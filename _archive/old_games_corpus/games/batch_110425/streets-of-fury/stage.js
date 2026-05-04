// stage.js - Stage and wave management

import { gameState, STAGE_WIDTH, GROUND_Y } from './globals.js';
import { Enemy, Boss } from './enemy.js';
import { BreakableObject } from './objects.js';

export class StageManager {
  constructor() {
    this.waves = [];
    this.currentWaveIndex = 0;
    this.waveActive = false;
    this.waveTimer = 0;
    this.stageComplete = false;
  }

  initStage(stage) {
    this.waves = this.generateWaves(stage);
    this.currentWaveIndex = 0;
    this.waveActive = false;
    this.waveTimer = 0;
    this.stageComplete = false;
    
    // Spawn breakable objects
    this.spawnObjects();
  }

  generateWaves(stage) {
    const waves = [];
    
    if (stage === 1) {
      waves.push([
        { type: 'basic', count: 2, spawnX: [400, 500] },
      ]);
      waves.push([
        { type: 'basic', count: 2, spawnX: [600, 700] },
        { type: 'fast', count: 1, spawnX: [650] }
      ]);
      waves.push([
        { type: 'basic', count: 1, spawnX: [800] },
        { type: 'tank', count: 1, spawnX: [900] }
      ]);
    } else if (stage === 2) {
      waves.push([
        { type: 'fast', count: 3, spawnX: [400, 500, 600] }
      ]);
      waves.push([
        { type: 'basic', count: 2, spawnX: [700, 750] },
        { type: 'tank', count: 1, spawnX: [800] }
      ]);
      waves.push([
        { type: 'fast', count: 2, spawnX: [900, 950] },
        { type: 'tank', count: 1, spawnX: [1000] }
      ]);
    } else if (stage === 3) {
      waves.push([
        { type: 'tank', count: 2, spawnX: [400, 500] },
        { type: 'fast', count: 2, spawnX: [450, 550] }
      ]);
      waves.push([
        { type: 'basic', count: 3, spawnX: [700, 750, 800] },
        { type: 'tank', count: 1, spawnX: [850] }
      ]);
      // Boss wave
      waves.push([
        { type: 'boss', count: 1, spawnX: [1000] }
      ]);
    }
    
    return waves;
  }

  spawnObjects() {
    // Clear existing objects
    gameState.entities = gameState.entities.filter(e => e.type !== 'breakable');
    
    // Spawn crates along the stage
    const positions = [300, 500, 700, 900, 1100];
    positions.forEach(x => {
      gameState.entities.push(new BreakableObject(x, GROUND_Y - 35, 'crate'));
    });
  }

  update(p) {
    if (this.stageComplete) return;

    // Check if current wave is cleared
    const enemiesAlive = gameState.entities.filter(e => 
      e.type === 'enemy' && e.health > 0
    ).length;

    if (!this.waveActive && enemiesAlive === 0) {
      this.waveTimer++;
      
      // Start next wave after delay
      if (this.waveTimer > 60) {
        if (this.currentWaveIndex < this.waves.length) {
          this.spawnWave(this.currentWaveIndex, p);
          this.currentWaveIndex++;
          this.waveActive = true;
          this.waveTimer = 0;
        } else {
          // Stage complete
          this.stageComplete = true;
        }
      }
    } else if (this.waveActive && enemiesAlive > 0) {
      // Wave is active
    } else if (this.waveActive && enemiesAlive === 0) {
      // Wave cleared
      this.waveActive = false;
    }
  }

  spawnWave(waveIndex, p) {
    const wave = this.waves[waveIndex];
    
    wave.forEach(group => {
      for (let i = 0; i < group.count; i++) {
        let enemy;
        const spawnX = group.spawnX[i] || 400 + i * 50;
        
        if (group.type === 'boss') {
          enemy = new Boss(spawnX, GROUND_Y);
        } else {
          enemy = new Enemy(spawnX, GROUND_Y, group.type);
        }
        
        gameState.entities.push(enemy);
      }
    });
  }

  isStageComplete() {
    return this.stageComplete;
  }
}