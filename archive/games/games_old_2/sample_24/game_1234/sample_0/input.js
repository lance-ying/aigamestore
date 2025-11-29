// input.js - Input handling and automated testing

import { GAME_PHASES, gameState } from './globals.js';

export function handleKeyPressed(p, key, keyCode) {
  // Log input
  if (p.logs && p.logs.inputs) {
    p.logs.inputs.push({
      input_type: 'keyPressed',
      data: { key, keyCode },
      framecount: p.frameCount,
      timestamp: Date.now()
    });
  }

  // Phase transitions
  if (keyCode === 13) { // ENTER
    if (gameState.gamePhase === GAME_PHASES.START) {
      startGame(p);
    }
    return;
  }

  if (keyCode === 27) { // ESC
    if (gameState.gamePhase === GAME_PHASES.PLAYING) {
      pauseGame(p);
    } else if (gameState.gamePhase === GAME_PHASES.PAUSED) {
      resumeGame(p);
    }
    return;
  }

  if (keyCode === 82) { // R
    if (gameState.gamePhase === GAME_PHASES.GAME_OVER || 
        gameState.gamePhase === GAME_PHASES.GAME_WON ||
        gameState.gamePhase === GAME_PHASES.PAUSED) {
      restartGame(p);
    }
    return;
  }

  // Gameplay controls
  if (gameState.gamePhase === GAME_PHASES.PLAYING && gameState.player) {
    if (keyCode === 38 || keyCode === 32) { // UP or SPACE
      gameState.player.jump();
    } else if (keyCode === 40) { // DOWN
      gameState.player.slide();
    } else if (keyCode === 37) { // LEFT
      gameState.player.turnLeft();
    } else if (keyCode === 39) { // RIGHT
      gameState.player.turnRight();
    }
  }
}

function startGame(p) {
  gameState.gamePhase = GAME_PHASES.PLAYING;
  
  if (p.logs && p.logs.game_info) {
    p.logs.game_info.push({
      data: { phase: gameState.gamePhase },
      framecount: p.frameCount,
      timestamp: Date.now()
    });
  }
}

function pauseGame(p) {
  gameState.gamePhase = GAME_PHASES.PAUSED;
  
  if (p.logs && p.logs.game_info) {
    p.logs.game_info.push({
      data: { phase: gameState.gamePhase },
      framecount: p.frameCount,
      timestamp: Date.now()
    });
  }
}

function resumeGame(p) {
  gameState.gamePhase = GAME_PHASES.PLAYING;
  
  if (p.logs && p.logs.game_info) {
    p.logs.game_info.push({
      data: { phase: gameState.gamePhase },
      framecount: p.frameCount,
      timestamp: Date.now()
    });
  }
}

function restartGame(p) {
  gameState.gamePhase = GAME_PHASES.START;
  gameState.score = 0;
  gameState.coinCount = 0;
  gameState.currentLevel = 1;
  gameState.distanceTraveled = 0;
  gameState.distanceTraveledInLevel = 0;
  gameState.obstacles = [];
  gameState.coins = [];
  gameState.cameraZ = 0;
  gameState.player = null;
  
  if (p.logs && p.logs.game_info) {
    p.logs.game_info.push({
      data: { phase: gameState.gamePhase, action: 'restart' },
      framecount: p.frameCount,
      timestamp: Date.now()
    });
  }
}

export class AutomatedController {
  constructor() {
    this.actionQueue = [];
    this.frameCounter = 0;
  }

  getAction(p) {
    this.frameCounter++;
    
    if (gameState.controlMode === 'TEST_1') {
      return this.basicTest(p);
    } else if (gameState.controlMode === 'TEST_2') {
      return this.winTest(p);
    }
    
    return null;
  }

  basicTest(p) {
    const phase = gameState.gamePhase;
    
    if (phase === GAME_PHASES.START && this.frameCounter > 60) {
      return { keyCode: 13 }; // ENTER
    }
    
    if (phase === GAME_PHASES.PLAYING && gameState.player) {
      // Simple pattern: jump periodically, slide occasionally
      if (this.frameCounter % 80 === 0) {
        return { keyCode: 38 }; // JUMP
      }
      if (this.frameCounter % 150 === 0) {
        return { keyCode: 40 }; // SLIDE
      }
      if (this.frameCounter % 200 === 0) {
        return { keyCode: 37 }; // TURN LEFT
      }
      if (this.frameCounter % 250 === 0) {
        return { keyCode: 39 }; // TURN RIGHT
      }
    }
    
    if (phase === GAME_PHASES.GAME_OVER && this.frameCounter % 120 === 0) {
      return { keyCode: 82 }; // R
    }
    
    return null;
  }

  winTest(p) {
    const phase = gameState.gamePhase;
    
    if (phase === GAME_PHASES.START && this.frameCounter > 60) {
      return { keyCode: 13 }; // ENTER
    }
    
    if (phase === GAME_PHASES.PLAYING && gameState.player) {
      // Advanced pattern to avoid obstacles
      const obstacles = gameState.obstacles.filter(o => o.active && o.z > 0 && o.z < 300);
      
      if (obstacles.length > 0) {
        const nearest = obstacles[0];
        const playerLane = gameState.player.lane;
        
        // Check if obstacle is in our lane
        if (Math.abs(nearest.lane - playerLane) < 0.5) {
          // React based on obstacle type
          if (nearest.type === 'low_barrier' && nearest.z < 200) {
            return { keyCode: 38 }; // JUMP
          }
          if (nearest.type === 'high_barrier' && nearest.z < 200) {
            return { keyCode: 40 }; // SLIDE
          }
          if (nearest.type === 'gap' && nearest.z < 200) {
            return { keyCode: 38 }; // JUMP
          }
        }
      }
      
      // Collect coins
      const coins = gameState.coins.filter(c => c.active && c.z > 0 && c.z < 400);
      if (coins.length > 0 && this.frameCounter % 30 === 0) {
        const nearest = coins[0];
        const playerLane = gameState.player.lane;
        
        if (nearest.lane < playerLane) {
          return { keyCode: 37 }; // TURN LEFT
        } else if (nearest.lane > playerLane) {
          return { keyCode: 39 }; // TURN RIGHT
        }
      }
    }
    
    if (phase === GAME_PHASES.LEVEL_COMPLETE) {
      // Just wait for auto-transition
    }
    
    if (phase === GAME_PHASES.GAME_WON && this.frameCounter % 120 === 0) {
      return { keyCode: 82 }; // R
    }
    
    if (phase === GAME_PHASES.GAME_OVER && this.frameCounter % 120 === 0) {
      return { keyCode: 82 }; // R
    }
    
    return null;
  }
}