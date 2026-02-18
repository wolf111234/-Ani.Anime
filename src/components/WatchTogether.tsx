import React, { useState, useEffect, useRef } from 'react';
import { useSocket } from '../context/SocketContext';
import { useAuth } from '../context/AuthContext';

interface WatchTogetherProps {
  animeId: number;
  animeTitle: string;
  animeCover: string;
  currentEpisode: number;
  onEpisodeChange: (episode: number) => void;
  videoRef: React.RefObject<HTMLVideoElement | null>;
}

const WatchTogether: React.FC<WatchTogetherProps> = ({
  animeId,
  animeTitle,
  animeCover,
  currentEpisode,
  onEpisodeChange,
  videoRef
}) => {
  const { user } = useAuth();
  const { 
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
    requestSync,
    getRooms,
    isHost
  } = useSocket();

  const [isOpen, setIsOpen] = useState(false);
  const [, setShowRooms] = useState(false);
  const [roomName, setRoomName] = useState('');
  const [joinRoomId, setJoinRoomId] = useState('');
  const [chatMessage, setChatMessage] = useState('');
  const [showReactions, setShowReactions] = useState(false);
  const [floatingReactions, setFloatingReactions] = useState<{id: number; emoji: string; x: number}[]>([]);
  const chatContainerRef = useRef<HTMLDivElement>(null);
  const lastSyncRef = useRef(0);

  const reactions = ['❤️', '😂', '😮', '😢', '🔥', '👏', '💀', '🎉'];

  // Авто-скролл чата
  useEffect(() => {
    if (chatContainerRef.current) {
      chatContainerRef.current.scrollTop = chatContainerRef.current.scrollHeight;
    }
  }, [messages]);

  // Синхронизация видео от хоста
  useEffect(() => {
    if (!socket || !currentRoom) return;

    const handleVideoSync = (data: { currentTime: number; isPlaying: boolean; episode?: number }) => {
      if (!isHost && videoRef.current) {
        const timeDiff = Math.abs(videoRef.current.currentTime - data.currentTime);
        if (timeDiff > 2) {
          videoRef.current.currentTime = data.currentTime;
        }
        if (data.isPlaying) {
          videoRef.current.play();
        } else {
          videoRef.current.pause();
        }
        if (data.episode && data.episode !== currentEpisode) {
          onEpisodeChange(data.episode);
        }
      }
    };

    const handleEpisodeChanged = (data: { episode: number }) => {
      if (!isHost) {
        onEpisodeChange(data.episode);
      }
    };

    const handleReaction = (data: { emoji: string; username: string }) => {
      const id = Date.now();
      const x = Math.random() * 80 + 10;
      setFloatingReactions(prev => [...prev, { id, emoji: data.emoji, x }]);
      setTimeout(() => {
        setFloatingReactions(prev => prev.filter(r => r.id !== id));
      }, 2000);
    };

    socket.on('video-sync', handleVideoSync);
    socket.on('episode-changed', handleEpisodeChanged);
    socket.on('reaction', handleReaction);

    return () => {
      socket.off('video-sync', handleVideoSync);
      socket.off('episode-changed', handleEpisodeChanged);
      socket.off('reaction', handleReaction);
    };
  }, [socket, currentRoom, isHost, videoRef, currentEpisode, onEpisodeChange]);

  // Хост синхронизирует видео
  useEffect(() => {
    if (!isHost || !currentRoom || !videoRef.current) return;

    const video = videoRef.current;

    const handleTimeUpdate = () => {
      const now = Date.now();
      if (now - lastSyncRef.current > 1000) {
        syncVideo(video.currentTime, !video.paused, currentEpisode);
        lastSyncRef.current = now;
      }
    };

    const handlePlay = () => syncVideo(video.currentTime, true, currentEpisode);
    const handlePause = () => syncVideo(video.currentTime, false, currentEpisode);
    const handleSeeked = () => syncVideo(video.currentTime, !video.paused, currentEpisode);

    video.addEventListener('timeupdate', handleTimeUpdate);
    video.addEventListener('play', handlePlay);
    video.addEventListener('pause', handlePause);
    video.addEventListener('seeked', handleSeeked);

    return () => {
      video.removeEventListener('timeupdate', handleTimeUpdate);
      video.removeEventListener('play', handlePlay);
      video.removeEventListener('pause', handlePause);
      video.removeEventListener('seeked', handleSeeked);
    };
  }, [isHost, currentRoom, videoRef, currentEpisode, syncVideo]);

  const handleCreateRoom = () => {
    createRoom({
      name: roomName || `Комната ${user?.username || 'Анонима'}`,
      animeId,
      animeTitle,
      animeCover,
      episode: currentEpisode
    });
    setRoomName('');
  };

  const handleJoinRoom = () => {
    if (joinRoomId.trim()) {
      joinRoom(joinRoomId.trim());
      setJoinRoomId('');
    }
  };

  const handleSendMessage = (e: React.FormEvent) => {
    e.preventDefault();
    if (chatMessage.trim()) {
      sendMessage(chatMessage.trim());
      setChatMessage('');
    }
  };

  const handleReaction = (emoji: string) => {
    sendReaction(emoji);
    const id = Date.now();
    const x = Math.random() * 80 + 10;
    setFloatingReactions(prev => [...prev, { id, emoji, x }]);
    setTimeout(() => {
      setFloatingReactions(prev => prev.filter(r => r.id !== id));
    }, 2000);
    setShowReactions(false);
  };

  const copyRoomLink = () => {
    if (currentRoom) {
      navigator.clipboard.writeText(currentRoom.id);
      alert('ID комнаты скопирован!');
    }
  };

  if (!user) {
    return (
      <button
        onClick={() => setIsOpen(true)}
        className="flex items-center gap-2 px-4 py-2 bg-purple-600/50 hover:bg-purple-600 rounded-lg transition-colors"
        title="Войдите чтобы смотреть вместе"
      >
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
        </svg>
        <span className="hidden sm:inline">Смотреть вместе</span>
      </button>
    );
  }

  return (
    <>
      {/* Floating Reactions */}
      <div className="fixed inset-0 pointer-events-none z-50">
        {floatingReactions.map(r => (
          <div
            key={r.id}
            className="absolute text-4xl animate-bounce"
            style={{
              left: `${r.x}%`,
              bottom: '20%',
              animation: 'floatUp 2s ease-out forwards'
            }}
          >
            {r.emoji}
          </div>
        ))}
      </div>

      {/* Кнопка */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className={`flex items-center gap-2 px-4 py-2 rounded-lg transition-all ${
          currentRoom 
            ? 'bg-green-600 hover:bg-green-500 animate-pulse' 
            : 'bg-purple-600/50 hover:bg-purple-600'
        }`}
      >
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
        </svg>
        <span className="hidden sm:inline">
          {currentRoom ? `В комнате (${roomUsers.length})` : 'Смотреть вместе'}
        </span>
        {currentRoom && (
          <span className="flex h-3 w-3">
            <span className="animate-ping absolute h-3 w-3 rounded-full bg-green-400 opacity-75"></span>
            <span className="relative rounded-full h-3 w-3 bg-green-500"></span>
          </span>
        )}
      </button>

      {/* Панель */}
      {isOpen && (
        <div className="fixed right-0 top-0 h-full w-full sm:w-96 bg-gray-900/95 backdrop-blur-md border-l border-purple-500/30 z-40 flex flex-col">
          {/* Header */}
          <div className="flex items-center justify-between p-4 border-b border-purple-500/30">
            <h3 className="text-lg font-bold text-white flex items-center gap-2">
              <span className={`w-2 h-2 rounded-full ${isConnected ? 'bg-green-500' : 'bg-red-500'}`} />
              Совместный просмотр
            </h3>
            <button onClick={() => setIsOpen(false)} className="text-gray-400 hover:text-white">
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>

          {!currentRoom ? (
            <div className="flex-1 p-4 space-y-4 overflow-y-auto">
              {/* Создать комнату */}
              <div className="bg-black/30 rounded-xl p-4 border border-purple-500/20">
                <h4 className="text-white font-semibold mb-3">Создать комнату</h4>
                <input
                  type="text"
                  value={roomName}
                  onChange={(e) => setRoomName(e.target.value)}
                  placeholder="Название комнаты (опционально)"
                  className="w-full px-3 py-2 bg-black/50 border border-purple-500/30 rounded-lg text-white placeholder-gray-500 mb-3"
                />
                <button
                  onClick={handleCreateRoom}
                  className="w-full py-2 bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-500 hover:to-pink-500 rounded-lg font-semibold transition-all"
                >
                  Создать комнату
                </button>
              </div>

              {/* Присоединиться */}
              <div className="bg-black/30 rounded-xl p-4 border border-purple-500/20">
                <h4 className="text-white font-semibold mb-3">Присоединиться</h4>
                <div className="flex gap-2">
                  <input
                    type="text"
                    value={joinRoomId}
                    onChange={(e) => setJoinRoomId(e.target.value)}
                    placeholder="ID комнаты"
                    className="flex-1 px-3 py-2 bg-black/50 border border-purple-500/30 rounded-lg text-white placeholder-gray-500"
                  />
                  <button
                    onClick={handleJoinRoom}
                    className="px-4 py-2 bg-cyan-600 hover:bg-cyan-500 rounded-lg transition-colors"
                  >
                    Войти
                  </button>
                </div>
              </div>

              {/* Список комнат */}
              <div className="bg-black/30 rounded-xl p-4 border border-purple-500/20">
                <div className="flex items-center justify-between mb-3">
                  <h4 className="text-white font-semibold">Открытые комнаты</h4>
                  <button
                    onClick={() => { getRooms(); setShowRooms(true); }}
                    className="text-purple-400 hover:text-purple-300 text-sm"
                  >
                    Обновить
                  </button>
                </div>
                {rooms.length === 0 ? (
                  <p className="text-gray-500 text-sm">Нет активных комнат</p>
                ) : (
                  <div className="space-y-2 max-h-60 overflow-y-auto">
                    {rooms.map(room => (
                      <div
                        key={room.id}
                        className="flex items-center gap-3 p-2 bg-black/30 rounded-lg hover:bg-purple-500/20 cursor-pointer transition-colors"
                        onClick={() => joinRoom(room.id)}
                      >
                        <img src={room.animeCover} alt="" className="w-10 h-14 object-cover rounded" />
                        <div className="flex-1 min-w-0">
                          <p className="text-white text-sm truncate">{room.name}</p>
                          <p className="text-gray-400 text-xs truncate">{room.animeTitle}</p>
                          <p className="text-gray-500 text-xs">Ep. {room.episode} • {room.userCount} чел.</p>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          ) : (
            <>
              {/* Инфо о комнате */}
              <div className="p-4 border-b border-purple-500/30 bg-black/30">
                <div className="flex items-center justify-between mb-2">
                  <h4 className="text-white font-semibold truncate">{currentRoom.name}</h4>
                  <div className="flex items-center gap-2">
                    <button
                      onClick={copyRoomLink}
                      className="p-1.5 bg-purple-600/50 hover:bg-purple-600 rounded-lg text-xs"
                      title="Скопировать ID"
                    >
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
                      </svg>
                    </button>
                    <button
                      onClick={leaveRoom}
                      className="p-1.5 bg-red-600/50 hover:bg-red-600 rounded-lg text-xs"
                    >
                      Выйти
                    </button>
                  </div>
                </div>
                <p className="text-gray-400 text-xs">ID: {currentRoom.id}</p>
                {isHost && (
                  <p className="text-green-400 text-xs mt-1">👑 Вы хост - видео синхронизируется по вам</p>
                )}
              </div>

              {/* Участники */}
              <div className="p-3 border-b border-purple-500/30">
                <div className="flex items-center gap-2 overflow-x-auto pb-1">
                  {roomUsers.map((u, i) => (
                    <div key={u.id} className="flex-shrink-0 relative group">
                      <img 
                        src={u.avatar} 
                        alt={u.username} 
                        className="w-8 h-8 rounded-full border-2 border-purple-500"
                      />
                      {i === 0 && (
                        <span className="absolute -top-1 -right-1 text-xs">👑</span>
                      )}
                      <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-1 px-2 py-1 bg-black rounded text-xs whitespace-nowrap opacity-0 group-hover:opacity-100 transition-opacity">
                        {u.username}
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Реакции */}
              <div className="p-2 border-b border-purple-500/30 flex items-center gap-2">
                <button
                  onClick={() => setShowReactions(!showReactions)}
                  className="p-2 bg-purple-600/30 hover:bg-purple-600/50 rounded-lg"
                >
                  😀
                </button>
                {showReactions && (
                  <div className="flex gap-1 overflow-x-auto">
                    {reactions.map(emoji => (
                      <button
                        key={emoji}
                        onClick={() => handleReaction(emoji)}
                        className="p-2 hover:bg-purple-600/30 rounded-lg text-xl transition-transform hover:scale-125"
                      >
                        {emoji}
                      </button>
                    ))}
                  </div>
                )}
                {!showReactions && (
                  <button
                    onClick={requestSync}
                    className="px-3 py-1.5 bg-cyan-600/30 hover:bg-cyan-600/50 rounded-lg text-xs"
                  >
                    🔄 Синхронизировать
                  </button>
                )}
              </div>

              {/* Чат */}
              <div 
                ref={chatContainerRef}
                className="flex-1 overflow-y-auto p-3 space-y-2"
              >
                {messages.map(msg => (
                  <div key={msg.id} className={`${msg.type === 'system' ? 'text-center' : ''}`}>
                    {msg.type === 'system' ? (
                      <span className="text-gray-500 text-xs bg-black/30 px-2 py-1 rounded">
                        {msg.text}
                      </span>
                    ) : (
                      <div className="flex items-start gap-2">
                        <img src={msg.avatar} alt="" className="w-6 h-6 rounded-full flex-shrink-0" />
                        <div className="flex-1 min-w-0">
                          <div className="flex items-baseline gap-2">
                            <span className="text-purple-400 text-xs font-semibold">{msg.username}</span>
                            <span className="text-gray-600 text-xs">
                              {new Date(msg.timestamp).toLocaleTimeString('ru', { hour: '2-digit', minute: '2-digit' })}
                            </span>
                          </div>
                          <p className="text-white text-sm break-words">{msg.text}</p>
                        </div>
                      </div>
                    )}
                  </div>
                ))}
              </div>

              {/* Ввод сообщения */}
              <form onSubmit={handleSendMessage} className="p-3 border-t border-purple-500/30">
                <div className="flex gap-2">
                  <input
                    type="text"
                    value={chatMessage}
                    onChange={(e) => setChatMessage(e.target.value)}
                    placeholder="Написать сообщение..."
                    className="flex-1 px-3 py-2 bg-black/50 border border-purple-500/30 rounded-lg text-white placeholder-gray-500 text-sm"
                  />
                  <button
                    type="submit"
                    className="px-4 py-2 bg-purple-600 hover:bg-purple-500 rounded-lg transition-colors"
                  >
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" />
                    </svg>
                  </button>
                </div>
              </form>
            </>
          )}
        </div>
      )}

      <style>{`
        @keyframes floatUp {
          0% { transform: translateY(0) scale(1); opacity: 1; }
          100% { transform: translateY(-200px) scale(1.5); opacity: 0; }
        }
      `}</style>
    </>
  );
};

export default WatchTogether;
