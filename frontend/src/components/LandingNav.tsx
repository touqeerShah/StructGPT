// src/components/LandingNav.tsx
import React from 'react';
import { Brain } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

const LandingNav = ({ isAuthenticated, user, setDarkMode, darkMode, onLogout }: any) => {
  const [dropdownOpen, setDropdownOpen] = React.useState(false);
  const navigate = useNavigate();

  return (
    <nav className="fixed top-0 w-full bg-white dark:bg-gray-900/90 backdrop-blur-md  z-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          {/* Logo */}
          <div className="flex items-center space-x-2 cursor-pointer" onClick={() => navigate('/')}>
            <Brain className="h-8 w-8 text-indigo-600" />
            <span className="text-xl font-bold text-gray-900 dark:text-white">DataMind</span>
          </div>

          {/* Navigation Links */}
          <div className="hidden md:flex items-center space-x-8">
            <a href="#features" className="text-gray-600 dark:text-gray-300 hover:text-gray-900 dark:hover:text-white transition-colors">Features</a>
            <a href="#how-it-works" className="text-gray-600 dark:text-gray-300 hover:text-gray-900 dark:hover:text-white transition-colors">How It Works</a>
            <a href="#use-cases" className="text-gray-600 dark:text-gray-300 hover:text-gray-900 dark:hover:text-white transition-colors">Use Cases</a>

            {/* Authenticated Dropdown or Auth Buttons */}
            {isAuthenticated ? (
              <div className="relative">
                <button
                  onClick={() => setDropdownOpen(!dropdownOpen)}
                  className="flex items-center space-x-2 text-gray-700 dark:text-white hover:opacity-80 transition"
                >
                  <span className="text-sm">Welcome, {user?.name}</span>
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                  </svg>
                </button>

                {dropdownOpen && (
                  <div className="absolute right-0 mt-2 w-56 rounded-xl shadow-xl bg-white dark:bg-gray-800 ring-1 ring-black ring-opacity-5 z-50 overflow-hidden transition-all">
                    <div className="divide-y divide-gray-100 dark:divide-gray-700">
                      <div className="py-2">
                        {['dashboard', 'upload', 'settings'].map((route) => (
                          <button
                            key={route}
                            onClick={() => {
                              navigate(`/${route}`);
                              setDropdownOpen(false);
                            }}
                            className="flex items-center gap-2 px-4 py-2 w-full text-sm text-gray-700 dark:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
                          >
                            <span className="capitalize">{route}</span>
                          </button>
                        ))}
                      </div>
                      <div className="py-2">
                        <button
                          onClick={() => {
                            onLogout();
                            setDropdownOpen(false);
                          }}
                          className="flex items-center gap-2 px-4 py-2 w-full text-sm text-white dark:text-indigo-400 hover:dark:text-white hover:bg-indigo-700 dark:hover:bg-indigo-700 transition-colors"
                        >
                          Logout
                        </button>
                      </div>
                    </div>
                  </div>

                )}
              </div>
            ) : (
              <div className="flex items-center space-x-3">
                <button
                  onClick={() => navigate('/login')}
                  className="text-gray-600 dark:text-gray-300 hover:text-gray-900 dark:hover:text-white transition-colors"
                >
                  Sign In
                </button>
                <button
                  onClick={() => navigate('/login')}
                  className="bg-indigo-600 text-white px-4 py-2 rounded-lg hover:bg-indigo-700 transition-colors"
                >
                  Get Started
                </button>
              </div>
            )}

            {/* Dark Mode Toggle */}
            <button
              onClick={() => setDarkMode(!darkMode)}
              className="p-2 rounded-full bg-gray-200 dark:bg-gray-800 hover:ring-2 ring-indigo-400 transition"
              title="Toggle Dark Mode"
            >
              {darkMode ? '🌙' : '☀️'}
            </button>
          </div>
        </div>
      </div>
    </nav>
  );
};

export default LandingNav;
