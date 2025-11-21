import { gameState, CANVAS_WIDTH, LANE_Y_POSITIONS } from './globals.js';
import { Note } from './note.js';
import { Elfin } from './elfin.js';
import { Enemy } from './enemy.js';

export class Spawner {
  constructor(p) {
    this.p = p;
    this.noteSpawnTimer = 0;
    this.noteSpawnInterval = 60;
    this.elfinSpawnTimer = 0;
    this.elfinSpawnInterval = 600;
    this.enemySpawnTimer = 0;
    this.enemySpawnInterval = 180;
    this.patternIndex = 0;
    
    // Patterns for interesting gameplay
    this.patterns = [
      [0], [1], [0, 1], [0], [1], [0, 0], [1, 1],
      [0, 1, 0], [1, 0, 1], [0], [1]
    ];
  }

  update() {
    this.noteSpawnTimer++;
    this.elfinSpawnTimer++;
    this.enemySpawnTimer++;
    
    // Increase difficulty over time
    const newDifficulty = 1.0 + (gameState.gameTime / 3000);
    gameState.difficulty = Math.min(2.5, newDifficulty);
    
    // Adjust spawn rate with difficulty
    const adjustedInterval = Math.max(30, this.noteSpawnInterval - gameState.difficulty * 5);
    
    if (this.noteSpawnTimer >= adjustedInterval) {
      this.spawnNotes();
      this.noteSpawnTimer = 0;
    }
    
    if (this.elfinSpawnTimer >= this.elfinSpawnInterval) {
      this.spawnElfin();
      this.elfinSpawnTimer = 0;
    }
    
    // Enemy spawning
    const enemyInterval = Math.max(120, this.enemySpawnInterval - gameState.difficulty * 10);
    if (this.enemySpawnTimer >= enemyInterval) {
      this.spawnEnemy();
      this.enemySpawnTimer = 0;
    }
  }

  spawnNotes() {
    const pattern = this.patterns[this.patternIndex % this.patterns.length];
    this.patternIndex++;
    
    for (let lane of pattern) {
      let noteType = 'normal';
      const rand = this.p.random();
      
      if (rand < 0.1 && gameState.notesHit > 10) {
        noteType = 'special';
      } else if (rand < 0.2 && gameState.notesHit > 5) {
        noteType = 'hold';
      }
      
      const note = new Note(this.p, lane, noteType);
      gameState.notes.push(note);
      gameState.entities.push(note);
    }
  }

  spawnElfin() {
    if (gameState.notesHit < 5) return;
    
    const types = ['red', 'blue', 'green'];
    const type = types[Math.floor(this.p.random(types.length))];
    const elfin = new Elfin(this.p, type);
    gameState.elfins.push(elfin);
    gameState.entities.push(elfin);
  }

  spawnEnemy() {
    // Don't spawn enemies too early
    if (gameState.gameTime < 180) return;
    
    const lane = Math.floor(this.p.random(2));
    let type = 'basic';
    
    const rand = this.p.random();
    if (rand < 0.3 && gameState.difficulty > 1.5) {
      type = 'fast';
    } else if (rand < 0.5 && gameState.difficulty > 1.2) {
      type = 'big';
    }
    
    const enemy = new Enemy(this.p, lane, type);
    gameState.enemies.push(enemy);
    gameState.entities.push(enemy);
  }
}