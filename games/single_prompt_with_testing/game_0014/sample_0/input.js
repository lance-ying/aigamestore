// input.js
import { 
  gameState, 
  PHASE_START, PHASE_PLAYING, PHASE_PAUSED, PHASE_GAME_OVER_WIN, PHASE_GAME_OVER_LOSE,
  KEY_ENTER, KEY_ESC, KEY_R, KEY_SPACE, KEY_SHIFT, KEY_Z,
  KEY_LEFT, KEY_UP, KEY_RIGHT, KEY_DOWN
} from './globals.js';
import { handleNPCInteraction, handlePortalEntry } from './collision.js';

export function handleKeyPressed(p) {
  const key = p.key;
  const keyCode = p.keyCode;

  // Log input
  p.logs.inputs.push({
    input_type: "keyPressed",
    data: { key: key, keyCode: keyCode },
    framecount: p.frameCount,
    timestamp: Date.now()
  });

  // Phase transitions
  if (keyCode === KEY_ENTER && gameState.gamePhase === PHASE_START) {
    startGame(p);
    return;
  }

  if (keyCode === KEY_ESC && (gameState.gamePhase === PHASE_PLAYING || gameState.gamePhase === PHASE_PAUSED)) {
    togglePause(p);
    return;
  }

  if (keyCode === KEY_R && (gameState.gamePhase === PHASE_GAME_OVER_WIN || gameState.gamePhase === PHASE_GAME_OVER_LOSE)) {
    restartGame(p);
    return;
  }

  // Gameplay inputs
  if (gameState.gamePhase === PHASE_PLAYING) {
    if (keyCode === KEY_SPACE) {
      handleNPCInteraction(p);
      handlePortalEntry(p);
    }

    if (keyCode === KEY_Z) {
      if (gameState.player.energy > 20) {
        gameState.player.isShielded = true;
      }
    }
  }
}

export function handleKeyReleased(p) {
  const keyCode = p.keyCode;

  // Log input
  p.logs.inputs.push({
    input_type: "keyReleased",
    data: { key: p.key, keyCode: keyCode },
    framecount: p.frameCount,
    timestamp: Date.now()
  });

  if (gameState.gamePhase === PHASE_PLAYING) {
    if (keyCode === KEY_Z) {
      gameState.player.isShielded = false;
    }
  }
}

export function handleMovement(p) {
  if (gameState.gamePhase !== PHASE_PLAYING) return;

  let dx = 0;
  let dy = 0;

  if (p.keyIsDown(KEY_LEFT)) dx -= 1;
  if (p.keyIsDown(KEY_RIGHT)) dx += 1;
  if (p.keyIsDown(KEY_UP)) dy -= 1;
  if (p.keyIsDown(KEY_DOWN)) dy += 1;

  gameState.player.isSprinting = p.keyIsDown(KEY_SHIFT);
  gameState.player.move(dx, dy);
}

function startGame(p) {
  gameState.gamePhase = PHASE_PLAYING;
  p.logs.game_info.push({
    data: { phase: PHASE_PLAYING },
    framecount: p.frameCount,
    timestamp: Date.now()
  });
  p.loop();
}

function togglePause(p) {
  if (gameState.gamePhase === PHASE_PLAYING) {
    gameState.gamePhase = PHASE_PAUSED;
    p.logs.game_info.push({
      data: { phase: PHASE_PAUSED },
      framecount: p.frameCount,
      timestamp: Date.now()
    });
    p.noLoop();
  } else if (gameState.gamePhase === PHASE_PAUSED) {
    gameState.gamePhase = PHASE_PLAYING;
    p.logs.game_info.push({
      data: { phase: PHASE_PLAYING },
      framecount: p.frameCount,
      timestamp: Date.now()
    });
    p.loop();
  }
}

function restartGame(p) {
  gameState.gamePhase = PHASE_START;
  p.logs.game_info.push({
    data: { phase: PHASE_START },
    framecount: p.frameCount,
    timestamp: Date.now()
  });
  p.loop();
}