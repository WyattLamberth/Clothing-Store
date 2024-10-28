import React, { useState } from 'react';

const NotificationBar = ({ message, linkText, linkUrl }) => {
  const [isVisible, setIsVisible] = useState(true);

  if (!isVisible) return null;

  return (
    <div className="bg-blue-600 text-white text-center py-2 px-4 relative">
      <span className="font-semibold">{message}</span>
      {linkText && linkUrl && (
        <a href={linkUrl} className="ml-2 underline font-bold hover:text-gray-200">
          {linkText}
        </a>
      )}
      <button 
        className="absolute right-4 top-2 text-white hover:text-gray-200"
        onClick={() => setIsVisible(false)}
      >
        ✕
      </button>
    </div>
  );
};

export default NotificationBar;