'use client';
import { useEffect } from 'react';
import { sdk } from '@farcaster/miniapp-sdk';

export function FarcasterInit() {
  useEffect(() => {
    const callReady = async () => {
      try {
        await sdk.actions.ready();
        console.log('sdk.actions.ready() success');
        return;
      } catch(e) {
        console.log('First ready attempt failed:', e);
      }

      setTimeout(async () => {
        try {
          await sdk.actions.ready();
          console.log('sdk.actions.ready() success retry');
        } catch(e) {
          console.log('Second ready attempt failed:', e);
        }
      }, 100);

      setTimeout(async () => {
        try {
          await sdk.actions.ready();
          console.log('sdk.actions.ready() success retry 2');
        } catch(e) {
          console.log('Third ready attempt failed:', e);
        }
      }, 500);
    };

    callReady();
  }, []);

  return null;
}
