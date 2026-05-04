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
        
        if (noteTypeRoll < 0.45) {
          // Regular circle note (45%)
          noteType = NOTE_TYPE_REGULAR;
          requiredKey = 32; // SPACE
        } else if (noteTypeRoll < 0.75) {
          // Hold note (30%) - INCREASED DURATION
          noteType = NOTE_TYPE_HOLD;
          requiredKey = 16; // SHIFT
          // Hold duration is now 2-4 beats (much longer)
          holdDuration = Math.floor(beatInterval * (2 + Math.random() * 2));
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
          requiredKey,
          holdDuration: holdDuration || 0
        });
      }
      
      // Add extra notes on strong beats for higher difficulty
      if (this.difficulty >= 3 && beat % 4 === 0 && Math.random() < 0.5) {
        const lane = Math.floor(Math.random() * 8);
        const extraRoll = Math.random();
        let extraType, extraKey, extraHold = 0;
        
        if (extraRoll < 0.6) {
          extraType = NOTE_TYPE_REGULAR;
          extraKey = 32;
        } else if (extraRoll < 0.85) {
          extraType = NOTE_TYPE_HOLD;
          extraKey = 16;
          // Extra hold notes are also longer (1.5-3 beats)
          extraHold = Math.floor(beatInterval * (1.5 + Math.random() * 1.5));
        } else {
          extraType = NOTE_TYPE_SPECIAL;
          extraKey = 90;
        }
        
        this.notePattern.push({
          spawnTime: spawnTime + Math.floor(beatInterval / 2),
          type: extraType,
          lane,
          spawnDistance,
          requiredKey: extraKey,
          holdDuration: extraHold
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