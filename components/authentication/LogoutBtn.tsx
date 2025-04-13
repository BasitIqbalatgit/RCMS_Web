"use client";

import React, { useState } from 'react';
import { signOut } from 'next-auth/react';

const LogoutBtn = () => {
  const [isLoggingOut, setIsLoggingOut] = useState(false);

  const handleLogOut = async () => {
    if (isLoggingOut) return; // Prevent multiple clicks
    
    try {
      setIsLoggingOut(true);
      console.log("Attempting to log out...");
      
      // Force a complete redirect to the signout endpoint
      await signOut({
        callbackUrl: '/',
        redirect: true
      });
      
      // This code below shouldn't run if redirect works properly
      console.log("Logout callback completed");
    } catch (error) {
      console.error("Logout failed:", error);
      setIsLoggingOut(false);
      
      // Fallback logout method if the normal one fails
      window.location.href = '/api/auth/signout?callbackUrl=/';
    }
  };

  return (
    <div>
      <span 
        className={`inline-block w-full text-destructive cursor-pointer hover:underline ${isLoggingOut ? 'opacity-50' : ''}`}
        onClick={handleLogOut}
      >
        {isLoggingOut ? 'Logging out...' : 'Logout'}
      </span>
    </div>
  );
};

export default LogoutBtn;