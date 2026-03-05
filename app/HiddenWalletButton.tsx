'use client';
import { ConnectWallet } from '@coinbase/onchainkit/wallet';

export function HiddenWalletButton() {
  return (
    <div style={{ position: 'fixed', opacity: 0, pointerEvents: 'none', zIndex: -1 }}>
      <ConnectWallet 
        render={({ onClick }) => (
          <button id="hiddenwallet" onClick={onClick} style={{ display: 'none' }} />
        )}
      />
    </div>
  );
}
