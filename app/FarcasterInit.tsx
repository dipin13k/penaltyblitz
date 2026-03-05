'use client';
import { useEffect } from 'react';
import { sdk } from '@farcaster/miniapp-sdk';

export function FarcasterInit() {
  useEffect(() => {
    const init = async () => {
      try {
        await sdk.actions.ready();
        console.log('Farcaster SDK ready');
      } catch (e) {
        console.log('Not in Farcaster context:', e);
      }
    };
    init();
  }, []);
  return null;
}
