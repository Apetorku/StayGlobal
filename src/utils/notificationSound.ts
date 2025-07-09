// Simple notification sound utility
export class NotificationSound {
  private static audioContext: AudioContext | null = null;
  private static isAudioEnabled: boolean = false;

  // Initialize audio context (requires user interaction)
  private static async getAudioContext(): Promise<AudioContext | null> {
    try {
      if (!this.audioContext) {
        this.audioContext = new (window.AudioContext || (window as any).webkitAudioContext)();
      }

      // Resume audio context if it's suspended (required by browsers)
      if (this.audioContext.state === 'suspended') {
        await this.audioContext.resume();
      }

      this.isAudioEnabled = true;
      return this.audioContext;
    } catch (error) {
      console.warn('Audio context not available:', error);
      return null;
    }
  }

  // Enable audio on user interaction (call this on first user click/touch)
  static async enableAudio(): Promise<void> {
    try {
      await this.getAudioContext();
      console.log('✅ Audio enabled for notifications');
    } catch (error) {
      console.warn('Could not enable audio:', error);
    }
  }

  // Play a simple notification beep
  static async playNotificationSound(): Promise<void> {
    try {
      const audioContext = await this.getAudioContext();
      if (!audioContext) {
        this.playFallbackSound();
        return;
      }

      // Create oscillator for the beep sound
      const oscillator = audioContext.createOscillator();
      const gainNode = audioContext.createGain();

      // Connect nodes
      oscillator.connect(gainNode);
      gainNode.connect(audioContext.destination);

      // Configure the sound
      oscillator.frequency.setValueAtTime(800, audioContext.currentTime); // 800Hz frequency
      oscillator.type = 'sine';

      // Configure volume envelope
      gainNode.gain.setValueAtTime(0, audioContext.currentTime);
      gainNode.gain.linearRampToValueAtTime(0.2, audioContext.currentTime + 0.01);
      gainNode.gain.exponentialRampToValueAtTime(0.001, audioContext.currentTime + 0.3);

      // Play the sound
      oscillator.start(audioContext.currentTime);
      oscillator.stop(audioContext.currentTime + 0.3);

    } catch (error) {
      console.warn('Could not play notification sound:', error);
      // Fallback: try to use a simple beep if available
      this.playFallbackSound();
    }
  }

  // Fallback sound using system beep or HTML5 audio
  private static playFallbackSound(): void {
    try {
      // Try to create a simple beep sound using HTML5 audio
      const audio = new Audio();
      audio.volume = 0.3;

      // Create a simple beep using data URL
      const beepSound = 'data:audio/wav;base64,UklGRnoGAABXQVZFZm10IBAAAAABAAEAQB8AAEAfAAABAAgAZGF0YQoGAACBhYqFbF1fdJivrJBhNjVgodDbq2EcBj+a2/LDciUFLIHO8tiJNwgZaLvt559NEAxQp+PwtmMcBjiR1/LMeSwFJHfH8N2QQAoUXrTp66hVFApGn+DyvmwhBSuBzvLZiTYIG2m98OScTgwOUarm7blmGgU7k9n1unEiBC13yO/eizEIHWq+8+OWT';
      audio.src = beepSound;

      // Try to play the sound
      const playPromise = audio.play();
      if (playPromise !== undefined) {
        playPromise.catch(() => {
          // If audio fails, try browser notification API
          this.tryBrowserNotification();
        });
      }
    } catch (error) {
      // Try browser notification as last resort
      this.tryBrowserNotification();
    }
  }

  // Try to use browser notification API for sound
  private static tryBrowserNotification(): void {
    try {
      if ('Notification' in window && Notification.permission === 'granted') {
        // Create a silent notification that might trigger system sound
        new Notification('New message', {
          body: 'You have a new message',
          silent: false,
          tag: 'message-notification'
        });
      }
    } catch (error) {
      // Silent fallback - do nothing if all audio methods fail
      console.log('Audio not available, using visual notifications only');
    }
  }

  // Play message notification sound (slightly different tone)
  static async playMessageSound(): Promise<void> {
    try {
      const audioContext = await this.getAudioContext();
      if (!audioContext) {
        this.playFallbackSound();
        return;
      }

      // Create a two-tone notification sound
      const oscillator1 = audioContext.createOscillator();
      const oscillator2 = audioContext.createOscillator();
      const gainNode = audioContext.createGain();

      // Connect nodes
      oscillator1.connect(gainNode);
      oscillator2.connect(gainNode);
      gainNode.connect(audioContext.destination);

      // Configure the first tone
      oscillator1.frequency.setValueAtTime(600, audioContext.currentTime);
      oscillator1.frequency.setValueAtTime(800, audioContext.currentTime + 0.1);
      oscillator1.type = 'sine';

      // Configure the second tone (harmony)
      oscillator2.frequency.setValueAtTime(800, audioContext.currentTime);
      oscillator2.frequency.setValueAtTime(1000, audioContext.currentTime + 0.1);
      oscillator2.type = 'sine';

      // Configure volume envelope
      gainNode.gain.setValueAtTime(0, audioContext.currentTime);
      gainNode.gain.linearRampToValueAtTime(0.1, audioContext.currentTime + 0.01);
      gainNode.gain.exponentialRampToValueAtTime(0.001, audioContext.currentTime + 0.4);

      // Play the sound
      oscillator1.start(audioContext.currentTime);
      oscillator1.stop(audioContext.currentTime + 0.4);
      oscillator2.start(audioContext.currentTime);
      oscillator2.stop(audioContext.currentTime + 0.4);

    } catch (error) {
      console.warn('Could not play message sound:', error);
      this.playFallbackSound();
    }
  }

  // Check if audio is supported
  static isAudioSupported(): boolean {
    return !!(window.AudioContext || (window as any).webkitAudioContext);
  }
}

export default NotificationSound;
