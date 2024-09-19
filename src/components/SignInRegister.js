// src/components/SignInRegister.js
import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../AuthContext';

const SignInRegister = () => {
  const [isSignIn, setIsSignIn] = useState(true);
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const { login } = useAuth();
  const navigate = useNavigate();

  const toggleForm = () => setIsSignIn(!isSignIn);

  const handleSubmit = (e) => {
    e.preventDefault();
    if (login(username, password)) {
      navigate('/employee');
    } else {
      alert('Invalid credentials');
    }
  };

  return (
    <div className="container mx-auto px-4 py-8">
      <h1 className="text-3xl font-bold mb-6">{isSignIn ? 'Sign In' : 'Register'}</h1>
      <div className="max-w-md mx-auto">
        <form className="space-y-4" onSubmit={handleSubmit}>
          <div>
            <label htmlFor="username" className="block mb-1">Username</label>
            <input 
              type="text" 
              id="username" 
              className="w-full border rounded px-3 py-2" 
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              required 
            />
          </div>
          <div>
            <label htmlFor="password" className="block mb-1">Password</label>
            <input 
              type="password" 
              id="password" 
              className="w-full border rounded px-3 py-2" 
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required 
            />
          </div>
          <button type="submit" className="w-full bg-blue-600 text-white py-2 rounded hover:bg-blue-700">
            {isSignIn ? 'Sign In' : 'Register'}
          </button>
        </form>
        <p className="mt-4 text-center">
          {isSignIn ? "Don't have an account? " : "Already have an account? "}
          <button onClick={toggleForm} className="text-blue-600 hover:underline">
            {isSignIn ? 'Register' : 'Sign In'}
          </button>
        </p>
      </div>
    </div>
  );
};

export default SignInRegister;