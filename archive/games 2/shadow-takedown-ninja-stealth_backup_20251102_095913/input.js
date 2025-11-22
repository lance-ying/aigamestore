// input.js - Input handling

import { gameState, GAME_PHASES, CONTROL_MODES, CANVAS_WIDTH, CANVAS_HEIGHT } from './globals.js';
import { loadLevel } from './levels.js';

export function handleInput(p) {
  if (gameState.gamePhase !== GAME_PHASES.PLAYING) {
    if (gameState.player) {
      gameState.player.setVelocity(0, 0);
    }
    return;
  }

  let vx = 0;
  let vy = 0;

  if (gameState.controlMode === CONTROL_MODES.HUMAN) {
    // Human mode uses discrete tap-based movement
    // No continuous movement from held keys
    vx = 0;
    vy = 0;
  } else {
    // Automated testing - keep continuous movement for test modes
    const action = getTestAction(p);
    if (action) {
      if (action.move) {
        vx = action.move.x * gameState.player.speed;
        vy = action.move.y * gameState.player.speed;
      }
      if (action.space) {
        handleSpaceAction(p);
      }
    }
  }

  gameState.player.setVelocity(vx, vy);
}

function getTestAction(p) {
  const mode = gameState.controlMode;
  const frame = p.frameCount;

  if (mode === CONTROL_MODES.TEST_1) {
    // Basic movement test
    if (frame < 120) return { move: { x: 1, y: 0 } };
    if (frame < 240) return { move: { x: 0, y: 1 } };
    if (frame < 360) return { move: { x: -1, y: 0 } };
    return { move: { x: 0, y: -1 } };
  } else if (mode === CONTROL_MODES.TEST_2) {
    // Win test for level 1
    const player = gameState.player;
    const targets = gameState.primaryTargets.filter(t => !t.eliminated);
    
    if (targets.length > 0) {
      const target = targets[0];
      const dx = target.x - player.x;
      const dy = target.y - player.y;
      const dist = p.dist(player.x, player.y, target.x, target.y);
      
      if (dist < 35) {
        return { space: true };
      } else {
        const angle = p.atan2(dy, dx);
        return { move: { x: p.cos(angle), y: p.sin(angle) } };
      }
    }
  }

  return null;
}

function movePlayerDiscrete(p, dx, dy) {
  if (!gameState.player) return;
  
  const player = gameState.player;
  const oldX = player.x;
  const oldY = player.y;
  
  // Try to move
  player.x += dx;
  player.y += dy;
  
  // Check collisions
  let collided = false;
  for (let wall of gameState.walls) {
    if (player.collidesWithWall(wall)) {
      collided = true;
      break;
    }
  }
  
  // If collision, revert
  if (collided) {
    player.x = oldX;
    player.y = oldY;
  }
  
  // Keep in bounds
  player.x = p.constrain(player.x, player.size / 2, CANVAS_WIDTH - player.size / 2);
  player.y = p.constrain(player.y, player.size / 2, CANVAS_HEIGHT - player.size / 2);
  
  // Update direction based on movement
  if (dx !== 0 || dy !== 0) {
    player.direction = p.atan2(dy, dx);
  }
  
  // Log the movement
  p.logs.inputs.push({
    input_type: 'discreteMove',
    data: { dx, dy, finalX: player.x, finalY: player.y },
    framecount: p.frameCount,
    timestamp: Date.now()
  });
}

export function handleKeyPressed(p) {
  // Log input
  p.logs.inputs.push({
    input_type: 'keyPressed',
    data: { key: p.key, keyCode: p.keyCode },
    framecount: p.frameCount,
    timestamp: Date.now()
  });

  // Arrow keys - discrete tap-based movement (HUMAN mode only)
  if (gameState.gamePhase === GAME_PHASES.PLAYING && gameState.controlMode === CONTROL_MODES.HUMAN) {
    if (p.keyCode === 37) { // LEFT
      movePlayerDiscrete(p, -25, 0);
      return;
    } else if (p.keyCode === 39) { // RIGHT
      movePlayerDiscrete(p, 25, 0);
      return;
    } else if (p.keyCode === 38) { // UP
      movePlayerDiscrete(p, 0, -25);
      return;
    } else if (p.keyCode === 40) { // DOWN
      movePlayerDiscrete(p, 0, 25);
      return;
    }
  }

  // ENTER - Start game
  if (p.keyCode === 13) {
    if (gameState.gamePhase === GAME_PHASES.START) {
      startGame(p);
    } else if (gameState.gamePhase === GAME_PHASES.LEVEL_COMPLETE) {
      nextLevel(p);
    }
  }

  // ESC - Pause/Unpause
  if (p.keyCode === 27) {
    if (gameState.gamePhase === GAME_PHASES.PLAYING) {
      gameState.gamePhase = GAME_PHASES.PAUSED;
      p.logs.game_info.push({
        data: { gamePhase: GAME_PHASES.PAUSED },
        framecount: p.frameCount,
        timestamp: Date.now()
      });
    } else if (gameState.gamePhase === GAME_PHASES.PAUSED) {
      gameState.gamePhase = GAME_PHASES.PLAYING;
      p.logs.game_info.push({
        data: { gamePhase: GAME_PHASES.PLAYING },
        framecount: p.frameCount,
        timestamp: Date.now()
      });
    }
  }

  // R - Restart
  if (p.keyCode === 82) {
    if (gameState.gamePhase === GAME_PHASES.GAME_OVER_WIN ||
        gameState.gamePhase === GAME_PHASES.GAME_OVER_LOSE) {
      restartGame(p);
    }
  }

  // SPACE - Context action (single tap)
  if (p.keyCode === 32 && gameState.gamePhase === GAME_PHASES.PLAYING) {
    handleSpaceAction(p);
  }
}

function handleSpaceAction(p) {
  const player = gameState.player;
  
  // Try takedown first
  if (player.attemptTakedown(gameState.enemies)) {
    return;
  }
  
  // Try vent use
  if (player.attemptVentUse(gameState.vents)) {
    return;
  }
  
  // Try barrel detonation
  if (player.attemptBarrelDetonate(gameState.barrels, gameState.enemies)) {
    return;
  }
}

function startGame(p) {
  gameState.gamePhase = GAME_PHASES.PLAYING;
  gameState.currentLevel = 1;
  gameState.score = 0;
  
  loadLevel(p, gameState.currentLevel);
  
  p.logs.game_info.push({
    data: { gamePhase: GAME_PHASES.PLAYING, level: gameState.currentLevel },
    framecount: p.frameCount,
    timestamp: Date.now()
  });
}

function nextLevel(p) {
  gameState.currentLevel++;
  
  if (gameState.currentLevel > gameState.maxLevel) {
    gameState.gamePhase = GAME_PHASES.GAME_OVER_WIN;
    p.logs.game_info.push({
      data: { gamePhase: GAME_PHASES.GAME_OVER_WIN, finalScore: gameState.score },
      framecount: p.frameCount,
      timestamp: Date.now()
    });
  } else {
    gameState.gamePhase = GAME_PHASES.PLAYING;
    
    loadLevel(p, gameState.currentLevel);
    
    p.logs.game_info.push({
      data: { gamePhase: GAME_PHASES.PLAYING, level: gameState.currentLevel },
      framecount: p.frameCount,
      timestamp: Date.now()
    });
  }
}

function restartGame(p) {
  gameState.gamePhase = GAME_PHASES.START;
  gameState.currentLevel = 1;
  gameState.score = 0;
  
  p.logs.game_info.push({
    data: { gamePhase: GAME_PHASES.START },
    framecount: p.frameCount,
    timestamp: Date.now()
  });
}