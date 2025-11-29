// input.js - Input handling
import { gameState, PHASE_START, PHASE_PLAYING, PHASE_PAUSED, PHASE_GAME_OVER_WIN, 
         PHASE_GAME_OVER_LOSE, KEY_ENTER, KEY_ESC, KEY_R, KEY_SPACE, 
         KEY_LEFT, KEY_UP, KEY_RIGHT, KEY_DOWN, resetGameState } from './globals.js';
import { initGame } from './game_logic.js';
import { selectUpgrade } from './game_logic.js';

export function handleKeyPressed(p) {
  // Log input
  p.logs.inputs.push({
    input_type: 'keyPressed',
    data: { key: p.key, keyCode: p.keyCode },
    framecount: p.frameCount,
    timestamp: Date.now()
  });
  
  // Phase control keys
  if (p.keyCode === KEY_ENTER && gameState.gamePhase === PHASE_START) {
    resetGameState();
    initGame(p);
    gameState.gamePhase = PHASE_PLAYING;
    p.logs.game_info.push({
      data: { phase: PHASE_PLAYING },
      framecount: p.frameCount,
      timestamp: Date.now()
    });
    return;
  }
  
  if (p.keyCode === KEY_ESC && (gameState.gamePhase === PHASE_PLAYING || gameState.gamePhase === PHASE_PAUSED)) {
    if (!gameState.showUpgradeScreen) {
      gameState.gamePhase = gameState.gamePhase === PHASE_PLAYING ? PHASE_PAUSED : PHASE_PLAYING;
      p.logs.game_info.push({
        data: { phase: gameState.gamePhase },
        framecount: p.frameCount,
        timestamp: Date.now()
      });
    }
    return;
  }
  
  if (p.keyCode === KEY_R && (gameState.gamePhase === PHASE_GAME_OVER_WIN || gameState.gamePhase === PHASE_GAME_OVER_LOSE)) {
    resetGameState();
    gameState.gamePhase = PHASE_START;
    p.logs.game_info.push({
      data: { phase: PHASE_START },
      framecount: p.frameCount,
      timestamp: Date.now()
    });
    return;
  }
  
  // Gameplay keys
  if (gameState.gamePhase !== PHASE_PLAYING) return;
  
  // Upgrade selection
  if (gameState.showUpgradeScreen) {
    if (p.key === '1') selectUpgrade(0);
    else if (p.key === '2') selectUpgrade(1);
    else if (p.key === '3') selectUpgrade(2);
    return;
  }
  
  // Dash
  if (p.keyCode === KEY_SPACE && gameState.player) {
    const dx = gameState.player.vx;
    const dy = gameState.player.vy;
    gameState.player.startDash(dx, dy);
  }
}

export function processMovement(p) {
  if (gameState.gamePhase !== PHASE_PLAYING || !gameState.player || gameState.showUpgradeScreen) {
    return;
  }
  
  let vx = 0;
  let vy = 0;
  
  if (gameState.controlMode === "HUMAN") {
    if (p.keyIsDown(KEY_LEFT)) vx -= 1;
    if (p.keyIsDown(KEY_RIGHT)) vx += 1;
    if (p.keyIsDown(KEY_UP)) vy -= 1;
    if (p.keyIsDown(KEY_DOWN)) vy += 1;
  } else {
    // Automated testing control
    const action = window.get_automated_testing_action(gameState);
    if (action) {
      if (action.left) vx -= 1;
      if (action.right) vx += 1;
      if (action.up) vy -= 1;
      if (action.down) vy += 1;
      if (action.dash && gameState.player) {
        gameState.player.startDash(vx, vy);
      }
      if (action.upgrade !== undefined && gameState.showUpgradeScreen) {
        selectUpgrade(action.upgrade);
      }
    }
  }
  
  // Normalize diagonal movement
  if (vx !== 0 && vy !== 0) {
    const mag = Math.sqrt(2);
    vx /= mag;
    vy /= mag;
  }
  
  gameState.player.vx = vx;
  gameState.player.vy = vy;
}