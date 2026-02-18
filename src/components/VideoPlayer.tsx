import React, { useState, useRef, useEffect, forwardRef, useImperativeHandle } from 'react';
import { Episode, DubbingStudio } from '../types';

interface VideoPlayerProps {
  animeTitle: string;
  animeTitleEnglish: string;
  episode: Episode;
  dubbing: DubbingStudio;
  onNextEpisode: () => void;
  onPrevEpisode: () => void;
  hasNext: boolean;
  hasPrev: boolean;
  totalEpisodes: number;
}

export const VideoPlayer = forwardRef<HTMLVideoElement, VideoPlayerProps>(({
  animeTitle,
  episode,
  dubbing,
  onNextEpisode,
  onPrevEpisode,
  hasNext,
  hasPrev,
  totalEpisodes
}, ref) => {
  const videoRef = useRef<HTMLVideoElement>(null);
  
  // Экспортируем ref для внешнего использования
  useImperativeHandle(ref, () => videoRef.current as HTMLVideoElement);
  const containerRef = useRef<HTMLDivElement>(null);
  const progressRef = useRef<HTMLDivElement>(null);
  const hideControlsTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const lastTapRef = useRef<number>(0);
  
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [buffered, setBuffered] = useState(0);
  const [volume, setVolume] = useState(1);
  const [isMuted, setIsMuted] = useState(false);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [showControls, setShowControls] = useState(true);
  const [isLoading, setIsLoading] = useState(true);
  const [playbackRate, setPlaybackRate] = useState(1);
  const [currentQuality, setCurrentQuality] = useState('720p');
  const [showSpeedMenu, setShowSpeedMenu] = useState(false);
  const [showQualityMenu, setShowQualityMenu] = useState(false);
  const [doubleTapSide, setDoubleTapSide] = useState<'left' | 'right' | null>(null);

  // Демо видео для показа работы плеера
  const demoVideos = [
    'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/BigBuckBunny.mp4',
    'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ElephantsDream.mp4',
    'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/Sintel.mp4',
  ];

  const videoSrc = demoVideos[episode.number % demoVideos.length];

  // Загрузка видео при смене эпизода
  useEffect(() => {
    const video = videoRef.current;
    if (!video) return;
    
    setIsLoading(true);
    setIsPlaying(false);
    setCurrentTime(0);
    video.src = videoSrc;
    video.load();
  }, [videoSrc]);

  // Play/Pause
  const togglePlay = () => {
    const video = videoRef.current;
    if (!video) return;
    
    if (video.paused) {
      video.play().catch(console.error);
    } else {
      video.pause();
    }
  };

  // События видео
  const handlePlay = () => setIsPlaying(true);
  const handlePause = () => setIsPlaying(false);
  
  const handleTimeUpdate = () => {
    const video = videoRef.current;
    if (!video) return;
    setCurrentTime(video.currentTime);
    
    if (video.buffered.length > 0) {
      setBuffered(video.buffered.end(video.buffered.length - 1));
    }
  };

  const handleLoadedMetadata = () => {
    const video = videoRef.current;
    if (!video) return;
    setDuration(video.duration);
    setIsLoading(false);
  };

  const handleCanPlay = () => setIsLoading(false);
  const handleWaiting = () => setIsLoading(true);

  const handleEnded = () => {
    if (hasNext) {
      onNextEpisode();
    }
  };

  // Клик по прогресс-бару
  const handleProgressClick = (e: React.MouseEvent<HTMLDivElement>) => {
    const video = videoRef.current;
    const progress = progressRef.current;
    if (!video || !progress) return;
    
    const rect = progress.getBoundingClientRect();
    const percent = Math.max(0, Math.min(1, (e.clientX - rect.left) / rect.width));
    video.currentTime = percent * duration;
  };

  // Громкость
  const handleVolumeChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const video = videoRef.current;
    if (!video) return;
    
    const value = parseFloat(e.target.value);
    setVolume(value);
    video.volume = value;
    setIsMuted(value === 0);
    video.muted = value === 0;
  };

  const toggleMute = () => {
    const video = videoRef.current;
    if (!video) return;
    
    const newMuted = !isMuted;
    setIsMuted(newMuted);
    video.muted = newMuted;
  };

  // Полноэкранный режим
  const toggleFullscreen = async () => {
    const container = containerRef.current;
    if (!container) return;
    
    try {
      if (!document.fullscreenElement) {
        await container.requestFullscreen();
        setIsFullscreen(true);
      } else {
        await document.exitFullscreen();
        setIsFullscreen(false);
      }
    } catch (err) {
      console.error('Fullscreen error:', err);
    }
  };

  // Отслеживание fullscreen
  useEffect(() => {
    const handleFullscreenChange = () => {
      setIsFullscreen(!!document.fullscreenElement);
    };
    document.addEventListener('fullscreenchange', handleFullscreenChange);
    return () => document.removeEventListener('fullscreenchange', handleFullscreenChange);
  }, []);

  // Picture-in-Picture
  const togglePiP = async () => {
    const video = videoRef.current;
    if (!video) return;
    
    try {
      if (document.pictureInPictureElement) {
        await document.exitPictureInPicture();
      } else {
        await video.requestPictureInPicture();
      }
    } catch (err) {
      console.error('PiP error:', err);
    }
  };

  // Перемотка
  const skip = (seconds: number) => {
    const video = videoRef.current;
    if (!video) return;
    video.currentTime = Math.max(0, Math.min(duration, video.currentTime + seconds));
  };

  // Скорость воспроизведения
  const changePlaybackRate = (rate: number) => {
    const video = videoRef.current;
    if (!video) return;
    
    video.playbackRate = rate;
    setPlaybackRate(rate);
    setShowSpeedMenu(false);
  };

  // Качество (визуальное)
  const changeQuality = (quality: string) => {
    setCurrentQuality(quality);
    setShowQualityMenu(false);
  };

  // Форматирование времени
  const formatTime = (time: number) => {
    if (!isFinite(time)) return '0:00';
    const hours = Math.floor(time / 3600);
    const minutes = Math.floor((time % 3600) / 60);
    const seconds = Math.floor(time % 60);
    
    if (hours > 0) {
      return `${hours}:${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
    }
    return `${minutes}:${seconds.toString().padStart(2, '0')}`;
  };

  // Автоскрытие контролов
  const handleMouseMove = () => {
    setShowControls(true);
    if (hideControlsTimer.current) {
      clearTimeout(hideControlsTimer.current);
    }
    if (isPlaying) {
      hideControlsTimer.current = setTimeout(() => {
        setShowControls(false);
      }, 3000);
    }
  };

  const handleMouseLeave = () => {
    if (isPlaying) {
      setShowControls(false);
    }
  };

  // Горячие клавиши
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement) return;
      
      const video = videoRef.current;
      if (!video) return;

      switch (e.key.toLowerCase()) {
        case ' ':
        case 'k':
          e.preventDefault();
          togglePlay();
          break;
        case 'arrowleft':
          e.preventDefault();
          skip(-10);
          break;
        case 'arrowright':
          e.preventDefault();
          skip(10);
          break;
        case 'arrowup':
          e.preventDefault();
          setVolume(v => {
            const newVol = Math.min(1, v + 0.1);
            video.volume = newVol;
            return newVol;
          });
          break;
        case 'arrowdown':
          e.preventDefault();
          setVolume(v => {
            const newVol = Math.max(0, v - 0.1);
            video.volume = newVol;
            return newVol;
          });
          break;
        case 'f':
          e.preventDefault();
          toggleFullscreen();
          break;
        case 'm':
          e.preventDefault();
          toggleMute();
          break;
        case 'n':
          if (hasNext) onNextEpisode();
          break;
        case 'p':
          if (hasPrev) onPrevEpisode();
          break;
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [hasNext, hasPrev, onNextEpisode, onPrevEpisode, duration]);

  // Двойной тап на мобильных
  const handleTouchEnd = (side: 'left' | 'right' | 'center') => {
    const now = Date.now();
    if (now - lastTapRef.current < 300) {
      if (side === 'left') {
        skip(-10);
        setDoubleTapSide('left');
        setTimeout(() => setDoubleTapSide(null), 500);
      } else if (side === 'right') {
        skip(10);
        setDoubleTapSide('right');
        setTimeout(() => setDoubleTapSide(null), 500);
      }
    } else if (side === 'center') {
      togglePlay();
    }
    lastTapRef.current = now;
  };

  // Закрыть меню при клике вне
  useEffect(() => {
    const handleClick = () => {
      setShowSpeedMenu(false);
      setShowQualityMenu(false);
    };
    
    if (showSpeedMenu || showQualityMenu) {
      setTimeout(() => {
        document.addEventListener('click', handleClick, { once: true });
      }, 100);
    }
  }, [showSpeedMenu, showQualityMenu]);

  const qualities = ['auto', '1080p', '720p', '480p', '360p'];
  const speeds = [0.25, 0.5, 0.75, 1, 1.25, 1.5, 1.75, 2];

  return (
    <div 
      ref={containerRef}
      className={`relative bg-black rounded-2xl overflow-hidden select-none
        ${isFullscreen ? 'fixed inset-0 z-50 rounded-none' : 'aspect-video'}`}
      onMouseMove={handleMouseMove}
      onMouseLeave={handleMouseLeave}
    >
      {/* Видео элемент */}
      <video
        ref={videoRef}
        className="w-full h-full object-contain bg-black cursor-pointer"
        onClick={togglePlay}
        onPlay={handlePlay}
        onPause={handlePause}
        onTimeUpdate={handleTimeUpdate}
        onLoadedMetadata={handleLoadedMetadata}
        onCanPlay={handleCanPlay}
        onWaiting={handleWaiting}
        onEnded={handleEnded}
        playsInline
        preload="metadata"
      />

      {/* Зоны для двойного тапа (мобильные) */}
      <div className="absolute inset-0 flex md:hidden pointer-events-auto">
        <div 
          className="w-1/3 h-full" 
          onTouchEnd={(e) => { e.stopPropagation(); handleTouchEnd('left'); }}
        />
        <div 
          className="w-1/3 h-full" 
          onTouchEnd={(e) => { e.stopPropagation(); handleTouchEnd('center'); }}
        />
        <div 
          className="w-1/3 h-full" 
          onTouchEnd={(e) => { e.stopPropagation(); handleTouchEnd('right'); }}
        />
      </div>

      {/* Индикатор двойного тапа */}
      {doubleTapSide && (
        <div className={`absolute top-1/2 -translate-y-1/2 ${doubleTapSide === 'left' ? 'left-12' : 'right-12'} 
          bg-white/20 backdrop-blur-sm rounded-full p-6 animate-ping pointer-events-none`}>
          <svg className="w-8 h-8 text-white" fill="currentColor" viewBox="0 0 24 24">
            {doubleTapSide === 'left' ? (
              <path d="M11 18V6l-8.5 6 8.5 6zm.5-6l8.5 6V6l-8.5 6z"/>
            ) : (
              <path d="M4 18l8.5-6L4 6v12zm9-12v12l8.5-6L13 6z"/>
            )}
          </svg>
        </div>
      )}

      {/* Лоадер */}
      {isLoading && (
        <div className="absolute inset-0 flex items-center justify-center bg-black/60 pointer-events-none">
          <div className="relative">
            <div className="w-16 h-16 border-4 border-purple-500/30 rounded-full animate-spin border-t-purple-500" />
            <div className="absolute inset-0 flex items-center justify-center">
              <div className="w-8 h-8 bg-purple-500 rounded-full animate-pulse" />
            </div>
          </div>
        </div>
      )}

      {/* Большая кнопка Play */}
      {!isPlaying && !isLoading && (
        <div 
          className="absolute inset-0 flex items-center justify-center cursor-pointer pointer-events-none"
        >
          <div className="w-20 h-20 md:w-24 md:h-24 bg-gradient-to-r from-violet-600 to-cyan-600 rounded-full 
            flex items-center justify-center shadow-2xl shadow-violet-500/50 animate-pulse pointer-events-auto"
            onClick={togglePlay}
          >
            <svg className="w-10 h-10 md:w-12 md:h-12 text-white ml-1" fill="currentColor" viewBox="0 0 24 24">
              <path d="M8 5v14l11-7z"/>
            </svg>
          </div>
        </div>
      )}

      {/* Контролы */}
      <div 
        className={`absolute inset-x-0 bottom-0 transition-opacity duration-300 
          ${showControls ? 'opacity-100' : 'opacity-0 pointer-events-none'}`}
      >
        {/* Верхний градиент с инфо */}
        <div className="absolute top-0 left-0 right-0 p-3 md:p-4 bg-gradient-to-b from-black/80 to-transparent">
          <h3 className="text-white font-bold text-sm md:text-lg truncate">{animeTitle}</h3>
          <p className="text-gray-300 text-xs md:text-sm">
            Серия {episode.number} из {totalEpisodes} • {dubbing.name}
          </p>
        </div>

        {/* Нижний градиент с контролами */}
        <div className="bg-gradient-to-t from-black/90 via-black/60 to-transparent pt-16 pb-3 px-3 md:px-4">
          
          {/* Прогресс-бар */}
          <div 
            ref={progressRef}
            className="relative h-2 md:h-3 bg-white/20 rounded-full cursor-pointer mb-3 group"
            onClick={handleProgressClick}
          >
            {/* Буфер */}
            <div 
              className="absolute inset-y-0 left-0 bg-white/30 rounded-full transition-all"
              style={{ width: `${duration ? (buffered / duration) * 100 : 0}%` }}
            />
            {/* Прогресс */}
            <div 
              className="absolute inset-y-0 left-0 bg-gradient-to-r from-violet-500 to-cyan-500 rounded-full transition-all"
              style={{ width: `${duration ? (currentTime / duration) * 100 : 0}%` }}
            >
              {/* Ползунок */}
              <div className="absolute right-0 top-1/2 -translate-y-1/2 w-4 h-4 md:w-5 md:h-5 
                bg-white rounded-full shadow-lg opacity-0 group-hover:opacity-100 transition-opacity
                transform -translate-x-1/2" 
              />
            </div>
          </div>

          {/* Нижние контролы */}
          <div className="flex items-center justify-between gap-2">
            
            {/* Левая часть */}
            <div className="flex items-center gap-1 md:gap-2">
              
              {/* Play/Pause */}
              <button 
                onClick={togglePlay}
                className="w-10 h-10 md:w-12 md:h-12 flex items-center justify-center 
                  text-white hover:text-violet-400 active:scale-90 transition-all"
              >
                {isPlaying ? (
                  <svg className="w-7 h-7 md:w-8 md:h-8" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M6 4h4v16H6V4zm8 0h4v16h-4V4z"/>
                  </svg>
                ) : (
                  <svg className="w-7 h-7 md:w-8 md:h-8" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M8 5v14l11-7z"/>
                  </svg>
                )}
              </button>

              {/* Предыдущая */}
              <button 
                onClick={onPrevEpisode}
                disabled={!hasPrev}
                className="w-10 h-10 flex items-center justify-center text-white 
                  hover:text-violet-400 active:scale-90 transition-all
                  disabled:opacity-30 disabled:cursor-not-allowed disabled:hover:text-white"
              >
                <svg className="w-5 h-5 md:w-6 md:h-6" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M6 6h2v12H6zm3.5 6l8.5 6V6z"/>
                </svg>
              </button>

              {/* Следующая */}
              <button 
                onClick={onNextEpisode}
                disabled={!hasNext}
                className="w-10 h-10 flex items-center justify-center text-white 
                  hover:text-violet-400 active:scale-90 transition-all
                  disabled:opacity-30 disabled:cursor-not-allowed disabled:hover:text-white"
              >
                <svg className="w-5 h-5 md:w-6 md:h-6" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M6 18l8.5-6L6 6v12zM16 6v12h2V6h-2z"/>
                </svg>
              </button>

              {/* Громкость */}
              <div className="hidden sm:flex items-center gap-2 group/vol">
                <button 
                  onClick={toggleMute}
                  className="w-10 h-10 flex items-center justify-center text-white 
                    hover:text-violet-400 active:scale-90 transition-all"
                >
                  {isMuted || volume === 0 ? (
                    <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 24 24">
                      <path d="M16.5 12c0-1.77-1.02-3.29-2.5-4.03v2.21l2.45 2.45c.03-.2.05-.41.05-.63zm2.5 0c0 .94-.2 1.82-.54 2.64l1.51 1.51C20.63 14.91 21 13.5 21 12c0-4.28-2.99-7.86-7-8.77v2.06c2.89.86 5 3.54 5 6.71zM4.27 3L3 4.27 7.73 9H3v6h4l5 5v-6.73l4.25 4.25c-.67.52-1.42.93-2.25 1.18v2.06c1.38-.31 2.63-.95 3.69-1.81L19.73 21 21 19.73l-9-9L4.27 3zM12 4L9.91 6.09 12 8.18V4z"/>
                    </svg>
                  ) : volume < 0.5 ? (
                    <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 24 24">
                      <path d="M18.5 12c0-1.77-1.02-3.29-2.5-4.03v8.05c1.48-.73 2.5-2.25 2.5-4.02zM5 9v6h4l5 5V4L9 9H5z"/>
                    </svg>
                  ) : (
                    <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 24 24">
                      <path d="M3 9v6h4l5 5V4L7 9H3zm13.5 3c0-1.77-1.02-3.29-2.5-4.03v8.05c1.48-.73 2.5-2.25 2.5-4.02zM14 3.23v2.06c2.89.86 5 3.54 5 6.71s-2.11 5.85-5 6.71v2.06c4.01-.91 7-4.49 7-8.77s-2.99-7.86-7-8.77z"/>
                    </svg>
                  )}
                </button>
                <input
                  type="range"
                  min="0"
                  max="1"
                  step="0.05"
                  value={isMuted ? 0 : volume}
                  onChange={handleVolumeChange}
                  className="w-0 group-hover/vol:w-20 transition-all duration-300 
                    accent-violet-500 cursor-pointer"
                />
              </div>

              {/* Время */}
              <span className="text-white text-xs md:text-sm font-mono whitespace-nowrap ml-1">
                {formatTime(currentTime)} / {formatTime(duration)}
              </span>
            </div>

            {/* Правая часть */}
            <div className="flex items-center gap-1 md:gap-2">
              
              {/* Скорость */}
              <div className="relative">
                <button 
                  onClick={(e) => {
                    e.stopPropagation();
                    setShowSpeedMenu(!showSpeedMenu);
                    setShowQualityMenu(false);
                  }}
                  className="h-10 px-2 md:px-3 flex items-center justify-center text-white text-xs md:text-sm
                    hover:text-violet-400 active:scale-95 transition-all rounded-lg hover:bg-white/10"
                >
                  {playbackRate}x
                </button>
                {showSpeedMenu && (
                  <div 
                    className="absolute bottom-full right-0 mb-2 bg-gray-900/95 backdrop-blur-md 
                      rounded-xl shadow-2xl overflow-hidden border border-violet-500/30 min-w-[100px] z-50"
                    onClick={(e) => e.stopPropagation()}
                  >
                    {speeds.map(rate => (
                      <button
                        key={rate}
                        onClick={() => changePlaybackRate(rate)}
                        className={`block w-full px-4 py-2.5 text-sm text-left transition-colors
                          ${playbackRate === rate 
                            ? 'bg-violet-600 text-white' 
                            : 'text-gray-300 hover:bg-white/10'}`}
                      >
                        {rate}x
                      </button>
                    ))}
                  </div>
                )}
              </div>

              {/* Качество */}
              <div className="relative">
                <button 
                  onClick={(e) => {
                    e.stopPropagation();
                    setShowQualityMenu(!showQualityMenu);
                    setShowSpeedMenu(false);
                  }}
                  className="h-10 px-2 md:px-3 flex items-center justify-center gap-1 text-white text-xs md:text-sm
                    hover:text-violet-400 active:scale-95 transition-all rounded-lg hover:bg-white/10"
                >
                  <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M19.14 12.94c.04-.31.06-.63.06-.94 0-.31-.02-.63-.06-.94l2.03-1.58c.18-.14.23-.41.12-.61l-1.92-3.32c-.12-.22-.37-.29-.59-.22l-2.39.96c-.5-.38-1.03-.7-1.62-.94l-.36-2.54c-.04-.24-.24-.41-.48-.41h-3.84c-.24 0-.43.17-.47.41l-.36 2.54c-.59.24-1.13.57-1.62.94l-2.39-.96c-.22-.08-.47 0-.59.22L2.74 8.87c-.12.21-.08.47.12.61l2.03 1.58c-.04.31-.06.63-.06.94s.02.63.06.94l-2.03 1.58c-.18.14-.23.41-.12.61l1.92 3.32c.12.22.37.29.59.22l2.39-.96c.5.38 1.03.7 1.62.94l.36 2.54c.05.24.24.41.48.41h3.84c.24 0 .44-.17.47-.41l.36-2.54c.59-.24 1.13-.56 1.62-.94l2.39.96c.22.08.47 0 .59-.22l1.92-3.32c.12-.22.07-.47-.12-.61l-2.01-1.58zM12 15.6c-1.98 0-3.6-1.62-3.6-3.6s1.62-3.6 3.6-3.6 3.6 1.62 3.6 3.6-1.62 3.6-3.6 3.6z"/>
                  </svg>
                  <span className="hidden md:inline">{currentQuality}</span>
                </button>
                {showQualityMenu && (
                  <div 
                    className="absolute bottom-full right-0 mb-2 bg-gray-900/95 backdrop-blur-md 
                      rounded-xl shadow-2xl overflow-hidden border border-violet-500/30 min-w-[100px] z-50"
                    onClick={(e) => e.stopPropagation()}
                  >
                    {qualities.map(quality => (
                      <button
                        key={quality}
                        onClick={() => changeQuality(quality)}
                        className={`block w-full px-4 py-2.5 text-sm text-left transition-colors
                          ${currentQuality === quality 
                            ? 'bg-violet-600 text-white' 
                            : 'text-gray-300 hover:bg-white/10'}`}
                      >
                        {quality === 'auto' ? 'Авто' : quality}
                      </button>
                    ))}
                  </div>
                )}
              </div>

              {/* PiP */}
              <button 
                onClick={togglePiP}
                className="hidden md:flex w-10 h-10 items-center justify-center text-white 
                  hover:text-violet-400 active:scale-90 transition-all"
                title="Картинка в картинке"
              >
                <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M19 7h-8v6h8V7zm2-4H3c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h18c1.1 0 2-.9 2-2V5c0-1.1-.9-2-2-2zm0 16H3V5h18v14z"/>
                </svg>
              </button>

              {/* Полноэкранный режим */}
              <button 
                onClick={toggleFullscreen}
                className="w-10 h-10 md:w-12 md:h-12 flex items-center justify-center text-white 
                  hover:text-violet-400 active:scale-90 transition-all"
              >
                {isFullscreen ? (
                  <svg className="w-6 h-6 md:w-7 md:h-7" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M5 16h3v3h2v-5H5v2zm3-8H5v2h5V5H8v3zm6 11h2v-3h3v-2h-5v5zm2-11V5h-2v5h5V8h-3z"/>
                  </svg>
                ) : (
                  <svg className="w-6 h-6 md:w-7 md:h-7" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M7 14H5v5h5v-2H7v-3zm-2-4h2V7h3V5H5v5zm12 7h-3v2h5v-5h-2v3zM14 5v2h3v3h2V5h-5z"/>
                  </svg>
                )}
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Кнопка "Следующая серия" перед концом */}
      {duration > 0 && duration - currentTime < 30 && hasNext && (
        <button
          onClick={onNextEpisode}
          className="absolute bottom-20 md:bottom-24 right-4 bg-gradient-to-r from-violet-600 to-cyan-600 
            text-white px-4 py-2 rounded-xl font-bold text-sm md:text-base
            animate-bounce shadow-lg shadow-violet-500/50 hover:scale-105 transition-transform"
        >
          Следующая серия →
        </button>
      )}
    </div>
  );
});

VideoPlayer.displayName = 'VideoPlayer';
export default VideoPlayer;
