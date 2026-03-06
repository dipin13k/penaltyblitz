export function getGameHTML() {
  return `
<div id="app">

  <!-- SCREEN 1: LOADING / WALLET CONNECT (shown by default until wallet connects) -->
  <div id="screen-connect" class="screen active">
    <div style="
      position:absolute;inset:0;
      background:#0d0d1a;
      display:flex;flex-direction:column;
      align-items:center;justify-content:center;
      color:white;font-family:sans-serif;
      padding:20px;text-align:center;
    ">
      <div style="font-size:64px;margin-bottom:20px">⚽</div>
      <div style="
        font-size:28px;font-weight:bold;
        color:#00ff88;margin-bottom:12px;
        letter-spacing:4px;
      ">PENALTY BLITZ</div>
      <div style="font-size:14px;color:#555;letter-spacing:2px;margin-bottom:32px;">Connecting wallet...</div>
      <div class="spinner" style="width:32px;height:32px;border-width:3px;"></div>
    </div>
  </div>

  <!-- SCREEN 2: USERNAME SETUP -->
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
        \u2022 3 to 16 characters<br>
        \u2022 Letters, numbers, underscores only<br>
        \u2022 This name shows on the leaderboard<br>
        \u2022 Cannot be changed later
      </div>
    </div>
    <div id="usernameError" class="username-error"></div>
    <button id="confirmUsernameBtn" onclick="confirmUsername()">
      LET'S PLAY \u2192
    </button>
  </div>

  <!-- SCREEN 3: MAIN MENU -->
  <div id="screen-menu" class="screen">
    <div class="menu-topbar">
      <div class="menu-topbar-left">
        <div class="topbar-dot"></div>
        <span class="topbar-username" id="topbarUsername"></span>
        <span class="topbar-address" id="topbarAddress"></span>
      </div>
      <button class="topbar-disconnect" onclick="handleDisconnect()">\u2715</button>
    </div>
    <div class="menu-logo">
      <h1>PENALTY<br><span>BLITZ</span></h1>
      <p>Score. Save. Dominate.</p>
    </div>
    <div id="menuStatsRow" class="menu-stats-row" style="display:none"></div>
    <div class="menu-btns">
      <button class="btn btn-primary" id="playBtn" onclick="showScreen('difficulty')">
        \u25b6&nbsp; PLAY
      </button>
      <button class="btn btn-secondary" onclick="showScreen('leaderboard')">
        \ud83c\udfc6&nbsp; LEADERBOARD
      </button>
    </div>
    <div class="powered-by">Powered by <span>\u2b21 Base</span></div>
  </div>

  <!-- SCREEN 4: DIFFICULTY SELECT -->
  <div id="screen-difficulty" class="screen">
    <button class="back-btn" onclick="showScreen('menu')">\u2190 Back</button>
    <div class="diff-title">SELECT DIFFICULTY</div>
    <div class="diff-cards">
      <div class="diff-card easy" onclick="startGame('easy')">
        <div class="diff-emoji">\ud83d\ude0a</div>
        <div class="diff-info">
          <h3>AMATEUR</h3>
          <p>Relaxed keeper &nbsp;\u2022&nbsp; Slow arrow</p>
        </div>
        <div class="diff-accent"></div>
      </div>
      <div class="diff-card medium" onclick="startGame('medium')">
        <div class="diff-badge">\u2605 BEST</div>
        <div class="diff-emoji">\ud83d\ude24</div>
        <div class="diff-info">
          <h3>SEMI-PRO</h3>
          <p>Decent keeper &nbsp;\u2022&nbsp; Medium arrow</p>
        </div>
        <div class="diff-accent"></div>
      </div>
      <div class="diff-card hard" onclick="startGame('hard')">
        <div class="diff-emoji">\ud83d\ude08</div>
        <div class="diff-info">
          <h3>WORLD CLASS</h3>
          <p>Sharp keeper &nbsp;\u2022&nbsp; Fast arrow</p>
        </div>
        <div class="diff-accent"></div>
      </div>
    </div>
  </div>

  <!-- SCREEN 5: GAME SCREEN -->
  <div id="screen-game" class="screen">
    <div id="scoreBar">
      <div class="score-side">
        <div class="score-dot player-dot"></div>
        <div class="score-label">YOU</div>
        <div class="score-num" id="playerScoreEl">0</div>
      </div>
      <div id="turnIndicator">YOUR TURN \u26bd</div>
      <div class="score-side">
        <div class="score-num" id="aiScoreEl">0</div>
        <div class="score-label">AI</div>
        <div class="score-dot ai-dot"></div>
      </div>
    </div>
    <div id="crowdLeft" class="crowd-strip left"></div>
    <div id="crowdRight" class="crowd-strip right"></div>
    <div id="goal-container">
      <div id="goal">
        <div id="post-left"></div>
        <div id="post-right"></div>
        <div id="crossbar"></div>
        <div id="net">
          <div id="net-ripple"></div>
          <div id="aimCursor"></div>
          <div id="swingArrow">\u27a4</div>
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
    <div id="ball">\u26bd</div>
    <div id="pitch">
      <div id="penalty-arc"></div>
      <div id="penalty-spot"></div>
    </div>
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
    <button id="shootBtn" onclick="handleShoot()">
      <span>\u26bd</span>
      <span>SHOOT</span>
    </button>
    <button id="diveLeft" onclick="handleDive('left')">\u2190 LEFT</button>
    <button id="diveCenter" onclick="handleDive('center')">\u2191 CENTER</button>
    <button id="diveRight" onclick="handleDive('right')">RIGHT \u2192</button>
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
      <h2>\u26a1 SUDDEN DEATH \u26a1</h2>
    </div>
  </div>

  <!-- SCREEN 6: RESULTS -->
  <div id="screen-results" class="screen">
    <div class="results-card">
      <div id="resultEmoji" class="result-emoji">\ud83c\udfc6</div>
      <div id="resultTitle" class="result-title">VICTORY!</div>
      <div id="resultScore" class="result-score">0 \u2014 0</div>
      <div class="score-labels-row">
        <span>YOU</span><span>AI</span>
      </div>
      <div class="stats-row">
        <div class="stat-box">
          <div id="statGoals" class="stat-num" style="color:#00d4ff">0</div>
          <div class="stat-lbl">GOALS</div>
        </div>
        <div class="stat-box">
          <div id="statSaves" class="stat-num" style="color:#00ff88">0</div>
          <div class="stat-lbl">SAVES</div>
        </div>
      </div>
      <div class="results-btns" id="resultsBtns">
        <button class="btn btn-primary" onclick="onPlayAgain()">\u25b6 PLAY AGAIN</button>
        <button class="btn btn-secondary" onclick="onMainMenu()">MAIN MENU</button>
      </div>
    </div>
  </div>

  <!-- SCREEN 7: LEADERBOARD -->
  <div id="screen-leaderboard" class="screen">
    <div class="data-topbar">
      <button class="back-btn-inline" onclick="showScreen('menu')">\u2190 Back</button>
      <div class="data-title">LEADERBOARD</div>
      <button class="refresh-btn" onclick="forceRefreshLeaderboard()">\u21bb</button>
    </div>
    <div id="leaderboardContent" class="lb-content"></div>
    <div id="myRankBar" class="my-rank-bar"></div>
  </div>

</div>
` }
