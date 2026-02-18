import { useState } from 'react';
import { View } from '../types';
import { useAuth } from '../context/AuthContext';
import { useSocket } from '../context/SocketContext';
import AuthModal from './AuthModal';

interface HeaderProps {
  onNavigate: (view: View) => void;
  searchQuery: string;
  onSearch: (query: string) => void;
}

export function Header({ onNavigate, searchQuery, onSearch }: HeaderProps) {
  const { user, logout } = useAuth();
  const { isConnected } = useSocket();
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [showAuthModal, setShowAuthModal] = useState(false);
  const [showUserMenu, setShowUserMenu] = useState(false);

  return (
    <>
      <header className="sticky top-0 z-50 bg-[#0a0a0f]/90 backdrop-blur-xl border-b border-violet-500/20">
        <div className="max-w-7xl mx-auto px-3 sm:px-4 py-3 sm:py-4">
          <div className="flex items-center justify-between gap-2 sm:gap-4">
            {/* Logo */}
            <button 
              onClick={() => onNavigate('home')}
              className="flex items-center gap-2 sm:gap-3 group flex-shrink-0"
            >
              <div className="relative">
                <div className="w-10 h-10 sm:w-12 sm:h-12 bg-gradient-to-br from-violet-500 to-cyan-500 rounded-lg sm:rounded-xl flex items-center justify-center glow float">
                  <svg className="w-5 h-5 sm:w-7 sm:h-7 text-white" viewBox="0 0 24 24" fill="currentColor">
                    <path d="M8 5v14l11-7z"/>
                  </svg>
                </div>
                <div className="absolute -inset-1 bg-gradient-to-r from-violet-500 to-cyan-500 rounded-xl blur opacity-30 group-hover:opacity-50 transition-opacity" />
              </div>
              <div className="hidden sm:block">
                <h1 className="text-xl sm:text-2xl font-bold gradient-text">AniWatch</h1>
                <p className="text-xs text-gray-500">3D Experience</p>
              </div>
            </button>

            {/* Desktop Search */}
            <div className="hidden sm:flex flex-1 max-w-xl">
              <div className="relative w-full group">
                <input
                  type="text"
                  placeholder="Поиск аниме..."
                  value={searchQuery}
                  onChange={(e) => onSearch(e.target.value)}
                  className="w-full bg-[#13131a] border border-violet-500/30 rounded-xl px-5 py-3 pl-12 text-white placeholder-gray-500 focus:outline-none focus:border-violet-500 focus:ring-2 focus:ring-violet-500/20 transition-all"
                />
                <svg className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-500 group-focus-within:text-violet-400 transition-colors" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                </svg>
              </div>
            </div>

            {/* Mobile Search Toggle & Nav */}
            <div className="flex items-center gap-2">
              {/* Connection Status */}
              {user && (
                <div className={`hidden sm:flex items-center gap-1 px-2 py-1 rounded-full text-xs ${isConnected ? 'bg-green-500/20 text-green-400' : 'bg-red-500/20 text-red-400'}`}>
                  <span className={`w-2 h-2 rounded-full ${isConnected ? 'bg-green-500' : 'bg-red-500'}`} />
                  {isConnected ? 'Online' : 'Offline'}
                </div>
              )}

              {/* Mobile Search Button */}
              <button 
                onClick={() => setIsSearchOpen(!isSearchOpen)}
                className="sm:hidden p-2 text-gray-400 hover:text-violet-400 transition-colors"
              >
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                </svg>
              </button>

              {/* Desktop Nav */}
              <nav className="hidden md:flex items-center gap-4 lg:gap-6">
                <button className="text-gray-400 hover:text-violet-400 transition-colors font-medium">
                  Каталог
                </button>
                <button className="text-gray-400 hover:text-violet-400 transition-colors font-medium">
                  Жанры
                </button>
                
                {user ? (
                  <div className="relative">
                    <button 
                      onClick={() => setShowUserMenu(!showUserMenu)}
                      className="flex items-center gap-2 hover:opacity-80 transition-opacity"
                    >
                      <img 
                        src={user.avatar} 
                        alt={user.username} 
                        className="w-10 h-10 rounded-full border-2 border-violet-500"
                      />
                      <span className="text-white font-medium">{user.username}</span>
                    </button>

                    {showUserMenu && (
                      <>
                        <div className="fixed inset-0 z-40" onClick={() => setShowUserMenu(false)} />
                        <div className="absolute right-0 top-full mt-2 w-48 bg-[#1a1a2e] border border-violet-500/30 rounded-xl shadow-xl z-50 overflow-hidden">
                          <div className="p-3 border-b border-violet-500/20">
                            <p className="text-white font-medium">{user.username}</p>
                            <p className="text-gray-400 text-xs truncate">{user.email}</p>
                          </div>
                          <button className="w-full px-4 py-3 text-left text-gray-300 hover:bg-violet-500/20 hover:text-white transition-colors flex items-center gap-2">
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                            </svg>
                            Профиль
                          </button>
                          <button className="w-full px-4 py-3 text-left text-gray-300 hover:bg-violet-500/20 hover:text-white transition-colors flex items-center gap-2">
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
                            </svg>
                            Избранное
                          </button>
                          <button 
                            onClick={() => { logout(); setShowUserMenu(false); }}
                            className="w-full px-4 py-3 text-left text-red-400 hover:bg-red-500/20 hover:text-red-300 transition-colors flex items-center gap-2"
                          >
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
                            </svg>
                            Выйти
                          </button>
                        </div>
                      </>
                    )}
                  </div>
                ) : (
                  <button 
                    onClick={() => setShowAuthModal(true)}
                    className="bg-gradient-to-r from-violet-500 to-cyan-500 px-4 lg:px-5 py-2 rounded-xl font-semibold hover:shadow-lg hover:shadow-violet-500/30 transition-all text-sm lg:text-base"
                  >
                    Войти
                  </button>
                )}
              </nav>

              {/* Mobile Menu Button */}
              <button 
                onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
                className="md:hidden p-2 text-gray-400 hover:text-violet-400 transition-colors"
              >
                {isMobileMenuOpen ? (
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                ) : (
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
                  </svg>
                )}
              </button>
            </div>
          </div>

          {/* Mobile Search Bar */}
          {isSearchOpen && (
            <div className="sm:hidden mt-3">
              <div className="relative group">
                <input
                  type="text"
                  placeholder="Поиск аниме..."
                  value={searchQuery}
                  onChange={(e) => onSearch(e.target.value)}
                  autoFocus
                  className="w-full bg-[#13131a] border border-violet-500/30 rounded-xl px-4 py-2.5 pl-10 text-white placeholder-gray-500 focus:outline-none focus:border-violet-500 transition-all"
                />
                <svg className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                </svg>
              </div>
            </div>
          )}

          {/* Mobile Menu */}
          {isMobileMenuOpen && (
            <div className="md:hidden mt-3 py-3 border-t border-violet-500/20">
              {user && (
                <div className="flex items-center gap-3 pb-3 mb-3 border-b border-violet-500/20">
                  <img 
                    src={user.avatar} 
                    alt={user.username} 
                    className="w-12 h-12 rounded-full border-2 border-violet-500"
                  />
                  <div>
                    <p className="text-white font-medium">{user.username}</p>
                    <p className="text-gray-400 text-xs">{user.email}</p>
                  </div>
                  <div className={`ml-auto flex items-center gap-1 px-2 py-1 rounded-full text-xs ${isConnected ? 'bg-green-500/20 text-green-400' : 'bg-red-500/20 text-red-400'}`}>
                    <span className={`w-2 h-2 rounded-full ${isConnected ? 'bg-green-500' : 'bg-red-500'}`} />
                  </div>
                </div>
              )}

              <nav className="flex flex-col gap-2">
                <button className="text-gray-400 hover:text-violet-400 transition-colors font-medium py-2 text-left">
                  Каталог
                </button>
                <button className="text-gray-400 hover:text-violet-400 transition-colors font-medium py-2 text-left">
                  Жанры
                </button>
                {user ? (
                  <>
                    <button className="text-gray-400 hover:text-violet-400 transition-colors font-medium py-2 text-left">
                      Избранное
                    </button>
                    <button 
                      onClick={logout}
                      className="text-red-400 hover:text-red-300 transition-colors font-medium py-2 text-left"
                    >
                      Выйти
                    </button>
                  </>
                ) : (
                  <button 
                    onClick={() => { setShowAuthModal(true); setIsMobileMenuOpen(false); }}
                    className="bg-gradient-to-r from-violet-500 to-cyan-500 px-4 py-2.5 rounded-xl font-semibold text-center mt-2"
                  >
                    Войти
                  </button>
                )}
              </nav>
            </div>
          )}
        </div>
      </header>

      <AuthModal isOpen={showAuthModal} onClose={() => setShowAuthModal(false)} />
    </>
  );
}
