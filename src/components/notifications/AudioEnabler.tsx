import React, { useEffect } from 'react';
import { NotificationSound } from '@/utils/notificationSound';

const AudioEnabler: React.FC = () => {
  useEffect(() => {
    // Enable audio on first user interaction
    const enableAudio = async () => {
      await NotificationSound.enableAudio();
    };

    // Add event listeners for user interactions
    const handleUserInteraction = () => {
      enableAudio();
      // Remove listeners after first interaction
      document.removeEventListener('click', handleUserInteraction);
      document.removeEventListener('keydown', handleUserInteraction);
      document.removeEventListener('touchstart', handleUserInteraction);
    };

    // Listen for any user interaction
    document.addEventListener('click', handleUserInteraction);
    document.addEventListener('keydown', handleUserInteraction);
    document.addEventListener('touchstart', handleUserInteraction);

    // Cleanup
    return () => {
      document.removeEventListener('click', handleUserInteraction);
      document.removeEventListener('keydown', handleUserInteraction);
      document.removeEventListener('touchstart', handleUserInteraction);
    };
  }, []);

  return null; // This component doesn't render anything
};

export default AudioEnabler;
