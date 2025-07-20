import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { toast } from 'react-hot-toast';
import { authAPI } from '../services/api';
import { QrCode, Shield, Users, UserPlus, LogIn, Zap } from 'lucide-react';

const Login = () => {
  const [isSignup, setIsSignup] = useState(false);
  const [credentials, setCredentials] = useState({
    username: '',
    password: '',
    confirmPassword: ''
  });
  const [isLoading, setIsLoading] = useState(false);
  const navigate = useNavigate();

  const handleChange = (e) => {
    setCredentials({
      ...credentials,
      [e.target.name]: e.target.value
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsLoading(true);

    try {
      if (isSignup) {
        // Signup logic
        if (credentials.password !== credentials.confirmPassword) {
          toast.error('Passwords do not match');
          setIsLoading(false);
          return;
        }

        if (credentials.password.length < 6) {
          toast.error('Password must be at least 6 characters long');
          setIsLoading(false);
          return;
        }

        await authAPI.create({
          username: credentials.username,
          password: credentials.password
        });
        
        toast.success('Admin account created successfully! Please sign in.');
        setIsSignup(false);
        setCredentials({ username: '', password: '', confirmPassword: '' });
      } else {
        // Login logic
        const response = await authAPI.login(credentials);
        localStorage.setItem('token', response.data.token);
        toast.success('Login successful!');
        navigate('/');
      }
    } catch (error) {
      console.error(isSignup ? 'Signup error:' : 'Login error:', error);
      toast.error(error.response?.data?.error || (isSignup ? 'Signup failed' : 'Login failed'));
    } finally {
      setIsLoading(false);
    }
  };

  const toggleMode = () => {
    setIsSignup(!isSignup);
    setCredentials({ username: '', password: '', confirmPassword: '' });
  };

  return (
    <div className="min-h-screen flex">
      {/* Left Side - HCLTech Branding */}
      <div className="hidden lg:flex lg:w-1/2 bg-gradient-to-br from-purple-900 via-purple-800 to-blue-600 relative overflow-hidden">
        {/* Background Pattern */}
        <div className="absolute inset-0 opacity-10">
          <div className="absolute top-10 left-10 w-32 h-32 bg-white rounded-full"></div>
          <div className="absolute top-40 right-20 w-24 h-24 bg-white rounded-full"></div>
          <div className="absolute bottom-20 left-20 w-16 h-16 bg-white rounded-full"></div>
          <div className="absolute bottom-40 right-10 w-20 h-20 bg-white rounded-full"></div>
        </div>
        
        {/* Content */}
        <div className="relative z-10 flex flex-col justify-center items-center text-white px-12">
          {/* Logo */}
          <div className="mb-8">
            <div className="flex items-center space-x-4">
              <div className="w-16 h-16 bg-white rounded-xl flex items-center justify-center">
                <Zap className="w-8 h-8 text-purple-600" />
              </div>
              <div>
                <h1 className="text-4xl font-bold tracking-tight">HCLTech</h1>
                <p className="text-lg text-purple-200">Supercharging Progress™</p>
              </div>
            </div>
          </div>

          {/* Main Message */}
          <div className="text-center max-w-md">
            <h2 className="text-3xl font-bold mb-4">
              Hackathon Management System
            </h2>
            <p className="text-xl text-purple-200 mb-8">
              Streamline your hackathon with AI-powered squad formation and QR attendance tracking
            </p>
          </div>

          {/* Features */}
          <div className="space-y-6 w-full max-w-sm">
            <div className="flex items-center space-x-4 p-4 bg-white bg-opacity-10 rounded-lg backdrop-blur-sm">
              <QrCode className="w-6 h-6 text-purple-300" />
              <div>
                <h3 className="font-semibold text-white">QR Attendance</h3>
                <p className="text-sm text-purple-200">Instant check-ins with QR codes</p>
              </div>
            </div>
            
            <div className="flex items-center space-x-4 p-4 bg-white bg-opacity-10 rounded-lg backdrop-blur-sm">
              <Users className="w-6 h-6 text-blue-300" />
              <div>
                <h3 className="font-semibold text-white">AI Squad Formation</h3>
                <p className="text-sm text-purple-200">Smart team building with AI</p>
              </div>
            </div>
            
            <div className="flex items-center space-x-4 p-4 bg-white bg-opacity-10 rounded-lg backdrop-blur-sm">
              <Shield className="w-6 h-6 text-purple-300" />
              <div>
                <h3 className="font-semibold text-white">Real-time Analytics</h3>
                <p className="text-sm text-purple-200">Comprehensive reporting dashboard</p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Right Side - Login Form */}
      <div className="flex-1 flex items-center justify-center px-4 sm:px-6 lg:px-8 bg-gray-50">
        <div className="max-w-md w-full space-y-8">
          {/* Mobile Logo */}
          <div className="lg:hidden text-center">
            <div className="flex items-center justify-center space-x-3 mb-4">
              <div className="w-12 h-12 bg-gradient-to-br from-purple-600 to-blue-600 rounded-lg flex items-center justify-center">
                <Zap className="w-6 h-6 text-white" />
              </div>
              <div>
                <h1 className="text-2xl font-bold text-gray-900">HCLTech</h1>
                <p className="text-sm text-gray-600">Supercharging Progress™</p>
              </div>
            </div>
          </div>

          {/* Form Header */}
          <div className="text-center">
            <h2 className="text-3xl font-bold text-gray-900">
              {isSignup ? 'Create Account' : 'Welcome Back'}
            </h2>
            <p className="mt-2 text-sm text-gray-600">
              {isSignup 
                ? 'Set up your admin account to get started' 
                : 'Sign in to access the hackathon management system'
              }
            </p>
          </div>

          {/* Form */}
          <form className="mt-8 space-y-6" onSubmit={handleSubmit}>
            <div className="space-y-4">
              <div>
                <label htmlFor="username" className="block text-sm font-medium text-gray-700 mb-1">
                  Username
                </label>
                <input
                  id="username"
                  name="username"
                  type="text"
                  required
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-colors"
                  placeholder="Enter your username"
                  value={credentials.username}
                  onChange={handleChange}
                />
              </div>
              
              <div>
                <label htmlFor="password" className="block text-sm font-medium text-gray-700 mb-1">
                  Password
                </label>
                <input
                  id="password"
                  name="password"
                  type="password"
                  required
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-colors"
                  placeholder="Enter your password"
                  value={credentials.password}
                  onChange={handleChange}
                />
              </div>
              
              {isSignup && (
                <div>
                  <label htmlFor="confirmPassword" className="block text-sm font-medium text-gray-700 mb-1">
                    Confirm Password
                  </label>
                  <input
                    id="confirmPassword"
                    name="confirmPassword"
                    type="password"
                    required
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-colors"
                    placeholder="Confirm your password"
                    value={credentials.confirmPassword}
                    onChange={handleChange}
                  />
                </div>
              )}
            </div>

            <div>
              <button
                type="submit"
                disabled={isLoading}
                className="w-full flex justify-center items-center py-3 px-4 border border-transparent rounded-lg text-white bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-purple-500 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200 font-medium"
              >
                {isLoading ? (
                  <div className="spinner h-5 w-5"></div>
                ) : (
                  <>
                    {isSignup ? (
                      <>
                        <UserPlus className="h-5 w-5 mr-2" />
                        Create Account
                      </>
                    ) : (
                      <>
                        <LogIn className="h-5 w-5 mr-2" />
                        Sign In
                      </>
                    )}
                  </>
                )}
              </button>
            </div>

            {/* Toggle Mode */}
            <div className="text-center">
              <button
                type="button"
                onClick={toggleMode}
                className="text-sm text-purple-600 hover:text-purple-500 font-medium transition-colors"
              >
                {isSignup 
                  ? 'Already have an account? Sign in' 
                  : 'Need an admin account? Create one'
                }
              </button>
            </div>
          </form>

          {/* Footer */}
          <div className="text-center">
            <p className="text-xs text-gray-500">
              Access the QR scanner at{' '}
              <a 
                href="/scanner" 
                className="text-purple-600 hover:text-purple-500 underline font-medium"
              >
                /scanner
              </a>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Login; 