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

  useEffect(() => { setIsReady(true); }, []);
  useEffect(() => { setFrameReady(); }, [setFrameReady]);

  useEffect(() => {
    const timer = setTimeout(() => {
      const addr = isConnected ? (address ?? null) : null
      if ((window as any).__onWalletStateChange) {
        (window as any).__onWalletStateChange(addr)
      } else {
        (window as any).__pendingWalletAddr = addr
      }
    }, 500)
    return () => clearTimeout(timer)
  }, [isConnected, address])

  useEffect(() => {
    if (!containerRef.current || document.getElementById('game-injected')) return;
    const style = document.createElement('style');
    style.id = 'game-injected';
    style.innerHTML = getGameCSS();
    document.head.appendChild(style);
    containerRef.current.innerHTML = getGameHTML();
    const load = async () => {
      try {
        await sdk.actions.ready()
        const ctx = await sdk.context
        ;(window as any).__miniAppContext = ctx
      } catch (e) {
        console.log('SDK context failed:', e)
      }
      initGame()
    }
    load()
  }, []);

  return (
    <div ref={containerRef} style={{
      width: '100%', maxWidth: '480px',
      height: '100vh', margin: '0 auto', overflow: 'hidden'
    }} />
  );
}

interface PlayerRow {
  rank: number;
  username: string;
  win_rate: number;
  total_wins: number;
  wallet_address: string;
  leaderboard_score: number;
}

function initGame() {
  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  );

  async function getIdentityFromWallet(walletAddress: string): Promise<{
    fid: number | null; username: string | null; avatarUrl: string | null;
  }> {
    try {
      const res = await fetch(
        `https://api.neynar.com/v2/farcaster/user/bulk-by-address?addresses=${walletAddress}`,
        { headers: { 'x-api-key': process.env.NEXT_PUBLIC_NEYNAR_API_KEY || '' } }
      )
      const data = await res.json()
      const users = data[walletAddress.toLowerCase()]
      if (users && users.length > 0) {
        const user = users[0]
        return { fid: user.fid || null, username: user.username || null, avatarUrl: user.pfp_url || null }
      }
    } catch (e) { console.log('Neynar lookup failed:', e) }
    return { fid: null, username: null, avatarUrl: null }
  }

  let activeIntervals: number[] = [];
  function safeSetInterval(fn: () => void, ms: number) {
    const id = window.setInterval(fn, ms);
    activeIntervals.push(id);
    return id;
  }
  function clearAllIntervals() {
    activeIntervals.forEach(id => clearInterval(id));
    activeIntervals = [];
  }

  const C = {
    BALL_WAIT: 400, POST_SHOOT_WAIT: 800,
    END_RND_WAIT: 1500, SUDDEN_DEATH_DUR: 2500, FPS: 60,
  };

  const DIFF = {
    easy:   { kSpeed: 0.05, pSpeed: 1.5, kReach: 24, label: 'AMATEUR' },
    medium: { kSpeed: 0.12, pSpeed: 3.5, kReach: 32, label: 'SEMI-PRO' },
    hard:   { kSpeed: 0.22, pSpeed: 6.0, kReach: 40, label: 'WORLD CLASS' }
  };

  const S = {
    wallet: null as string | null,
    primaryWallet: null as string | null,
    fid: null as number | null,
    username: null as string | null,
    avatarUrl: null as string | null,
    diff: 'medium' as 'easy' | 'medium' | 'hard',
    myTurn: true, round: 1, maxRounds: 5,
    pScore: 0, aScore: 0,
    busy: false, isSuddenDeath: false, gameOver: false,
    matchStats: { goals: 0, saves: 0 },
    aimX: 0, aimY: -20, aimDirX: 1, aimDirY: 1,
    pBar: 0, pDir: 1,
    pLoopId: null as number | null,
    animId: null as number | null,
    arrowPos: 50
  };

  let cachedLeaderboardData: any = null;
  let leaderboardCacheTime = 0;

  function el(id: string) { return document.getElementById(id); }

  // Only show username in topbar, no wallet address
  function updateTopbar() {
    const u = document.getElementById('topbarUsername')
    if (u) u.innerText = S.username || ''
  }

  function showScreen(id: string) {
    const ep = document.getElementById('screen-profile')
    if (ep) ep.remove()
    clearAllIntervals();
    document.querySelectorAll('.screen').forEach(s => s.classList.remove('active'));
    el(`screen-${id}`)?.classList.add('active');
    if (id === 'leaderboard') (window as any).forceRefreshLeaderboard();
    const nav = document.getElementById('bottomNav');
    if (nav) nav.style.display = ['menu','leaderboard','profile'].includes(id) ? 'flex' : 'none';
    if (id === 'menu') {
      updateTopbar();
      if (S.wallet) setTimeout(() => showOnboardingIfNeeded(), 300);
    }
  }
  ;(window as any).showScreen = showScreen;

  async function getFarcasterIdentity(): Promise<{
    fid: number | null; username: string | null; avatarUrl: string | null;
  }> {
    const ctx = (window as any).__miniAppContext
    if (ctx?.user) {
      return { fid: ctx.user.fid||null, username: ctx.user.username||null, avatarUrl: ctx.user.pfpUrl||null }
    }
    return { fid: null, username: null, avatarUrl: null }
  }

  ;(window as any).__onWalletStateChange = async (address: string | null) => {
    S.wallet = address
    // If no wallet, show connect screen (rare edge case in miniapp)
    if (!address) { showScreen('connect'); return }

    const identity = await getFarcasterIdentity()
    S.fid = identity.fid
    S.username = identity.username
    S.avatarUrl = identity.avatarUrl

    if (!S.fid || !S.username) {
      const ni = await getIdentityFromWallet(address)
      if (ni.fid) S.fid = ni.fid
      if (!S.username && ni.username) S.username = ni.username
      if (!S.avatarUrl && ni.avatarUrl) S.avatarUrl = ni.avatarUrl
    }

    console.log('Identity resolved — fid:', S.fid, 'username:', S.username)

    let existingPlayer: any = null
    if (S.fid) {
      const { data } = await supabase.from('player_profiles').select('*').eq('fid', S.fid).maybeSingle()
      existingPlayer = data
    }
    if (!existingPlayer) {
      const { data } = await supabase.from('player_profiles').select('*').eq('wallet_address', address).maybeSingle()
      existingPlayer = data
    }
    if (!existingPlayer) {
      const { data } = await supabase.from('player_profiles').select('*').eq('wallet_address_2', address).maybeSingle()
      existingPlayer = data
    }

    if (existingPlayer) {
      S.primaryWallet = existingPlayer.wallet_address
      if (!S.username && existingPlayer.username) S.username = existingPlayer.username
      if (!S.avatarUrl && existingPlayer.avatar_url) S.avatarUrl = existingPlayer.avatar_url
      const updateData: any = {
        fid: S.fid || existingPlayer.fid,
        username: S.username || existingPlayer.username,
        avatar_url: S.avatarUrl || existingPlayer.avatar_url,
      }
      if (existingPlayer.wallet_address !== address && existingPlayer.wallet_address_2 !== address) {
        if (!existingPlayer.wallet_address) updateData.wallet_address = address
        else if (!existingPlayer.wallet_address_2) updateData.wallet_address_2 = address
      }
      await supabase.from('player_profiles').update(updateData).eq('id', existingPlayer.id)
      // Update topbar in place — no screen switch needed (already on menu)
      updateTopbar()
      loadMenuStats()
    } else {
      S.primaryWallet = address
      const { error } = await supabase.from('player_profiles').insert({
        wallet_address: address,
        fid: S.fid,
        username: S.username || address.slice(0,6)+'...'+address.slice(-4),
        avatar_url: S.avatarUrl
      })
      if (!error) { updateTopbar(); loadMenuStats() }
      else console.error('Insert error:', error)
    }
    console.log('primaryWallet:', S.primaryWallet)
  }

  const pending = (window as any).__pendingWalletAddr
  if (pending !== undefined) {
    delete (window as any).__pendingWalletAddr
    setTimeout(() => { ;(window as any).__onWalletStateChange(pending) }, 100)
  }

  ;(window as any).handleDisconnect = () => { location.reload(); };

  async function loadMenuStats() {
    if (!S.wallet) return;
    const row = el('menuStatsRow');
    if (row) {
      row.style.display = 'flex';
      row.innerHTML = '<div class="spinner" style="border-width:2px;width:24px;height:24px;margin:10px auto"></div>';
    }
    try {
      let data: any = null;
      if (S.fid) {
        const { data: d } = await supabase.from('player_profiles')
          .select('total_matches,total_wins,win_rate').eq('fid', S.fid).maybeSingle();
        data = d;
      }
      if (!data) {
        const { data: d } = await supabase.from('player_profiles')
          .select('total_matches,total_wins,win_rate').eq('wallet_address', S.wallet).maybeSingle();
        data = d;
      }
      if (!data) {
        const { data: d } = await supabase.from('player_profiles')
          .select('total_matches,total_wins,win_rate').eq('wallet_address_2', S.wallet).maybeSingle();
        data = d;
      }
      if (!data) throw new Error();
      if (row) {
        row.innerHTML = `
          <div class="menu-stat"><div class="menu-stat-num">${data.total_matches}</div><div class="menu-stat-lbl">MATCHES</div></div>
          <div class="menu-stat-divider"></div>
          <div class="menu-stat"><div class="menu-stat-num" style="color:#00ff88">${data.total_wins}</div><div class="menu-stat-lbl">WINS</div></div>
          <div class="menu-stat-divider"></div>
          <div class="menu-stat"><div class="menu-stat-num" style="color:#00d4ff">${data.win_rate}%</div><div class="menu-stat-lbl">RATE</div></div>
        `;
      }
    } catch (_e) {
      if (row) row.style.display = 'none';
    }
  }

  ;(window as any).startGame = (diff: 'easy' | 'medium' | 'hard') => {
    S.diff = diff;
    S.round = 1; S.pScore = 0; S.aScore = 0;
    S.isSuddenDeath = false; S.gameOver = false;
    S.matchStats = { goals: 0, saves: 0 };
    updateScoreUI();
    showScreen('game');
    playCountdown();
  };

  function updateScoreUI() {
    const pEl = el('playerScoreEl'); const aEl = el('aiScoreEl');
    if (pEl) pEl.innerText = S.pScore.toString();
    if (aEl) aEl.innerText = S.aScore.toString();
  }

  function playCountdown() {
    S.busy = true;
    const ov = el('countdownOverlay'); const num = el('countNum');
    if (!ov || !num) return;
    ov.style.display = 'flex';
    let count = 3;
    num.innerText = count.toString();
    num.style.animation = 'none'; void num.offsetWidth;
    num.style.animation = 'countPop 0.8s ease forwards';
    safeSetInterval(() => {
      count--;
      if (count > 0) {
        num.innerText = count.toString();
        num.style.animation = 'none'; void num.offsetWidth;
        num.style.animation = 'countPop 0.8s ease forwards';
      } else if (count === 0) {
        num.innerText = 'GO!'; num.style.color = '#00ff88';
        num.style.animation = 'none'; void num.offsetWidth;
        num.style.animation = 'countPop 0.8s ease forwards';
      } else {
        ov.style.display = 'none'; num.style.color = 'white';
        clearAllIntervals();
        showRoundPopup(S.round, beginPlayerTurn);
      }
    }, 800);
  }

  function showRoundPopup(rNum: number, cb: () => void) {
    const p = el('roundPopup'); const rt = el('roundText'); const rs = el('roundSub');
    if (!p || !rt || !rs) return;
    rt.innerText = `ROUND ${rNum}`; rs.innerText = S.isSuddenDeath ? 'Sudden Death' : 'of 5';
    p.style.display = 'flex';
    setTimeout(() => { p.style.display = 'none'; cb(); }, 1500);
  }

  function beginPlayerTurn() {
    S.myTurn = true; resetField();
    const ind = el('turnIndicator');
    if (ind) { ind.innerText = 'YOUR TURN ⚽'; ind.style.color = '#00d4ff'; }
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
    const ball = el('ball'); const spot = el('penalty-spot'); const app = el('app');
    if (ball && spot && app) {
      const sr = spot.getBoundingClientRect(); const ar = app.getBoundingClientRect();
      ball.style.transition = 'none'; ball.style.transform = 'scale(1) rotate(0deg)';
      ball.style.left = (sr.left - ar.left - 22) + 'px';
      ball.style.top  = (sr.top  - ar.top  - 22) + 'px';
    }
    const kw = el('keeper-dive-wrapper');
    if (kw) kw.style.transform = 'translate(0,0) rotate(0)';
  }

  const T = { keeperDive: 300, keeperReturn: 400 };

  function diveKeeper(dir: 'left' | 'center' | 'right') {
    const kw = el('keeper-dive-wrapper');
    if (!kw) return;
    kw.style.transition = `transform ${T.keeperDive}ms cubic-bezier(0.1,0.8,0.2,1)`;
    if (dir === 'left')       kw.style.transform = 'translateX(-50px) rotate(-65deg)';
    else if (dir === 'right') kw.style.transform = 'translateX(50px) rotate(65deg)';
    else                      kw.style.transform = 'translateY(-30px)';
    setTimeout(() => {
      const kwr = el('keeper-dive-wrapper');
      if (kwr) { kwr.style.transition = `transform ${T.keeperReturn}ms ease-in-out`; kwr.style.transform = 'none'; }
    }, T.keeperDive + 900);
  }

  function resetCursor() {
    const net = el('net'); if (!net) return;
    S.aimX = net.getBoundingClientRect().width / 2;
    S.aimY = net.getBoundingClientRect().height * 0.8;
  }

  function startAim() {
    resetCursor(); S.aimDirX = 1; S.aimDirY = 1; S.pBar = 0; S.pDir = 1;
    updatePowerUI();
    if (S.animId) cancelAnimationFrame(S.animId);
    if (S.pLoopId) clearInterval(S.pLoopId);
    const d = DIFF[S.diff];
    S.pLoopId = safeSetInterval(() => {
      S.pBar += 2 * S.pDir;
      if (S.pBar >= 100) { S.pBar = 100; S.pDir = -1; }
      if (S.pBar <= 0)   { S.pBar = 0;   S.pDir = 1; }
      updatePowerUI();
    }, 1000 / C.FPS);
    const loop = () => { moveCursor(d.pSpeed); S.animId = requestAnimationFrame(loop); };
    S.animId = requestAnimationFrame(loop);
  }

  function updatePowerUI() {
    const f = el('powerBarFill'); const pl = el('powerLine');
    if (f) f.style.clipPath = `inset(${100 - S.pBar}% 0 0 0)`;
    if (pl) pl.style.bottom = `${S.pBar}%`;
  }

  function moveCursor(baseSpeed: number) {
    const net = el('net'); const cursor = el('aimCursor');
    if (!net || !cursor) return;
    const rect = net.getBoundingClientRect();
    const r = 26; const fuzz = 4;
    S.aimX += baseSpeed * 1.5 * S.aimDirX;
    S.aimY += baseSpeed * S.aimDirY;
    if (S.aimX < r-fuzz)              { S.aimX = r-fuzz;              S.aimDirX *= -1; }
    if (S.aimX > rect.width-(r-fuzz)) { S.aimX = rect.width-(r-fuzz); S.aimDirX *= -1; }
    if (S.aimY < r-fuzz)              { S.aimY = r-fuzz;              S.aimDirY *= -1; }
    if (S.aimY > rect.height-(r-fuzz)){ S.aimY = rect.height-(r-fuzz);S.aimDirY *= -1; }
    cursor.style.left = `${S.aimX}px`; cursor.style.top = `${S.aimY}px`;
  }

  ;(window as any).handleShoot = () => {
    if (S.busy) return; S.busy = true;
    if (S.animId) cancelAnimationFrame(S.animId);
    if (S.pLoopId) clearInterval(S.pLoopId);
    el('shootBtn')!.style.display = 'none';
    el('powerBarWrap')!.style.display = 'none';
    el('aimCursor')!.style.display = 'none';
    const pwr = S.pBar;
    const net = el('net');
    const rect = net?.getBoundingClientRect() || { width: 200, height: 172 };
    let fx = S.aimX / rect.width;
    let fy = S.aimY / rect.height;
    if (pwr > 80) {
      const err = ((pwr-80)/20)*0.15;
      fx += (Math.random()*err*2)-err;
      fy -= (Math.random()*err);
    }
    const tx = (fx-0.5)*rect.width;
    const isGoal = checkGoal(fx, fy, pwr);
    const shotDir: 'left'|'center'|'right' = tx < -20 ? 'left' : tx > 20 ? 'right' : 'center';
    diveKeeper(shotDir);
    const ball = el('ball'); const app = el('app');
    if (ball && net && app) {
      const nr = net.getBoundingClientRect(); const ar = app.getBoundingClientRect();
      ball.style.transition = 'all 0.4s ease-in';
      ball.style.left = (nr.left-ar.left)+S.aimX-22+'px';
      ball.style.top  = (nr.top -ar.top )+S.aimY-22+'px';
      ball.style.transform = 'scale(0.3) rotate(360deg)';
      const isOut = fx<0 || fx>1 || fy<0;
      setTimeout(() => {
        if (isOut) showText('MISS!','#ff3535');
        else if (isGoal) { S.pScore++; S.matchStats.goals++; updateScoreUI(); triggerNetRipple(); showText('GOAL!','#00ff88'); }
        else showText('SAVED!','#ff6b35');
      }, C.BALL_WAIT);
    }
    setTimeout(() => { checkRoundEnd(); }, C.BALL_WAIT + C.POST_SHOOT_WAIT);
  };

  function checkGoal(fx: number, fy: number, pwr: number) {
    if (fx<0||fx>1||fy<0) return false;
    const dist = Math.abs(fx-0.5); const d = DIFF[S.diff];
    if (pwr>=40&&pwr<=80) { if (dist>0.3) return true; return Math.random()>d.kSpeed*2.5; }
    if (pwr<40) { if (dist>0.4) return Math.random()>0.3; return false; }
    return Math.random()>d.kSpeed*1.5;
  }

  function showText(msg: string, color: string) {
    const app = el('app'); if (!app) return;
    const d = document.createElement('div');
    d.className = 'outcome-text'; d.style.color = color; d.innerText = msg;
    app.appendChild(d);
    if (msg==='GOAL!') { app.style.animation='none'; void app.offsetWidth; app.style.animation='screenShake 0.4s ease'; }
    setTimeout(() => d.remove(), 1100);
  }

  function triggerNetRipple() {
    const rp = el('net-ripple'); if (!rp) return;
    rp.style.opacity='1'; setTimeout(() => { rp.style.opacity='0'; }, 300);
  }

  function checkRoundEnd() {
    if (S.myTurn) {
      beginAiTurn();
    } else {
      let over = false;
      if (!S.isSuddenDeath) {
        const rem = S.maxRounds - S.round;
        const diff = Math.abs(S.pScore - S.aScore);
        if (diff > rem) over = true;
        else if (S.round === S.maxRounds) {
          if (diff === 0) { S.isSuddenDeath=true; showSuddenDeath(); return; }
          else over = true;
        }
      } else { if (S.pScore !== S.aScore) over = true; }
      if (over) endGame();
      else { S.round++; showBetweenRounds(`ROUND ${S.round}`, beginPlayerTurn); }
    }
  }

  function showSuddenDeath() {
    const o = el('suddenDeathOverlay'); if (o) o.style.display='flex';
    setTimeout(() => { if (o) o.style.display='none'; S.round++; beginPlayerTurn(); }, C.SUDDEN_DEATH_DUR);
  }

  function showBetweenRounds(txt: string, cb: () => void) {
    const s = el('betweenStrip'); const t = el('betweenText');
    if (!s||!t) return;
    t.innerText = txt; s.style.display='flex';
    s.style.animation='none'; void s.offsetWidth; s.style.animation='slideUp 0.3s ease-out forwards';
    setTimeout(() => { s.style.display='none'; cb(); }, Math.max(800, C.END_RND_WAIT));
  }

  function beginAiTurn() {
    S.myTurn = false; resetField();
    const ind = el('turnIndicator');
    if (ind) { ind.innerText='AI TURN 🤖'; ind.style.color='#ff3535'; }
    el('keeper')!.style.display='block';
    el('keeper')!.style.visibility='visible';
    el('ai-player')!.style.display='flex';
    el('ai-player')!.style.animation='none';
    el('shootBtn')!.style.display='none';
    el('powerBarWrap')!.style.display='none';
    el('aimCursor')!.style.display='none';
    el('diveLeft')!.style.display='block';
    el('diveCenter')!.style.display='block';
    el('diveRight')!.style.display='block';
    const sw = el('swingArrow');
    if (sw) {
      sw.style.display='block';
      let dir=1; let rot=0; S.arrowPos=50;
      if (S.pLoopId) clearInterval(S.pLoopId);
      const arrowSpeed = S.diff==='easy'?1.5:S.diff==='medium'?3.5:6;
      const arrowMs = S.diff==='easy'?1000/30:S.diff==='medium'?1000/45:1000/60;
      S.pLoopId = safeSetInterval(() => {
        rot += arrowSpeed*dir;
        if (rot>=70){rot=70;dir=-1;} if(rot<=-70){rot=-70;dir=1;}
        sw.style.left=`calc(50% + ${rot}px - 16px)`;
        S.arrowPos=((rot+70)/140)*100;
      }, arrowMs);
    }
    S.busy=false;
  }

  ;(window as any).handleDive = (dir: 'left'|'center'|'right') => {
    if (S.busy) return; S.busy=true;
    if (S.pLoopId) clearInterval(S.pLoopId);
    el('swingArrow')!.style.display='none';
    const pos = S.arrowPos;
    const zone: 'left'|'center'|'right' = pos<33?'left':pos<66?'center':'right';
    el('diveLeft')!.style.display='none';
    el('diveCenter')!.style.display='none';
    el('diveRight')!.style.display='none';
    const ai = el('ai-player'); if (ai) ai.style.animation='runUp 0.4s ease forwards';
    setTimeout(() => { resolveAiShot(dir, zone); }, 400);
  };

  function resolveAiShot(playerDir: 'left'|'center'|'right', zone: 'left'|'center'|'right') {
    let shot = zone;
    if (S.diff==='hard' && Math.random()<0.25) {
      const others = (['left','center','right'] as const).filter(d=>d!==zone);
      shot = others[Math.floor(Math.random()*others.length)];
    }
    const net = el('net'); const app = el('app');
    const rect = net?.getBoundingClientRect()||{width:200,height:172};
    const lx = shot==='left'?rect.width*0.2:shot==='right'?rect.width*0.8:rect.width*0.5;
    const ly = rect.height*0.35;
    let tx=0, ty=0;
    if (net&&app) {
      const nr=net.getBoundingClientRect(); const ar=app.getBoundingClientRect();
      tx=(nr.left-ar.left)+lx-22; ty=(nr.top-ar.top)+ly-22;
    }
    el('ai-player')!.style.display='none';
    el('keeper')!.style.display='block';
    diveKeeper(playerDir);
    const ball=el('ball');
    if (ball) {
      ball.style.transition='all 0.4s ease-in';
      ball.style.left=tx+'px'; ball.style.top=ty+'px';
      ball.style.transform='scale(0.3) rotate(360deg)';
      const isSave = shot===playerDir;
      setTimeout(() => {
        if (isSave) { S.matchStats.saves++; showText('SAVED!','#00ff88'); }
        else { S.aScore++; updateScoreUI(); triggerNetRipple(); showText('GOAL!','#ff3535'); }
      }, C.BALL_WAIT);
      setTimeout(() => { checkRoundEnd(); }, C.BALL_WAIT+C.POST_SHOOT_WAIT);
    }
  }

  function endGame() {
    S.gameOver=true;
    showScreen('results');
    const isWin=S.pScore>S.aScore; const isDraw=S.pScore===S.aScore;
    const t=el('resultTitle'); const e=el('resultEmoji'); const s=el('resultScore');
    const cg=el('statGoals'); const cs=el('statSaves');
    if (t) t.innerText=isWin?'VICTORY!':(isDraw?'DRAW':'DEFEAT');
    if (e) e.innerText=isWin?'🏆':(isDraw?'🤝':'💀');
    if (s) s.innerText=`${S.pScore} — ${S.aScore}`;
    if (cg) cg.innerText=S.matchStats.goals.toString();
    if (cs) cs.innerText=S.matchStats.saves.toString();
    if (isWin) spawnConfetti();
    const walletForSave = S.primaryWallet || S.wallet
    if (walletForSave) {
      saveMatchResult(isWin, walletForSave);
      cachedLeaderboardData=null; leaderboardCacheTime=0;
    }
  }

  async function saveMatchResult(isWin: boolean, walletForSave: string) {
    console.log('saveMatchResult — wallet:', walletForSave, 'fid:', S.fid, 'win:', isWin)
    try {
      const result = await supabase.rpc('upsert_player_stats', {
        p_wallet:     walletForSave,
        p_fid:        S.fid,
        p_username:   S.username,
        p_avatar_url: S.avatarUrl,
        p_is_win:     isWin,
        p_goals:      S.matchStats.goals,
        p_saves:      S.matchStats.saves
      })
      if (result.error) console.error('Supabase error:', result.error)
      else console.log('Stats saved!')
    } catch (e) { console.error('saveMatchResult exception:', e) }
  }

  ;(window as any).onPlayAgain = () => (window as any).startGame(S.diff);
  ;(window as any).onMainMenu = () => { showScreen('menu'); loadMenuStats(); };

  ;(window as any).forceRefreshLeaderboard = () => {
    cachedLeaderboardData=null; leaderboardCacheTime=0; loadLeaderboard();
  };

  async function loadLeaderboard() {
    const cont=el('leaderboardContent'); const myRank=el('myRankBar');
    if (!cont||!myRank) return;
    cont.innerHTML='<div class="spinner"></div>';
    try {
      const { data, error } = await supabase
        .from('player_profiles')
        .select('username,wallet_address,total_wins,win_rate,total_matches,leaderboard_score,avatar_url')
        .order('leaderboard_score',{ascending:false})
        .order('total_wins',{ascending:false})
        .gte('total_matches',1).limit(100);
      if (error) { cont.innerHTML=`<div class="error-text">Error: ${error.message}</div>`; return; }
      cachedLeaderboardData=data; leaderboardCacheTime=Date.now();
      renderLeaderboard(data);
    } catch (e:any) { cont.innerHTML=`<div class="error-text">Failed: ${e?.message||'Unknown'}</div>`; }
  }

  function renderLeaderboard(data: any[]) {
    const cont=el('leaderboardContent'); const myRank=el('myRankBar');
    if (!cont||!myRank) return;
    if (!data||data.length===0) {
      cont.innerHTML=`<div class="placeholder-wrap"><div class="placeholder-emoji">🤷‍♂️</div><div class="placeholder-title">NO PLAYERS YET</div></div>`;
      return;
    }
    let meFound: PlayerRow | null = null;
    let html='';
    for (let i = 0; i < data.length; i++) {
      const p = data[i];
      const rank = i + 1;
      if (p.wallet_address === S.primaryWallet || p.wallet_address === S.wallet) {
        meFound = { rank, username: p.username, win_rate: p.win_rate, total_wins: p.total_wins, wallet_address: p.wallet_address, leaderboard_score: p.leaderboard_score };
      }
      html+=`
<div style="display:flex;align-items:center;padding:10px 16px;gap:12px;border-bottom:1px solid #222;background:${i===0?'#1e2a1e':i===1?'#1e1e2a':i===2?'#2a1e1e':'transparent'};">
  <div style="width:28px;text-align:center;font-weight:bold;color:#666;font-size:13px;">${i===0?'🥇':i===1?'🥈':i===2?'🥉':rank}</div>
  <div style="width:32px;height:32px;border-radius:50%;overflow:hidden;background:#333;flex-shrink:0;">
    ${p.avatar_url?`<img src="${p.avatar_url}" style="width:100%;height:100%;object-fit:cover"/>`:`<div style="width:100%;height:100%;display:flex;align-items:center;justify-content:center;font-size:16px">👤</div>`}
  </div>
  <div style="flex:1;min-width:0;">
    <div style="font-weight:bold;font-size:14px;white-space:nowrap;overflow:hidden;text-overflow:ellipsis;">${p.username||p.wallet_address.slice(0,6)+'...'+p.wallet_address.slice(-4)}</div>
    <div style="font-size:11px;color:#888">${p.win_rate}% win rate</div>
  </div>
  <div style="font-weight:bold;color:#00ff88;font-size:15px;">${Math.round(p.leaderboard_score)}</div>
</div>`;
    }
    cont.innerHTML=html;
    if (S.wallet) {
      myRank.style.display='flex';
      if (meFound !== null) {
        const mf = meFound;
        updateMyRankBar(mf.rank, mf.username, mf.win_rate, mf.total_wins, mf.leaderboard_score);
      } else {
        updateMyRankBar('100+', S.username||'You', 0, 0, 0);
      }
    } else {
      myRank.style.display='none';
    }
  }

  function updateMyRankBar(rank:string|number, name:string, wr:number, wins:number, score:number) {
    const rb=el('myRankBar'); if (!rb) return;
    rb.innerHTML=`
      <div class="lb-rank"><span class="lb-rank-num" style="color:#00d4ff">${rank}</span></div>
      <div class="lb-name">${name} <span class="lb-you-tag">(YOU)</span></div>
      <div style="text-align:right;margin-right:8px;">
        <div class="lb-wr">${score||0} pts</div>
        <div style="font-family:Rajdhani,sans-serif;font-size:11px;color:#555;">${wr}% · ${wins}W</div>
      </div>`;
  }

  function spawnConfetti() {
    const sc=el('screen-results'); if (!sc) return;
    for(let i=0;i<40;i++){
      const c=document.createElement('div'); c.className='confetti-piece';
      c.style.left='50%'; c.style.top='40%';
      c.style.background=`hsl(${Math.random()*360},100%,60%)`;
      c.style.setProperty('--dx',`${(Math.random()-0.5)*300}px`);
      c.style.setProperty('--dy',`${(Math.random()-0.5)*300}px`);
      sc.appendChild(c); setTimeout(()=>c.remove(),1100);
    }
  }

  function showOnboardingIfNeeded() {
    if (localStorage.getItem('pb_onboarding_seen')) return;
    document.body.insertAdjacentHTML('beforeend',`
    <div id="onboardingOverlay" style="position:fixed;inset:0;background:rgba(0,0,0,0.85);display:flex;align-items:center;justify-content:center;z-index:9999;padding:20px;">
      <div style="background:#1a1a2e;border-radius:20px;padding:32px 24px;max-width:320px;width:100%;text-align:center;border:1px solid #333;color:white;font-family:sans-serif;">
        <div style="font-size:48px;margin-bottom:16px">⚽</div>
        <div style="font-size:22px;font-weight:bold;color:#00ff88;margin-bottom:8px;">Welcome to Penalty Blitz!</div>
        <div style="font-size:14px;color:#aaa;line-height:1.6;margin-bottom:24px;">
          Compete in penalty shootouts and climb the global leaderboard.<br/><br/>
          <b style="color:white">⚡ How to play:</b><br/>
          🎯 <b>Shooting:</b> Aim your shot and choose power carefully<br/>
          🧤 <b>Saving:</b> Watch the arrow and dive the right way<br/>
          🏆 <b>Win</b> to earn points and rank up!
        </div>
        <button onclick="localStorage.setItem('pb_onboarding_seen','1');document.getElementById('onboardingOverlay').remove();"
          style="background:#00ff88;color:#000;border:none;border-radius:12px;padding:14px 32px;font-size:16px;font-weight:bold;cursor:pointer;width:100%;">Let's Play! ⚽</button>
      </div>
    </div>`)
    localStorage.setItem('pb_onboarding_seen','1')
  }

  async function showProfileScreen() {
    ['play','leaderboard','profile'].forEach(t=>{
      const e=document.getElementById(`tab-${t}`);
      if(e) e.style.color=t==='profile'?'#00ff88':'#888';
    })
    let data:any=null;
    if(S.fid){const{data:d}=await supabase.from('player_profiles').select('*').eq('fid',S.fid).maybeSingle();data=d;}
    if(!data){const{data:d}=await supabase.from('player_profiles').select('*').eq('wallet_address',S.wallet).maybeSingle();data=d;}
    if(!data){const{data:d}=await supabase.from('player_profiles').select('*').eq('wallet_address_2',S.wallet).maybeSingle();data=d;}
    const{count}=await supabase.from('player_profiles').select('*',{count:'exact',head:true}).gt('leaderboard_score',data?.leaderboard_score||0);
    const rank=(count||0)+1;
    const existing=document.getElementById('screen-profile');if(existing)existing.remove();
    document.body.insertAdjacentHTML('beforeend',`
    <div id="screen-profile" style="position:fixed;inset:0;background:linear-gradient(135deg,#0d0d1a 0%,#1a1a2e 100%);display:flex;flex-direction:column;align-items:center;padding:40px 20px 80px;overflow-y:auto;color:white;font-family:sans-serif;">
      <div style="width:80px;height:80px;border-radius:50%;overflow:hidden;border:3px solid #00ff88;background:#333;flex-shrink:0;margin-bottom:12px;">
        ${S.avatarUrl?`<img src="${S.avatarUrl}" style="width:100%;height:100%;object-fit:cover;border-radius:50%;display:block;"/>`:`<div style="width:100%;height:100%;display:flex;align-items:center;justify-content:center;font-size:32px">👤</div>`}
      </div>
      <div style="font-size:20px;font-weight:bold;color:#00ff88;margin-bottom:20px;">${data?.username||S.username||'Anonymous'}</div>
      <div style="background:#1e1e3a;border:1px solid #00ff88;border-radius:12px;padding:8px 24px;font-size:14px;color:#00ff88;margin-bottom:24px;">🏆 Rank #${rank}</div>
      <div style="width:100%;max-width:320px;display:grid;grid-template-columns:1fr 1fr;gap:12px;">
        ${([['Matches',data?.total_matches||0,'🎮'],['Wins',data?.total_wins||0,'✅'],['Losses',data?.total_losses||0,'❌'],['Win Rate',(data?.win_rate||0)+'%','📊'],['Goals',data?.total_goals_scored||0,'⚽'],['Score',data?.leaderboard_score||0,'⭐']] as [string,string|number,string][]).map(([l,v,ic])=>`
          <div style="background:#1e1e3a;border-radius:12px;padding:16px;text-align:center;border:1px solid #333;">
            <div style="font-size:20px">${ic}</div>
            <div style="font-size:22px;font-weight:bold;color:#00ff88;margin:4px 0;">${v}</div>
            <div style="font-size:11px;color:#888">${l}</div>
          </div>`).join('')}
      </div>
    </div>`)
  }

  ;(window as any).switchTab=(tab:string)=>{
    const ep=document.getElementById('screen-profile');if(ep)ep.remove();
    ['play','leaderboard','profile'].forEach(t=>{
      const e=document.getElementById(`tab-${t}`);if(e)e.style.color=t===tab?'#00ff88':'#888';
    })
    if(tab==='play')showScreen('menu');
    if(tab==='leaderboard')showScreen('leaderboard');
    if(tab==='profile')showProfileScreen();
  }

  document.body.insertAdjacentHTML('beforeend',`
  <div id="bottomNav" style="position:fixed;bottom:0;left:0;right:0;height:64px;background:#1a1a2e;border-top:1px solid #333;display:flex;align-items:center;justify-content:space-around;z-index:1000;">
    <button onclick="switchTab('play')" id="tab-play" style="flex:1;height:64px;background:none;border:none;color:#00ff88;font-size:11px;cursor:pointer;display:flex;flex-direction:column;align-items:center;justify-content:center;gap:4px;min-width:44px;"><span style="font-size:20px">⚽</span><span>Play</span></button>
    <button onclick="switchTab('leaderboard')" id="tab-leaderboard" style="flex:1;height:64px;background:none;border:none;color:#888;font-size:11px;cursor:pointer;display:flex;flex-direction:column;align-items:center;justify-content:center;gap:4px;min-width:44px;"><span style="font-size:20px">🏆</span><span>Leaderboard</span></button>
    <button onclick="switchTab('profile')" id="tab-profile" style="flex:1;height:64px;background:none;border:none;color:#888;font-size:11px;cursor:pointer;display:flex;flex-direction:column;align-items:center;justify-content:center;gap:4px;min-width:44px;"><span style="font-size:20px">👤</span><span>Profile</span></button>
  </div>`)
}
