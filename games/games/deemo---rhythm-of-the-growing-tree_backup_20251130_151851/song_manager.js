// song_manager.js - Song and note pattern management
import { 
  NOTE_TYPE_SINGLE, 
  NOTE_TYPE_HOLD, 
  NOTE_TYPE_SWIPE,
  DIFFICULTY_EASY,
  DIFFICULTY_NORMAL,
  DIFFICULTY_HARD,
  NUM_LANES,
  NOTE_SPEED,
  JUDGMENT_LINE_Y,
  GOOD_TIMING
} from './globals.js';
import { Note } from './note.js';

export class SongManager {
  constructor(p) {
    this.p = p;
    this.songs = this.createSongLibrary();
    this.currentSongIndex = 0;
    this.currentPattern = [];
    this.patternIndex = 0;
  }

  createSongLibrary() {
    return [
      {
        id: 0,
        name: "First Steps",
        difficulty: DIFFICULTY_EASY,
        unlocked: true,
        treeGrowth: 1.0,
        bgColor: { top: [40, 80, 120], bottom: [10, 20, 40] } // Blue
      },
      {
        id: 1,
        name: "Emerald Path",
        difficulty: DIFFICULTY_EASY,
        unlocked: false,
        treeGrowth: 1.2,
        bgColor: { top: [40, 120, 60], bottom: [10, 40, 20] } // Green
      },
      {
        id: 2,
        name: "Violet Dream",
        difficulty: DIFFICULTY_NORMAL,
        unlocked: false,
        treeGrowth: 1.5,
        bgColor: { top: [100, 40, 120], bottom: [30, 10, 40] } // Purple
      },
      {
        id: 3,
        name: "Amber Sunset",
        difficulty: DIFFICULTY_NORMAL,
        unlocked: false,
        treeGrowth: 1.8,
        bgColor: { top: [140, 80, 40], bottom: [50, 20, 10] } // Orange
      },
      {
        id: 4,
        name: "Crimson Storm",
        difficulty: DIFFICULTY_HARD,
        unlocked: false,
        treeGrowth: 2.0,
        bgColor: { top: [120, 40, 40], bottom: [40, 10, 10] } // Red
      },
      {
        id: 5,
        name: "Void Walker",
        difficulty: DIFFICULTY_HARD,
        unlocked: false,
        treeGrowth: 2.5,
        bgColor: { top: [60, 60, 70], bottom: [10, 10, 15] } // Dark Grey
      }
    ];
  }

  getSong(index) {
    return this.songs[index] || this.songs[0];
  }

  unlockNextSong() {
    for (let i = 0; i < this.songs.length; i++) {
      if (!this.songs[i].unlocked) {
        this.songs[i].unlocked = true;
        return this.songs[i];
      }
    }
    return null;
  }

  generatePattern(songId, difficulty) {
    const pattern = [];
    const song = this.getSong(songId);
    
    // Pattern length based on difficulty - Shortened levels
    let numNotes = 20; 
    let holdFrequency = 0.15;
    let swipeFrequency = 0.1;
    let baseReactionBuffer = 20; // Frames
    
    if (difficulty === DIFFICULTY_NORMAL) {
      numNotes = 30;
      holdFrequency = 0.2;
      swipeFrequency = 0.15;
      baseReactionBuffer = 15;
    } else if (difficulty === DIFFICULTY_HARD) {
      numNotes = 40;
      holdFrequency = 0.25;
      swipeFrequency = 0.2;
      baseReactionBuffer = 10;
    }

    let frame = 60; // Start after 1 second
    let lastLane = Math.floor(NUM_LANES / 2); // Assume player starts in middle

    for (let i = 0; i < numNotes; i++) {
      const lane = Math.floor(this.p.random(NUM_LANES));
      const rand = this.p.random();
      
      let noteType = NOTE_TYPE_SINGLE;
      let holdDuration = 0;

      if (rand < swipeFrequency) {
        noteType = NOTE_TYPE_SWIPE;
      } else if (rand < swipeFrequency + holdFrequency) {
        noteType = NOTE_TYPE_HOLD;
        holdDuration = Math.floor(this.p.random(30, 60));
      }

      // Calculate minimum gap required based on travel time
      // Player speed is 15px/frame. Lane width is 150px. ~10 frames per lane.
      const laneDistance = Math.abs(lane - lastLane);
      const travelFrames = laneDistance * 10;
      
      // Ensure no simultaneous notes and allow travel time
      const minGap = travelFrames + baseReactionBuffer;
      
      // Apply gap to frame counter
      frame += minGap + Math.floor(this.p.random(10, 30));

      pattern.push({
        frame: frame,
        lane: lane,
        type: noteType,
        holdDuration: holdDuration
      });

      // If it's a hold note, ensure next note doesn't start until hold is done
      // (Assuming single-channel focus)
      if (noteType === NOTE_TYPE_HOLD) {
        frame += holdDuration;
      }

      lastLane = lane;
    }

    return pattern;
  }

  loadSong(songId) {
    this.currentSongIndex = songId;
    const song = this.getSong(songId);
    this.currentPattern = this.generatePattern(songId, song.difficulty);
    this.patternIndex = 0;
    return song;
  }

  getNextNote(frameCount) {
    if (this.patternIndex >= this.currentPattern.length) {
      return null;
    }

    const nextNote = this.currentPattern[this.patternIndex];
    if (frameCount >= nextNote.frame) {
      this.patternIndex++;
      return nextNote;
    }

    return null;
  }

  isPatternComplete() {
    return this.patternIndex >= this.currentPattern.length;
  }

  getTotalNotes() {
    return this.currentPattern.length;
  }
}