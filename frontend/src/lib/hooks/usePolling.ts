'use client';

import { useEffect, useRef } from 'react';

export function usePolling(
  callback: () => void,
  interval: number = 30000,
  isActive: boolean = true
) {
  const callbackRef = useRef(callback);

  useEffect(() => {
    callbackRef.current = callback;
  }, [callback]);

  useEffect(() => {
    if (!isActive) return;

    callbackRef.current();

    const intervalId = setInterval(() => callbackRef.current(), interval);

    return () => clearInterval(intervalId);
  }, [interval, isActive]);
}
