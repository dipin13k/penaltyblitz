  function shareResultOnFarcaster(pScore: number, aScore: number, isWin: boolean, isDraw: boolean) {
    const emoji = isWin ? '\uD83C\uDFC6' : isDraw ? '\uD83E\uDD1D' : '\uD83D\uDC80';
    const result = isWin ? 'won' : isDraw ? 'drew' : 'lost';
    const text = `${emoji} I just ${result} ${pScore}-${aScore} in Penalty Blitz! ⚽\nCan you beat my score? Come challenge me!`;
    const url = `https://warpcast.com/~/compose?text=${encodeURIComponent(text)}&embeds[]=${encodeURIComponent('https://penaltyblitz.vercel.app')}`;
    sdk.actions.openUrl(url);
  }
  ;(window as any).shareResultOnFarcaster = shareResultOnFarcaster;
  ;(window as any).handleShareResult = () => {
    const isWin = S.pScore > S.aScore;
    const isDraw = S.pScore === S.aScore;
    shareResultOnFarcaster(S.pScore, S.aScore, isWin, isDraw);
  };