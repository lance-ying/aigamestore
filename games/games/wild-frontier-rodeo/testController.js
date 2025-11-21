// testController.js - Automated testing controllers

import { gameState, GAME_PHASES } from './globals.js';
import { Animal } from './animal.js';

export class TestController {
  constructor(p, gameManager) {
    this.p = p;
    this.gameManager = gameManager;
    this.actionTimer = 0;
  }

  update() {
    if (gameState.controlMode === 'HUMAN') return;

    if (gameState.controlMode === 'TEST_1') {
      this.basicTest();
    } else if (gameState.controlMode === 'TEST_2') {
      this.winTest();
    }
  }

  basicTest() {
    // Start game if not started
    if (gameState.gamePhase === GAME_PHASES.START) {
      if (this.p.frameCount > 60) {
        this.simulateKeyPress(13); // ENTER
      }
      return;
    }

    if (gameState.gamePhase !== GAME_PHASES.PLAYING) return;

    // Jump periodically
    if (gameState.currentAnimal && !gameState.isJumping) {
      const timeOnAnimal = gameState.currentAnimal.ridingDuration - gameState.ridingTimer;
      
      // Jump when about 60% through riding duration
      if (timeOnAnimal > gameState.currentAnimal.ridingDuration * 0.6) {
        this.gameManager.handleJump();
      }
    }

    // Steer randomly
    if (Math.random() < 0.05) {
      if (gameState.currentAnimal) {
        if (gameState.currentAnimal.x < 200) {
          // Steer right
          this.p.keyIsDown = (code) => code === 39;
        } else if (gameState.currentAnimal.x > 400) {
          // Steer left
          this.p.keyIsDown = (code) => code === 37;
        }
      }
    }
  }

  winTest() {
    // Start game if not started
    if (gameState.gamePhase === GAME_PHASES.START) {
      if (this.p.frameCount > 60) {
        this.simulateKeyPress(13); // ENTER
      }
      return;
    }

    if (gameState.gamePhase !== GAME_PHASES.PLAYING) return;

    // Intelligent jumping - find nearest animal
    if (gameState.currentAnimal && !gameState.isJumping) {
      const timeOnAnimal = gameState.currentAnimal.ridingDuration - gameState.ridingTimer;
      
      // Find next animal
      let nearestAnimal = null;
      let minDist = Infinity;
      
      for (const entity of gameState.entities) {
        if (entity instanceof Animal && entity !== gameState.currentAnimal && entity.isActive) {
          const dist = Math.abs(entity.x - gameState.currentAnimal.x);
          if (dist < minDist && entity.x > gameState.currentAnimal.x - 100) {
            minDist = dist;
            nearestAnimal = entity;
          }
        }
      }
      
      // Jump when ready and target in range
      if (nearestAnimal && minDist < 200 && timeOnAnimal > gameState.currentAnimal.ridingDuration * 0.5) {
        this.gameManager.handleJump();
      }
    }

    // Smart steering - avoid obstacles and align with next animal
    if (gameState.currentAnimal && !gameState.isJumping) {
      // Find obstacles ahead
      let obstacleAhead = false;
      let obstacleSide = 0;
      
      for (const entity of gameState.entities) {
        if (entity.type && (entity.type === 'ROCK' || entity.type === 'TREE' || entity.type === 'FENCE')) {
          if (entity.x > gameState.currentAnimal.x - 50 && entity.x < gameState.currentAnimal.x + 150) {
            obstacleAhead = true;
            obstacleSide = entity.x > gameState.currentAnimal.x ? 1 : -1;
          }
        }
      }
      
      if (obstacleAhead) {
        // Steer away from obstacle
        if (obstacleSide > 0 && gameState.currentAnimal.x > 100) {
          gameState.currentAnimal.x -= 3;
        } else if (obstacleSide < 0 && gameState.currentAnimal.x < 500) {
          gameState.currentAnimal.x += 3;
        }
      } else {
        // Center position
        const targetX = 300;
        if (gameState.currentAnimal.x < targetX - 20) {
          gameState.currentAnimal.x += 2;
        } else if (gameState.currentAnimal.x > targetX + 20) {
          gameState.currentAnimal.x -= 2;
        }
      }
    }
  }

  simulateKeyPress(keyCode) {
    const fakeEvent = { keyCode };
    this.p.keyCode = keyCode;
    this.p.key = String.fromCharCode(keyCode);
    
    // Log the simulated input
    this.p.logs.inputs.push({
      input_type: 'keyPressed',
      data: { key: this.p.key, keyCode },
      framecount: this.p.frameCount,
      timestamp: Date.now()
    });
    
    // Process in input handler
    if (keyCode === 13 && gameState.gamePhase === GAME_PHASES.START) {
      this.gameManager.startGame();
    }
  }
}