import { gameState, GAME_PHASES } from './globals.js';

// Track key states for smooth movement
const keyStates = {
  left: false,
  right: false
};

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
  if (gameState.gamePhase === GAME_PHASES.PLAYING && gameState.player && gameState.controlMode === 'HUMAN') {
    // Arrow Up - Jump
    if (keyCode === 38) {
      gameState.player.jump();
    }
    
    // Arrow Left - Track key state for smooth movement
    if (keyCode === 37) {
      keyStates.left = true;
    }
    
    // Arrow Right - Track key state for smooth movement
    if (keyCode === 39) {
      keyStates.right = true;
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
  
  // Release key states for smooth movement
  if (keyCode === 37) {
    keyStates.left = false;
  }
  if (keyCode === 39) {
    keyStates.right = false;
  }
}

export function handlePlayerMovement(p) {
  if (gameState.gamePhase !== GAME_PHASES.PLAYING || !gameState.player) return;

  if (gameState.controlMode === 'HUMAN') {
    // Human mode now uses smooth velocity-based movement
    if (keyStates.left && !keyStates.right) {
      gameState.player.moveLeft();
    } else if (keyStates.right && !keyStates.left) {
      gameState.player.moveRight();
    } else {
      gameState.player.stopMove();
    }
  } else {
    // Automated testing mode - keep velocity-based movement
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
  
  // Reset key states
  keyStates.left = false;
  keyStates.right = false;
  
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
  
  // Reset key states
  keyStates.left = false;
  keyStates.right = false;
  
  p.logs.game_info.push({
    event: 'reset_to_start',
    data: {},
    framecount: p.frameCount,
    timestamp: Date.now()
  });
}