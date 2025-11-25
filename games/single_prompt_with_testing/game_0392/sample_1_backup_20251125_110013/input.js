// input.js - Input handling

import { 
  gameState,
  KEY_LEFT,
  KEY_UP,
  KEY_RIGHT,
  KEY_DOWN,
  KEY_SPACE,
  KEY_SHIFT,
  KEY_Z,
  KEY_ENTER,
  KEY_ESC,
  KEY_R
} from './globals.js';

// Key state tracking
const keys = {};

export function setupInput(p) {
  p.keyPressed = function() {
    keys[p.keyCode] = true;
    
    // Log input
    if (p.logs && p.logs.inputs) {
      p.logs.inputs.push({
        input_type: 'keyPressed',
        data: { key: p.key, keyCode: p.keyCode },
        framecount: p.frameCount,
        timestamp: Date.now()
      });
    }
    
    // Handle phase controls
    if (p.keyCode === KEY_ENTER) {
      if (gameState.gamePhase === "START") {
        startGame(p);
      }
    }
    
    if (p.keyCode === KEY_ESC) {
      if (gameState.gamePhase === "PLAYING") {
        gameState.gamePhase = "PAUSED";
        if (p.logs && p.logs.game_info) {
          p.logs.game_info.push({
            data: { gamePhase: "PAUSED" },
            framecount: p.frameCount,
            timestamp: Date.now()
          });
        }
      } else if (gameState.gamePhase === "PAUSED") {
        gameState.gamePhase = "PLAYING";
        if (p.logs && p.logs.game_info) {
          p.logs.game_info.push({
            data: { gamePhase: "PLAYING" },
            framecount: p.frameCount,
            timestamp: Date.now()
          });
        }
      }
    }
    
    if (p.keyCode === KEY_R) {
      if (gameState.gamePhase === "GAME_OVER_WIN" || 
          gameState.gamePhase === "GAME_OVER_LOSE") {
        resetGame(p);
      }
    }
  };
  
  p.keyReleased = function() {
    keys[p.keyCode] = false;
    
    // Log input
    if (p.logs && p.logs.inputs) {
      p.logs.inputs.push({
        input_type: 'keyReleased',
        data: { key: p.key, keyCode: p.keyCode },
        framecount: p.frameCount,
        timestamp: Date.now()
      });
    }
  };
}

export function isKeyPressed(keyCode) {
  return keys[keyCode] === true;
}

export function handleInput(p) {
  if (!gameState.player) return;
  
  // Movement
  let dx = 0;
  let dy = 0;
  
  if (isKeyPressed(KEY_LEFT)) dx -= 1;
  if (isKeyPressed(KEY_RIGHT)) dx += 1;
  if (isKeyPressed(KEY_UP)) dy -= 1;
  if (isKeyPressed(KEY_DOWN)) dy += 1;
  
  // Normalize diagonal movement
  if (dx !== 0 && dy !== 0) {
    dx *= 0.707;
    dy *= 0.707;
  }
  
  if (dx !== 0 || dy !== 0) {
    gameState.player.move(dx, dy);
  }
  
  // Focus mode (slow movement)
  gameState.player.isFocused = isKeyPressed(KEY_SHIFT);
  
  // Shooting
  if (isKeyPressed(KEY_Z)) {
    gameState.player.shoot(p);
  }
  
  // Spell card
  if (keys[KEY_SPACE] && !keys.spaceProcessed) {
    gameState.player.useSpellCard(p);
    keys.spaceProcessed = true;
  }
  if (!keys[KEY_SPACE]) {
    keys.spaceProcessed = false;
  }
}

export function startGame(p) {
  gameState.gamePhase = "PLAYING";
  
  // Import necessary classes
  import('./entities.js').then(module => {
    const { Player } = module;
    
    // Create player
    gameState.player = new Player(
      (gameState.PLAY_AREA_LEFT + gameState.PLAY_AREA_RIGHT) / 2,
      gameState.PLAY_AREA_BOTTOM - 50
    );
  });
  
  if (p.logs && p.logs.game_info) {
    p.logs.game_info.push({
      data: { gamePhase: "PLAYING" },
      framecount: p.frameCount,
      timestamp: Date.now()
    });
  }
}

export function resetGame(p) {
  const { initializeGameState } = await import('./globals.js');
  initializeGameState();
  gameState.gamePhase = "START";
  
  if (p.logs && p.logs.game_info) {
    p.logs.game_info.push({
      data: { gamePhase: "START" },
      framecount: p.frameCount,
      timestamp: Date.now()
    });
  }
}