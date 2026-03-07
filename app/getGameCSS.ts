export function getGameCSS() {
    return `

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

/* ── LIGHT MODE ── */
body.light-mode {
  background: #f0f2f5;
}
body.light-mode #app {
  background: linear-gradient(180deg,#e8eaf6 0%,#dde3f0 100%);
}
body.light-mode .menu-topbar,
body.light-mode .data-topbar {
  background: rgba(255,255,255,0.85);
}
body.light-mode .menu-topbar-left .topbar-dot { background: #00cc66; }
body.light-mode .topbar-username,
body.light-mode .topbar-address { color: #222; }
body.light-mode .menu-logo h1 { color: #111; text-shadow: 0 0 30px rgba(0,120,200,0.3); }
body.light-mode .menu-logo h1 span { color: #0077cc; }
body.light-mode .menu-logo p { color: #888; }
body.light-mode .menu-stat-num { color: #111; }
body.light-mode .menu-stat-lbl { color: #888; }
body.light-mode .menu-stat-divider { background: #ccc; }
body.light-mode .btn-secondary {
  background: #fff;
  border-color: #0077cc;
  color: #111;
}
body.light-mode .connect-card,
body.light-mode .username-card {
  background: #fff;
  border-color: #ddd;
}
body.light-mode .connect-card-title,
body.light-mode .username-title { color: #111; }
body.light-mode .connect-card-sub,
body.light-mode .username-sub { color: #888; }
body.light-mode .username-input {
  background: #f5f5f5;
  border-color: #ccc;
  color: #111;
}
body.light-mode #scoreBar { background: rgba(255,255,255,0.9); }
body.light-mode .score-label { color: #666; }
body.light-mode .score-num { color: #111; }
body.light-mode #net { background: #b8cce4; }
body.light-mode .results-card {
  background: #fff;
  box-shadow: 0 4px 24px rgba(0,0,0,0.1);
}
body.light-mode .stat-box { background: #f0f2f5; }
body.light-mode .stat-lbl { color: #888; }
body.light-mode .lb-content { background: transparent; }
body.light-mode .lb-row { background: #fff; }
body.light-mode .lb-name { color: #111; }
body.light-mode .my-rank-bar {
  background: linear-gradient(to top,#e8eaf6,rgba(232,234,246,0.95));
  border-color: #ccc;
}
body.light-mode .data-title { color: #111; }
body.light-mode .bottomNav-wrap {
  background: #fff;
  border-color: #ddd;
}
body.light-mode #bottomNav {
  background: #fff !important;
  border-color: #ddd !important;
}
body.light-mode #bottomNav button { color: #aaa !important; }
body.light-mode #bottomNav button[style*='#00ff88'] { color: #00aa55 !important; }
body.light-mode .diff-title { color: #111; }
body.light-mode #pitch { background: #3a9e5c; }

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
  height: 52px; z-index: 200;
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
  font-size:28px; color:#ff6b35; display:none;
  pointer-events:none; z-index:4;
  text-shadow:0 0 10px rgba(255,107,53,0.7);
}
#keeper {
  position:absolute;
  bottom: 2px;
  left: 50%;
  transform: translateX(-50%);
  z-index: 5; pointer-events:none;
}
#keeper-sway-wrapper {
  animation:keeperSway 1.6s ease-in-out infinite alternate;
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
  transform: scale(0.5);
  transform-origin: bottom center;
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
  position:absolute; bottom:24%; left:50%;
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
