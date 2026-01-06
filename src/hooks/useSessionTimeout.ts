'use client';

import { useEffect, useRef, useCallback } from 'react';
import { useAuth } from '@/context/AuthContext';

/**
 * Hook to automatically logout users after X minutes of inactivity
 * Safe implementation - doesn't modify existing auth logic
 * 
 * @param timeoutMinutes - Minutes of inactivity before logout (default: 30)
 * 
 * Usage:
 *   useSessionTimeout(30); // Logout after 30 minutes of inactivity
 */
export function useSessionTimeout(timeoutMinutes: number = 30) {
  // IMPORTANT: All hooks must be called BEFORE any conditional logic
  // to follow React Rules of Hooks
  const authContext = useAuth();
  const timeoutRef = useRef<NodeJS.Timeout | null>(null);
  const INACTIVITY_TIME = timeoutMinutes * 60 * 1000;

  const resetTimeout = useCallback(() => {
    try {
      // Safety check - only proceed if logout exists
      if (!authContext?.logout) return;

      // Clear existing timeout
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }

      // Set new timeout for inactivity logout
      timeoutRef.current = setTimeout(() => {
        try {
          authContext.logout();
          console.log(`✅ Session expired after ${timeoutMinutes} minutes of inactivity`);
        } catch (err) {
          console.error('Error during inactivity logout:', err);
        }
      }, INACTIVITY_TIME);
    } catch (err) {
      console.error('Error resetting session timeout:', err);
    }
  }, [authContext?.logout, INACTIVITY_TIME, timeoutMinutes]);

  useEffect(() => {
    // Only run if user is authenticated
    if (!authContext?.token) return;

    try {
      // List of user activity events that reset the inactivity timer
      const activityEvents = ['mousedown', 'keydown', 'scroll', 'touchstart', 'click'];

      // Add event listeners for each activity type
      activityEvents.forEach((event) => {
        window.addEventListener(event, resetTimeout, { passive: true });
      });

      // Initial timeout setup
      resetTimeout();

      // Cleanup function - remove event listeners and clear timeout
      return () => {
        activityEvents.forEach((event) => {
          window.removeEventListener(event, resetTimeout);
        });
        if (timeoutRef.current) {
          clearTimeout(timeoutRef.current);
        }
      };
    } catch (err) {
      console.error('Error setting up session timeout:', err);
    }
  }, [authContext?.token, resetTimeout]);
}
