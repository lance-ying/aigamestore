// song.js - Song and note pattern generation

import { 
  NOTE_TYPE_REGULAR,
  NOTE_TYPE_ARROW,
  NOTE_TYPE_HOLD,
  NOTE_TYPE_SPECIAL
} from './globals.js';

export class Song {
  constructor(name, difficulty, bpm, duration) {
    this.name = name;
    this.difficulty = difficulty;
    this.bpm = bpm;
    this.duration = duration; // in frames at 60 FPS
    this.notePattern = [];
    this.generatePattern();
  }

  generatePattern() {
    const beatInterval = Math.floor((60 / this.bpm) * 60); // frames per beat
    const totalBeats = Math.floor(this.duration / beatInterval);
    
    // Generate notes based on difficulty
    const noteDensity = 0.3 + (this.difficulty * 0.15);
    const spawnDistance = 300;
    
    for (let beat = 0; beat < totalBeats; beat++) {
      const spawnTime = beat * beatInterval;
      
      // Determine if we spawn a note on this beat
      if (Math.random() < noteDensity) {
        const lane = Math.floor(Math.random() * 8);
        const noteTypeRoll = Math.random();
        
        let noteType, requiredKey, holdDuration;
        
        if (noteTypeRoll < 0.5) {
          // Regular note (50%)
          noteType = NOTE_TYPE_REGULAR;
          requiredKey = 32; // SPACE
        } else if (noteTypeRoll < 0.7) {
          // Arrow note (20%)
          noteType = NOTE_TYPE_ARROW;
          requiredKey = [37, 38, 39, 40][Math.floor(Math.random() * 4)]; // Arrow keys
        } else if (noteTypeRoll < 0.85) {
          // Hold note (15%)
          noteType = NOTE_TYPE_HOLD;
          requiredKey = 16; // SHIFT
          holdDuration = Math.floor(beatInterval * (1 + Math.random()));
        } else {
          // Special note (15%)
          noteType = NOTE_TYPE_SPECIAL;
          requiredKey = 90; // Z
        }
        
        this.notePattern.push({
          spawnTime,
          type: noteType,
          lane,
          spawnDistance,
          requiredKey,
          holdDuration: holdDuration || 0
        });
      }
      
      // Add extra notes on strong beats for higher difficulty
      if (this.difficulty >= 3 && beat % 4 === 0 && Math.random() < 0.5) {
        const lane = Math.floor(Math.random() * 8);
        this.notePattern.push({
          spawnTime: spawnTime + Math.floor(beatInterval / 2),
          type: NOTE_TYPE_REGULAR,
          lane,
          spawnDistance,
          requiredKey: 32,
          holdDuration: 0
        });
      }
    }
    
    // Sort by spawn time
    this.notePattern.sort((a, b) => a.spawnTime - b.spawnTime);
  }

  getNotesForFrame(frame) {
    return this.notePattern.filter(note => note.spawnTime === frame);
  }

  getTotalNotes() {
    return this.notePattern.length;
  }
}

export function createSongList() {
  return [
    new Song("Cosmic Journey", 1, 120, 1800), // 30 seconds at 60 FPS
    new Song("Stellar Rhythm", 2, 130, 2100),
    new Song("Nebula Dance", 3, 140, 2400),
    new Song("Galaxy Pulse", 4, 150, 2700),
    new Song("Quantum Beats", 5, 160, 3000)
  ];
}