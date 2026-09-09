import { useRef, useCallback, useEffect } from 'react';

/**
 * Custom hook for playing sound effects
 * @param {string} soundPath - Path to the sound file (e.g., '/sounds/water_drop.mp3')
 * @param {Object} options - Options object
 * @param {number} options.volume - Volume 0-1
 * @param {boolean} options.loop - Whether to loop
 * @param {number} options.playbackRate - Speed of playback
 * @returns {Object} { play, stop, isPlaying }
 */
export const useSound = (soundPath, options = {}) => {
  const { volume = 1, loop = false, playbackRate = 1 } = options;
  const audioRef = useRef(null);
  const isPlayingRef = useRef(false);

  // Initialize audio element
  const getAudio = useCallback(() => {
    if (!audioRef.current) {
      const audio = new Audio(soundPath);
      audio.volume = volume;
      audio.loop = loop;
      audio.playbackRate = playbackRate;
      audioRef.current = audio;
    }
    return audioRef.current;
  }, [soundPath, volume, loop, playbackRate]);

  const play = useCallback(() => {
    try {
      const audio = getAudio();
      // Reset to start if already playing
      if (isPlayingRef.current) {
        audio.currentTime = 0;
        return;
      }
      audio.currentTime = 0;
      audio.play()
        .then(() => {
          isPlayingRef.current = true;
        })
        .catch((err) => {
          console.warn('Failed to play sound:', err);
          isPlayingRef.current = false;
        });
    } catch (err) {
      console.warn('Error playing sound:', err);
    }
  }, [getAudio]);

  const stop = useCallback(() => {
    if (audioRef.current) {
      audioRef.current.pause();
      audioRef.current.currentTime = 0;
      isPlayingRef.current = false;
    }
  }, []);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (audioRef.current) {
        audioRef.current.pause();
        audioRef.current = null;
      }
    };
  }, []);

  return { play, stop, isPlaying: isPlayingRef.current };
};

export default useSound;