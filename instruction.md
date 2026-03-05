# PENALTY BLITZ
# Complete Product Requirements Document
# Version FINAL — Ready for AI Implementation
# Base Mini App | Football Penalty Shootout Game

═══════════════════════════════════════════════════════
CRITICAL RULES — READ BEFORE WRITING ANY CODE
═══════════════════════════════════════════════════════

1. DO NOT use any game library or physics engine
2. DO NOT change power bar, keeper, AI arrow, shot 
   outcomes, round flow, scoring, or any game mechanic
3. DO NOT use localStorage or sessionStorage
4. DO NOT use .single() from Supabase — always use 
   .maybeSingle() to avoid errors on empty rows
5. DO NOT manipulate DOM outside of useEffect in React
6. DO NOT guess npm package names — verify them
7. ALL intervals must be tracked and cleared on unmount
8. ALL Supabase calls wrapped in try/catch, silent fail
9. NEVER show a console error to the player visually
10. Read this entire document before writing line 1

═══════════════════════════════════════════════════════
SECTION 0 — PROJECT INITIALIZATION
═══════════════════════════════════════════════════════

0.1 SCAFFOLD WITH ONCHAINKIT
Run this exact command first. Nothing before it.

npm create onchain@latest

Answer prompts exactly:
  Project name: penalty-blitz
  Package manager: npm
  Template: Mini App

Then run:
  cd penalty-blitz
  npm install

0.2 INSTALL ALL DEPENDENCIES
Run these in order:

  npm install @supabase/supabase-js
  npm install @farcaster/miniapp-sdk
  npm install viem

If @farcaster/miniapp-sdk fails try:
  npm install @farcaster/frame-sdk

Use whichever installs. Import as:
  import sdk from '@farcaster/miniapp-sdk'
or
  import { sdk } from '@farcaster/frame-sdk'
Test which exports sdk.actions.ready()

0.3 ENVIRONMENT FILE
Create .env.local in project root with exactly:

NEXT_PUBLIC_SUPABASE_URL=your_supabase_project_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
NEXT_PUBLIC_ONCHAINKIT_API_KEY=your_onchainkit_key

0.4 UPDATE next.config.mjs
Replace entire file content with:

const nextConfig = { turbopack: {} };
export default nextConfig;

0.5 FILE STRUCTURE
app/page.tsx          — entire game lives here
app/layout.tsx        — metadata and providers
app/lib/trophy.ts     — USDC payment function
app/globals.css       — reset only
public/               — images
public/.well-known/   — farcaster manifest

═══════════════════════════════════════════════════════
SECTION 1 — SUPABASE COMPLETE SETUP
═══════════════════════════════════════════════════════

Run ALL of this in Supabase SQL Editor in one go.

-- TABLE
CREATE TABLE IF NOT EXISTS player_profiles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  wallet_address TEXT UNIQUE NOT NULL,
  username TEXT UNIQUE,
  total_matches INTEGER NOT NULL DEFAULT 0,
  total_wins INTEGER NOT NULL DEFAULT 0,
  total_losses INTEGER NOT NULL DEFAULT 0,
  total_goals_scored INTEGER NOT NULL DEFAULT 0,
  total_saves INTEGER NOT NULL DEFAULT 0,
  win_rate NUMERIC(5,1) NOT NULL DEFAULT 0.0,
  last_updated TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- INDEXES
CREATE INDEX IF NOT EXISTS idx_wallet
  ON player_profiles(wallet_address);
CREATE INDEX IF NOT EXISTS idx_win_rate
  ON player_profiles(win_rate DESC);
CREATE INDEX IF NOT EXISTS idx_username
  ON player_profiles(username);

-- ROW LEVEL SECURITY
ALTER TABLE player_profiles ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Public read"
  ON player_profiles FOR SELECT USING (true);

CREATE POLICY "Allow insert"
  ON player_profiles FOR INSERT WITH CHECK (true);

CREATE POLICY "Allow update"
  ON player_profiles FOR UPDATE USING (true);

-- ATOMIC UPSERT FUNCTION (prevents race conditions)
CREATE OR REPLACE FUNCTION upsert_player_stats(
  p_wallet TEXT,
  p_is_win BOOLEAN,
  p_goals INTEGER,
  p_saves INTEGER
) RETURNS void AS $$
BEGIN
  INSERT INTO player_profiles (
    wallet_address, total_matches, total_wins,
    total_losses, total_goals_scored, total_saves,
    win_rate, last_updated
  )
  VALUES (
    p_wallet, 1,
    CASE WHEN p_is_win THEN 1 ELSE 0 END,
    CASE WHEN p_is_win THEN 0 ELSE 1 END,
    p_goals, p_saves,
    CASE WHEN p_is_win THEN 100.0 ELSE 0.0 END,
    NOW()
  )
  ON CONFLICT (wallet_address) DO UPDATE SET
    total_matches = player_profiles.total_matches + 1,
    total_wins = player_profiles.total_wins +
      CASE WHEN p_is_win THEN 1 ELSE 0 END,
    total_losses = player_profiles.total_losses +
      CASE WHEN p_is_win THEN 0 ELSE 1 END,
    total_goals_scored =
      player_profiles.total_goals_scored + p_goals,
    total_saves =
      player_profiles.total_saves + p_saves,
    win_rate = ROUND(
      ((player_profiles.total_wins +
        CASE WHEN p_is_win THEN 1 ELSE 0 END
      )::NUMERIC /
      (player_profiles.total_matches + 1)::NUMERIC
      ) * 100, 1
    ),
    last_updated = NOW();
END;
$$ LANGUAGE plpgsql;

═══════════════════════════════════════════════════════
SECTION 2 — ARCHITECTURE PATTERN
═══════════════════════════════════════════════════════

This is Next.js React but the game uses imperative JS.
The correct pattern is the single useEffect bridge.

React renders ONE container div.
All game HTML, CSS, and JS runs inside one useEffect.
The useEffect returns a cleanup function.
This prevents React from interfering with the game DOM.

page.tsx structure:

'use client'
import { useEffect, useRef } from 'react'
import { useAccount } from 'wagmi'

export default function PenaltyBlitzPage() {
  const containerRef = useRef(null)
  const { address, isConnected } = useAccount()

  // SDK init
  useEffect(() => {
    const init = async () => {
      try {
        const m = await import('@farcaster/miniapp-sdk')
        const sdk = m.default || m.sdk
        await sdk.actions.ready()
      } catch(e) {
        console.log('SDK non-fatal:', e)
      }
    }
    init()
  }, [])

  // Bridge wallet state to game
  useEffect(() => {
    if (window.__gameState) {
      window.__gameState.walletConnected = isConnected
      window.__gameState.walletAddress = address || null
      if (window.__onWalletStateChange) {
        window.__onWalletStateChange(isConnected, address)
      }
    }
  }, [isConnected, address])

  // Main game init
  useEffect(() => {
    if (!containerRef.current) return
    const link = document.createElement('link')
    link.href = 'https://fonts.googleapis.com/css2?' +
      'family=Rajdhani:wght@400;600;700&display=swap'
    link.rel = 'stylesheet'
    document.head.appendChild(link)

    const style = document.createElement('style')
    style.textContent = getGameCSS()
    document.head.appendChild(style)

    containerRef.current.innerHTML = getGameHTML()
    initGame()

    return () => {
      if (window.__cleanupGame) window.__cleanupGame()
      style.remove()
      link.remove()
    }
  }, [])

  return (
    <div ref={containerRef}
      style={{
        width:'100%', maxWidth:'480px',
        height:'100vh', margin:'0 auto',
        overflow:'hidden'
      }}
    />
  )
}

In layout.tsx expose wallet trigger:

'use client'
import { useEffect } from 'react'
import { ConnectWallet } from '@coinbase/onchainkit/wallet'

// Inside layout component:
useEffect(() => {
  window.__triggerWalletConnect = () => {
    document.getElementById('hiddenwallet')?.click()
  }
}, [])

// In JSX render hidden connect button:
<div style={{ position:'fixed', opacity:0,
  pointerEvents:'none', zIndex:-1 }}>
  <ConnectWallet id="hiddenwallet" />
</div>

═══════════════════════════════════════════════════════
SECTION 3 — COMPLETE HTML STRUCTURE (getGameHTML)
═══════════════════════════════════════════════════════

function getGameHTML() { return `
<div id="app">

  <!--
  ════════════════════════════════
  SCREEN 1: WALLET CONNECT
  First screen. Cannot be skipped.
  ════════════════════════════════
  -->
  <div id="screen-connect" class="screen active">
    <div class="connect-logo">
      <div style="font-size:64px">⚽</div>
      <h1>PENALTY<br>BLITZ</h1>
      <p class="connect-tagline">Score. Save. Dominate.</p>
    </div>
    <div class="connect-card">
      <div style="font-size:36px;text-align:center">🔐</div>
      <div class="connect-card-title">Connect Your Wallet</div>
      <div class="connect-card-sub">
        Required to play, save stats, and appear on
        the global leaderboard
      </div>
      <div class="connect-features">
        <div class="connect-feature">
          <span class="cf-icon">✅</span>
          <span>Stats saved permanently to your wallet</span>
        </div>
        <div class="connect-feature">
          <span class="cf-icon">✅</span>
          <span>Appear on the global leaderboard</span>
        </div>
        <div class="connect-feature">
          <span class="cf-icon">✅</span>
          <span>Mint trophies for your wins</span>
        </div>
      </div>
      <button id="connectWalletBtn"
              onclick="triggerWalletConnect()">
        🔗&nbsp; Connect Wallet
      </button>
    </div>
    <div class="powered-by">Powered by <span>⬡ Base</span></div>
  </div>

  <!--
  ════════════════════════════════
  SCREEN 2: USERNAME SETUP
  Shown once per wallet ever.
  After submitting never shown again.
  ════════════════════════════════
  -->
  <div id="screen-username" class="screen">
    <div class="username-header">
      <div class="username-title">Welcome to Penalty Blitz!</div>
      <div class="username-sub">Choose your player name</div>
      <div class="wallet-badge" id="usernameBadge"></div>
    </div>
    <div class="username-card">
      <div class="input-label">YOUR PLAYER NAME</div>
      <input
        id="usernameInput"
        class="username-input"
        type="text"
        placeholder="e.g. SniperKing"
        maxlength="16"
        autocomplete="off"
        autocorrect="off"
        autocapitalize="off"
        spellcheck="false"
      />
      <div class="char-counter" id="charCounter">0 / 16</div>
      <div class="username-rules">
        • 3 to 16 characters<br>
        • Letters, numbers, underscores only<br>
        • This name shows on the leaderboard<br>
        • Cannot be changed later
      </div>
    </div>
    <div id="usernameError" class="username-error"></div>
    <button id="confirmUsernameBtn"
            onclick="confirmUsername()">
      LET'S PLAY →
    </button>
  </div>

  <!--
  ════════════════════════════════
  SCREEN 3: MAIN MENU
  Shown after wallet + username.
  Two options: Play or Leaderboard.
  ════════════════════════════════
  -->
  <div id="screen-menu" class="screen">
    <!-- Top bar with wallet info -->
    <div class="menu-topbar">
      <div class="menu-topbar-left">
        <div class="topbar-dot"></div>
        <span class="topbar-username" id="topbarUsername"></span>
        <span class="topbar-address" id="topbarAddress"></span>
      </div>
      <button class="topbar-disconnect"
              onclick="handleDisconnect()">✕</button>
    </div>

    <!-- Floating particles injected by JS -->

    <!-- Logo -->
    <div class="menu-logo">
      <h1>PENALTY<br><span>BLITZ</span></h1>
      <p>Score. Save. Dominate.</p>
    </div>

    <!-- Quick stats (hidden until data loads) -->
    <div id="menuStatsRow" class="menu-stats-row"
         style="display:none">
    </div>

    <!-- Main buttons -->
    <div class="menu-btns">
      <button class="btn btn-primary"
              id="playBtn"
              onclick="showScreen('difficulty')">
        ▶&nbsp; PLAY
      </button>
      <button class="btn btn-secondary"
              onclick="showScreen('leaderboard')">
        🏆&nbsp; LEADERBOARD
      </button>
    </div>

    <div class="powered-by">Powered by <span>⬡ Base</span></div>
  </div>

  <!--
  ════════════════════════════════
  SCREEN 4: DIFFICULTY SELECT
  ════════════════════════════════
  -->
  <div id="screen-difficulty" class="screen">
    <button class="back-btn" onclick="showScreen('menu')">
      ← Back
    </button>
    <div class="diff-title">SELECT DIFFICULTY</div>
    <div class="diff-cards">
      <div class="diff-card easy"
           onclick="startGame('easy')">
        <div class="diff-emoji">😊</div>
        <div class="diff-info">
          <h3>AMATEUR</h3>
          <p>Relaxed keeper &nbsp;•&nbsp; Slow arrow</p>
        </div>
        <div class="diff-accent"></div>
      </div>
      <div class="diff-card medium"
           onclick="startGame('medium')">
        <div class="diff-badge">★ BEST</div>
        <div class="diff-emoji">😤</div>
        <div class="diff-info">
          <h3>SEMI-PRO</h3>
          <p>Decent keeper &nbsp;•&nbsp; Medium arrow</p>
        </div>
        <div class="diff-accent"></div>
      </div>
      <div class="diff-card hard"
           onclick="startGame('hard')">
        <div class="diff-emoji">😈</div>
        <div class="diff-info">
          <h3>WORLD CLASS</h3>
          <p>Sharp keeper &nbsp;•&nbsp; Fast arrow</p>
        </div>
        <div class="diff-accent"></div>
      </div>
    </div>
  </div>

  <!--
  ════════════════════════════════
  SCREEN 5: GAME SCREEN
  DO NOT CHANGE ANYTHING HERE
  ════════════════════════════════
  -->
  <div id="screen-game" class="screen">

    <!-- Score Bar -->
    <div id="scoreBar">
      <div class="score-side">
        <div class="score-dot player-dot"></div>
        <div class="score-label">YOU</div>
        <div class="score-num" id="playerScoreEl">0</div>
      </div>
      <div id="turnIndicator">YOUR TURN ⚽</div>
      <div class="score-side">
        <div class="score-num" id="aiScoreEl">0</div>
        <div class="score-label">AI</div>
        <div class="score-dot ai-dot"></div>
      </div>
    </div>

    <!-- Crowds -->
    <div id="crowdLeft" class="crowd-strip left"></div>
    <div id="crowdRight" class="crowd-strip right"></div>

    <!-- Goal -->
    <div id="goal-container">
      <div id="goal">
        <div id="post-left"></div>
        <div id="post-right"></div>
        <div id="crossbar"></div>
        <div id="net">
          <div id="net-ripple"></div>
          <div id="aimCursor"></div>
          <div id="swingArrow">➤</div>
        </div>

        <!-- Keeper: 3-wrapper system prevents transform conflict -->
        <div id="keeper">
          <div id="keeper-sway-wrapper">
            <div id="keeper-dive-wrapper">
              <div id="keeper-body">
                <div class="k-hair"></div>
                <div class="k-head">
                  <div class="k-eye-l"></div>
                  <div class="k-eye-r"></div>
                  <div class="k-mouth"></div>
                </div>
                <div class="k-arms-row">
                  <div class="k-arm"></div>
                  <div class="k-jersey">1</div>
                  <div class="k-arm"></div>
                </div>
                <div class="k-gloves-row">
                  <div class="k-glove"></div>
                  <div class="k-glove"></div>
                </div>
                <div class="k-shorts"></div>
                <div class="k-legs-row">
                  <div class="k-leg"></div>
                  <div class="k-leg"></div>
                </div>
                <div class="k-boots-row">
                  <div class="k-boot"></div>
                  <div class="k-boot"></div>
                </div>
              </div>
            </div>
          </div>
        </div>

        <!-- AI Footballer -->
        <div id="ai-player" style="display:none">
          <div class="a-head">
            <div class="a-eye-l"></div>
            <div class="a-eye-r"></div>
          </div>
          <div class="a-jersey">9</div>
          <div class="a-shorts"></div>
          <div class="a-legs-row">
            <div class="a-leg"></div>
            <div class="a-leg"></div>
          </div>
          <div class="a-boots-row">
            <div class="a-boot"></div>
            <div class="a-boot"></div>
          </div>
        </div>
      </div>
    </div>

    <!-- Ball -->
    <div id="ball">⚽</div>

    <!-- Pitch -->
    <div id="pitch">
      <div id="penalty-arc"></div>
      <div id="penalty-spot"></div>
    </div>

    <!-- Power Bar -->
    <div id="powerBarWrap">
      <div class="bar-label">POWER</div>
      <div id="powerBarOuter">
        <div id="powerBarFill"></div>
        <div class="zone-labels">
          <div class="zlbl perfect">P</div>
          <div class="zlbl strong">S</div>
          <div class="zlbl risky">R</div>
        </div>
        <div id="powerLine"></div>
      </div>
      <div class="bar-label tap-label">TAP</div>
    </div>

    <!-- Shoot Button -->
    <button id="shootBtn" onclick="handleShoot()">
      <span>⚽</span>
      <span>SHOOT</span>
    </button>

    <!-- THREE Dive Buttons — covers all 3 arrow zones -->
    <button id="diveLeft" onclick="handleDive('left')">
      ← LEFT
    </button>
    <button id="diveCenter" onclick="handleDive('center')">
      ↑ CENTER
    </button>
    <button id="diveRight" onclick="handleDive('right')">
      RIGHT →
    </button>

    <!-- Game Overlays -->
    <div id="roundPopup">
      <div class="popup-card">
        <h2 id="roundText">ROUND 1</h2>
        <p id="roundSub">of 5</p>
      </div>
    </div>
    <div id="countdownOverlay">
      <div id="countNum">3</div>
    </div>
    <div id="betweenStrip">
      <h3 id="betweenText"></h3>
    </div>
    <div id="suddenDeathOverlay">
      <h2>⚡ SUDDEN DEATH ⚡</h2>
    </div>
  </div>

  <!--
  ════════════════════════════════
  SCREEN 6: RESULTS SCREEN
  ════════════════════════════════
  -->
  <div id="screen-results" class="screen">
    <div class="results-card">
      <div id="resultEmoji" class="result-emoji">🏆</div>
      <div id="resultTitle" class="result-title">VICTORY!</div>
      <div id="resultScore" class="result-score">0 — 0</div>
      <div class="score-labels-row">
        <span>YOU</span><span>AI</span>
      </div>
      <div class="stats-row">
        <div class="stat-box">
          <div id="statGoals" class="stat-num"
               style="color:#00d4ff">0</div>
          <div class="stat-lbl">GOALS</div>
        </div>
        <div class="stat-box">
          <div id="statSaves" class="stat-num"
               style="color:#00ff88">0</div>
          <div class="stat-lbl">SAVES</div>
        </div>
      </div>
      <div class="results-btns" id="resultsBtns">
        <button class="btn btn-primary"
                onclick="onPlayAgain()">
          ▶ PLAY AGAIN
        </button>
        <button class="btn btn-secondary"
                onclick="onMainMenu()">
          MAIN MENU
        </button>
        <!-- Mint trophy button injected here by JS on WIN -->
      </div>
    </div>
  </div>

  <!--
  ════════════════════════════════
  SCREEN 7: LEADERBOARD
  Shows usernames, player rank pinned at bottom
  ════════════════════════════════
  -->
  <div id="screen-leaderboard" class="screen">
    <div class="data-topbar">
      <button class="back-btn-inline"
              onclick="showScreen('menu')">← Back</button>
      <div class="data-title">LEADERBOARD</div>
      <button class="refresh-btn"
              onclick="forceRefreshLeaderboard()">↻</button>
    </div>
    <div id="leaderboardContent" class="lb-content"></div>
    <!-- Player rank always pinned at bottom -->
    <div id="myRankBar" class="my-rank-bar"></div>
  </div>

</div>
` }

═══════════════════════════════════════════════════════
SECTION 4 — COMPLETE CSS (getGameCSS)
═══════════════════════════════════════════════════════

function getGameCSS() { return `

* {
  margin:0; padding:0; box-sizing:border-box;
  -webkit-tap-highlight-color:transparent;
}

body {
  overscroll-behavior: none;
  position: fixed;
  width: 100%; height: 100%;
  background: #0a0a14;
  display: flex;
  justify-content: center;
  font-family: 'Rajdhani', sans-serif;
}

#app {
  width: 100%; max-width: 480px;
  height: 100vh;
  position: relative;
  overflow: hidden;
  background: linear-gradient(180deg,#1a1a2e 0%,#16213e 100%);
}

/* ── SCREENS ── */
.screen {
  display: none;
  position: absolute; inset: 0;
  flex-direction: column;
  align-items: center;
  overflow: hidden;
  opacity: 0;
  transition: opacity 0.25s ease;
}
.screen.active { display: flex; opacity: 1; }

/* ── PARTICLES ── */
.particle {
  position: absolute; border-radius: 50%;
  background: white; pointer-events: none;
  animation: floatParticle linear infinite;
}
@keyframes floatParticle {
  0% { transform:translateY(0); opacity:0.5; }
  100% { transform:translateY(-110vh); opacity:0; }
}

/* ── BUTTONS ── */
.btn {
  width: 100%; height: 56px;
  border-radius: 14px; border: none;
  font-family: 'Rajdhani', sans-serif;
  font-size: 19px; font-weight: 700;
  letter-spacing: 1px; cursor: pointer;
  transition: transform 0.1s, box-shadow 0.15s;
  user-select: none;
}
.btn:active { transform: scale(0.95); }
.btn-primary {
  background: linear-gradient(135deg,#00d4ff,#0088cc);
  color: white;
  box-shadow: 0 4px 24px rgba(0,212,255,0.4);
}
.btn-secondary {
  background: #1e1e2e;
  border: 2px solid #00d4ff;
  color: white;
}
.back-btn {
  position: absolute; top: 16px; left: 16px;
  background: none; border: none;
  color: #888; font-family: 'Rajdhani', sans-serif;
  font-size: 15px; cursor: pointer; padding: 8px;
  z-index: 10;
}
.powered-by {
  position: absolute; bottom: 18px;
  font-size: 13px; color: #444;
}
.powered-by span { color: #0052ff; }
.wallet-badge {
  background: #111122; border-radius: 8px;
  padding: 6px 14px;
  font-family: 'Rajdhani', sans-serif;
  font-size: 13px; font-weight: 600;
  color: #00d4ff; text-align: center;
  width: fit-content; margin: 8px auto 0;
}

/* ── CONNECT SCREEN ── */
.connect-logo {
  text-align: center;
  margin-top: auto; margin-bottom: 24px;
}
.connect-logo h1 {
  font-size: 46px; font-weight: 700;
  color: white; letter-spacing: 6px; line-height: 1.1;
  text-shadow: 0 0 40px rgba(0,212,255,0.7);
}
.connect-tagline {
  font-size: 13px; color: #666;
  letter-spacing: 3px; margin-top: 6px;
}
.connect-card {
  background: #1e1e2e; border-radius: 20px;
  padding: 24px 22px;
  border: 1px solid #2a2a3e;
  width: 88%; margin-bottom: auto;
  display: flex; flex-direction: column;
  align-items: center; gap: 10px;
}
.connect-card-title {
  font-size: 21px; font-weight: 700; color: white;
  text-align: center; margin-top: 6px;
}
.connect-card-sub {
  font-size: 13px; color: #666;
  text-align: center; line-height: 1.5;
}
.connect-features {
  width: 100%; margin-top: 8px;
  display: flex; flex-direction: column; gap: 8px;
}
.connect-feature {
  display: flex; align-items: center; gap: 10px;
}
.cf-icon { color: #00ff88; font-size: 14px; }
.connect-feature span:last-child {
  font-family: 'Rajdhani', sans-serif;
  font-size: 13px; font-weight: 600; color: white;
}
#connectWalletBtn {
  width: 100%; height: 58px; border-radius: 14px;
  background: linear-gradient(135deg,#00d4ff,#0088cc);
  border: none; color: white; margin-top: 8px;
  font-family: 'Rajdhani', sans-serif;
  font-size: 19px; font-weight: 700;
  cursor: pointer; letter-spacing: 1px;
  box-shadow: 0 4px 28px rgba(0,212,255,0.45);
  transition: transform 0.1s;
}
#connectWalletBtn:active { transform: scale(0.95); }

/* ── USERNAME SCREEN ── */
.username-header {
  text-align: center; margin-top: auto;
  margin-bottom: 16px; padding: 0 10%;
}
.username-title {
  font-size: 24px; font-weight: 700; color: white;
}
.username-sub {
  font-size: 14px; color: #888;
  letter-spacing: 2px; margin-top: 6px;
}
.username-card {
  background: #1e1e2e; border-radius: 18px;
  padding: 22px 20px; width: 88%;
  border: 1px solid #2a2a3e;
}
.input-label {
  font-size: 11px; font-weight: 700;
  color: #888; letter-spacing: 2px;
  margin-bottom: 8px;
}
.username-input {
  width: 100%; height: 52px;
  background: #111122;
  border: 2px solid #2a2a3e;
  border-radius: 10px;
  color: white;
  font-family: 'Rajdhani', sans-serif;
  font-size: 18px; font-weight: 600;
  padding: 0 14px; outline: none;
  transition: border-color 0.2s, box-shadow 0.2s;
}
.username-input:focus {
  border-color: #00d4ff;
  box-shadow: 0 0 0 3px rgba(0,212,255,0.15);
}
.char-counter {
  font-size: 11px; color: #555;
  text-align: right; margin-top: 4px;
  transition: color 0.2s;
}
.username-rules {
  font-size: 12px; color: #555;
  line-height: 1.7; margin-top: 10px;
}
.username-error {
  display: none; width: 88%;
  font-size: 13px; font-weight: 600;
  color: #ff3535; text-align: center;
  padding: 8px 14px;
  background: rgba(255,53,53,0.1);
  border-radius: 8px; margin-top: 4px;
}
#confirmUsernameBtn {
  width: 88%; height: 56px; border-radius: 14px;
  background: linear-gradient(135deg,#00d4ff,#0088cc);
  border: none; color: white;
  font-family: 'Rajdhani', sans-serif;
  font-size: 19px; font-weight: 700;
  cursor: pointer; letter-spacing: 1px;
  box-shadow: 0 4px 24px rgba(0,212,255,0.4);
  transition: transform 0.1s; margin-bottom: auto;
  margin-top: 8px;
}
#confirmUsernameBtn:active { transform: scale(0.95); }

/* ── MAIN MENU ── */
.menu-topbar {
  position: absolute; top: 0; left: 0; right: 0;
  height: 48px; background: rgba(0,0,0,0.5);
  display: flex; align-items: center;
  justify-content: space-between;
  padding: 0 14px; z-index: 100;
}
.menu-topbar-left {
  display: flex; align-items: center; gap: 7px;
}
.topbar-dot {
  width: 7px; height: 7px; border-radius: 50%;
  background: #00ff88; flex-shrink: 0;
}
.topbar-username {
  font-size: 14px; font-weight: 700; color: white;
}
.topbar-address {
  font-size: 11px; color: #555;
}
.topbar-disconnect {
  background: none; border: none;
  color: #444; font-size: 14px;
  cursor: pointer; padding: 6px;
}
.menu-logo {
  text-align: center;
  margin-top: auto; margin-bottom: 24px;
}
.menu-logo h1 {
  font-size: 56px; font-weight: 700;
  color: white; letter-spacing: 6px; line-height: 1.1;
  text-shadow: 0 0 40px rgba(0,212,255,0.7);
}
.menu-logo h1 span { color: #00d4ff; }
.menu-logo p {
  font-size: 14px; color: #777;
  letter-spacing: 4px; margin-top: 8px;
}
.menu-stats-row {
  display: flex; align-items: center;
  gap: 6px; margin-bottom: 12px;
}
.menu-stat { text-align: center; }
.menu-stat-num {
  font-size: 20px; font-weight: 700; color: white;
}
.menu-stat-lbl {
  font-size: 10px; color: #555;
  letter-spacing: 1px; margin-top: 2px;
}
.menu-stat-divider {
  width: 1px; height: 32px;
  background: #2a2a3e; margin: 0 6px;
}
.menu-btns {
  display: flex; flex-direction: column;
  gap: 12px; width: 82%;
  margin-bottom: auto;
}

/* ── DIFFICULTY ── */
.diff-title {
  font-size: 19px; font-weight: 700;
  color: white; letter-spacing: 5px;
  text-align: center;
  margin-top: 55px; margin-bottom: 20px;
}
.diff-cards {
  display: flex; flex-direction: column;
  gap: 12px; width: 86%;
}
.diff-card {
  border-radius: 18px; padding: 18px 22px;
  cursor: pointer; display: flex;
  align-items: center; gap: 16px;
  position: relative; overflow: hidden;
  transition: transform 0.12s; user-select: none;
}
.diff-card:active { transform: scale(0.97); }
.diff-card.easy {
  background: linear-gradient(135deg,#1a472a,#2d6a4f);
  border: 1px solid #3d8a60;
}
.diff-card.medium {
  background: linear-gradient(135deg,#7b3f00,#c1692a);
  border: 1px solid #d4752e;
}
.diff-card.hard {
  background: linear-gradient(135deg,#4a0000,#8b0000);
  border: 1px solid #aa2222;
}
.diff-emoji { font-size: 38px; }
.diff-info h3 {
  font-size: 19px; font-weight: 700; color: white;
}
.diff-info p { font-size: 12px; margin-top: 3px; }
.easy .diff-info p { color: #88bb88; }
.medium .diff-info p { color: #ddaa88; }
.hard .diff-info p { color: #dd8888; }
.diff-accent {
  position: absolute; bottom: 0; left: 0; right: 0;
  height: 3px;
}
.easy .diff-accent { background: #00ff88; }
.medium .diff-accent { background: #ff8c00; }
.hard .diff-accent { background: #ff3535; }
.diff-badge {
  position: absolute; top: 10px; right: 12px;
  background: #00d4ff; color: white;
  font-size: 9px; font-weight: 700;
  padding: 3px 10px; border-radius: 20px;
}

/* ── GAME SCREEN ── */
#scoreBar {
  position: absolute; top: 0; left: 0; right: 0;
  height: 52px; z-index: 20;
  background: rgba(0,0,0,0.7);
  display: flex; align-items: center;
  justify-content: space-between; padding: 0 16px;
}
.score-side { display:flex; align-items:center; gap:7px; }
.score-dot { width:13px; height:13px; border-radius:50%; }
.player-dot { background: #ff6b35; }
.ai-dot { background: #ff3535; }
.score-label { font-size:11px; color:#888; font-weight:600; }
.score-num {
  font-size:30px; font-weight:700; color:white;
  min-width:24px; text-align:center;
}
#turnIndicator {
  font-size:13px; font-weight:700; color:#00d4ff;
  letter-spacing:1px;
  animation: turnPulse 1s infinite;
}
@keyframes turnPulse {
  0%,100% { opacity:1; } 50% { opacity:0.4; }
}
.crowd-strip {
  position:absolute; top:52px; width:14%; height:50%;
  display:flex; flex-wrap:wrap; gap:2px; padding:3px;
  overflow:hidden; pointer-events:none; z-index:1;
}
.crowd-strip.left { left:0; }
.crowd-strip.right { right:0; }
.fan {
  width:11px; height:8px;
  border-radius:2px; flex-shrink:0;
}
#pitch {
  position:absolute; bottom:0; left:0; right:0;
  height:22%; background:#2d8a4e; z-index:2;
}
#pitch::before {
  content:''; position:absolute;
  top:0; left:0; right:0; height:2px; background:white;
}
#penalty-arc {
  position:absolute; top:-58px; left:50%;
  transform:translateX(-50%);
  width:120px; height:60px;
  border:2px solid rgba(255,255,255,0.7);
  border-radius:60px 60px 0 0;
  border-bottom:none; background:transparent;
}
#penalty-spot {
  position:absolute; top:-16px; left:50%;
  transform:translateX(-50%);
  width:8px; height:8px;
  background:rgba(255,255,255,0.8); border-radius:50%;
}
#goal-container {
  position:absolute; top:62px; left:50%;
  transform:translateX(-50%);
  width:76%; z-index:3;
}
#goal { position:relative; }
#post-left, #post-right {
  position:absolute; top:0;
  width:8px; height:180px;
  background:white;
  box-shadow:0 0 8px rgba(255,255,255,0.4); z-index:6;
}
#post-left { left:0; }
#post-right { right:0; }
#crossbar {
  position:absolute; left:0; right:0; top:0;
  height:8px; background:white;
  box-shadow:0 0 8px rgba(255,255,255,0.4); z-index:6;
}
#net {
  position:absolute; left:8px; right:8px; top:8px;
  height:172px; background:#060d14;
  background-image:
    repeating-linear-gradient(0deg,transparent,
      transparent 18px,rgba(255,255,255,0.07) 18px,
      rgba(255,255,255,0.07) 20px),
    repeating-linear-gradient(90deg,transparent,
      transparent 18px,rgba(255,255,255,0.07) 18px,
      rgba(255,255,255,0.07) 20px);
  transform:perspective(500px) rotateX(4deg);
  z-index:4; overflow:hidden;
}
#net-ripple {
  position:absolute; inset:0;
  background:radial-gradient(circle,
    rgba(255,255,255,0.3) 0%,transparent 70%);
  opacity:0; transition:opacity 0.15s;
  pointer-events:none;
}
#aimCursor {
  position:absolute; width:52px; height:52px;
  border-radius:50%; border:3px solid #00d4ff;
  background:transparent; display:none;
  pointer-events:none; z-index:10;
  animation:aimPulse 0.9s ease-in-out infinite alternate;
}
#aimCursor::before {
  content:''; position:absolute;
  top:50%; left:50%;
  transform:translate(-50%,-50%);
  width:28px; height:2px; background:#00d4ff;
}
#aimCursor::after {
  content:''; position:absolute;
  top:50%; left:50%;
  transform:translate(-50%,-50%);
  width:2px; height:28px; background:#00d4ff;
}
@keyframes aimPulse {
  0% { box-shadow:0 0 4px rgba(0,212,255,0.5); }
  100% { box-shadow:0 0 18px rgba(0,212,255,0.9); }
}
#swingArrow {
  position:absolute; bottom:20px; left:0;
  font-size:32px; color:#ff6b35; display:none;
  pointer-events:none; z-index:10;
  text-shadow:0 0 10px rgba(255,107,53,0.7);
}
#keeper {
  position:absolute; bottom:0; left:50%;
  z-index:5; pointer-events:none;
}
#keeper-sway-wrapper {
  animation:keeperSway 1.6s ease-in-out infinite alternate;
  transform:translateX(-50%);
  display:flex; flex-direction:column; align-items:center;
}
@keyframes keeperSway {
  0% { transform:translateX(calc(-50% - 2px)); }
  100% { transform:translateX(calc(-50% + 2px)); }
}
#keeper-dive-wrapper {
  display:flex; flex-direction:column;
  align-items:center; transition:transform 0.3s ease-out;
}
#keeper-body {
  display:flex; flex-direction:column; align-items:center;
}
.k-hair {
  width:30px; height:7px;
  background:#3d2b1f; border-radius:4px 4px 0 0;
}
.k-head {
  width:34px; height:34px; border-radius:50%;
  background:#f4c08a; position:relative;
}
.k-eye-l,.k-eye-r {
  position:absolute; width:6px; height:6px;
  border-radius:50%; background:#2c1810; top:11px;
}
.k-eye-l { left:6px; } .k-eye-r { right:6px; }
.k-mouth {
  position:absolute; width:10px; height:4px;
  background:#c0694a; border-radius:0 0 5px 5px;
  bottom:6px; left:50%; transform:translateX(-50%);
}
.k-arms-row { display:flex; align-items:flex-start; }
.k-arm {
  width:9px; height:24px;
  background:#f5c518; border-radius:4px;
}
.k-jersey {
  width:44px; height:38px; background:#f5c518;
  border-radius:4px; display:flex;
  align-items:center; justify-content:center;
  font-size:18px; font-weight:700; color:white;
}
.k-gloves-row { display:flex; gap:30px; margin-top:1px; }
.k-glove {
  width:15px; height:16px;
  background:#ff6b35; border-radius:7px;
}
.k-shorts {
  width:38px; height:22px; background:#1a1a1a;
  border-radius:0 0 5px 5px;
}
.k-legs-row,.k-boots-row { display:flex; gap:5px; }
.k-leg { width:11px; height:26px; background:#f4c08a; }
.k-boot {
  width:14px; height:9px;
  background:white; border-radius:2px;
}
#ai-player {
  position:absolute; bottom:0; left:50%;
  transform:translateX(-50%) scale(0.75);
  display:none; flex-direction:column;
  align-items:center; z-index:6; pointer-events:none;
}
@keyframes runUp {
  0%,100% {
    transform:translateX(-50%) scale(0.75) translateY(0);
  }
  50% {
    transform:translateX(-50%) scale(0.75) translateY(-10px);
  }
}
.a-head {
  width:28px; height:28px; border-radius:50%;
  background:#f4c08a; position:relative;
}
.a-eye-l,.a-eye-r {
  position:absolute; width:5px; height:5px;
  border-radius:50%; background:#2c1810; top:10px;
}
.a-eye-l { left:5px; } .a-eye-r { right:5px; }
.a-jersey {
  width:36px; height:32px; background:#ff3535;
  border-radius:4px; display:flex;
  align-items:center; justify-content:center;
  font-size:14px; font-weight:700; color:white;
}
.a-shorts {
  width:32px; height:20px; background:#1a1a1a;
  border-radius:0 0 4px 4px;
}
.a-legs-row,.a-boots-row { display:flex; gap:4px; }
.a-leg { width:10px; height:22px; background:#f4c08a; }
.a-boot {
  width:13px; height:8px;
  background:white; border-radius:2px;
}
#ball {
  position:absolute; width:44px; height:44px;
  font-size:40px; line-height:44px; text-align:center;
  z-index:8; pointer-events:none;
}
#powerBarWrap {
  position:absolute; right:14px; top:50%;
  transform:translateY(-50%);
  display:flex; flex-direction:column;
  align-items:center; gap:5px;
  z-index:20; pointer-events:none;
}
.bar-label {
  font-size:10px; color:white;
  font-weight:700; letter-spacing:1px;
}
.tap-label {
  color:#00d4ff;
  animation:tapBlink 0.9s infinite;
}
@keyframes tapBlink {
  0%,100% { opacity:1; } 50% { opacity:0.1; }
}
#powerBarOuter {
  width:26px; height:195px; background:#0d1117;
  border-radius:13px; border:1px solid #2a2a3e;
  position:relative; overflow:hidden;
}
#powerBarFill {
  position:absolute; inset:0; border-radius:13px;
  background:linear-gradient(to top,
    #00ff88 0%,#00ff88 40%,
    #ffd700 40%,#ffd700 80%,
    #ff3535 80%,#ff3535 100%);
}
.zone-labels {
  position:absolute; left:-34px; top:0; height:100%;
  display:flex; flex-direction:column-reverse;
  pointer-events:none;
}
.zlbl {
  font-size:8px; font-weight:700;
  display:flex; align-items:center;
}
.zlbl.perfect { flex:40; color:#00ff88; }
.zlbl.strong { flex:40; color:#ffd700; }
.zlbl.risky { flex:20; color:#ff3535; }
#powerLine {
  position:absolute; left:0; right:0; height:3px;
  background:white; border-radius:2px;
  box-shadow:0 0 8px rgba(255,255,255,0.9);
  bottom:0; z-index:2;
}
#shootBtn {
  position:absolute; bottom:85px; right:14px;
  width:74px; height:74px; border-radius:50%;
  background:linear-gradient(135deg,#00d4ff,#0088cc);
  border:none; cursor:pointer;
  display:flex; flex-direction:column;
  align-items:center; justify-content:center;
  box-shadow:0 0 24px rgba(0,212,255,0.5);
  z-index:20; transition:transform 0.1s;
  font-family:'Rajdhani',sans-serif;
}
#shootBtn:active { transform:scale(0.91); }
#shootBtn span:first-child { font-size:26px; line-height:1; }
#shootBtn span:last-child {
  font-size:11px; color:white; font-weight:700;
}
#diveLeft,#diveCenter,#diveRight {
  position:absolute; bottom:80px; width:30%; height:66px;
  border-radius:12px; background:#1a1a2e;
  border:2px solid #00d4ff; color:white;
  font-family:'Rajdhani',sans-serif;
  font-size:14px; font-weight:700;
  cursor:pointer; display:none; z-index:20;
  transition:transform 0.1s;
}
#diveLeft:active,#diveCenter:active,
#diveRight:active { transform:scale(0.94); }
#diveLeft { left:2%; }
#diveCenter {
  left:50%; transform:translateX(-50%);
}
#diveCenter:active {
  transform:translateX(-50%) scale(0.94);
}
#diveRight { right:2%; }
#roundPopup,#suddenDeathOverlay {
  position:absolute; inset:0;
  background:rgba(0,0,0,0.85);
  display:none; align-items:center;
  justify-content:center; z-index:40;
}
.popup-card {
  background:#1e1e2e; border-radius:20px;
  padding:32px 48px; text-align:center;
}
.popup-card h2 {
  font-size:50px; font-weight:700; color:white;
}
.popup-card p {
  font-size:16px; color:#00d4ff; margin-top:6px;
}
#countdownOverlay {
  position:absolute; inset:0; display:none;
  align-items:center; justify-content:center;
  z-index:45; pointer-events:none;
}
#countNum {
  font-size:110px; font-weight:700; color:white;
  text-shadow:0 0 30px rgba(255,255,255,0.5);
}
@keyframes countPop {
  0% { transform:scale(1.6); opacity:0; }
  35% { transform:scale(1); opacity:1; }
  75% { transform:scale(0.9); opacity:1; }
  100% { transform:scale(0.75); opacity:0; }
}
#betweenStrip {
  position:absolute; bottom:0; left:0; right:0;
  background:#1e1e2e; border-radius:14px 14px 0 0;
  height:60px; display:none;
  align-items:center; justify-content:center; z-index:35;
}
@keyframes slideUp {
  from { transform:translateY(100%); }
  to { transform:translateY(0); }
}
#betweenStrip h3 { font-size:30px; font-weight:700; }
#suddenDeathOverlay h2 {
  font-size:38px; font-weight:700; letter-spacing:2px;
  animation:sdFlash 0.5s infinite alternate;
}
@keyframes sdFlash {
  0% { color:white; } 100% { color:#ff3535; }
}

/* ── OUTCOME TEXT ── */
.outcome-text {
  position:absolute; left:50%; top:38%;
  transform:translateX(-50%);
  font-family:'Rajdhani',sans-serif;
  font-size:64px; font-weight:700;
  pointer-events:none; z-index:30;
  white-space:nowrap;
  animation:floatFade 1.1s ease-out forwards;
}
@keyframes floatFade {
  0% {
    transform:translateX(-50%) translateY(0) scale(1);
    opacity:1;
  }
  100% {
    transform:translateX(-50%) translateY(-65px) scale(1.1);
    opacity:0;
  }
}
.confetti-piece {
  position:absolute; width:7px; height:7px;
  border-radius:1px; pointer-events:none; z-index:31;
  animation:confettiFall 1.1s ease-out forwards;
}
@keyframes confettiFall {
  0% { transform:translate(0,0) rotate(0deg); opacity:1; }
  100% {
    transform:translate(var(--dx),var(--dy)) rotate(540deg);
    opacity:0;
  }
}
@keyframes screenShake {
  0%,100% { transform:translateX(0); }
  20% { transform:translateX(-6px); }
  40% { transform:translateX(6px); }
  60% { transform:translateX(-4px); }
  80% { transform:translateX(4px); }
}

/* ── RESULTS ── */
#screen-results {
  justify-content:center; align-items:center;
  overflow:hidden;
}
.results-card {
  background:#1e1e2e; border-radius:24px;
  padding:32px 24px; width:88%;
  position:relative; z-index:2;
  display:flex; flex-direction:column;
  align-items:center; gap:12px;
}
.result-emoji {
  font-size:68px; line-height:1; text-align:center;
}
.result-title {
  font-size:50px; font-weight:700; text-align:center;
}
.result-score {
  font-size:44px; font-weight:700; color:white;
}
.score-labels-row {
  display:flex; justify-content:space-between;
  width:80px; font-size:12px; color:#888;
  font-weight:600; letter-spacing:1px;
  margin-top:-8px;
}
.stats-row { display:flex; gap:10px; width:100%; }
.stat-box {
  flex:1; background:#111122; border-radius:10px;
  padding:12px 8px; text-align:center;
}
.stat-num {
  font-size:28px; font-weight:700;
}
.stat-lbl {
  font-size:10px; color:#666;
  font-weight:600; letter-spacing:1px; margin-top:2px;
}
.results-btns {
  display:flex; flex-direction:column;
  gap:10px; width:100%;
}
@keyframes trophyBounce {
  0%,100% { transform:translateY(0) rotate(-3deg); }
  50% { transform:translateY(-16px) rotate(3deg); }
}
@keyframes sadRock {
  0%,100% { transform:rotate(0deg); }
  25% { transform:rotate(-12deg); }
  75% { transform:rotate(12deg); }
}
.gold-particle {
  position:absolute; border-radius:1px;
  pointer-events:none; z-index:1; background:#ffd700;
}
@keyframes goldFall {
  0% { transform:translateY(-20px) rotate(0deg); opacity:1; }
  100% {
    transform:translateY(110vh) rotate(360deg); opacity:0.2;
  }
}
.btn-mint {
  width:100%; height:56px; border-radius:14px;
  border:2px solid #ffd700;
  background:rgba(255,215,0,0.07); color:#ffd700;
  font-family:'Rajdhani',sans-serif;
  font-size:16px; font-weight:700; cursor:pointer;
  display:flex; align-items:center;
  justify-content:center; gap:8px;
  transition:transform 0.1s, background 0.2s;
}
.btn-mint:active { transform:scale(0.95); }
.mint-disclaimer {
  font-size:11px; color:#444; text-align:center;
  margin-top:-4px;
}

/* ── LEADERBOARD ── */
.data-topbar {
  position:absolute; top:0; left:0; right:0;
  height:52px; background:rgba(0,0,0,0.5);
  display:flex; align-items:center;
  justify-content:space-between; padding:0 16px;
  z-index:10;
}
.back-btn-inline {
  background:none; border:none; color:#888;
  font-family:'Rajdhani',sans-serif;
  font-size:15px; cursor:pointer;
}
.data-title {
  font-size:16px; font-weight:700; color:white;
  letter-spacing:4px;
}
.refresh-btn {
  background:none; border:none; color:#00d4ff;
  font-size:18px; cursor:pointer; padding:4px;
}
.lb-content {
  position:absolute; top:52px; bottom:72px;
  left:0; right:0;
  overflow-y:auto; padding:12px 14px;
}
.my-rank-bar {
  position:absolute; bottom:0; left:0; right:0;
  height:72px;
  background:linear-gradient(to top,#1a1a2e,
    rgba(26,26,46,0.95));
  border-top:1px solid #2a2a3e;
  padding:0 16px; display:flex;
  align-items:center; gap:12px; z-index:20;
}
.lb-row {
  display:flex; align-items:center;
  padding:13px 14px; border-radius:12px;
  background:#1e1e2e; margin-bottom:8px; gap:10px;
}
.lb-row.is-me {
  background:rgba(0,212,255,0.08);
  border-left:3px solid #00d4ff;
}
.lb-rank { width:32px; font-size:22px; }
.lb-rank-num {
  font-family:'Rajdhani',sans-serif;
  font-size:16px; font-weight:700; color:#666;
}
.lb-name {
  flex:1; font-family:'Rajdhani',sans-serif;
  font-size:16px; font-weight:700; color:white;
}
.lb-you-tag {
  font-size:12px; color:#555; font-weight:400;
}
.lb-wr {
  font-family:'Rajdhani',sans-serif;
  font-size:16px; font-weight:700;
  color:#00d4ff; width:52px; text-align:right;
}
.lb-wins {
  font-family:'Rajdhani',sans-serif;
  font-size:13px; color:#666;
  width:36px; text-align:right;
}

/* ── SHARED ── */
.spinner {
  width:40px; height:40px; border-radius:50%;
  border:3px solid #00d4ff; border-top-color:transparent;
  animation:spin 0.8s linear infinite; margin:40px auto;
}
@keyframes spin { to { transform:rotate(360deg); } }
.placeholder-wrap {
  display:flex; flex-direction:column;
  align-items:center; gap:12px; margin-top:60px;
}
.placeholder-emoji { font-size:52px; }
.placeholder-title {
  font-size:24px; font-weight:700; color:white;
}
.placeholder-sub { font-size:14px; color:#666; }
.error-text {
  font-size:14px; color:#ff3535;
  text-align:center; margin-top:40px;
}
@keyframes walletShake {
  0%,100% { transform:translateX(0); }
  15% { transform:translateX(-6px); }
  30% { transform:translateX(6px); }
  45% { transform:translateX(-5px); }
  60% { transform:translateX(5px); }
  75% { transform:translateX(-3px); }
  90% { transform:translateX(3px); }
}

` }

═══════════════════════════════════════════════════════
SECTION 5 — COMPLETE GAME LOGIC (initGame function)
═══════════════════════════════════════════════════════

function initGame() {

// ─── STATE ───────────────────────────────────────────
const gameState = {
  playerScore:0, aiScore:0,
  currentRound:1, totalRounds:5,
  isSuddenDeath:false, suddenDeathCount:0,
  maxSuddenDeath:10, difficulty:'medium',
  playerGoals:0, playerSaves:0,
  matchOver:false, busy:false,
  walletConnected:false, walletAddress:null,
  username:null
}
window.__gameState = gameState

// ─── TIMING CONSTANTS ────────────────────────────────
const T = {
  ballFlight:350, outcome:1300, roundPopup:1200,
  countStep:850, betweenRound:1600, suddenDeath:2000,
  keeperDive:1200, keeperReturn:700, aiRunup:900,
  flashBorder:400, redOverlay:400, confetti:1150,
  screenStart:350
}

// ─── INTERVAL TRACKING ───────────────────────────────
const activeIntervals = new Set()
let powerInterval = null
let arrowInterval = null

function safeSetInterval(fn, delay) {
  const id = setInterval(fn, delay)
  activeIntervals.add(id)
  return id
}
function safeClearInterval(id) {
  if (id) { clearInterval(id); activeIntervals.delete(id) }
}
function clearAllIntervals() {
  activeIntervals.forEach(id => clearInterval(id))
  activeIntervals.clear()
  powerInterval = null
  arrowInterval = null
}

// ─── POWER/CURSOR/ARROW STATE ─────────────────────────
let powerPos = 0, powerDir = 1, powerZone = 'perfect'
let isDragging = false, cursorX = 0, cursorY = 0
let arrowPos = 50, arrowDir2 = 1

// ─── LEADERBOARD CACHE ───────────────────────────────
let cachedLeaderboardData = null
let leaderboardCacheTime = 0
const CACHE_DURATION = 30000

// ─── SUPABASE CLIENT ─────────────────────────────────
async function getSupabase() {
  const { createClient } = await import('@supabase/supabase-js')
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
  )
}

// ─── SCREEN MANAGER ──────────────────────────────────
function showScreen(name) {
  clearAllIntervals()
  document.querySelectorAll('.screen').forEach(s => {
    s.classList.remove('active')
    s.style.display = 'none'
  })
  const target = document.getElementById('screen-' + name)
  if (!target) return
  target.style.display = 'flex'
  requestAnimationFrame(() => target.classList.add('active'))
  if (name === 'leaderboard') loadLeaderboard()
  if (name === 'menu') loadMenuStats()
}
window.showScreen = showScreen

// ─── WALLET BRIDGE ───────────────────────────────────
window.__onWalletStateChange = function(connected, address) {
  gameState.walletConnected = connected
  gameState.walletAddress = address || null

  if (connected && address) {
    // Update top bar display
    const un = document.getElementById('topbarUsername')
    const ad = document.getElementById('topbarAddress')
    if (un && gameState.username) un.textContent = gameState.username
    if (ad) ad.textContent =
      address.slice(0,6)+'...'+address.slice(-4)

    // Update connect button badge
    const badge = document.getElementById('usernameBadge')
    if (badge) badge.textContent =
      address.slice(0,6)+'...'+address.slice(-4)

    // Check if this wallet has a username
    checkExistingUser(address)
  }
}

// ─── CONNECT SCREEN ──────────────────────────────────
window.triggerWalletConnect = function() {
  const btn = document.getElementById('connectWalletBtn')
  if (btn) {
    btn.textContent = '⏳  Connecting...'
    btn.style.opacity = '0.7'
    btn.style.cursor = 'not-allowed'
  }
  if (window.__triggerWalletConnect) {
    window.__triggerWalletConnect()
  }
}

async function checkExistingUser(address) {
  try {
    const supabase = await getSupabase()
    const { data } = await supabase
      .from('player_profiles')
      .select('username')
      .eq('wallet_address', address)
      .maybeSingle()

    if (data && data.username && data.username.trim() !== '') {
      gameState.username = data.username
      // Returning player — go straight to menu
      updateMenuTopbar()
      showScreen('menu')
    } else {
      // New player — needs username
      const badge = document.getElementById('usernameBadge')
      if (badge) badge.textContent =
        address.slice(0,6)+'...'+address.slice(-4)
      showScreen('username')
    }
  } catch (err) {
    console.error('User check error:', err)
    showScreen('username')
  }
}

// ─── DISCONNECT ──────────────────────────────────────
window.handleDisconnect = function() {
  // Just go back to connect screen
  // Actual disconnect handled by wagmi externally
  gameState.walletConnected = false
  gameState.walletAddress = null
  gameState.username = null
  showScreen('connect')
}

// ─── USERNAME SETUP ───────────────────────────────────
const usernameInput = document.getElementById('usernameInput')
const charCounter = document.getElementById('charCounter')

if (usernameInput) {
  usernameInput.addEventListener('input', (e) => {
    const len = e.target.value.length
    if (charCounter) {
      charCounter.textContent = len + ' / 16'
      charCounter.style.color = len >= 16 ? '#ff3535' : '#555'
    }
    hideUsernameError()
  })
  usernameInput.addEventListener('keydown', (e) => {
    if (e.key === 'Enter') confirmUsername()
  })
}

function showUsernameError(msg) {
  const el = document.getElementById('usernameError')
  if (el) { el.textContent = msg; el.style.display = 'block' }
}
function hideUsernameError() {
  const el = document.getElementById('usernameError')
  if (el) el.style.display = 'none'
}
function validateUsername(name) {
  name = name.trim()
  if (name.length < 3)
    return { valid:false, error:'Minimum 3 characters' }
  if (name.length > 16)
    return { valid:false, error:'Maximum 16 characters' }
  if (!/^[a-zA-Z0-9_]+$/.test(name))
    return { valid:false,
      error:'Letters, numbers, underscores only' }
  return { valid:true }
}

window.confirmUsername = async function() {
  const input = document.getElementById('usernameInput')
  const btn = document.getElementById('confirmUsernameBtn')
  if (!input || !btn) return

  const name = input.value.trim()
  const v = validateUsername(name)
  if (!v.valid) {
    showUsernameError(v.error)
    input.style.animation = 'none'
    void input.offsetWidth
    input.style.animation = 'walletShake 0.4s ease'
    setTimeout(() => { input.style.animation = '' }, 400)
    return
  }

  hideUsernameError()
  btn.textContent = '⏳ Saving...'
  btn.style.opacity = '0.7'
  btn.style.cursor = 'not-allowed'
  input.disabled = true

  try {
    const supabase = await getSupabase()

    // Check if name taken by another wallet
    const { data: existing } = await supabase
      .from('player_profiles')
      .select('wallet_address')
      .eq('username', name)
      .maybeSingle()

    if (existing &&
        existing.wallet_address !== gameState.walletAddress) {
      showUsernameError('That name is taken. Try another!')
      btn.textContent = "LET'S PLAY →"
      btn.style.opacity = '1'
      btn.style.cursor = 'pointer'
      input.disabled = false
      return
    }

    // Save username
    const { error } = await supabase
      .from('player_profiles')
      .upsert({
        wallet_address: gameState.walletAddress,
        username: name
      }, { onConflict: 'wallet_address' })

    if (error) throw error

    gameState.username = name
    updateMenuTopbar()
    showScreen('menu')

  } catch (err) {
    console.error('Username save error:', err)
    showUsernameError('Something went wrong. Try again.')
    btn.textContent = "LET'S PLAY →"
    btn.style.opacity = '1'
    btn.style.cursor = 'pointer'
    input.disabled = false
  }
}

// ─── MENU HELPERS ────────────────────────────────────
function updateMenuTopbar() {
  const un = document.getElementById('topbarUsername')
  const ad = document.getElementById('topbarAddress')
  if (un && gameState.username) un.textContent = gameState.username
  if (ad && gameState.walletAddress) {
    ad.textContent =
      gameState.walletAddress.slice(0,6)+'...'+
      gameState.walletAddress.slice(-4)
  }
}

async function loadMenuStats() {
  if (!gameState.walletConnected || !gameState.walletAddress) return
  try {
    const supabase = await getSupabase()
    const { data } = await supabase
      .from('player_profiles')
      .select('total_matches,total_wins,win_rate')
      .eq('wallet_address', gameState.walletAddress)
      .maybeSingle()

    const row = document.getElementById('menuStatsRow')
    if (!row || !data || data.total_matches === 0) return

    row.innerHTML = `
      <div class="menu-stat">
        <div class="menu-stat-num">${data.total_matches}</div>
        <div class="menu-stat-lbl">MATCHES</div>
      </div>
      <div class="menu-stat-divider"></div>
      <div class="menu-stat">
        <div class="menu-stat-num">${data.total_wins}</div>
        <div class="menu-stat-lbl">WINS</div>
      </div>
      <div class="menu-stat-divider"></div>
      <div class="menu-stat">
        <div class="menu-stat-num">${data.win_rate}%</div>
        <div class="menu-stat-lbl">WIN RATE</div>
      </div>
    `
    row.style.display = 'flex'
  } catch(e) { /* silent */ }
}

// ─── CROWD + PARTICLES ───────────────────────────────
const fanColors = ['#e63946','#457b9d','#e9c46a',
                   '#2a9d8f','#f4a261','#264653']
;['crowdLeft','crowdRight'].forEach(id => {
  const el = document.getElementById(id)
  if (!el) return
  for (let i=0; i<80; i++) {
    const f = document.createElement('div')
    f.className = 'fan'
    f.style.background =
      fanColors[Math.floor(Math.random()*6)]
    el.appendChild(f)
  }
})

const menuScreen = document.getElementById('screen-menu')
if (menuScreen) {
  for (let i=0; i<25; i++) {
    const p = document.createElement('div')
    p.className = 'particle'
    const size = 2 + Math.random()*3
    p.style.cssText = `
      width:${size}px; height:${size}px;
      left:${Math.random()*100}%;
      top:${20+Math.random()*80}%;
      animation-duration:${5+Math.random()*4}s;
      animation-delay:${Math.random()*5}s;
    `
    menuScreen.appendChild(p)
  }
}

// ─── RESET BALL ───────────────────────────────────────
function resetBall() {
  const spot = document.getElementById('penalty-spot')
  const app = document.getElementById('app')
  const ball = document.getElementById('ball')
  if (!spot||!app||!ball) return
  const sr = spot.getBoundingClientRect()
  const ar = app.getBoundingClientRect()
  ball.style.transition = 'none'
  ball.style.transform = 'scale(1) rotate(0deg)'
  ball.style.left = (sr.left-ar.left-22)+'px'
  ball.style.top = (sr.top-ar.top-22)+'px'
}

// ─── RESET CURSOR ─────────────────────────────────────
// CRITICAL: cursor is inside #net — net-local coordinates
function resetCursor() {
  const net = document.getElementById('net')
  const cursor = document.getElementById('aimCursor')
  if (!net||!cursor) return
  cursorX = net.offsetWidth/2
  cursorY = net.offsetHeight/2
  cursor.style.left = (cursorX-26)+'px'
  cursor.style.top = (cursorY-26)+'px'
}

// ─── CURSOR DRAG (net-local coordinates) ─────────────
const netEl = document.getElementById('net')
if (netEl) {
  netEl.addEventListener('mousedown',
    () => { isDragging=true })
  netEl.addEventListener('touchstart', (e) => {
    isDragging=true; e.preventDefault()
  }, { passive:false })
}
document.addEventListener('mousemove', moveCursor)
document.addEventListener('touchmove', (e) => {
  if (isDragging) { moveCursor(e); e.preventDefault() }
}, { passive:false })
document.addEventListener('mouseup',
  () => { isDragging=false })
document.addEventListener('touchend',
  () => { isDragging=false })

function moveCursor(e) {
  if (!isDragging||gameState.busy) return
  const net = document.getElementById('net')
  if (!net) return
  const rect = net.getBoundingClientRect()
  const clientX = e.touches ? e.touches[0].clientX : e.clientX
  const clientY = e.touches ? e.touches[0].clientY : e.clientY
  const localX = clientX - rect.left
  const localY = clientY - rect.top
  cursorX = Math.min(Math.max(localX, 26), rect.width-26)
  cursorY = Math.min(Math.max(localY, 26), rect.height-26)
  const cursor = document.getElementById('aimCursor')
  if (cursor) {
    cursor.style.left = (cursorX-26)+'px'
    cursor.style.top = (cursorY-26)+'px'
  }
}

// ─── POWER BAR ────────────────────────────────────────
function startPowerBar() {
  stopPowerBar()
  powerPos=0; powerDir=1
  powerInterval = safeSetInterval(() => {
    powerPos += 0.75*powerDir
    powerPos = Math.min(100, Math.max(0, powerPos))
    if (powerPos>=100) powerDir=-1
    if (powerPos<=0) powerDir=1
    const barH = document.getElementById('powerBarOuter')
      ?.offsetHeight||195
    const line = document.getElementById('powerLine')
    if (line) line.style.bottom = (powerPos/100*barH)+'px'
  }, 16)
}
function stopPowerBar() {
  safeClearInterval(powerInterval)
  powerInterval=null
  if (powerPos<40) powerZone='perfect'
  else if (powerPos<80) powerZone='strong'
  else powerZone='risky'
}

// ─── START GAME ──────────────────────────────────────
window.startGame = function(diff) {
  gameState.difficulty=diff
  gameState.playerScore=0; gameState.aiScore=0
  gameState.currentRound=1; gameState.isSuddenDeath=false
  gameState.suddenDeathCount=0; gameState.playerGoals=0
  gameState.playerSaves=0; gameState.matchOver=false
  gameState.busy=false
  const p = document.getElementById('playerScoreEl')
  const a = document.getElementById('aiScoreEl')
  if (p) p.textContent='0'
  if (a) a.textContent='0'
  showScreen('game')
  setTimeout(() => {
    resetBall(); resetCursor(); startRound()
  }, T.screenStart)
}

// ─── ROUND MANAGEMENT ────────────────────────────────
function startRound() {
  if (gameState.isSuddenDeath) {
    gameState.suddenDeathCount++
    if (gameState.suddenDeathCount > gameState.maxSuddenDeath) {
      endMatch('draw'); return
    }
  }
  gameState.busy=true
  stopPowerBar(); stopArrow()
  hideDiveBtns(); hideShootBtn(); hideAiPlayer()
  const cursor = document.getElementById('aimCursor')
  if (cursor) cursor.style.display='none'
  showRoundPopup(() => showCountdown(() => beginPlayerTurn()))
}

function showRoundPopup(cb) {
  const popup = document.getElementById('roundPopup')
  const rt = document.getElementById('roundText')
  const rs = document.getElementById('roundSub')
  if (!popup||!rt||!rs) { cb(); return }
  if (gameState.isSuddenDeath) {
    rt.textContent='⚡ SUDDEN DEATH'; rs.textContent=''
  } else {
    rt.textContent='ROUND '+gameState.currentRound
    rs.textContent='of '+gameState.totalRounds
  }
  popup.style.opacity='0'; popup.style.display='flex'
  requestAnimationFrame(() => {
    popup.style.transition='opacity 0.2s'
    popup.style.opacity='1'
  })
  setTimeout(() => {
    popup.style.opacity='0'
    setTimeout(() => {
      popup.style.display='none'
      popup.style.transition=''; cb()
    }, 200)
  }, T.roundPopup)
}

function showCountdown(cb) {
  const overlay = document.getElementById('countdownOverlay')
  const numEl = document.getElementById('countNum')
  if (!overlay||!numEl) { cb(); return }
  overlay.style.display='flex'; let count=3
  function showNum() {
    numEl.textContent=count
    numEl.style.animation='none'
    void numEl.offsetWidth
    numEl.style.animation='countPop 0.85s forwards'
    count--
    if (count>=1) setTimeout(showNum, T.countStep)
    else setTimeout(() => {
      overlay.style.display='none'; cb()
    }, T.countStep)
  }
  showNum()
}

function beginPlayerTurn() {
  gameState.busy=false
  setTurnIndicator(true)
  startPowerBar(); resetCursor()
  const cursor = document.getElementById('aimCursor')
  if (cursor) cursor.style.display='block'
  showShootBtn()
}

function setTurnIndicator(isPlayer) {
  const el = document.getElementById('turnIndicator')
  if (!el) return
  el.textContent = isPlayer ? 'YOUR TURN ⚽' : 'AI TURN 🤖'
  el.style.color = isPlayer ? '#00d4ff' : '#ff3535'
}
function updateScoreBar() {
  const p = document.getElementById('playerScoreEl')
  const a = document.getElementById('aiScoreEl')
  if (p) p.textContent=gameState.playerScore
  if (a) a.textContent=gameState.aiScore
}

// ─── HANDLE SHOOT ─────────────────────────────────────
window.handleShoot = function() {
  if (gameState.busy||gameState.matchOver) return
  gameState.busy=true
  stopPowerBar()
  const cursor = document.getElementById('aimCursor')
  if (cursor) cursor.style.display='none'
  hideShootBtn()

  const net = document.getElementById('net')
  const netW = net ? net.offsetWidth : 200
  let aimZone
  if (cursorX < netW/3) aimZone='left'
  else if (cursorX < netW*2/3) aimZone='center'
  else aimZone='right'

  const ball = document.getElementById('ball')
  const netRect = net.getBoundingClientRect()
  const appRect = document.getElementById('app')
    .getBoundingClientRect()
  const targetX = netRect.left-appRect.left+cursorX-22
  const targetY = netRect.top-appRect.top+cursorY-22
  ball.style.transition = `all ${T.ballFlight}ms ease-in`
  ball.style.left = targetX+'px'
  ball.style.top = targetY+'px'
  ball.style.transform = 'scale(0.3) rotate(360deg)'

  let r = Math.random()
  let keeperDive = r<0.33?'left':r<0.66?'right':'center'
  if (gameState.difficulty==='medium'&&Math.random()<0.40)
    keeperDive=aimZone
  else if (gameState.difficulty==='hard'&&Math.random()<0.62)
    keeperDive=aimZone

  diveKeeper(keeperDive)

  setTimeout(() => {
    let outcome
    if (powerZone==='risky'&&Math.random()<0.5) {
      outcome='miss'
      ball.style.transition='all 0.3s ease-out'
      ball.style.top='-80px'
      ball.style.transform='scale(0.2) rotate(720deg)'
    } else if (keeperDive===aimZone) {
      outcome='saved'
    } else {
      outcome='goal'
    }

    if (outcome==='goal') {
      gameState.playerScore++; gameState.playerGoals++
      updateScoreBar()
      showOutcomeText('GOAL!','#ffd700')
      spawnConfetti(); triggerNetRipple()
    } else if (outcome==='saved') {
      showOutcomeText('SAVED!','#00ff88')
      flashGoalBorder('#00ff88')
    } else {
      showOutcomeText('MISS!','#888888')
      shakeScreen()
    }

    setTimeout(() => {
      resetBall()
      setTimeout(() => beginAiTurn(), 400)
    }, T.outcome)
  }, T.ballFlight+30)
}

// ─── KEEPER DIVE ─────────────────────────────────────
function diveKeeper(dir) {
  const wrapper = document.getElementById('keeper-dive-wrapper')
  if (!wrapper) return
  wrapper.style.transition='transform 0.3s ease-out'
  if (dir==='left')
    wrapper.style.transform='translateX(-85px) rotate(-75deg)'
  else if (dir==='right')
    wrapper.style.transform='translateX(85px) rotate(75deg)'
  else
    wrapper.style.transform='translateY(-32px)'
  setTimeout(() => {
    wrapper.style.transition=
      `transform ${T.keeperReturn}ms ease-in-out`
    wrapper.style.transform='none'
  }, T.keeperDive)
}

// ─── AI TURN ──────────────────────────────────────────
function beginAiTurn() {
  setTurnIndicator(false); showAiPlayer()
  const arrowEl = document.getElementById('swingArrow')
  const net = document.getElementById('net')
  if (!arrowEl||!net) return
  arrowEl.style.display='block'
  arrowPos=0; arrowDir2=1
  const speeds={easy:0.4,medium:0.9,hard:1.7}
  const speed=speeds[gameState.difficulty]
  const goalW=net.offsetWidth-40
  stopArrow()
  arrowInterval = safeSetInterval(() => {
    arrowPos += speed*arrowDir2
    arrowPos=Math.min(100,Math.max(0,arrowPos))
    if (arrowPos>=100) arrowDir2=-1
    if (arrowPos<=0) arrowDir2=1
    arrowEl.style.left=(arrowPos/100*goalW)+'px'
  }, 16)
  setTimeout(() => showDiveBtns(), T.aiRunup)
}

function stopArrow() {
  safeClearInterval(arrowInterval); arrowInterval=null
  const el=document.getElementById('swingArrow')
  if (el) el.style.display='none'
}

// ─── HANDLE DIVE ─────────────────────────────────────
window.handleDive = function(dir) {
  if (!arrowInterval) return
  const cap=arrowPos
  stopArrow(); hideDiveBtns(); hideAiPlayer()

  let arrowZone
  if (cap<33) arrowZone='left'
  else if (cap<66) arrowZone='center'
  else arrowZone='right'

  // Symmetric feint for hard mode
  if (gameState.difficulty==='hard'&&Math.random()<0.30) {
    const others=['left','center','right']
      .filter(z=>z!==arrowZone)
    arrowZone=others[Math.floor(Math.random()*others.length)]
  }

  if (dir===arrowZone) {
    gameState.playerSaves++
    showOutcomeText('SAVED!','#00d4ff')
    flashGoalBorder('#00d4ff')
  } else {
    gameState.aiScore++; updateScoreBar()
    showOutcomeText('GOAL!','#ff3535')
    showRedOverlay()
  }

  // busy stays true — only released in beginPlayerTurn
  setTimeout(() => proceedRound(), T.outcome)
}

// ─── ROUND FLOW ───────────────────────────────────────
function proceedRound() {
  const strip=document.getElementById('betweenStrip')
  const txt=document.getElementById('betweenText')
  if (strip&&txt) {
    txt.textContent='YOU '+gameState.playerScore+
      ' — '+gameState.aiScore+' AI'
    txt.style.color =
      gameState.playerScore>gameState.aiScore?'#00ff88':
      gameState.aiScore>gameState.playerScore?'#ff3535':
      'white'
    strip.style.display='flex'
    strip.style.animation='slideUp 0.3s ease'
  }
  setTimeout(() => {
    if (strip) strip.style.display='none'
    if (gameState.isSuddenDeath) {
      if (gameState.playerScore!==gameState.aiScore)
        endMatch(gameState.playerScore>gameState.aiScore
          ?'win':'loss')
      else startRound()
    } else {
      gameState.currentRound++
      if (gameState.currentRound>gameState.totalRounds)
        checkMatchEnd()
      else startRound()
    }
  }, T.betweenRound)
}

function checkMatchEnd() {
  if (gameState.playerScore>gameState.aiScore)
    endMatch('win')
  else if (gameState.aiScore>gameState.playerScore)
    endMatch('loss')
  else {
    gameState.isSuddenDeath=true
    const sd=document.getElementById('suddenDeathOverlay')
    if (sd) sd.style.display='flex'
    setTimeout(() => {
      if (sd) sd.style.display='none'; startRound()
    }, T.suddenDeath)
  }
}

// ─── END MATCH ───────────────────────────────────────
function endMatch(result) {
  gameState.matchOver=true
  if (result!=='draw') saveMatchResult(result==='win')
  buildResultsScreen(result)
  showScreen('results')
  // Prefetch fresh leaderboard
  setTimeout(() => {
    cachedLeaderboardData=null; leaderboardCacheTime=0
    fetchAndRenderLeaderboard().catch(()=>{})
  }, 2500)
}

// ─── RESULTS SCREEN ──────────────────────────────────
function buildResultsScreen(result) {
  document.querySelectorAll('.gold-particle')
    .forEach(p=>p.remove())
  const emojiEl=document.getElementById('resultEmoji')
  const titleEl=document.getElementById('resultTitle')
  const scoreEl=document.getElementById('resultScore')
  const goalsEl=document.getElementById('statGoals')
  const savesEl=document.getElementById('statSaves')
  const btns=document.getElementById('resultsBtns')
  if (!emojiEl) return

  if (result==='win') {
    emojiEl.textContent='🏆'
    emojiEl.style.animation='trophyBounce 0.9s ease-in-out infinite'
    titleEl.textContent='VICTORY!'
    titleEl.style.color='#ffd700'
    titleEl.style.textShadow='0 0 30px rgba(255,215,0,0.6)'
    spawnGoldParticles()
    // Add optional mint button
    if (btns) {
      const existing=document.getElementById('mintSection')
      if (existing) existing.remove()
      const mintSection=document.createElement('div')
      mintSection.id='mintSection'
      mintSection.style.cssText=
        'display:flex;flex-direction:column;' +
        'align-items:center;gap:6px;width:100%;margin-top:4px;'
      const mintBtn=document.createElement('button')
      mintBtn.id='mintTrophyBtn'
      mintBtn.className='btn-mint'
      mintBtn.innerHTML=`🏆 <span>MINT TROPHY</span>
        <span style="font-size:12px;
          color:rgba(255,215,0,0.6);margin-left:2px;">
          • 0.001 USDC</span>`
      mintBtn.onclick=handleMintTrophy
      const disc=document.createElement('div')
      disc.className='mint-disclaimer'
      disc.textContent=
        'Optional  •  0.001 USDC fee  •  Permanent on-chain record'
      mintSection.appendChild(mintBtn)
      mintSection.appendChild(disc)
      btns.appendChild(mintSection)
    }
  } else if (result==='loss') {
    emojiEl.textContent='⚽'
    emojiEl.style.animation='sadRock 1.1s ease-in-out infinite'
    titleEl.textContent='DEFEATED'
    titleEl.style.color='#ff3535'
    titleEl.style.textShadow='none'
  } else {
    emojiEl.textContent='🤝'
    emojiEl.style.animation='none'
    titleEl.textContent='DRAW'
    titleEl.style.color='#888'
    titleEl.style.textShadow='none'
  }

  if (scoreEl) scoreEl.textContent=
    gameState.playerScore+'  —  '+gameState.aiScore
  if (goalsEl) goalsEl.textContent=gameState.playerGoals
  if (savesEl) savesEl.textContent=gameState.playerSaves
}

window.onPlayAgain = function() {
  document.querySelectorAll('.gold-particle').forEach(p=>p.remove())
  showScreen('difficulty')
}
window.onMainMenu = function() {
  document.querySelectorAll('.gold-particle').forEach(p=>p.remove())
  showScreen('menu')
}

// ─── GOLD PARTICLES ───────────────────────────────────
function spawnGoldParticles() {
  const sc=document.getElementById('screen-results')
  if (!sc) return
  for (let i=0;i<28;i++) {
    const p=document.createElement('div')
    p.className='gold-particle'
    const size=5+Math.random()*4
    p.style.cssText=`width:${size}px;height:${size}px;
      left:${Math.random()*100}%;top:-20px;
      animation:goldFall ${1.8+Math.random()*1.4}s linear
        ${Math.random()*2}s infinite;`
    sc.appendChild(p)
  }
}

// ─── MINT TROPHY ──────────────────────────────────────
async function handleMintTrophy() {
  const btn=document.getElementById('mintTrophyBtn')
  if (!btn||!gameState.walletConnected) return
  if (btn.dataset.processing==='true') return
  btn.dataset.processing='true'
  btn.style.cursor='not-allowed'
  btn.innerHTML=`<span style="width:16px;height:16px;
    border:2px solid #ffd700;border-top-color:transparent;
    border-radius:50%;display:inline-block;
    animation:spin 0.8s linear infinite;"></span>
    <span style="margin-left:8px;">Confirm in wallet...</span>`

  try {
    const { sendUSDCPayment } = await import('./lib/trophy')
    const result = await sendUSDCPayment(gameState.walletAddress)

    if (result.success) {
      btn.style.borderColor='#00ff88'
      btn.style.color='#00ff88'
      btn.style.background='rgba(0,255,136,0.07)'
      btn.innerHTML='✅  Trophy Minted!'
      if (result.txHash) {
        const link=document.createElement('a')
        link.href='https://basescan.org/tx/'+result.txHash
        link.target='_blank'; link.rel='noopener noreferrer'
        link.textContent='↗ View on BaseScan'
        link.style.cssText=`display:block;text-align:center;
          font-family:Rajdhani,sans-serif;font-size:12px;
          color:#00d4ff;text-decoration:none;margin-top:6px;
          border-bottom:1px solid rgba(0,212,255,0.3);
          padding-bottom:2px;width:fit-content;
          margin-left:auto;margin-right:auto;`
        btn.insertAdjacentElement('afterend',link)
      }
      spawnConfetti()
    } else if (result.cancelled) {
      btn.dataset.processing='false'
      btn.style.cursor='pointer'
      btn.style.borderColor='#ffd700'
      btn.style.color='#ffd700'
      btn.style.background='rgba(255,215,0,0.07)'
      btn.innerHTML=`🏆 <span>MINT TROPHY</span>
        <span style="font-size:12px;
          color:rgba(255,215,0,0.6);margin-left:2px;">
          • 0.001 USDC</span>`
    } else {
      btn.style.borderColor='#ff3535'
      btn.style.color='#ff3535'
      btn.style.background='rgba(255,53,53,0.07)'
      btn.innerHTML='❌  Failed — Tap to retry'
      setTimeout(() => {
        if (!btn.parentNode) return
        btn.dataset.processing='false'
        btn.style.cursor='pointer'
        btn.style.borderColor='#ffd700'
        btn.style.color='#ffd700'
        btn.style.background='rgba(255,215,0,0.07)'
        btn.innerHTML=`🏆 <span>MINT TROPHY</span>
          <span style="font-size:12px;
            color:rgba(255,215,0,0.6);margin-left:2px;">
            • 0.001 USDC</span>`
      }, 2500)
    }
  } catch(err) {
    console.error('Mint error:',err)
    btn.dataset.processing='false'
    btn.style.cursor='pointer'
    btn.innerHTML=`🏆 <span>MINT TROPHY</span>
      <span style="font-size:12px;
        color:rgba(255,215,0,0.6);">• 0.001 USDC</span>`
  }
}

// ─── SAVE MATCH ───────────────────────────────────────
async function saveMatchResult(isWin) {
  if (!gameState.walletConnected||!gameState.walletAddress) return
  if (!/^0x[a-fA-F0-9]{40}$/.test(gameState.walletAddress)) return
  try {
    const supabase = await getSupabase()
    const { error } = await supabase.rpc('upsert_player_stats', {
      p_wallet: gameState.walletAddress,
      p_is_win: isWin,
      p_goals: gameState.playerGoals,
      p_saves: gameState.playerSaves
    })
    if (error) console.error('Save error:',error)
  } catch(err) {
    console.error('Save failed (non-fatal):',err)
  }
}

// ─── LEADERBOARD ─────────────────────────────────────
function loadLeaderboard() {
  const cacheAge = Date.now()-leaderboardCacheTime
  if (cachedLeaderboardData && cacheAge<CACHE_DURATION) {
    renderLeaderboard(cachedLeaderboardData); return
  }
  const content=document.getElementById('leaderboardContent')
  if (content) content.innerHTML='<div class="spinner"></div>'
  fetchAndRenderLeaderboard()
}

window.forceRefreshLeaderboard = async function() {
  cachedLeaderboardData=null; leaderboardCacheTime=0
  const c=document.getElementById('leaderboardContent')
  if (c) c.innerHTML='<div class="spinner"></div>'
  await fetchAndRenderLeaderboard()
}

async function fetchAndRenderLeaderboard() {
  try {
    const supabase=await getSupabase()
    const { data,error } = await supabase
      .from('player_profiles')
      .select('wallet_address,username,win_rate,' +
              'total_wins,total_matches')
      .gte('total_matches',3)
      .order('win_rate',{ascending:false})
      .order('total_wins',{ascending:false})
      .limit(20)
    if (error) throw error
    cachedLeaderboardData=data||[]
    leaderboardCacheTime=Date.now()
    renderLeaderboard(cachedLeaderboardData)
  } catch(err) {
    const c=document.getElementById('leaderboardContent')
    if (c) c.innerHTML=`<div class="error-text">
      Failed to load. Tap ↻ to retry.</div>`
    console.error('Leaderboard error:',err)
  }
}

function renderLeaderboard(data) {
  const content=document.getElementById('leaderboardContent')
  if (!content) return
  content.innerHTML=''
  if (!data||data.length===0) {
    content.innerHTML=`<div class="placeholder-wrap">
      <div class="placeholder-emoji">🏆</div>
      <div class="placeholder-title">No players yet</div>
      <div class="placeholder-sub">
        Play 3 matches to appear here</div></div>`
    updateMyRankBar(null,-1); return
  }
  const medals=['🥇','🥈','🥉']
  let myRank=-1
  data.forEach((row,i) => {
    const isMe=gameState.walletConnected&&
      row.wallet_address===gameState.walletAddress
    if (isMe) myRank=i+1
    const displayName=(row.username&&row.username.trim())
      ? row.username
      : row.wallet_address.slice(0,6)+'...'+
        row.wallet_address.slice(-4)
    const div=document.createElement('div')
    div.className='lb-row'+(isMe?' is-me':'')
    div.innerHTML=`
      <div class="lb-rank">
        ${i<3?medals[i]:
          '<span class="lb-rank-num">'+(i+1)+'</span>'}
      </div>
      <div class="lb-name">${displayName}
        ${isMe?'<span class="lb-you-tag"> (You)</span>':''}
      </div>
      <div class="lb-wr">${row.win_rate}%</div>
      <div class="lb-wins">${row.total_wins}W</div>
    `
    content.appendChild(div)
  })
  updateMyRankBar(data,myRank)
}

function updateMyRankBar(data, rank) {
  const bar=document.getElementById('myRankBar')
  if (!bar) return
  const username=gameState.username||
    (gameState.walletAddress
      ? gameState.walletAddress.slice(0,6)+'...'+
        gameState.walletAddress.slice(-4)
      : 'You')

  if (rank>0) {
    const my=data.find(r=>
      r.wallet_address===gameState.walletAddress)
    bar.innerHTML=`
      <div style="font-family:Rajdhani,sans-serif;
        font-size:26px;font-weight:700;color:#00d4ff;
        width:44px;text-align:center;">#${rank}</div>
      <div style="flex:1;">
        <div style="font-family:Rajdhani,sans-serif;
          font-size:16px;font-weight:700;color:white;">
          ${username}</div>
        <div style="font-family:Rajdhani,sans-serif;
          font-size:10px;color:#555;letter-spacing:1px;">
          YOUR RANK</div>
      </div>
      <div style="text-align:right;">
        <div style="font-family:Rajdhani,sans-serif;
          font-size:18px;font-weight:700;color:#00d4ff;">
          ${my?my.win_rate:0}%</div>
        <div style="font-family:Rajdhani,sans-serif;
          font-size:12px;color:#666;">
          ${my?my.total_wins:0} wins</div>
      </div>`
  } else {
    bar.innerHTML=`
      <div style="font-family:Rajdhani,sans-serif;
        font-size:20px;font-weight:700;color:#555;
        width:44px;text-align:center;">—</div>
      <div style="flex:1;">
        <div style="font-family:Rajdhani,sans-serif;
          font-size:16px;font-weight:700;color:#888;">
          ${username}</div>
        <div style="font-family:Rajdhani,sans-serif;
          font-size:10px;color:#555;letter-spacing:1px;">
          PLAY 3+ MATCHES TO RANK</div>
      </div>
      <div style="font-family:Rajdhani,sans-serif;
        font-size:12px;color:#555;">Keep playing!</div>`
  }
}
window.loadLeaderboard=loadLeaderboard

// ─── VISUAL EFFECTS ───────────────────────────────────
function showOutcomeText(text,color) {
  const game=document.getElementById('screen-game')
  if (!game) return
  const div=document.createElement('div')
  div.className='outcome-text'
  div.textContent=text; div.style.color=color
  div.style.textShadow=`0 0 20px ${color}`
  game.appendChild(div)
  setTimeout(()=>{ if(div.parentNode) div.remove() },1150)
}

function spawnConfetti() {
  const game=document.getElementById('screen-game')
  const net=document.getElementById('net')
  const app=document.getElementById('app')
  if (!game||!net||!app) return
  const nr=net.getBoundingClientRect()
  const ar=app.getBoundingClientRect()
  const cx=nr.left-ar.left+nr.width/2
  const cy=nr.top-ar.top+nr.height/2
  const clrs=['#ffd700','#00d4ff','#ff6b35','#00ff88','#ff3535']
  for (let i=0;i<22;i++) {
    const div=document.createElement('div')
    div.className='confetti-piece'
    const angle=Math.random()*Math.PI*2
    const dist=40+Math.random()*80
    div.style.background=clrs[Math.floor(Math.random()*5)]
    div.style.left=cx+'px'; div.style.top=cy+'px'
    div.style.setProperty('--dx',Math.cos(angle)*dist+'px')
    div.style.setProperty('--dy',
      (Math.sin(angle)*dist+50)+'px')
    game.appendChild(div)
    setTimeout(()=>{ if(div.parentNode) div.remove() },1150)
  }
}

function triggerNetRipple() {
  const r=document.getElementById('net-ripple')
  if (!r) return
  r.style.opacity='1'
  setTimeout(()=>{ r.style.opacity='0' },300)
}

function flashGoalBorder(color) {
  const g=document.getElementById('goal')
  if (!g) return
  g.style.outline=`3px solid ${color}`
  g.style.outlineOffset='2px'
  setTimeout(()=>{ g.style.outline='' },400)
}

function shakeScreen() {
  const g=document.getElementById('screen-game')
  if (!g) return
  g.style.animation='screenShake 0.4s ease'
  setTimeout(()=>{ g.style.animation='' },400)
}

function showRedOverlay() {
  const game=document.getElementById('screen-game')
  if (!game) return
  const div=document.createElement('div')
  div.style.cssText=`position:absolute;inset:0;
    background:rgba(255,0,0,0.13);
    z-index:50;pointer-events:none;`
  game.appendChild(div)
  setTimeout(()=>{ if(div.parentNode) div.remove() },400)
}

// ─── SHOW/HIDE HELPERS ────────────────────────────────
function showShootBtn() {
  const b=document.getElementById('shootBtn')
  if (b) b.style.display='flex'
}
function hideShootBtn() {
  const b=document.getElementById('shootBtn')
  if (b) b.style.display='none'
}
function showDiveBtns() {
  ;['diveLeft','diveCenter','diveRight'].forEach(id=>{
    const b=document.getElementById(id)
    if (b) b.style.display='block'
  })
}
function hideDiveBtns() {
  ;['diveLeft','diveCenter','diveRight'].forEach(id=>{
    const b=document.getElementById(id)
    if (b) b.style.display='none'
  })
}
function showAiPlayer() {
  const ai=document.getElementById('ai-player')
  if (!ai) return
  ai.style.display='flex'
  ai.style.animation='none'
  void ai.offsetWidth
  ai.style.animation='runUp 0.3s ease-in-out 3'
}
function hideAiPlayer() {
  const ai=document.getElementById('ai-player')
  if (ai) ai.style.display='none'
}

// ─── INIT ────────────────────────────────────────────
resetBall()
showScreen('connect')

// ─── CLEANUP ─────────────────────────────────────────
window.__cleanupGame = () => {
  clearAllIntervals()
  document.removeEventListener('mousemove', moveCursor)
  window.__gameState=null
  window.__onWalletStateChange=null
  window.__cleanupGame=null
}

} // END initGame()

═══════════════════════════════════════════════════════
SECTION 6 — TROPHY PAYMENT FILE
═══════════════════════════════════════════════════════

Create file: app/lib/trophy.ts

import {
  createWalletClient, custom,
  encodeFunctionData, parseAbi
} from 'viem'
import { base } from 'viem/chains'

const USDC = '0x833589fCD6eDb6E08f4c7C32D4f71b54bdA02913' as const
const DEV = '0x42adA0062FC76E56fC33709a2B03f9BddB55975F' as const
const AMOUNT = BigInt(1000) // 0.001 USDC (6 decimals)

const ABI = parseAbi([
  'function transfer(address to,uint256 amount) returns(bool)'
])

export async function sendUSDCPayment(
  from: string
): Promise<{
  success:boolean; txHash?:string;
  cancelled?:boolean; error?:string
}> {
  if (!window.ethereum)
    return { success:false, error:'No wallet' }
  try {
    const client = createWalletClient({
      account: from as `0x${string}`,
      chain: base,
      transport: custom(window.ethereum)
    })
    const data = encodeFunctionData({
      abi:ABI, functionName:'transfer',
      args:[DEV, AMOUNT]
    })
    const txHash = await client.sendTransaction({
      to:USDC, data, chain:base
    })
    return { success:true, txHash }
  } catch(err:any) {
    if (err?.code===4001||
        err?.message?.includes('rejected')||
        err?.message?.includes('denied'))
      return { success:false, cancelled:true }
    return { success:false, error:err?.message||'Failed' }
  }
}

═══════════════════════════════════════════════════════
SECTION 7 — MINI APP FILES
═══════════════════════════════════════════════════════

7.1 app/layout.tsx metadata section:

export const metadata = {
  title: 'Penalty Blitz',
  description: 'Penalty shootout game on Base',
  other: {
    'fc:miniapp': JSON.stringify({
      version:"1", name:"Penalty Blitz",
      iconUrl:"https://YOUR_VERCEL_URL/icon.png",
      splashImageUrl:"https://YOUR_VERCEL_URL/splash.png",
      splashBackgroundColor:"#1a1a2e",
      homeUrl:"https://YOUR_VERCEL_URL",
      buttonTitle:"⚽ Play Now"
    })
  }
}

7.2 public/.well-known/farcaster.json:

{
  "accountAssociation": {
    "header": "",
    "payload": "",
    "signature": ""
  },
  "miniapp": {
    "version": "1",
    "name": "Penalty Blitz",
    "subtitle": "Penalty Shootout on Base",
    "description": "Penalty shootout football game. Connect wallet, pick a name, score goals, climb the leaderboard.",
    "homeUrl": "https://YOUR_VERCEL_URL",
    "iconUrl": "https://YOUR_VERCEL_URL/icon.png",
    "splashImageUrl": "https://YOUR_VERCEL_URL/splash.png",
    "splashBackgroundColor": "#1a1a2e",
    "screenshotUrls": [
      "https://YOUR_VERCEL_URL/screenshot.png"
    ],
    "primaryCategory": "games",
    "tags": ["football","soccer","penalty","base","game"],
    "tagline": "Score. Save. Dominate.",
    "heroImageUrl": "https://YOUR_VERCEL_URL/icon.png",
    "ogTitle": "Penalty Blitz",
    "ogDescription": "Penalty shootout on Base blockchain",
    "ogImageUrl": "https://YOUR_VERCEL_URL/icon.png",
    "noindex": false
  }
}

7.3 Required images (save to /public):

icon.png — 300x300px:
  Background #1a1a2e, ⚽ 160px centered
  "BLITZ" below in #00d4ff Rajdhani bold 50px

splash.png — 200x200px:
  Background #1a1a2e, ⚽ 110px centered

screenshot.png — 1284x2778px:
  Background #1a1a2e
  "PENALTY BLITZ" large white centered
  "Score. Save. Dominate." cyan below

═══════════════════════════════════════════════════════
SECTION 8 — DEPLOYMENT
═══════════════════════════════════════════════════════

Step 1: Test locally
  npm run dev
  Open localhost:3000
  Confirm wallet connect screen appears first
  Connect wallet — confirm username screen appears
  Enter name — confirm main menu appears
  Play full match — confirm results appear
  Check Supabase — confirm row saved
  Open leaderboard — confirm data appears

Step 2: Push to GitHub
  git init
  git add .
  git commit -m "Penalty Blitz v1.0"
  Create repo at github.com
  git remote add origin YOUR_REPO_URL
  git push -u origin main

Step 3: Deploy on Vercel
  Go to vercel.com
  Add New Project → Import from GitHub
  Add environment variables:
    NEXT_PUBLIC_SUPABASE_URL
    NEXT_PUBLIC_SUPABASE_ANON_KEY
    NEXT_PUBLIC_ONCHAINKIT_API_KEY
  Click Deploy

Step 4: Update URLs
  Copy live Vercel URL
  Replace ALL YOUR_VERCEL_URL in:
    public/.well-known/farcaster.json
    app/layout.tsx metadata
  git add . && git commit -m "Live URLs"
  git push (auto-redeploys)

Step 5: Verify Farcaster
  Go to warpcast.com/~/developers
  Add domain, complete verification
  accountAssociation fills automatically

═══════════════════════════════════════════════════════
SECTION 9 — COMPLETE DEFINITION OF DONE
═══════════════════════════════════════════════════════

FLOW:
✅ App opens to wallet connect screen always
✅ Cannot reach any other screen without wallet
✅ Returning users with active session skip to menu
✅ New players see username setup exactly once
✅ Username saved — never asked again for that wallet
✅ Taken usernames rejected with clear message
✅ Main menu shows username + wallet in top bar
✅ Main menu shows match/win/rate stats after first game
✅ PLAY goes to difficulty, LEADERBOARD to leaderboard

GAME (DO NOT CHANGE THESE):
✅ Power bar oscillates and freezes on tap
✅ Aim cursor drags within goal boundaries only
✅ Touch drag does not scroll page
✅ Keeper dives without animation conflict
✅ GOAL/SAVED/MISS show correctly
✅ AI arrow swings at correct speed per difficulty
✅ 3 dive buttons cover all 3 arrow zones
✅ Hard mode feint is symmetric across all 3 zones
✅ 5 rounds complete in correct order
✅ Sudden death triggers on tie, capped at 10 rounds
✅ Draw result handled if sudden death exhausted
✅ gameState.busy prevents all double-tap issues

LEADERBOARD:
✅ Shows usernames not wallet addresses
✅ Falls back to short address if no username
✅ Your rank pinned at bottom of screen always
✅ Shows "PLAY 3+ MATCHES TO RANK" if unranked
✅ Auto-refreshes after every match silently
✅ 30 second cache prevents excessive fetches
✅ Manual refresh button works

STATS:
✅ Stats save after every match via atomic RPC
✅ No race conditions