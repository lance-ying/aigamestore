import { gameState } from './globals.js';
import { Note } from './note.js';

export class Spawner {
  constructor(p) {
    this.p = p;
    this.noteSpawnTimer = 0;
    this.noteSpawnInterval = 60;
    this.patternIndex = 0;
    
    // Patterns for interesting gameplay
    this.patterns = [
      [0], [1], [0, 1], [0], [1], [0, 0], [1, 1],
      [0, 1, 0], [1, 0, 1], [0], [1]
    ];
  }

  update() {
    this.noteSpawnTimer++;
    
    // Increase difficulty over time
    const newDifficulty = 1.0 + (gameState.gameTime / 3000);
    gameState.difficulty = Math.min(2.5, newDifficulty);
    
    // Adjust spawn rate with difficulty
    const adjustedInterval = Math.max(30, this.noteSpawnInterval - gameState.difficulty * 5);
    
    if (this.noteSpawnTimer >= adjustedInterval) {
      this.spawnNotes();
      this.noteSpawnTimer = 0;
    }
  }

  spawnNotes() {
    const pattern = this.patterns[this.patternIndex % this.patterns.length];
    this.patternIndex++;
    
    for (let lane of pattern) {
      const note = new Note(this.p, lane);
      gameState.notes.push(note);
      gameState.entities.push(note);
    }
  }
}