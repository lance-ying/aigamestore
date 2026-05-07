// song.js - Song and note pattern generation

import { 
  NOTE_TYPE_REGULAR,
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
    
    // Generate notes based on difficulty - increased density scaling
    const baseDensity = 0.25;
    const densityIncrease = this.difficulty * 0.12;
    const noteDensity = Math.min(0.95, baseDensity + densityIncrease);
    const spawnDistance = 300;
    
    for (let beat = 0; beat < totalBeats; beat++) {
      const spawnTime = beat * beatInterval;
      
      // Determine if we spawn a note on this beat
      if (Math.random() < noteDensity) {
        const lane = Math.floor(Math.random() * 8);
        const noteTypeRoll = Math.random();
        
        let noteType, requiredKey;
        
        if (noteTypeRoll < 0.45) {
          // Regular circle note (45%)
          noteType = NOTE_TYPE_REGULAR;
          requiredKey = 32; // SPACE
        } else if (noteTypeRoll < 0.75) {
          // Purple circle note (30%)
          noteType = NOTE_TYPE_HOLD;
          requiredKey = 16; // SHIFT
        } else {
          // Special star note (25%)
          noteType = NOTE_TYPE_SPECIAL;
          requiredKey = 90; // Z
        }
        
        this.notePattern.push({
          spawnTime,
          type: noteType,
          lane,
          spawnDistance,
          requiredKey
        });
      }
      
      // Add extra notes on strong beats for higher difficulty
      if (this.difficulty >= 3 && beat % 4 === 0 && Math.random() < 0.6) {
        const lane = Math.floor(Math.random() * 8);
        const extraRoll = Math.random();
        let extraType, extraKey;
        
        if (extraRoll < 0.6) {
          extraType = NOTE_TYPE_REGULAR;
          extraKey = 32;
        } else if (extraRoll < 0.85) {
          extraType = NOTE_TYPE_HOLD;
          extraKey = 16;
        } else {
          extraType = NOTE_TYPE_SPECIAL;
          extraKey = 90;
        }
        
        this.notePattern.push({
          spawnTime: spawnTime + Math.floor(beatInterval / 2),
          type: extraType,
          lane,
          spawnDistance,
          requiredKey: extraKey
        });
      }
      
      // Add even more notes for very high difficulty
      if (this.difficulty >= 6 && Math.random() < 0.4) {
        const lane = Math.floor(Math.random() * 8);
        const extraRoll = Math.random();
        let extraType, extraKey;
        
        if (extraRoll < 0.5) {
          extraType = NOTE_TYPE_REGULAR;
          extraKey = 32;
        } else if (extraRoll < 0.8) {
          extraType = NOTE_TYPE_HOLD;
          extraKey = 16;
        } else {
          extraType = NOTE_TYPE_SPECIAL;
          extraKey = 90;
        }
        
        this.notePattern.push({
          spawnTime: spawnTime + Math.floor(beatInterval / 3),
          type: extraType,
          lane,
          spawnDistance,
          requiredKey: extraKey
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
    // Easier, shorter levels
    new Song("First Steps", 1, 100, 900),        // 15 seconds, slow BPM
    new Song("Cosmic Journey", 2, 110, 1050),    // 17.5 seconds
    new Song("Stellar Rhythm", 3, 120, 1200),    // 20 seconds
    new Song("Nebula Dance", 4, 130, 1200),      // 20 seconds, faster
    new Song("Galaxy Pulse", 5, 140, 1350),      // 22.5 seconds
    new Song("Astral Beat", 6, 150, 1350),       // 22.5 seconds, more intense
    new Song("Quantum Rhythm", 7, 160, 1500),    // 25 seconds
    new Song("Hypernova", 8, 170, 1500),         // 25 seconds, very fast
    new Song("Void Runner", 9, 180, 1500),       // 25 seconds, extreme
    new Song("Infinity Loop", 10, 190, 1500)     // 25 seconds, maximum difficulty
  ];
}