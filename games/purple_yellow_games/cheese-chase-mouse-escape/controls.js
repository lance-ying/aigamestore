import { gameState, GAME_PHASES } from './globals.js';

export function handleKeyPressed(p, key, keyCode) {
  // Log input
  p.logs.inputs.push({
    input_type: 'keyPressed',
    data: { key, keyCode },
    framecount: p.frameCount,
    timestamp: Date.now()
  });

  // ENTER - Start game
  if (keyCode === 13) {
    if (gameState.gamePhase === GAME_PHASES.START) {
      startGame(p);
    }
  }

  // ESC - Pause/Unpause
  if (keyCode === 27) {
    if (gameState.gamePhase === GAME_PHASES.PLAYING) {
      gameState.gamePhase = GAME_PHASES.PAUSED;
      p.logs.game_info.push({
        event: 'game_paused',
        data: {},
        framecount: p.frameCount,
        timestamp: Date.now()
      });
    } else if (gameState.gamePhase === GAME_PHASES.PAUSED) {
      gameState.gamePhase = GAME_PHASES.PLAYING;
      p.logs.game_info.push({
        event: 'game_resumed',
        data: {},
        framecount: p.frameCount,
        timestamp: Date.now()
      });
    }
  }

  // R - Restart
  if (keyCode === 82) {
    if (gameState.gamePhase === GAME_PHASES.GAME_OVER_WIN || 
        gameState.gamePhase === GAME_PHASES.GAME_OVER_LOSE ||
        gameState.gamePhase === GAME_PHASES.PAUSED) {
      resetToStart(p);
    }
  }

  // Gameplay controls
  if (gameState.gamePhase === GAME_PHASES.PLAYING && gameState.player) {
    if (keyCode === 38) { // Arrow Up
      gameState.player.jump();
    }
  }
}

export function handleKeyReleased(p, key, keyCode) {
  // Log input
  p.logs.inputs.push({
    input_type: 'keyReleased',
    data: { key, keyCode },
    framecount: p.frameCount,
    timestamp: Date.now()
  });
}

export function handlePlayerMovement(p) {
  if (gameState.gamePhase !== GAME_PHASES.PLAYING || !gameState.player) return;

  if (gameState.controlMode === 'HUMAN') {
    if (p.keyIsDown(37)) { // Arrow Left
      gameState.player.moveLeft();
    } else if (p.keyIsDown(39)) { // Arrow Right
      gameState.player.moveRight();
    } else {
      gameState.player.stopMove();
    }
  } else {
    // Automated testing mode
    handleAutomatedControls(p);
  }
}

function handleAutomatedControls(p) {
  // Simple AI for testing
  if (!gameState.player) return;

  const player = gameState.player;
  
  if (gameState.controlMode === 'TEST_1') {
    // Basic movement test - just move right
    player.moveRight();
    if (p.frameCount % 60 === 0) {
      player.jump();
    }
  } else if (gameState.controlMode === 'TEST_2') {
    // More advanced - try to collect cheese
    const cheeses = gameState.entities.filter(e => e.type === 'cheese' && !e.collected);
    if (cheeses.length > 0) {
      const targetCheese = cheeses[0];
      if (player.x < targetCheese.x - 10) {
        player.moveRight();
      } else if (player.x > targetCheese.x + 10) {
        player.moveLeft();
      } else {
        player.stopMove();
      }
      
      // Jump if cheese is above
      if (targetCheese.y < player.y - 30 && player.onGround) {
        player.jump();
      }
    } else {
      // Go to mouse hole
      const mouseHole = gameState.entities.find(e => e.type === 'mousehole');
      if (mouseHole) {
        if (player.x < mouseHole.x - 10) {
          player.moveRight();
        } else if (player.x > mouseHole.x + 10) {
          player.moveLeft();
        } else {
          player.stopMove();
        }
      }
    }
  }
}

export function startGame(p) {
  gameState.gamePhase = GAME_PHASES.PLAYING;
  gameState.level = 1;
  gameState.score = 0;
  gameState.lives = 3;
  
  p.logs.game_info.push({
    event: 'game_started',
    data: {},
    framecount: p.frameCount,
    timestamp: Date.now()
  });
  
  // Level will be loaded in the main update loop
}

export function resetToStart(p) {
  gameState.gamePhase = GAME_PHASES.START;
  gameState.level = 1;
  gameState.score = 0;
  gameState.lives = 3;
  gameState.entities = [];
  gameState.player = null;
  gameState.cheeseCollected = 0;
  gameState.totalCheese = 0;
  gameState.mouseHoleActive = false;
  gameState.invulnerable = false;
  gameState.invulnerableTimer = 0;
  gameState.levelTransitionTimer = 0;
  
  p.logs.game_info.push({
    event: 'reset_to_start',
    data: {},
    framecount: p.frameCount,
    timestamp: Date.now()
  });
}