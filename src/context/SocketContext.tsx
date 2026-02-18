import React, { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import { io, Socket } from 'socket.io-client';
import { useAuth } from './AuthContext';

interface SocketContextType {
  socket: Socket | null;
  isConnected: boolean;
  currentRoom: Room | null;
  roomUsers: RoomUser[];
  messages: Message[];
  rooms: RoomPreview[];
  createRoom: (data: CreateRoomData) => void;
  joinRoom: (roomId: string) => void;
  leaveRoom: () => void;
  sendMessage: (text: string) => void;
  sendReaction: (emoji: string) => void;
  syncVideo: (currentTime: number, isPlaying: boolean, episode?: number) => void;
  changeEpisode: (episode: number) => void;
  requestSync: () => void;
  getRooms: () => void;
  isHost: boolean;
}

interface Room {
  id: string;
  name: string;
  host: string;
  animeId: number;
  animeTitle: string;
  animeCover: string;
  episode: number;
  currentTime: number;
  isPlaying: boolean;
}

interface RoomUser {
  id: string;
  username: string;
  avatar: string;
}

interface Message {
  id: string;
  type: 'user' | 'system';
  userId?: string;
  username?: string;
  avatar?: string;
  text: string;
  timestamp: number;
}

interface RoomPreview {
  id: string;
  name: string;
  animeTitle: string;
  animeCover: string;
  episode: number;
  userCount: number;
  host: string;
}

interface CreateRoomData {
  name?: string;
  animeId: number;
  animeTitle: string;
  animeCover: string;
  episode?: number;
}

const SocketContext = createContext<SocketContextType | null>(null);

export const useSocket = () => {
  const context = useContext(SocketContext);
  if (!context) {
    throw new Error('useSocket must be used within SocketProvider');
  }
  return context;
};

interface SocketProviderProps {
  children: ReactNode;
}

export const SocketProvider: React.FC<SocketProviderProps> = ({ children }) => {
  const { user } = useAuth();
  const [socket, setSocket] = useState<Socket | null>(null);
  const [isConnected, setIsConnected] = useState(false);
  const [currentRoom, setCurrentRoom] = useState<Room | null>(null);
  const [roomUsers, setRoomUsers] = useState<RoomUser[]>([]);
  const [messages, setMessages] = useState<Message[]>([]);
  const [rooms, setRooms] = useState<RoomPreview[]>([]);

  useEffect(() => {
    // Подключаемся к серверу
    const socketUrl = window.location.hostname === 'localhost' 
      ? 'http://localhost:3000'
      : window.location.origin;
    
    const newSocket = io(socketUrl, {
      transports: ['websocket', 'polling']
    });

    newSocket.on('connect', () => {
      console.log('Connected to server');
      setIsConnected(true);
      
      if (user) {
        newSocket.emit('register', {
          username: user.username,
          avatar: user.avatar
        });
      }
    });

    newSocket.on('disconnect', () => {
      console.log('Disconnected from server');
      setIsConnected(false);
    });

    newSocket.on('room-created', (data) => {
      setCurrentRoom(data.room);
      setRoomUsers([]);
      setMessages([]);
    });

    newSocket.on('room-joined', (data) => {
      setCurrentRoom(data.room);
      setRoomUsers(data.users);
      setMessages(data.room.messages || []);
    });

    newSocket.on('room-error', (data) => {
      alert(data.message);
    });

    newSocket.on('user-joined', (data) => {
      setRoomUsers(data.users);
    });

    newSocket.on('user-left', (data) => {
      setRoomUsers(data.users);
    });

    newSocket.on('chat-message', (message) => {
      setMessages(prev => [...prev, message]);
    });

    newSocket.on('host-changed', (data) => {
      setCurrentRoom(prev => prev ? { ...prev, host: data.newHostId } : null);
    });

    newSocket.on('rooms-list', (roomsList) => {
      setRooms(roomsList);
    });

    setSocket(newSocket);

    return () => {
      newSocket.close();
    };
  }, []);

  // Перерегистрация при смене пользователя
  useEffect(() => {
    if (socket && isConnected && user) {
      socket.emit('register', {
        username: user.username,
        avatar: user.avatar
      });
    }
  }, [user, socket, isConnected]);

  const createRoom = (data: CreateRoomData) => {
    if (socket) {
      socket.emit('create-room', data);
    }
  };

  const joinRoom = (roomId: string) => {
    if (socket) {
      socket.emit('join-room', roomId);
    }
  };

  const leaveRoom = () => {
    if (socket && currentRoom) {
      socket.emit('leave-room', currentRoom.id);
      setCurrentRoom(null);
      setRoomUsers([]);
      setMessages([]);
    }
  };

  const sendMessage = (text: string) => {
    if (socket && currentRoom) {
      socket.emit('send-message', { roomId: currentRoom.id, text });
    }
  };

  const sendReaction = (emoji: string) => {
    if (socket && currentRoom) {
      socket.emit('send-reaction', { roomId: currentRoom.id, emoji });
    }
  };

  const syncVideo = (currentTime: number, isPlaying: boolean, episode?: number) => {
    if (socket && currentRoom) {
      socket.emit('video-sync', { roomId: currentRoom.id, currentTime, isPlaying, episode });
    }
  };

  const changeEpisode = (episode: number) => {
    if (socket && currentRoom) {
      socket.emit('change-episode', { roomId: currentRoom.id, episode });
    }
  };

  const requestSync = () => {
    if (socket && currentRoom) {
      socket.emit('request-sync', currentRoom.id);
    }
  };

  const getRooms = () => {
    if (socket) {
      socket.emit('get-rooms');
    }
  };

  const isHost = socket?.id === currentRoom?.host;

  return (
    <SocketContext.Provider value={{
      socket,
      isConnected,
      currentRoom,
      roomUsers,
      messages,
      rooms,
      createRoom,
      joinRoom,
      leaveRoom,
      sendMessage,
      sendReaction,
      syncVideo,
      changeEpisode,
      requestSync,
      getRooms,
      isHost
    }}>
      {children}
    </SocketContext.Provider>
  );
};
