'use client';
import { useEffect, useState, useRef } from 'react';
import { useAccount } from 'wagmi';
import { createClient } from '@supabase/supabase-js';
import { useMiniKit } from '@coinbase/onchainkit/minikit';
import { sdk } from '@farcaster/miniapp-sdk';
import { getGameHTML } from './getGameHTML';
import { getGameCSS } from './getGameCSS';

export default function GamePage() {
  const containerRef = useRef<HTMLDivElement>(null);
  const { address, isConnected } = useAccount();
  const [_isReady, setIsReady] = useState(false);
  const { setFrameReady } = useMiniKit();

  useEffect(() => {
    setIsReady(true);
  }, []);

  useEffect(() => {
    setFrameReady();
  }, [setFrameReady]);

  useEffect(() => {
    if (typeof window !== 'undefined' && (window as unknown as { __onWalletStateChange?: (addr: string | null) => void }).__onWalletStateChange) {
      if (!isConnected) {
        (window as unknown as { __onWalletStateChange?: (addr: string | null) => void }).__onWalletStateChange?.(null);
      } else {
        (window as unknown as { __onWalletStateChange?: (addr: string | null) => void }).__onWalletStateChange?.(address ?? null);
      }
    }
  }, [isConnected, address]);

  useEffect(() => {
    if (!containerRef.current || document.getElementById('game-injected')) return;

    const style = document.createElement('style');
    style.id = 'game-injected';
    style.innerHTML = getGameCSS();
    document.head.appendChild(style);

    containerRef.current.innerHTML = getGameHTML();

    initGame();
  }, []);

  return (
    <div ref={containerRef} style={{
      width: '100%',
      maxWidth: '480px',
      height: '100vh',
      margin: '0 auto',
      overflow: 'hidden'
    }} />
  );
}

function initGame() {
  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  );

  let activeIntervals: number[] = [];
  function safeSetInterval(fn: Function, ms: number) {
    const id = window.setInterval(fn, ms);
    activeIntervals.push(id);
    return id;
  }
  function clearAllIntervals() {
    activeIntervals.forEach(id => clearInterval(id));
    activeIntervals = [];
  }

  const C = {
    BALL_WAIT: 400,
    POST_SHOOT_WAIT: 800,
    AI_THINK: 1200,
    END_RND_WAIT: 1500,
    SUDDEN_DEATH_DUR: 2500,
    FPS: 60,
    KEEPER_Y: 28,
  };

  const DIFF = {
    easy: { kSpeed: 0.05, pSpeed: 1.5, kReach: 24, label: 'AMATEUR' },
    medium: { kSpeed: 0.12, pSpeed: 3.5, kReach: 32, label: 'SEMI-PRO' },
    hard: { kSpeed: 0.22, pSpeed: 6.0, kReach: 40, label: 'WORLD CLASS' }
  };

  const PRESET_DIVE = {
    left: { x: -50, y: -25, r: -40 },
    center: { x: 0, y: -40, r: 0 },
    right: { x: 50, y: -25, r: 40 }
  };

  const S = {
    wallet: null as string | null,
    username: null as string | null,
    diff: 'medium' as 'easy' | 'medium' | 'hard',
    myTurn: true,
    round: 1, maxRounds: 5,
    pScore: 0, aScore: 0,
    busy: false, isSuddenDeath: false,
    gameOver: false,
    matchStats: { goals: 0, saves: 0 },
    aimX: 0, aimY: -20,
    aimDirX: 1, aimDirY: 1,
    pBar: 0, pDir: 1,
    pLoopId: null as number | null,
    animId: null as number | null,
    arrowPos: 50
  };

  let cachedLeaderboardData: any = null;
  let leaderboardCacheTime = 0;
  const LEADERBOARD_CACHE_DUR = 30000;

  function el(id: string) { return document.getElementById(id); }

  function showScreen(id: string) {
    clearAllIntervals();
    document.querySelectorAll('.screen').forEach(s => s.classList.remove('active'));
    el(`screen-${id}`)?.classList.add('active');
    if(id === 'leaderboard') {
      (window as any).forceRefreshLeaderboard();
    }
  }

  ;(window as any).showScreen = showScreen;

  ; (window as any).__onWalletStateChange = async (address: string | null) => {
    S.wallet = address;
    if (!address) {
      showScreen('connect');
      return;
    }
    const exists = await checkExistingUser(address);
    if (exists) {
      showScreen('menu');
      loadMenuStats();
    } else {
      showScreen('username');
      const badge = el('usernameBadge');
      if (badge) badge.innerText = address.slice(0, 6) + '...' + address.slice(-4);
    }
  };

  ; (window as any).triggerWalletConnect = () => {
    if ((window as any).__triggerWalletConnect) {
      (window as any).__triggerWalletConnect();
    }
  };

  ; (window as any).handleDisconnect = () => {
    // In actual implementation we'd call wagmi disconnect hook via UI but imperative can't directly use react hooks
    location.reload();
  };

  async function checkExistingUser(addr: string) {
    try {
      const { data } = await supabase
        .from('player_profiles')
        .select('username')
        .eq('wallet_address', addr)
        .maybeSingle();
      if (data?.username) {
        S.username = data.username;
        const tbU = el('topbarUsername'); if (tbU) tbU.innerText = data.username;
        const tbA = el('topbarAddress'); if (tbA) tbA.innerText = addr.slice(0, 6) + '...' + addr.slice(-4);
        return true;
      }
    } catch (_e) { }
    return false;
  }

  ; (window as any).confirmUsername = async () => {
    const input = el('usernameInput') as HTMLInputElement;
    const errObj = el('usernameError');
    if (!input || !errObj) return;

    errObj.style.display = 'none';
    const val = input.value.trim();

    if (val.length < 3 || val.length > 16) {
      errObj.innerText = 'Must be 3-16 characters';
      errObj.style.display = 'block';
      return;
    }
    if (!/^[a-zA-Z0-9_]+$/.test(val)) {
      errObj.innerText = 'Letters, numbers, underscores only';
      errObj.style.display = 'block';
      return;
    }

    const btn = el('confirmUsernameBtn');
    if (btn) btn.innerText = 'SAVING...';

    try {
      const { data: exist } = await supabase
        .from('player_profiles')
        .select('username')
        .eq('username', val)
        .maybeSingle();

      if (exist) {
        errObj.innerText = 'Username already taken';
        errObj.style.display = 'block';
        if (btn) btn.innerText = 'LET\'S PLAY →';
        return;
      }

      const { error } = await supabase.from('player_profiles').insert({
        wallet_address: S.wallet,
        username: val
      });

      if (error) throw error;

      S.username = val;
      const tbU = el('topbarUsername'); if (tbU) tbU.innerText = val;
      const tbA = el('topbarAddress'); if (tbA) tbA.innerText = S.wallet?.slice(0, 6) + '...' + S.wallet?.slice(-4);

      showScreen('menu');
      loadMenuStats();
    } catch (_e: unknown) {
      errObj.innerText = 'Failed to save. Try again.';
      errObj.style.display = 'block';
    }
    if (btn) btn.innerText = 'LET\'S PLAY →';
  };

  const inputEl = el('usernameInput');
  if (inputEl) {
    inputEl.addEventListener('input', (e) => {
      const t = e.target as HTMLInputElement;
      const c = el('charCounter');
      if (c) c.innerText = `${t.value.length} / 16`;
    });
  }

  async function loadMenuStats() {
    if (!S.wallet) return;
    const row = el('menuStatsRow');
    if(row) {
      row.style.display = 'flex';
      row.innerHTML = '<div class="spinner" style="border-width:2px;width:24px;height:24px;margin:10px auto"></div>';
    }
    try {
      const { data } = await supabase
        .from('player_profiles')
        .select('total_matches, total_wins, win_rate')
        .eq('wallet_address', S.wallet)
        .maybeSingle();
      if (!data) throw new Error();
      if(row) {
        row.innerHTML = `
          <div class="menu-stat">
            <div class="menu-stat-num">${data.total_matches}</div>
            <div class="menu-stat-lbl">MATCHES</div>
          </div>
          <div class="menu-stat-divider"></div>
          <div class="menu-stat">
            <div class="menu-stat-num" style="color:#00ff88">${data.total_wins}</div>
            <div class="menu-stat-lbl">WINS</div>
          </div>
          <div class="menu-stat-divider"></div>
          <div class="menu-stat">
            <div class="menu-stat-num" style="color:#00d4ff">${data.win_rate}%</div>
            <div class="menu-stat-lbl">RATE</div>
          </div>
        `;
      }
    } catch(_e) {
      if(row) row.style.display = 'none';
    }
  }

  ;(window as any).startGame = (diff: 'easy'|'medium'|'hard') => {
    S.diff = diff;
    S.round = 1; S.pScore = 0; S.aScore = 0;
    S.isSuddenDeath = false; S.gameOver = false;
    S.matchStats = { goals: 0, saves: 0 };
    updateScoreUI();
    showScreen('game');
    playCountdown();
  };

  function updateScoreUI() {
    const pEl = el('playerScoreEl');
    const aEl = el('aiScoreEl');
    if(pEl) pEl.innerText = S.pScore.toString();
    if(aEl) aEl.innerText = S.aScore.toString();
  }

  function playCountdown() {
    S.busy = true;
    const ov = el('countdownOverlay');
    const num = el('countNum');
    if(!ov || !num) return;
    ov.style.display = 'flex';
    
    let count = 3;
    num.innerText = count.toString();
    num.style.animation = 'none';
    void num.offsetWidth;
    num.style.animation = 'countPop 0.8s ease forwards';
    
    safeSetInterval(() => {
      count--;
      if(count > 0) {
        num.innerText = count.toString();
        num.style.animation = 'none';
        void num.offsetWidth;
        num.style.animation = 'countPop 0.8s ease forwards';
      } else if(count === 0) {
        num.innerText = 'GO!';
        num.style.color = '#00ff88';
        num.style.animation = 'none';
        void num.offsetWidth;
        num.style.animation = 'countPop 0.8s ease forwards';
      } else {
        ov.style.display = 'none';
        num.style.color = 'white';
        clearAllIntervals();
        showRoundPopup(S.round, beginPlayerTurn);
      }
    }, 800);
  }

  function showRoundPopup(rNum: number, cb: Function) {
    const p = el('roundPopup');
    const rt = el('roundText');
    const rs = el('roundSub');
    if(!p || !rt || !rs) return;
    rt.innerText = `ROUND ${rNum}`;
    rs.innerText = S.isSuddenDeath ? 'Sudden Death' : 'of 5';
    p.style.display = 'flex';
    setTimeout(() => {
      p.style.display = 'none';
      cb();
    }, 1500);
  }

  function beginPlayerTurn() {
    S.myTurn = true;
    resetField();
    const ind = el('turnIndicator');
    if(ind) {
      ind.innerText = 'YOUR TURN ⚽';
      ind.style.color = '#00d4ff';
    }
    el('ai-player')!.style.display = 'none';
    el('keeper')!.style.display = 'block';
    
    el('diveLeft')!.style.display = 'none';
    el('diveCenter')!.style.display = 'none';
    el('diveRight')!.style.display = 'none';
    
    S.busy = false;
    
    el('shootBtn')!.style.display = 'flex';
    el('powerBarWrap')!.style.display = 'flex';
    el('aimCursor')!.style.display = 'block';
    
    startAim();
  }

  function resetField() {
    const ball = el('ball');
    const spot = el('penalty-spot');
    const app = el('app');
    if(ball && spot && app) {
      const spotRect = spot.getBoundingClientRect();
      const appRect = app.getBoundingClientRect();
      ball.style.transition = 'none';
      ball.style.transform = 'scale(1) rotate(0deg)';
      ball.style.left = (spotRect.left - appRect.left - 22) + 'px';
      ball.style.top = (spotRect.top - appRect.top - 22) + 'px';
    }
    const kw = el('keeper-dive-wrapper');
    if(kw) kw.style.transform = 'translate(0,0) rotate(0)';
  }

  const T = {
    keeperDive: 300,
    keeperReturn: 400,
  };

  function diveKeeper(dir: 'left'|'center'|'right') {
    const kw = el('keeper-dive-wrapper');
    if(!kw) return;
    
    kw.style.transition = `transform ${T.keeperDive}ms cubic-bezier(0.1, 0.8, 0.2, 1)`;
    
    if(dir === 'left') {
      kw.style.transform = 'translateX(-50px) rotate(-65deg)';
    } else if(dir === 'right') {
      kw.style.transform = 'translateX(50px) rotate(65deg)';
    } else {
      kw.style.transform = 'translateY(-30px)';
    }
    
    setTimeout(() => {
      const kwr = el('keeper-dive-wrapper');
      if(kwr) {
        kwr.style.transition = `transform ${T.keeperReturn}ms ease-in-out`;
        kwr.style.transform = 'none';
      }
    }, T.keeperDive + 900);
  }

  function clamp(v: number, min: number, max: number) {
    return Math.max(min, Math.min(max, v));
  }

  function resetCursor() {
    const net = el('net');
    if(!net) return;
    const cw = net.getBoundingClientRect().width;
    const ch = net.getBoundingClientRect().height;
    S.aimX = cw/2; S.aimY = ch*0.8;
  }

  function startAim() {
    resetCursor();
    S.aimDirX = 1; S.aimDirY = 1;
    S.pBar = 0; S.pDir = 1;
    updatePowerUI();
    
    if(S.animId) cancelAnimationFrame(S.animId);
    if(S.pLoopId) clearInterval(S.pLoopId);
    
    const d = DIFF[S.diff];
    
    S.pLoopId = safeSetInterval(() => {
      S.pBar += 2 * S.pDir;
      if(S.pBar >= 100) { S.pBar = 100; S.pDir = -1; }
      if(S.pBar <= 0) { S.pBar = 0; S.pDir = 1; }
      updatePowerUI();
    }, 1000/C.FPS);
    
    const loop = () => {
      moveCursor(d.pSpeed);
      S.animId = requestAnimationFrame(loop);
    };
    S.animId = requestAnimationFrame(loop);
  }

  function updatePowerUI() {
    const f = el('powerBarFill');
    const pl = el('powerLine');
    if(f) f.style.clipPath = `inset(${100 - S.pBar}% 0 0 0)`;
    if(pl) pl.style.bottom = `${S.pBar}%`;
  }

  function moveCursor(baseSpeed: number) {
    const net = el('net');
    const cursor = el('aimCursor');
    if(!net || !cursor) return;
    
    const rect = net.getBoundingClientRect();
    const w = rect.width; const h = rect.height;
    const r = 26; // HALF OF CURSOR WIDTH
    
    S.aimX += baseSpeed * 1.5 * S.aimDirX;
    S.aimY += baseSpeed * S.aimDirY;
    
    const fuzz = 4;
    if(S.aimX < r-fuzz) { S.aimX = r-fuzz; S.aimDirX *= -1; }
    if(S.aimX > w-(r-fuzz)) { S.aimX = w-(r-fuzz); S.aimDirX *= -1; }
    if(S.aimY < r-fuzz) { S.aimY = r-fuzz; S.aimDirY *= -1; }
    if(S.aimY > h-(r-fuzz)) { S.aimY = h-(r-fuzz); S.aimDirY *= -1; }
    
    cursor.style.left = `${S.aimX}px`;
    cursor.style.top = `${S.aimY}px`;
  }

  ;(window as any).handleShoot = () => {
    if(S.busy) return;
    S.busy = true;
    
    if(S.animId) cancelAnimationFrame(S.animId);
    if(S.pLoopId) clearInterval(S.pLoopId);
    
    el('shootBtn')!.style.display = 'none';
    el('powerBarWrap')!.style.display = 'none';
    el('aimCursor')!.style.display = 'none';
    
    const pwr = S.pBar;
    const net = el('net');
    const rect = net?.getBoundingClientRect() || {width:200,height:172};
    
    let fx = S.aimX / rect.width;  // 0 to 1
    let fy = S.aimY / rect.height; // 0 to 1
    
    if(pwr > 80) { // risky mode
      const err = ((pwr - 80) / 20) * 0.15;
      fx += (Math.random() * err * 2) - err;
      fy -= (Math.random() * err); // tends to go high
    }
    
    const screenW = el('app')?.getBoundingClientRect().width || window.innerWidth;
    const netCenterScreen = screenW / 2;
    const tx = (fx - 0.5) * rect.width;
    const ty = -(rect.height - (fy * rect.height)) - C.KEEPER_Y;
    
    const isGoal = checkGoal(fx, fy, pwr);
    
    const shotDir: 'left'|'center'|'right' = tx < -20 ? 'left' : tx > 20 ? 'right' : 'center';
    diveKeeper(shotDir);
    
    const ball = el('ball');
    const app = el('app');
    if(ball && net && app) {
      const netRect = net.getBoundingClientRect();
      const appRect = app.getBoundingClientRect();
      
      const targetX = (netRect.left - appRect.left) + S.aimX - 22;
      const targetY = (netRect.top - appRect.top) + S.aimY - 22;
      
      ball.style.transition = 'all 0.4s ease-in';
      ball.style.left = targetX + 'px';
      ball.style.top = targetY + 'px';
      ball.style.transform = 'scale(0.3) rotate(360deg)';
      
      const outLeft = fx < 0; const outRight = fx > 1; const outTop = fy < 0;
      const isOut = outLeft || outRight || outTop;
      
      setTimeout(() => {
        if(isOut) {
          showText('MISS!', '#ff3535');
        } else if(isGoal) {
          S.pScore++;
          S.matchStats.goals++;
          updateScoreUI();
          triggerNetRipple();
          showText('GOAL!', '#00ff88');
        } else {
          showText('SAVED!', '#ff6b35');
        }
      }, C.BALL_WAIT);
    }
    
    setTimeout(() => {
      checkRoundEnd();
    }, C.BALL_WAIT + C.POST_SHOOT_WAIT);
  };

  function checkGoal(fx: number, fy: number, pwr: number) {
    if(fx < 0 || fx > 1 || fy < 0) return false;
    const distToCenter = Math.abs(fx - 0.5);
    const d = DIFF[S.diff];
    
    if(pwr >= 40 && pwr <= 80) { // strong
      if(distToCenter > 0.3) return true;
      return Math.random() > d.kSpeed * 2.5;
    }
    if(pwr < 40) { // weak
      if(distToCenter > 0.4) return Math.random() > 0.3;
      return false;
    }
    // risky (pwr > 80)
    return Math.random() > d.kSpeed * 1.5;
  }

  function showText(msg: string, color: string) {
    const app = el('app');
    if(!app) return;
    const d = document.createElement('div');
    d.className = 'outcome-text';
    d.style.color = color;
    d.innerText = msg;
    app.appendChild(d);
    
    if(msg === 'GOAL!') {
      app.style.animation = 'none';
      void app.offsetWidth;
      app.style.animation = 'screenShake 0.4s ease';
    }
    
    setTimeout(() => d.remove(), 1100);
  }

  function triggerNetRipple() {
    const rp = el('net-ripple');
    if(!rp) return;
    rp.style.opacity = '1';
    setTimeout(() => { rp.style.opacity = '0'; }, 300);
  }

  function checkRoundEnd() {
    if(S.myTurn) {
      beginAiTurn();
    } else {
      let over = false;
      if(!S.isSuddenDeath) {
        const rem = S.maxRounds - S.round;
        const diff = Math.abs(S.pScore - S.aScore);
        if(diff > rem) over = true;
        else if(S.round === S.maxRounds) {
          if(diff === 0) {
            S.isSuddenDeath = true;
            showSuddenDeath();
            return;
          } else over = true;
        }
      } else {
        if(S.pScore !== S.aScore) over = true;
      }
      
      if(over) {
        endGame();
      } else {
        S.round++;
        showBetweenRounds(`ROUND ${S.round}`, () => {
          beginPlayerTurn();
        });
      }
    }
  }

  function showSuddenDeath() {
    const o = el('suddenDeathOverlay');
    if(o) o.style.display = 'flex';
    setTimeout(() => {
      if(o) o.style.display = 'none';
      S.round++;
      beginPlayerTurn();
    }, C.SUDDEN_DEATH_DUR);
  }

  function showBetweenRounds(txt: string, cb: Function) {
    const s = el('betweenStrip');
    const t = el('betweenText');
    if(!s || !t) return;
    t.innerText = txt;
    s.style.display = 'flex';
    s.style.animation = 'none';
    void s.offsetWidth;
    s.style.animation = 'slideUp 0.3s ease-out forwards';
    setTimeout(() => {
      s.style.display = 'none';
      cb();
    }, Math.max(800, C.END_RND_WAIT));
  }

  function beginAiTurn() {
    S.myTurn = false;
    resetField();
    
    const ind = el('turnIndicator');
    if(ind) {
      ind.innerText = 'AI TURN 🤖';
      ind.style.color = '#ff3535';
    }
    
    el('keeper')!.style.display = 'block';
    el('keeper')!.style.visibility = 'visible';
    el('ai-player')!.style.display = 'flex';
    el('ai-player')!.style.animation = 'none';
    
    el('shootBtn')!.style.display = 'none';
    el('powerBarWrap')!.style.display = 'none';
    el('aimCursor')!.style.display = 'none';
    
    el('diveLeft')!.style.display = 'block';
    el('diveCenter')!.style.display = 'block';
    el('diveRight')!.style.display = 'block';
    
    const sw = el('swingArrow');
    if(sw) {
      sw.style.display = 'block';
      let dir = 1;
      let rot = 0;
      S.arrowPos = 50;
      if(S.pLoopId) clearInterval(S.pLoopId);
      S.pLoopId = safeSetInterval(() => {
        rot += 6 * dir;
        if(rot >= 70) { rot = 70; dir = -1; }
        if(rot <= -70) { rot = -70; dir = 1; }
        sw.style.left = `calc(50% + ${rot}px - 16px)`;
        S.arrowPos = ((rot + 70) / 140) * 100;
      }, 1000/C.FPS);
    }
    
    S.busy = false;
  }

  ;(window as any).handleDive = (dir: 'left'|'center'|'right') => {
    if(S.busy) return;
    S.busy = true;
    
    if(S.pLoopId) clearInterval(S.pLoopId);
    el('swingArrow')!.style.display = 'none';
    
    const capturedPos = S.arrowPos;
    let arrowZone: 'left'|'center'|'right';
    if(capturedPos < 33) {
      arrowZone = 'left';
    } else if(capturedPos < 66) {
      arrowZone = 'center';
    } else {
      arrowZone = 'right';
    }
    
    console.log('Arrow pos:', capturedPos, 'Arrow zone:', arrowZone, 'Player dove:', dir);
    
    el('diveLeft')!.style.display = 'none';
    el('diveCenter')!.style.display = 'none';
    el('diveRight')!.style.display = 'none';
    
    const ai = el('ai-player');
    if(ai) ai.style.animation = 'runUp 0.4s ease forwards';
    
    setTimeout(() => {
      resolveAiShot(dir, arrowZone);
    }, 400);
  };

  function resolveAiShot(playerDiveDir: 'left'|'center'|'right', arrowZone: 'left'|'center'|'right') {
    const dirs = ['left','center','right'];
    const aiChoice = dirs[Math.floor(Math.random()*3)];
    
    const net = el('net');
    const app = el('app');
    const rect = net?.getBoundingClientRect() || {width:200,height:172};
    
    let targetLocalX: number;
    if(aiChoice === 'left') targetLocalX = rect.width * 0.2;
    else if(aiChoice === 'right') targetLocalX = rect.width * 0.8;
    else targetLocalX = rect.width * 0.5;
    const targetLocalY = rect.height * 0.35;
    
    let tx = 0, ty = 0;
    if(net && app) {
      const netRect = net.getBoundingClientRect();
      const appRect = app.getBoundingClientRect();
      tx = (netRect.left - appRect.left) + targetLocalX - 22;
      ty = (netRect.top - appRect.top) + targetLocalY - 22;
    }
    
    // Switch to keeper view
    el('ai-player')!.style.display = 'none';
    el('keeper')!.style.display = 'block';
    
    diveKeeper(playerDiveDir);
    
    const ball = el('ball');
    if(ball) {
      ball.style.transition = 'all 0.4s ease-in';
      ball.style.left = tx + 'px';
      ball.style.top = ty + 'px';
      ball.style.transform = 'scale(0.3) rotate(360deg)';
      
      const isSave = aiChoice === playerDiveDir;
      
      setTimeout(() => {
        if(isSave) {
          S.matchStats.saves++;
          showText('SAVED!', '#00ff88');
        } else {
          S.aScore++;
          updateScoreUI();
          triggerNetRipple();
          showText('GOAL!', '#ff3535');
        }
      }, C.BALL_WAIT);
      
      setTimeout(() => {
        checkRoundEnd();
      }, C.BALL_WAIT + C.POST_SHOOT_WAIT);
    }
  }

  function endGame() {
    S.gameOver = true;
    showScreen('results');
    
    const isWin = S.pScore > S.aScore;
    const isDraw = S.pScore === S.aScore;
    
    const t = el('resultTitle');
    const e = el('resultEmoji');
    const s = el('resultScore');
    const cg = el('statGoals');
    const cs = el('statSaves');
    
    if(t) t.innerText = isWin ? 'VICTORY!' : (isDraw ? 'DRAW' : 'DEFEAT');
    if(e) e.innerText = isWin ? '🏆' : (isDraw ? '🤝' : '💀');
    if(s) s.innerText = `${S.pScore} — ${S.aScore}`;
    if(cg) cg.innerText = S.matchStats.goals.toString();
    if(cs) cs.innerText = S.matchStats.saves.toString();
    
    if(isWin) spawnConfetti();
  }

  async function saveMatchResult(isWin: boolean) {
    if (!S.wallet) return;
    try {
      await supabase.rpc('upsert_player_stats', {
        p_wallet: S.wallet,
        p_is_win: isWin ? 1 : 0,
        p_goals: S.matchStats.goals,
        p_saves: S.matchStats.saves
      });
    } catch(e) {}
  }

  ;(window as any).onPlayAgain = () => (window as any).startGame(S.diff);
  ;(window as any).onMainMenu = () => { showScreen('menu'); loadMenuStats(); };

  ;(window as any).forceRefreshLeaderboard = () => {
    cachedLeaderboardData = null;
    leaderboardCacheTime = 0;
    loadLeaderboard();
  };

  async function loadLeaderboard() {
    const cont = el('leaderboardContent');
    const myRank = el('myRankBar');
    if(!cont || !myRank) return;
    
    cachedLeaderboardData = null;
    leaderboardCacheTime = 0;
    
    cont.innerHTML = '<div class="spinner"></div>';
    
    try {
      console.log('Fetching leaderboard...');
      const { data, error } = await supabase
        .from('player_profiles')
        .select('username, wallet_address, total_wins, win_rate, total_matches, leaderboard_score')
        .order('leaderboard_score', { ascending: false })
        .order('total_wins', { ascending: false })
        .gte('total_matches', 1)
        .limit(100);
      
      console.log('Leaderboard result:', data, 'error:', error);
      
      if(error) {
        console.error('Leaderboard error:', error);
        cont.innerHTML = `<div class="error-text">Error: ${error.message}</div>`;
        return;
      }
      
      cachedLeaderboardData = data;
      leaderboardCacheTime = Date.now();
      
      renderLeaderboard(data);
    } catch(e: any) {
      console.error('Leaderboard exception:', e);
      cont.innerHTML = `<div class="error-text">Failed to load: ${e?.message || 'Unknown'}</div>`;
    }
  }
  
  function renderLeaderboard(data: any) {
    const cont = el('leaderboardContent');
    const myRank = el('myRankBar');
    if(!cont || !myRank) return;
    
    console.log('Rendering leaderboard with data:', data);
    
    if(!data || data.length === 0) {
      cont.innerHTML = `
        <div class="placeholder-wrap">
          <div class="placeholder-emoji">🤷‍♂️</div>
          <div class="placeholder-title">NO PLAYERS YET</div>
        </div>
      `;
      return;
    }
    
    let html = '';
    type PlayerRow = { rank: number; username: string; win_rate: number; total_wins: number; wallet_address: string; leaderboard_score: number };
    let meFound: PlayerRow | null = null;
    
    data.forEach((p: any, i: number) => {
      const rank = i + 1;
      const isMe = p.wallet_address === S.wallet;
      if(isMe) {
        meFound = { ...p, rank };
      }
      html += `
        <div class="lb-row ${isMe ? 'is-me' : ''}">
          <div class="lb-rank">
            ${rank===1?'🥇':rank===2?'🥈':rank===3?'🥉':`<span class="lb-rank-num">${rank}</span>`}
          </div>
          <div class="lb-name">${p.username} ${isMe?'<span class="lb-you-tag">(YOU)</span>':''}</div>
          <div style="text-align:right;margin-right:8px;">
            <div class="lb-wr">${p.leaderboard_score || 0} pts</div>
            <div style="font-family:Rajdhani,sans-serif;font-size:11px;color:#555;">${p.win_rate}% · ${p.total_wins}W</div>
          </div>
        </div>
      `;
    });
    cont.innerHTML = html;
    
    if(S.wallet && S.username) {
      myRank.style.display = 'flex';
      const mf = meFound as PlayerRow | null;
      if(mf) {
        updateMyRankBar(mf.rank, mf.username, mf.win_rate, mf.total_wins, mf.leaderboard_score);
      } else {
        updateMyRankBar('100+', S.username!, 0, 0, 0);
      }
    } else {
      myRank.style.display = 'none';
    }
  }

  function updateMyRankBar(rank: string|number, name: string, wr: number, wins: number, score: number) {
    const rb = el('myRankBar');
    if(!rb) return;
    rb.innerHTML = `
      <div class="lb-rank"><span class="lb-rank-num" style="color:#00d4ff">${rank}</span></div>
      <div class="lb-name">${name} <span class="lb-you-tag">(YOU)</span></div>
      <div style="text-align:right;margin-right:8px;">
        <div class="lb-wr">${score || 0} pts</div>
        <div style="font-family:Rajdhani,sans-serif;font-size:11px;color:#555;">${wr}% · ${wins}W</div>
      </div>
    `;
  }

  function spawnConfetti() {
    const sc = el('screen-results');
    if(!sc) return;
    for(let i=0; i<40; i++) {
      const c = document.createElement('div');
      c.className = 'confetti-piece';
      c.style.left = '50%'; c.style.top = '40%';
      c.style.background = `hsl(${Math.random()*360}, 100%, 60%)`;
      const dx = (Math.random()-0.5)*300;
      const dy = (Math.random()-0.5)*300;
      c.style.setProperty('--dx', `${dx}px`);
      c.style.setProperty('--dy', `${dy}px`);
      sc.appendChild(c);
      setTimeout(() => c.remove(), 1100);
    }
  }

}
