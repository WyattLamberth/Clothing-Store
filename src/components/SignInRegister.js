import React, { useState } from 'react';

const SignInRegister = () => {
  const [isSignIn, setIsSignIn] = useState(true);

  const toggleForm = () => setIsSignIn(!isSignIn);

  return (
    <div className="container mx-auto px-4 py-8">
      <h1 className="text-3xl font-bold mb-6">{isSignIn ? 'Sign In' : 'Register'}</h1>
      <div className="max-w-md mx-auto">
        <form className="space-y-4">
          {!isSignIn && (
            <div>
              <label htmlFor="name" className="block mb-1">Name</label>
              <input type="text" id="name" className="w-full border rounded px-3 py-2" required />
            </div>
          )}
          <div>
            <label htmlFor="email" className="block mb-1">Email</label>
            <input type="email" id="email" className="w-full border rounded px-3 py-2" required />
          </div>
          <div>
            <label htmlFor="password" className="block mb-1">Password</label>
            <input type="password" id="password" className="w-full border rounded px-3 py-2" required />
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