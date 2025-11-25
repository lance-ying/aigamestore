import { gameState, GAME_AREA_X, GAME_AREA_WIDTH } from './globals.js';
import { Enemy, Boss } from './enemies.js';

export class WaveManager {
  constructor(p) {
    this.p = p;
    this.currentWave = 0;
    this.waveTimer = 0;
    this.waveDelay = 180;
    this.wavesCompleted = false;
  }

  update() {
    if (gameState.wave >= gameState.maxWave) {
      // Check if all enemies defeated
      if (gameState.enemies.length === 0 && gameState.ufos.length === 0) {
        this.wavesCompleted = true;
      }
      return;
    }
    
    this.waveTimer++;
    
    // Check if current wave is cleared
    const waveCleared = gameState.enemies.length === 0 && gameState.ufos.length === 0;
    
    if (waveCleared && this.waveTimer > this.waveDelay) {
      this.spawnWave();
      this.waveTimer = 0;
    }
  }

  spawnWave() {
    gameState.wave++;
    
    switch (gameState.wave) {
      case 1:
        this.spawnBasicWave(5);
        break;
      case 2:
        this.spawnFormationWave();
        break;
      case 3:
        this.spawnSineWave(8);
        break;
      case 4:
        this.spawnMixedWave();
        break;
      case 5:
        this.spawnBoss();
        break;
    }
  }

  spawnBasicWave(count) {
    for (let i = 0; i < count; i++) {
      const x = GAME_AREA_X + 50 + (i * (GAME_AREA_WIDTH - 100) / (count - 1));
      const enemy = new Enemy(this.p, x, -20, 'basic');
      enemy.movePattern = 'straight';
      enemy.vy = 1.5;
      gameState.enemies.push(enemy);
    }
  }

  spawnFormationWave() {
    for (let row = 0; row < 3; row++) {
      for (let col = 0; col < 4; col++) {
        const x = GAME_AREA_X + 60 + col * 90;
        const y = -20 - row * 40;
        const enemy = new Enemy(this.p, x, y, 'basic');
        enemy.movePattern = 'straight';
        enemy.vy = 1;
        gameState.enemies.push(enemy);
      }
    }
  }

  spawnSineWave(count) {
    for (let i = 0; i < count; i++) {
      setTimeout(() => {
        const x = GAME_AREA_X + GAME_AREA_WIDTH / 2;
        const enemy = new Enemy(this.p, x, -20, 'sine');
        enemy.movePattern = 'sine';
        enemy.vy = 1;
        gameState.enemies.push(enemy);
      }, i * 300);
    }
  }

  spawnMixedWave() {
    for (let i = 0; i < 3; i++) {
      const x = GAME_AREA_X + 80 + i * 120;
      const enemy = new Enemy(this.p, x, -20, 'zigzag');
      enemy.movePattern = 'zigzag';
      enemy.vx = 2;
      enemy.vy = 1;
      gameState.enemies.push(enemy);
    }
    
    setTimeout(() => {
      for (let i = 0; i < 6; i++) {
        const x = GAME_AREA_X + 50 + i * 60;
        const enemy = new Enemy(this.p, x, -20, 'basic');
        enemy.movePattern = 'sine';
        enemy.vy = 1.5;
        gameState.enemies.push(enemy);
      }
    }, 1000);
  }

  spawnBoss() {
    const boss = new Boss(this.p, GAME_AREA_X + GAME_AREA_WIDTH / 2, -50);
    gameState.enemies.push(boss);
  }

  isComplete() {
    return this.wavesCompleted;
  }
}