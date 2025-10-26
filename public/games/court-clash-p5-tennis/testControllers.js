import { gameState } from './globals.js';

export class TestController1 {
  constructor(p) {
    this.p = p;
    this.actionTimer = 0;
  }

  getAction() {
    // Basic testing: press space periodically to attempt shots
    this.actionTimer++;
    
    if (gameState.gamePhase === 'START') {
      if (this.actionTimer > 60) {
        this.actionTimer = 0;
        return 13; // ENTER
      }
    } else if (gameState.gamePhase === 'PLAYING') {
      const ball = gameState.ball;
      const player = gameState.player;
      
      if (ball && player && player.canHitBall(ball)) {
        if (this.actionTimer % 5 === 0) {
          return 32; // SPACE to hit
        }
      }
      
      // Also try arrow keys
      if (this.actionTimer % 10 === 0) {
        return [37, 39][Math.floor(Math.random() * 2)];
      }
    } else if (gameState.gamePhase === 'GAME_OVER_WIN' || gameState.gamePhase === 'GAME_OVER_LOSE') {
      if (this.actionTimer > 120) {
        this.actionTimer = 0;
        return 82; // R to restart
      }
    }
    
    return null;
  }
}

export class TestController2 {
  constructor(p) {
    this.p = p;
    this.actionTimer = 0;
  }

  getAction() {
    // Optimized to win
    this.actionTimer++;
    
    if (gameState.gamePhase === 'START') {
      if (this.actionTimer > 30) {
        this.actionTimer = 0;
        return 13; // ENTER
      }
    } else if (gameState.gamePhase === 'PLAYING') {
      const ball = gameState.ball;
      const player = gameState.player;
      
      if (ball && player) {
        // Try to hit when ball is close
        if (player.canHitBall(ball) && ball.lastHitBy !== 'player') {
          // Charge shot
          if (this.actionTimer % 3 === 0) {
            // Aim based on ball position
            if (ball.x < player.x) {
              return 39; // Right arrow to hit forward
            } else {
              return 37; // Left arrow to hit forward
            }
          } else if (this.actionTimer % 3 === 1) {
            return 32; // Space to execute
          }
        }
        
        // Serve quickly
        if (ball.isServing && gameState.currentServer === 'player') {
          if (this.actionTimer % 5 === 0) {
            return 32; // Space to serve
          }
        }
      }
    } else if (gameState.gamePhase === 'GAME_OVER_WIN') {
      if (this.actionTimer > 60) {
        this.actionTimer = 0;
        if (gameState.level < 4) {
          return 13; // ENTER for next level
        } else {
          return 82; // R to restart
        }
      }
    } else if (gameState.gamePhase === 'GAME_OVER_LOSE') {
      if (this.actionTimer > 60) {
        this.actionTimer = 0;
        return 82; // R to restart
      }
    }
    
    return null;
  }
}