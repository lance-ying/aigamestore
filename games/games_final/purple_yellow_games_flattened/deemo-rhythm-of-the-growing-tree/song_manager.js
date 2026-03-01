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
        name: "Level 1",
        difficulty: DIFFICULTY_EASY,
        unlocked: true,
        treeGrowth: 2.0,
        noteCount: 20,
        noteSpeed: 2.5,
        bgColor: { top: [40, 80, 120], bottom: [10, 20, 40] }
      },
      {
        id: 1,
        name: "Level 2",
        difficulty: DIFFICULTY_EASY,
        unlocked: false,
        treeGrowth: 2.5,
        noteCount: 30,
        noteSpeed: 2.8,
        bgColor: { top: [40, 120, 60], bottom: [10, 40, 20] }
      },
      {
        id: 2,
        name: "Level 3",
        difficulty: DIFFICULTY_NORMAL,
        unlocked: false,
        treeGrowth: 3.0,
        noteCount: 40,
        noteSpeed: 3.1,
        bgColor: { top: [100, 40, 120], bottom: [30, 10, 40] }
      },
      {
        id: 3,
        name: "Level 4",
        difficulty: DIFFICULTY_NORMAL,
        unlocked: false,
        treeGrowth: 3.5,
        noteCount: 50,
        noteSpeed: 3.4,
        bgColor: { top: [140, 80, 40], bottom: [50, 20, 10] }
      },
      {
        id: 4,
        name: "Level 5",
        difficulty: DIFFICULTY_HARD,
        unlocked: false,
        treeGrowth: 4.0,
        noteCount: 60,
        noteSpeed: 3.7,
        bgColor: { top: [120, 40, 40], bottom: [40, 10, 10] }
      },
      {
        id: 5,
        name: "Level 6",
        difficulty: DIFFICULTY_HARD,
        unlocked: false,
        treeGrowth: 5.0,
        noteCount: 70,
        noteSpeed: 4.0,
        bgColor: { top: [60, 60, 70], bottom: [10, 10, 15] }
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
    
    // Use fixed note count per level
    const numNotes = song.noteCount;
    const noteSpeed = song.noteSpeed;
    
    // Difficulty affects variety of note types
    let holdFrequency = 0.1 + (songId * 0.03); // Increases with level
    let swipeFrequency = 0.05 + (songId * 0.03); // Increases with level
    let baseReactionBuffer = 25 - (songId * 2); // Decreases with level (more challenging)
    
    let frame = 60; // Start after 1 second
    let lastLane = Math.floor(NUM_LANES / 2);

    for (let i = 0; i < numNotes; i++) {
      const lane = Math.floor(this.p.random(NUM_LANES));
      const rand = this.p.random();
      
      let noteType = NOTE_TYPE_SINGLE;
      let holdDuration = 0;

      if (rand < swipeFrequency) {
        noteType = NOTE_TYPE_SWIPE;
      } else if (rand < swipeFrequency + holdFrequency) {
        noteType = NOTE_TYPE_HOLD;
        holdDuration = Math.floor(this.p.random(20, 40));
      }

      // Calculate minimum gap required based on travel time
      const laneDistance = Math.abs(lane - lastLane);
      const travelFrames = laneDistance * 10;
      
      const minGap = travelFrames + baseReactionBuffer;
      
      // Reduced gap for faster pacing as levels progress
      frame += minGap + Math.floor(this.p.random(5, 20 - songId));

      pattern.push({
        frame: frame,
        lane: lane,
        type: noteType,
        holdDuration: holdDuration,
        speed: noteSpeed
      });

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