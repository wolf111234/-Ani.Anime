const express = require('express');
const { createServer } = require('http');
const { Server } = require('socket.io');
const path = require('path');
const { v4: uuidv4 } = require('uuid');

const app = express();
const server = createServer(app);
const io = new Server(server, {
  cors: {
    origin: "*",
    methods: ["GET", "POST"]
  }
});

// Храним комнаты и пользователей
const rooms = new Map();
const users = new Map();

// Статические файлы
app.use(express.static(path.join(__dirname, 'dist')));

// API для проверки сервера
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', rooms: rooms.size, users: users.size });
});

// Все остальные запросы - на фронтенд
app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, 'dist', 'index.html'));
});

io.on('connection', (socket) => {
  console.log('User connected:', socket.id);

  // Регистрация пользователя
  socket.on('register', (userData) => {
    users.set(socket.id, {
      id: socket.id,
      username: userData.username,
      avatar: userData.avatar || `https://api.dicebear.com/7.x/avataaars/svg?seed=${userData.username}`
    });
    socket.emit('registered', users.get(socket.id));
  });

  // Создание комнаты
  socket.on('create-room', (data) => {
    const roomId = uuidv4().substring(0, 8);
    const user = users.get(socket.id);
    
    rooms.set(roomId, {
      id: roomId,
      name: data.name || `Комната ${user?.username || 'Анонима'}`,
      host: socket.id,
      animeId: data.animeId,
      animeTitle: data.animeTitle,
      animeCover: data.animeCover,
      episode: data.episode || 1,
      currentTime: 0,
      isPlaying: false,
      users: [socket.id],
      messages: [],
      createdAt: Date.now()
    });

    socket.join(roomId);
    socket.emit('room-created', { roomId, room: rooms.get(roomId) });
    console.log('Room created:', roomId);
  });

  // Присоединение к комнате
  socket.on('join-room', (roomId) => {
    const room = rooms.get(roomId);
    const user = users.get(socket.id);

    if (!room) {
      socket.emit('room-error', { message: 'Комната не найдена' });
      return;
    }

    if (!room.users.includes(socket.id)) {
      room.users.push(socket.id);
    }

    socket.join(roomId);

    // Отправляем состояние комнаты новому пользователю
    socket.emit('room-joined', {
      room,
      users: room.users.map(id => users.get(id)).filter(Boolean)
    });

    // Уведомляем остальных
    socket.to(roomId).emit('user-joined', {
      user,
      users: room.users.map(id => users.get(id)).filter(Boolean)
    });

    // Системное сообщение
    const joinMessage = {
      id: uuidv4(),
      type: 'system',
      text: `${user?.username || 'Аноним'} присоединился к комнате`,
      timestamp: Date.now()
    };
    room.messages.push(joinMessage);
    io.to(roomId).emit('chat-message', joinMessage);
  });

  // Выход из комнаты
  socket.on('leave-room', (roomId) => {
    leaveRoom(socket, roomId);
  });

  // Синхронизация видео
  socket.on('video-sync', (data) => {
    const room = rooms.get(data.roomId);
    if (!room) return;

    // Только хост может синхронизировать
    if (room.host === socket.id) {
      room.currentTime = data.currentTime;
      room.isPlaying = data.isPlaying;
      room.episode = data.episode || room.episode;

      socket.to(data.roomId).emit('video-sync', {
        currentTime: data.currentTime,
        isPlaying: data.isPlaying,
        episode: data.episode
      });
    }
  });

  // Запрос синхронизации от участника
  socket.on('request-sync', (roomId) => {
    const room = rooms.get(roomId);
    if (!room) return;

    socket.emit('video-sync', {
      currentTime: room.currentTime,
      isPlaying: room.isPlaying,
      episode: room.episode
    });
  });

  // Смена серии
  socket.on('change-episode', (data) => {
    const room = rooms.get(data.roomId);
    if (!room || room.host !== socket.id) return;

    room.episode = data.episode;
    room.currentTime = 0;
    room.isPlaying = false;

    io.to(data.roomId).emit('episode-changed', {
      episode: data.episode
    });
  });

  // Передача хоста
  socket.on('transfer-host', (data) => {
    const room = rooms.get(data.roomId);
    if (!room || room.host !== socket.id) return;

    room.host = data.newHostId;
    io.to(data.roomId).emit('host-changed', {
      newHostId: data.newHostId,
      newHost: users.get(data.newHostId)
    });
  });

  // Чат сообщения
  socket.on('send-message', (data) => {
    const room = rooms.get(data.roomId);
    const user = users.get(socket.id);
    if (!room || !user) return;

    const message = {
      id: uuidv4(),
      type: 'user',
      userId: socket.id,
      username: user.username,
      avatar: user.avatar,
      text: data.text,
      timestamp: Date.now()
    };

    room.messages.push(message);
    
    // Храним только последние 100 сообщений
    if (room.messages.length > 100) {
      room.messages = room.messages.slice(-100);
    }

    io.to(data.roomId).emit('chat-message', message);
  });

  // Реакции на видео
  socket.on('send-reaction', (data) => {
    const user = users.get(socket.id);
    if (!user) return;

    socket.to(data.roomId).emit('reaction', {
      emoji: data.emoji,
      username: user.username
    });
  });

  // Получить список комнат
  socket.on('get-rooms', () => {
    const roomList = Array.from(rooms.values())
      .filter(room => room.users.length > 0)
      .map(room => ({
        id: room.id,
        name: room.name,
        animeTitle: room.animeTitle,
        animeCover: room.animeCover,
        episode: room.episode,
        userCount: room.users.length,
        host: users.get(room.host)?.username || 'Аноним'
      }));
    socket.emit('rooms-list', roomList);
  });

  // Отключение
  socket.on('disconnect', () => {
    console.log('User disconnected:', socket.id);
    
    // Удаляем из всех комнат
    rooms.forEach((room, roomId) => {
      if (room.users.includes(socket.id)) {
        leaveRoom(socket, roomId);
      }
    });

    users.delete(socket.id);
  });

  function leaveRoom(socket, roomId) {
    const room = rooms.get(roomId);
    const user = users.get(socket.id);
    if (!room) return;

    room.users = room.users.filter(id => id !== socket.id);
    socket.leave(roomId);

    // Если комната пуста - удаляем
    if (room.users.length === 0) {
      rooms.delete(roomId);
      return;
    }

    // Если ушёл хост - передаём права
    if (room.host === socket.id && room.users.length > 0) {
      room.host = room.users[0];
      io.to(roomId).emit('host-changed', {
        newHostId: room.users[0],
        newHost: users.get(room.users[0])
      });
    }

    // Уведомляем остальных
    socket.to(roomId).emit('user-left', {
      userId: socket.id,
      username: user?.username,
      users: room.users.map(id => users.get(id)).filter(Boolean)
    });

    // Системное сообщение
    const leaveMessage = {
      id: uuidv4(),
      type: 'system',
      text: `${user?.username || 'Аноним'} покинул комнату`,
      timestamp: Date.now()
    };
    room.messages.push(leaveMessage);
    io.to(roomId).emit('chat-message', leaveMessage);
  }
});

const PORT = process.env.PORT || 3000;
server.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
