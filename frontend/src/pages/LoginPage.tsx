import React, { useState, useEffect } from 'react';
import {
  Brain,
  Mail,
  Lock,
  Eye,
  EyeOff,
  ArrowRight,
  Shield,
  Zap,
  CheckCircle,
  AlertCircle,
  Github,
  Chrome,
  Sparkles
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { verifyGoogleToken, signup, login } from "../lib/auth";
import { saveUserData } from "../lib//localStorage";
import { GoogleLogin } from '@react-oauth/google';

interface LoginPageProps {
  onLogin: (email: string, password: string) => void;
  // onBack: () => void;
}

const LoginPage: React.FC<LoginPageProps> = ({ onLogin }) => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [message, setMessage] = useState('');
  const [loginMode, setLoginMode] = useState<'signin' | 'signup' | 'forgot'>('signin');
  const [rememberMe, setRememberMe] = useState(false);
  const navigate = useNavigate();
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setMessage('')
    setIsLoading(true);

    // Basic validation
    if (!email || !password) {
      setError('Please fill in all fields');
      setIsLoading(false);
      return;
    }

    if (!email.includes('@')) {
      setError('Please enter a valid email address');
      setIsLoading(false);
      return;
    }

    if (password.length < 6) {
      setError('Password must be at least 6 characters');
      setIsLoading(false);
      return;
    }

    // Simulate API call
    if (loginMode == "signup") {
      const response = await signup({ email, password })
      if (response.signup) {
        setIsLoading(false);
        setMessage(response.message)
        navigate("/login")
      } else {
        setIsLoading(false);
        setError(response.message)
      }
    } else if (loginMode == "signin") {
      const response = await login({ email, password })
      if (response.login) {
        setIsLoading(false);
        saveUserData(response.data)
        onLogin(response.data.user.name, 'social-login'); // or any logic to move to dashboard
        navigate("/")
      } else {
        setIsLoading(false);
        setError(response.message)
      }
    }

  };


  type GoogleCredentialResponse = {
    credential?: string; // This is the ID token
  };

  async function handleGoogleLoginSuccess(
    credentialResponse: GoogleCredentialResponse,
    onLogin: (name: string, type: string) => void,
    setError: (msg: string) => void,
    setIsLoading: (loading: boolean) => void
  ) {
    const idToken = credentialResponse.credential;

    if (!idToken) {
      setError('No ID token received');
      return;
    }

    setIsLoading(true);

    try {
      const res = await verifyGoogleToken(idToken)

      const data = res;
      console.log("data : ", data)
      if (data.isLogin && data.isVerify) {
        // Store token and user data in localStorage
        saveUserData(data)


        onLogin(data.user.name, 'social-login'); // or any logic to move to dashboard
      } else {
        setError(data.message || 'Login failed');
      }
    } catch (err) {
      console.error(err);
      setError('An error occurred during login');
    } finally {
      setIsLoading(false);
    }
  }


  const handleSocialLogin = (provider: string) => {
    setIsLoading(true);
    // Simulate social login
    if (provider === 'google') {
      setIsLoading(true);
      // googleLogin(); // 👈 This triggers Google login popup
    }

  };

  const getTitle = () => {
    switch (loginMode) {
      case 'signup': return 'Create Your Account';
      case 'forgot': return 'Reset Your Password';
      default: return 'Welcome Back';
    }
  };

  const getSubtitle = () => {
    switch (loginMode) {
      case 'signup': return 'Join thousands of teams transforming their data workflows';
      case 'forgot': return 'Enter your email and we\'ll send you a reset link';
      default: return 'Sign in to continue transforming your data';
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-indigo-50 via-white to-purple-50 flex">
      {/* Left Side - Branding */}
      <div className="hidden lg:flex lg:w-1/2 bg-gradient-to-br from-black to-gray-700 relative overflow-hidden">
        <div className="absolute inset-0 bg-black/10" />

        {/* Decorative Elements */}
        <div className="absolute top-20 left-20 w-32 h-32 bg-white/10 rounded-full blur-xl" />
        <div className="absolute bottom-40 right-20 w-48 h-48 bg-white/5 rounded-full blur-2xl" />
        <div className="absolute top-1/2 left-1/3 w-24 h-24 bg-white/10 rounded-full blur-lg" />

        <div className="relative z-10 flex flex-col justify-center px-12 py-16 text-white">
          <div className="mb-8">
            <div className="flex items-center space-x-3 mb-6">
              <div className="bg-white/20 p-3 rounded-xl backdrop-blur-sm">
                <Brain className="h-8 w-8 text-white" />
              </div>
              <span className="text-2xl font-bold">DataMind</span>
            </div>
            <h1 className="text-5xl md:text-6xl font-bold text-gray-900 dark:text-white mb-6 leading-tight">
              Transform Chaos Into
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-indigo-600 to-purple-600 dark:from-indigo-400 dark:to-purple-400">
                <br />Clarity</span>
            </h1>
            <p className="text-xl text-indigo-100 leading-relaxed">
              Join thousands of teams who trust DataMind to convert unstructured data
              into actionable insights with AI-powered precision.
            </p>
          </div>

          {/* Feature Highlights */}
          <div className="space-y-4">
            {[
              { icon: Zap, text: 'Process documents in seconds' },
              { icon: Shield, text: 'Enterprise-grade security' },
              { icon: CheckCircle, text: '99.9% accuracy guarantee' }
            ].map((feature, index) => (
              <div key={index} className="flex items-center space-x-3">
                <div className="bg-white/20 p-2 rounded-lg">
                  <feature.icon className="h-5 w-5 text-white" />
                </div>
                <span className="text-indigo-100">{feature.text}</span>
              </div>
            ))}
          </div>

          {/* Stats */}
          <div className="grid grid-cols-3 gap-6 mt-12 pt-8 border-t border-white/20">
            <div>
              <div className="text-2xl font-bold text-white">10M+</div>
              <div className="text-sm text-indigo-200">Documents Processed</div>
            </div>
            <div>
              <div className="text-2xl font-bold text-white">50+</div>
              <div className="text-sm text-indigo-200">Languages Supported</div>
            </div>
            <div>
              <div className="text-2xl font-bold text-white">99.9%</div>
              <div className="text-sm text-indigo-200">Uptime</div>
            </div>
          </div>
        </div>
      </div>

      {/* Right Side - Login Form */}
      <div className="flex-1 flex flex-col justify-center px-8 sm:px-12 lg:px-16 xl:px-20">
        <div className="w-full max-w-md mx-auto">
          {/* Mobile Header */}
          <div className="lg:hidden mb-8 text-center">
            <div className="flex items-center justify-center space-x-2 mb-4">
              <Brain className="h-8 w-8 text-indigo-600" />
              <span className="text-2xl font-bold text-gray-900">DataMind</span>
            </div>
            <div className="flex items-center justify-center space-x-2 bg-indigo-100 text-indigo-700 px-4 py-2 rounded-full text-sm font-medium">
              <Sparkles className="h-4 w-4" />
              <span>AI-Powered Data Transformation</span>
            </div>
          </div>

          {/* Back Button */}
          <button
            onClick={() => navigate('/')}
            className="mb-6 flex items-center space-x-2 text-gray-600 hover:text-gray-900 transition-colors"
          >
            <ArrowRight className="h-4 w-4 rotate-180" />
            <span>Back to Home</span>
          </button>

          {/* Form Header */}
          <div className="mb-8">
            <h2 className="text-3xl font-bold text-gray-900 mb-2">{getTitle()}</h2>
            <p className="text-gray-600">{getSubtitle()}</p>
          </div>

          {/* Error Message */}
          {error && (
            <div className="mb-6 bg-red-50 border border-red-200 rounded-lg p-4 flex items-start space-x-3">
              <AlertCircle className="h-5 w-5 text-red-500 mt-0.5" />
              <div>
                <p className="text-sm font-medium text-red-800">Error</p>
                <p className="text-sm text-red-600 mt-1">{error}</p>
              </div>
            </div>
          )}
          {message && (
            <div className="mb-6 bg-green-50 border border-green-200 rounded-lg p-4 flex items-start space-x-3">
              <CheckCircle className="h-5 w-5 text-green-500 mt-0.5" />
              <div>
                <p className="text-sm font-medium text-green-800">Success</p>
                <p className="text-sm text-green-600 mt-1">{message}</p>
              </div>
            </div>
          )}

          {/* Social Login */}
          {loginMode === 'signin' && (
            <div className="mb-6">
              <div className="grid grid-cols-2 gap-3">
                {/* <button
                  onClick={() => handleSocialLogin('google')}
                  disabled={isLoading}
                  className="flex items-center justify-center space-x-2 px-4 py-3 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <Chrome className="h-5 w-5 text-gray-600" />
                  <span className="text-sm font-medium text-gray-700">Google</span>
                </button> */}
                <GoogleLogin
                  onSuccess={(credentialResponse) =>
                    handleGoogleLoginSuccess(credentialResponse, onLogin, setError, setIsLoading)
                  }
                  onError={() => {
                    setError('Google login failed');
                    setIsLoading(false);
                  }}
                  useOneTap={false}
                />


                <button
                  onClick={() => handleSocialLogin('github')}
                  disabled={isLoading}
                  className="flex items-center justify-center space-x-2 px-4 py-3 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <Github className="h-5 w-5 text-gray-600" />
                  <span className="text-sm font-medium text-gray-700">GitHub</span>
                </button>
              </div>

              <div className="relative my-6">
                <div className="absolute inset-0 flex items-center">
                  <div className="w-full border-t border-gray-300" />
                </div>
                <div className="relative flex justify-center text-sm">
                  <span className="px-2 bg-white text-gray-500">or continue with email</span>
                </div>
              </div>
            </div>
          )}

          {/* Login Form */}
          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Email Field */}
            <div>
              <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-2">
                Email Address
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <Mail className="h-5 w-5 text-gray-400" />
                </div>
                <input
                  id="email"
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="block w-full pl-10 pr-3 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-colors"
                  placeholder="Enter your email"
                  disabled={isLoading}
                />
              </div>
            </div>

            {/* Password Field */}
            {loginMode !== 'forgot' && (
              <div>
                <label htmlFor="password" className="block text-sm font-medium text-gray-700 mb-2">
                  Password
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <Lock className="h-5 w-5 text-gray-400" />
                  </div>
                  <input
                    id="password"
                    type={showPassword ? 'text' : 'password'}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="block w-full pl-10 pr-10 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-colors"
                    placeholder="Enter your password"
                    disabled={isLoading}
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute inset-y-0 right-0 pr-3 flex items-center"
                    disabled={isLoading}
                  >
                    {showPassword ? (
                      <EyeOff className="h-5 w-5 text-gray-400 hover:text-gray-600" />
                    ) : (
                      <Eye className="h-5 w-5 text-gray-400 hover:text-gray-600" />
                    )}
                  </button>
                </div>
              </div>
            )}

            {/* Remember Me & Forgot Password */}
            {loginMode === 'signin' && (
              <div className="flex items-center justify-between">
                <label className="flex items-center">
                  <input
                    type="checkbox"
                    checked={rememberMe}
                    onChange={(e) => setRememberMe(e.target.checked)}
                    className="h-4 w-4 text-indigo-600 focus:ring-indigo-500 border-gray-300 rounded"
                    disabled={isLoading}
                  />
                  <span className="ml-2 text-sm text-gray-700">Remember me</span>
                </label>
                <button
                  type="button"
                  onClick={() => setLoginMode('forgot')}
                  className="text-sm text-indigo-600 hover:text-indigo-700 transition-colors"
                  disabled={isLoading}
                >
                  Forgot password?
                </button>
              </div>
            )}

            {/* Submit Button */}
            <button
              type="submit"
              disabled={isLoading}
              className="w-full flex items-center justify-center space-x-2 bg-gradient-to-r from-indigo-600 to-purple-600 text-white py-3 px-4 rounded-lg font-semibold hover:brightness-110 focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2 transition-all duration-200 transform hover:scale-105 shadow-lg hover:shadow-xl disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none"
            >
              {isLoading ? (
                <>
                  <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white" />
                  <span>
                    {loginMode === 'signin' ? 'Signing In...' :
                      loginMode === 'signup' ? 'Creating Account...' :
                        'Sending Reset Link...'}
                  </span>
                </>
              ) : (
                <>
                  <span>
                    {loginMode === 'signin' ? 'Sign In' :
                      loginMode === 'signup' ? 'Create Account' :
                        'Send Reset Link'}
                  </span>
                  <ArrowRight className="h-5 w-5" />
                </>
              )}
            </button>
          </form>

          {/* Mode Switcher */}
          <div className="mt-8 text-center">
            {loginMode === 'signin' ? (
              <p className="text-gray-600">
                Don't have an account?{' '}
                <button
                  onClick={() => setLoginMode('signup')}
                  className="text-indigo-600 hover:text-indigo-700 font-medium transition-colors"
                  disabled={isLoading}
                >
                  Sign up for free
                </button>
              </p>
            ) : loginMode === 'signup' ? (
              <p className="text-gray-600">
                Already have an account?{' '}
                <button
                  onClick={() => {
                    setError('')
                    setLoginMode('signin')
                  }
                  }
                  className="text-indigo-600 hover:text-indigo-700 font-medium transition-colors"
                  disabled={isLoading}
                >
                  Sign in
                </button>
              </p>
            ) : (
              <p className="text-gray-600">
                Remember your password?{' '}
                <button
                  onClick={() => setLoginMode('signin')}
                  className="text-indigo-600 hover:text-indigo-700 font-medium transition-colors"
                  disabled={isLoading}
                >
                  Back to sign in
                </button>
              </p>
            )}
          </div>

          {/* Terms & Privacy */}
          {loginMode === 'signup' && (
            <div className="mt-6 text-center">
              <p className="text-xs text-gray-500">
                By creating an account, you agree to our{' '}
                <a href="#" className="text-indigo-600 hover:text-indigo-700">Terms of Service</a>
                {' '}and{' '}
                <a href="#" className="text-indigo-600 hover:text-indigo-700">Privacy Policy</a>
              </p>
            </div>
          )}

          {/* Security Notice */}
          <div className="mt-8 bg-gray-50 rounded-lg p-4">
            <div className="flex items-start space-x-3">
              <Shield className="h-5 w-5 text-green-600 mt-0.5" />
              <div>
                <p className="text-sm font-medium text-gray-900">Secure & Private</p>
                <p className="text-xs text-gray-600 mt-1">
                  Your data is protected with enterprise-grade encryption and never shared with third parties.
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default LoginPage;