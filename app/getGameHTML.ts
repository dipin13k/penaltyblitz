export function getGameHTML() {
  return `
<div id="app">

  <!--
  ════════════════════════════════
  SCREEN 1: WALLET CONNECT
  First screen. Cannot be skipped.
  ════════════════════════════════
  -->
  <div id="screen-connect" class="screen active">
    <div style="
      position:fixed;inset:0;
      background:#0d0d1a;
      display:flex;flex-direction:column;
      align-items:center;justify-content:center;
      color:white;font-family:sans-serif;
      padding:20px;text-align:center;
    ">
      <div style="font-size:48px;margin-bottom:16px">⚽</div>
      <div style="
        font-size:22px;font-weight:bold;
        color:#00ff88;margin-bottom:12px;
      ">Penalty Blitz</div>
      <div style="
        font-size:14px;color:#aaa;
        line-height:1.6;max-width:280px;
      ">
        Open this app inside Base App or Warpcast
        to play automatically.
      </div>
    </div>
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
          
          <!-- Keeper: placed INSIDE net -->
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
