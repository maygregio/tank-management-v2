'use client';

import { useEffect } from 'react';

export function usePolling(
  callback: () => void,
  interval: number = 30000,
  isActive: boolean = true
) {
  useEffect(() => {
    if (!isActive) return;

    callback();

    const intervalId = setInterval(callback, interval);

    return () => clearInterval(intervalId);
  }, [callback, interval, isActive]);
}
