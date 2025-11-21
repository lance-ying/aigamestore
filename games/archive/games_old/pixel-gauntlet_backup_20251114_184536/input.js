import { gameState } from './globals.js';

export class InputManager {
  constructor() {
    this.keys = {};
    this.testController = null;
  }

  setKey(keyCode, value) {
    this.keys[keyCode] = value;
  }

  isKeyDown(keyCode) {
    if (gameState.controlMode === 'HUMAN') {
      return this.keys[keyCode] || false;
    } else {
      // Automated testing mode
      if (!this.testController) return false;
      const actions = this.testController.getActions();
      return actions[keyCode] || false;
    }
  }

  getKeys() {
    if (gameState.controlMode === 'HUMAN') {
      return this.keys;
    } else {
      if (!this.testController) return {};
      return this.testController.getActions();
    }
  }
}

export class TestController {
  constructor() {
    this.actions = {};
    this.frameCount = 0;
  }

  getActions() {
    this.frameCount++;
    this.actions = {};

    if (gameState.controlMode === 'TEST_1') {
      return this.basicTest();
    } else if (gameState.controlMode === 'TEST_2') {
      return this.winTest();
    }

    return this.actions;
  }

  basicTest() {
    // Simple movement test
    if (this.frameCount % 180 < 90) {
      this.actions[39] = true; // Right
    } else {
      this.actions[37] = true; // Left
    }

    if (this.frameCount % 60 === 0) {
      this.actions[32] = true; // Jump
    }

    if (this.frameCount % 40 === 0) {
      this.actions[90] = true; // Attack
    }

    return this.actions;
  }

  winTest() {
    // Aggressive test to try to win
    const player = gameState.player;
    if (!player) return this.actions;

    const enemies = gameState.enemies.filter(e => !e.isDead);
    
    if (enemies.length > 0) {
      const nearestEnemy = enemies.reduce((nearest, enemy) => {
        const distToNearest = Math.abs(nearest.x - player.x);
        const distToEnemy = Math.abs(enemy.x - player.x);
        return distToEnemy < distToNearest ? enemy : nearest;
      });

      // Move toward nearest enemy
      if (nearestEnemy.x > player.x + 30) {
        this.actions[39] = true; // Right
      } else if (nearestEnemy.x < player.x - 30) {
        this.actions[37] = true; // Left
      }

      // Jump if enemy is above or to reach platforms
      if (nearestEnemy.y < player.y - 50 || (this.frameCount % 120 === 0 && !player.onGround)) {
        this.actions[32] = true;
      }

      // Attack when close
      const distToEnemy = Math.abs(nearestEnemy.x - player.x);
      if (distToEnemy < 60) {
        this.actions[90] = true;
      }
    } else {
      // Explore when no enemies
      if (this.frameCount % 240 < 120) {
        this.actions[39] = true;
      } else {
        this.actions[37] = true;
      }
      
      if (this.frameCount % 90 === 0) {
        this.actions[32] = true;
      }
    }

    return this.actions;
  }
}