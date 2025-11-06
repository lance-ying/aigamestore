// wave_manager.js - Manages enemy waves and spawning
import { gameState, CANVAS_WIDTH, GROUND_Y } from './globals.js';
import { Enemy } from './enemy.js';

export class WaveManager {
  constructor(p) {
    this.p = p;
    this.spawnTimer = 0;
    this.spawnDelay = 120; // frames between spawns
    this.enemiesSpawnedThisWave = 0;
  }
  
  startWave() {
    gameState.waveComplete = false;
    gameState.enemiesDefeated = 0;
    gameState.bossActive = false;
    this.enemiesSpawnedThisWave = 0;
    
    // Determine enemies for this wave
    if (gameState.wave === gameState.maxWaves) {
      // Final boss wave
      gameState.enemiesInWave = 1;
      this.spawnEnemy("boss");
      gameState.bossActive = true;
    } else if (gameState.wave % 2 === 0) {
      // Mini-boss wave
      gameState.enemiesInWave = 1 + gameState.wave;
      this.spawnEnemy("miniboss");
      this.enemiesSpawnedThisWave++;
    } else {
      // Regular wave
      gameState.enemiesInWave = 3 + gameState.wave * 2;
    }
    
    this.spawnTimer = 60;
  }
  
  update() {
    // Check wave completion
    if (gameState.enemiesDefeated >= gameState.enemiesInWave && !gameState.waveComplete) {
      gameState.waveComplete = true;
      
      if (gameState.wave < gameState.maxWaves) {
        // Next wave
        setTimeout(() => {
          gameState.wave++;
          this.startWave();
        }, 2000);
      } else {
        // Game won!
        setTimeout(() => {
          gameState.gamePhase = "GAME_OVER_WIN";
        }, 1000);
      }
    }
    
    // Spawn enemies
    if (!gameState.waveComplete && this.enemiesSpawnedThisWave < gameState.enemiesInWave) {
      this.spawnTimer--;
      if (this.spawnTimer <= 0) {
        // Determine enemy type
        let type = "grunt";
        if (gameState.wave > 2 && this.p.random() < 0.3) {
          type = "warrior";
        }
        
        this.spawnEnemy(type);
        this.enemiesSpawnedThisWave++;
        this.spawnTimer = this.spawnDelay;
      }
    }
  }
  
  spawnEnemy(type) {
    const side = this.p.random() < 0.5 ? 0 : 1;
    const x = side === 0 ? 50 : CANVAS_WIDTH - 50;
    const y = GROUND_Y - 100;
    
    const enemy = new Enemy(this.p, x, y, type);
    gameState.enemies.push(enemy);
    gameState.entities.push(enemy);
  }
}