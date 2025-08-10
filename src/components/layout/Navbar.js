import { useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { useAuth } from '../../store/AuthContext';
import { 
  FiHome, 
  FiGrid, 
  FiLogOut, 
  FiLogIn, 
  FiFolder
} from 'react-icons/fi';

function Navbar() {
  const { isAuthenticated, logout } = useAuth();
  const [_mobileMenuOpen, _setMobileMenuOpen] = useState(false);
  const location = useLocation();

  const isActive = (path) => location.pathname === path;

  return (
    <nav className="sticky top-0 z-50 bg-gradient-to-b from-white/95 to-white/90 backdrop-blur-xl border-b border-gray-100/80 shadow-sm">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between h-16">
          {/* Logo Section */}
          <div className="flex">
            <Link to="/" className="group flex-shrink-0 flex items-center">
              <span className="text-2xl font-bold bg-gradient-to-br from-indigo-600 via-blue-600 to-blue-500
                             bg-clip-text text-transparent group-hover:from-indigo-500 
                             group-hover:via-blue-500 group-hover:to-blue-400 
                             transition-all duration-300 font-display tracking-tight">
                VideoAI
              </span>
            </Link>
            
            {/* Navigation Links - 更精致的样式 */}
            <div className="hidden sm:ml-10 sm:flex sm:space-x-10">
              <Link 
                to="/" 
                className={`group relative px-3 py-2 flex items-center space-x-2.5
                        ${isActive('/') ? 'text-blue-600' : 'text-gray-600'}`}
              >
                <div className={`absolute inset-0 rounded-lg bg-blue-50/0 
                              group-hover:bg-blue-50/80 transition-colors duration-300
                              ${isActive('/') ? 'bg-blue-50' : ''}`} />
                <FiHome className={`w-[18px] h-[18px] relative z-10 transition-colors duration-300
                              ${isActive('/') ? 'text-blue-600' : 'text-gray-500 group-hover:text-blue-500'}`} />
                <span className="text-[13px] relative z-10 font-medium tracking-wide font-ui
                             group-hover:text-blue-600 transition-colors duration-300">
                  Home
                </span>
                <div className={`absolute bottom-0 left-0 right-0 mx-auto w-8 h-0.5 rounded-full
                              bg-blue-500/80 scale-x-0 group-hover:scale-x-100 
                              transition-transform duration-300 ease-out
                              ${isActive('/') ? 'scale-x-100' : ''}`} />
              </Link>

              <Link
                to="/dashboard"
                className={`group relative px-3 py-2 flex items-center space-x-2.5
                        ${isActive('/dashboard') ? 'text-blue-600' : 'text-gray-600'}`}
              >
                <div className={`absolute inset-0 rounded-lg bg-blue-50/0 
                              group-hover:bg-blue-50/80 transition-colors duration-300
                              ${isActive('/dashboard') ? 'bg-blue-50' : ''}`} />
                <FiGrid className={`w-[18px] h-[18px] relative z-10 transition-colors duration-300
                              ${isActive('/dashboard') ? 'text-blue-600' : 'text-gray-500 group-hover:text-blue-500'}`} />
                <span className="text-[13px] relative z-10 font-medium tracking-wide font-ui
                             group-hover:text-blue-600 transition-colors duration-300">
                  Dashboard
                </span>
                <div className={`absolute bottom-0 left-0 right-0 mx-auto w-8 h-0.5 rounded-full
                              bg-blue-500/80 scale-x-0 group-hover:scale-x-100 
                              transition-transform duration-300 ease-out
                              ${isActive('/dashboard') ? 'scale-x-100' : ''}`} />
              </Link>

              {isAuthenticated && (
                <>
                  <Link
                    to="/folders"
                    className={`group relative px-3 py-2 flex items-center space-x-2.5
                              ${isActive('/folders') ? 'text-blue-600' : 'text-gray-600'}`}
                  >
                    <div className={`absolute inset-0 rounded-lg bg-blue-50/0 
                                  group-hover:bg-blue-50/80 transition-colors duration-300
                                  ${isActive('/folders') ? 'bg-blue-50' : ''}`} />
                    <FiFolder className={`w-[18px] h-[18px] relative z-10 transition-colors duration-300
                                     ${isActive('/folders') ? 'text-blue-600' : 'text-gray-500 group-hover:text-blue-500'}`} />
                    <span className="text-[13px] relative z-10 font-medium tracking-wide font-ui
                                 group-hover:text-blue-600 transition-colors duration-300">
                      Folders
                    </span>
                    <div className={`absolute bottom-0 left-0 right-0 mx-auto w-8 h-0.5 rounded-full
                                  bg-blue-500/80 scale-x-0 group-hover:scale-x-100 
                                  transition-transform duration-300 ease-out
                                  ${isActive('/folders') ? 'scale-x-100' : ''}`} />
                  </Link>
                </>
              )}
            </div>
          </div>

          {/* Auth Buttons - 更精致的按钮 */}
          <div className="hidden sm:ml-6 sm:flex sm:items-center">
            <button
              onClick={logout}
              className="group relative px-5 py-2 rounded-xl overflow-hidden
                       transform hover:-translate-y-0.5 transition-all duration-300"
            >
              <div className="absolute inset-0 bg-gradient-to-r from-blue-600 to-blue-500
                            group-hover:from-blue-500 group-hover:to-blue-400
                            transition-colors duration-300" />
              <div className="absolute inset-0 opacity-0 group-hover:opacity-20
                            bg-[radial-gradient(circle_at_center,_white_0%,_transparent_100%)]" />
              <span className="relative z-10 text-[13px] font-medium text-white font-ui
                           flex items-center gap-2">
                <FiLogOut className="w-[18px] h-[18px]" />
                <span>Logout</span>
              </span>
            </button>
          </div>

          {/* Mobile Menu - 更精致的移动端样式 */}
          <div className="sm:hidden">
            <div className="pt-2 pb-3 space-y-1.5">
              <Link
                to="/"
                className={`group flex items-center space-x-3 px-4 py-2.5 rounded-xl
                         ${isActive('/') ? 'bg-blue-50 text-blue-600' : 'text-gray-600'}
                         hover:bg-blue-50/80 transition-all duration-300`}
              >
                <FiHome className="w-[18px] h-[18px]" />
                <span className="text-[13px] font-medium font-ui">Home</span>
              </Link>

              {isAuthenticated && (
                <>
                  <Link
                    to="/dashboard"
                    className={`group flex items-center space-x-3 px-4 py-2.5 rounded-xl
                             ${isActive('/dashboard') ? 'bg-blue-50 text-blue-600' : 'text-gray-600'}
                             hover:bg-blue-50/80 transition-all duration-300`}
                  >
                    <FiGrid className="w-[18px] h-[18px]" />
                    <span className="text-[13px] font-medium font-ui">Dashboard</span>
                  </Link>

                  <Link
                    to="/folders"
                    className={`group flex items-center space-x-3 px-4 py-2.5 rounded-xl
                             ${isActive('/folders') ? 'bg-blue-50 text-blue-600' : 'text-gray-600'}
                             hover:bg-blue-50/80 transition-all duration-300`}
                  >
                    <FiFolder className="w-[18px] h-[18px]" />
                    <span className="text-[13px] font-medium font-ui">Folders</span>
                  </Link>
                </>
              )}

              {isAuthenticated ? (
                <button
                  onClick={logout}
                  className="w-full flex items-center space-x-3 px-4 py-2.5 text-gray-600
                         hover:bg-blue-50/80 transition-all duration-300"
                >
                  <FiLogOut className="w-4 h-4" />
                  <span className="text-sm font-medium font-ui">Logout</span>
                </button>
              ) : (
                <Link
                  to="/login"
                  className="flex items-center space-x-3 px-4 py-2.5 text-gray-600
                         hover:bg-blue-50/80 transition-all duration-300"
                >
                  <FiLogIn className="w-4 h-4" />
                  <span className="text-sm font-medium font-ui">Sign In</span>
                </Link>
              )}
            </div>
          </div>
        </div>
      </div>
    </nav>
  );
}

export default Navbar; 