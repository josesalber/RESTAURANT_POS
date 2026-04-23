import { useCallback } from 'react';

export default function useSound() {
  const playSound = useCallback((soundType) => {
    try {
      const audio = new Audio();

      switch (soundType) {
        case 'notification':
          audio.src = '/sounds/notification.mp3';
          break;
        case 'success':
          audio.src = '/sounds/success.mp3';
          break;
        case 'error':
          audio.src = '/sounds/error.mp3';
          break;
        case 'alert':
          audio.src = '/sounds/alert.mp3';
          break;
        default:
          return;
      }

      audio.volume = 0.5;
      audio.play().catch(() => {
        // Ignore autoplay restrictions
      });
    } catch {
      // Ignore audio errors
    }
  }, []);

  return { playSound };
}
