import { gameState } from './globals.js';
import { Enemy } from './enemy.js';
import { Boss } from './boss.js';

export class WaveManager {
  constructor(p) {
    this.p = p;
    this.waveTimer = 0;
    this.spawning = false;
  }
  
  update() {
    // Check if wave is complete
    if (gameState.enemies.every(e => e.dead) && gameState.bosses.every(b => b.dead)) {
      if (!this.spawning) {
        this.waveTimer++;
        
        if (this.waveTimer >= 120) { // 2 second delay between waves
          this.spawnNextWave();
          this.waveTimer = 0;
        }
      }
    }
  }
  
  spawnNextWave() {
    const p = this.p;
    
    if (gameState.wave >= gameState.maxWave && gameState.bossDefeated) {
      // Victory
      gameState.gamePhase = "GAME_OVER_WIN";
      p.logs.game_info.push({
        data: { phase: "GAME_OVER_WIN", reason: "All waves and boss defeated" },
        framecount: p.frameCount,
        timestamp: Date.now()
      });
      
      // Secret ending
      if (gameState.secrets.defiedNarrator && gameState.secrets.foundHiddenArea) {
        gameState.secrets.unlockedSecretEnding = true;
      }
      return;
    }
    
    gameState.wave++;
    this.spawning = true;
    
    // Spawn enemies based on wave
    const spawnPositions = [150, 250, 450, 550];
    
    switch(gameState.wave) {
      case 1:
        // 3 basic enemies
        for (let i = 0; i < 3; i++) {
          const enemy = new Enemy(p, spawnPositions[i], 100, "basic");
          gameState.enemies.push(enemy);
          gameState.entities.push(enemy);
        }
        break;
        
      case 2:
        // 2 basic, 2 fast
        for (let i = 0; i < 2; i++) {
          const enemy = new Enemy(p, spawnPositions[i], 100, "basic");
          gameState.enemies.push(enemy);
          gameState.entities.push(enemy);
        }
        for (let i = 2; i < 4; i++) {
          const enemy = new Enemy(p, spawnPositions[i], 100, "fast");
          gameState.enemies.push(enemy);
          gameState.entities.push(enemy);
        }
        break;
        
      case 3:
        // 1 tank, 2 fast, 1 basic
        const tank = new Enemy(p, 300, 100, "tank");
        gameState.enemies.push(tank);
        gameState.entities.push(tank);
        
        for (let i = 0; i < 2; i++) {
          const enemy = new Enemy(p, spawnPositions[i * 3], 100, "fast");
          gameState.enemies.push(enemy);
          gameState.entities.push(enemy);
        }
        
        const basic = new Enemy(p, spawnPositions[2], 100, "basic");
        gameState.enemies.push(basic);
        gameState.entities.push(basic);
        
        // Boss spawns after this wave
        if (!gameState.bossDefeated) {
          const boss = new Boss(p, 400, 100);
          gameState.bosses.push(boss);
          gameState.entities.push(boss);
        }
        break;
    }
    
    this.spawning = false;
  }
  
  draw() {
    const p = this.p;
    
    // Wave indicator
    p.push();
    p.fill(255);
    p.textAlign(p.LEFT, p.TOP);
    p.textSize(16);
    p.text(`Wave: ${gameState.wave}/${gameState.maxWave}`, 10, 10);
    p.pop();
  }
}