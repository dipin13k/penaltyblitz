export function getGameHTML() {
  return `
<div id="app">

  <!-- SCREEN 1: CONNECT (hidden, only shown if wallet truly disconnects) -->
  <div id="screen-connect" class="screen">
    <div style="position:absolute;inset:0;background:#0d0d1a;display:flex;flex-direction:column;align-items:center;justify-content:center;color:white;font-family:sans-serif;padding:20px;text-align:center;">
      <div style="font-size:64px;margin-bottom:20px">&#x26BD;</div>
      <div style="font-size:28px;font-weight:bold;color:#00ff88;margin-bottom:12px;letter-spacing:4px;">PENALTY BLITZ</div>
      <div class="spinner" style="width:32px;height:32px;border-width:3px;"></div>
    </div>
  </div>

  <!-- SCREEN 2: MAIN MENU (shown by default on open) -->
  <div id="screen-menu" class="screen active">
    <div class="menu-topbar">
      <div class="menu-topbar-left">
        <div class="topbar-dot"></div>
        <span class="topbar-username" id="topbarUsername"></span>
      </div>
      <button class="topbar-disconnect" onclick="handleDisconnect()">&#x2715;</button>
    </div>
    <div class="menu-logo">
      <h1>PENALTY<br><span>BLITZ</span></h1>
      <p>Score. Save. Dominate.</p>
    </div>
    <div id="menuStatsRow" class="menu-stats-row" style="display:none"></div>
    <div class="menu-btns">
      <button class="btn btn-primary" id="playBtn" onclick="showScreen('difficulty')">&#x25B6;&nbsp; PLAY</button>
      <button class="btn btn-secondary" onclick="showScreen('leaderboard')">&#x1F3C6;&nbsp; LEADERBOARD</button>
    </div>
    <div class="powered-by">Powered by <span>&#x2B21; Base</span></div>
  </div>

  <!-- SCREEN 3: DIFFICULTY SELECT -->
  <div id="screen-difficulty" class="screen">
    <button class="back-btn" onclick="showScreen('menu')">&#x2190; Back</button>
    <div class="diff-title">SELECT DIFFICULTY</div>
    <div class="diff-cards">
      <div class="diff-card easy" onclick="startGame('easy')">
        <div class="diff-emoji">&#x1F60A;</div>
        <div class="diff-info"><h3>AMATEUR</h3><p>Relaxed keeper &nbsp;&#x2022;&nbsp; Slow arrow</p></div>
        <div class="diff-accent"></div>
      </div>
      <div class="diff-card medium" onclick="startGame('medium')">
        <div class="diff-badge">&#x2605; BEST</div>
        <div class="diff-emoji">&#x1F624;</div>
        <div class="diff-info"><h3>SEMI-PRO</h3><p>Decent keeper &nbsp;&#x2022;&nbsp; Medium arrow</p></div>
        <div class="diff-accent"></div>
      </div>
      <div class="diff-card hard" onclick="startGame('hard')">
        <div class="diff-emoji">&#x1F608;</div>
        <div class="diff-info"><h3>WORLD CLASS</h3><p>Sharp keeper &nbsp;&#x2022;&nbsp; Fast arrow</p></div>
        <div class="diff-accent"></div>
      </div>
    </div>
  </div>

  <!-- SCREEN 4: GAME SCREEN -->
  <div id="screen-game" class="screen">
    <div id="scoreBar">
      <div class="score-side">
        <div class="score-dot player-dot"></div>
        <div class="score-label">YOU</div>
        <div class="score-num" id="playerScoreEl">0</div>
      </div>
      <div id="turnIndicator">YOUR TURN &#x26BD;</div>
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
          <div id="swingArrow">&#x27A4;</div>
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
          <div class="a-head"><div class="a-eye-l"></div><div class="a-eye-r"></div></div>
          <div class="a-jersey">9</div>
          <div class="a-shorts"></div>
          <div class="a-legs-row"><div class="a-leg"></div><div class="a-leg"></div></div>
          <div class="a-boots-row"><div class="a-boot"></div><div class="a-boot"></div></div>
        </div>
      </div>
    </div>
    <div id="ball">&#x26BD;</div>
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
    <button id="shootBtn" onclick="handleShoot()"><span>&#x26BD;</span><span>SHOOT</span></button>
    <button id="diveLeft" onclick="handleDive('left')">&#x2190; LEFT</button>
    <button id="diveCenter" onclick="handleDive('center')">&#x2191; CENTER</button>
    <button id="diveRight" onclick="handleDive('right')">RIGHT &#x2192;</button>
    <div id="roundPopup"><div class="popup-card"><h2 id="roundText">ROUND 1</h2><p id="roundSub">of 5</p></div></div>
    <div id="countdownOverlay"><div id="countNum">3</div></div>
    <div id="betweenStrip"><h3 id="betweenText"></h3></div>
    <div id="suddenDeathOverlay"><h2>&#x26A1; SUDDEN DEATH &#x26A1;</h2></div>
  </div>

  <!-- SCREEN 5: RESULTS -->
  <div id="screen-results" class="screen">
    <div class="results-card">
      <div id="resultEmoji" class="result-emoji">&#x1F3C6;</div>
      <div id="resultTitle" class="result-title">VICTORY!</div>
      <div id="resultScore" class="result-score">0 &#x2014; 0</div>
      <div class="score-labels-row"><span>YOU</span><span>AI</span></div>
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
        <button class="btn btn-primary" onclick="onPlayAgain()">&#x25B6; PLAY AGAIN</button>
        <button class="btn btn-secondary" onclick="onMainMenu()">MAIN MENU</button>
      </div>
    </div>
  </div>

  <!-- SCREEN 6: LEADERBOARD -->
  <div id="screen-leaderboard" class="screen">
    <div class="data-topbar">
      <button class="back-btn-inline" onclick="showScreen('menu')">&#x2190; Back</button>
      <div class="data-title">LEADERBOARD</div>
      <button class="refresh-btn" onclick="forceRefreshLeaderboard()">&#x21BB;</button>
    </div>
    <div id="leaderboardContent" class="lb-content"></div>
    <div id="myRankBar" class="my-rank-bar"></div>
  </div>

</div>
` }
