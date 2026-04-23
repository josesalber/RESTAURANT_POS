import { useEffect, useRef, useCallback } from 'react';

export default function useInterval(callback, delay, immediate = false) {
  const savedCallback = useRef(callback);
  const intervalRef = useRef(null);

  useEffect(() => {
    savedCallback.current = callback;
  }, [callback]);

  const start = useCallback(() => {
    if (intervalRef.current !== null) return;

    if (immediate) {
      savedCallback.current();
    }

    intervalRef.current = setInterval(() => {
      savedCallback.current();
    }, delay);
  }, [delay, immediate]);

  const stop = useCallback(() => {
    if (intervalRef.current === null) return;

    clearInterval(intervalRef.current);
    intervalRef.current = null;
  }, []);

  const reset = useCallback(() => {
    stop();
    start();
  }, [stop, start]);

  useEffect(() => {
    if (delay !== null) {
      start();
    }

    return () => {
      stop();
    };
  }, [delay, start, stop]);

  return { start, stop, reset };
}
