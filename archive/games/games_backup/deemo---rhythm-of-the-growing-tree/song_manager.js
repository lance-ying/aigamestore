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
        treeGrowth: 1.0
      },
      {
        id: 1,
        name: "Morning Light",
        difficulty: DIFFICULTY_EASY,
        unlocked: false,
        treeGrowth: 1.2
      },
      {
        id: 2,
        name: "Dancing Shadows",
        difficulty: DIFFICULTY_NORMAL,
        unlocked: false,
        treeGrowth: 1.5
      },
      {
        id: 3,
        name: "Ethereal Dreams",
        difficulty: DIFFICULTY_NORMAL,
        unlocked: false,
        treeGrowth: 1.8
      },
      {
        id: 4,
        name: "Storm's Crescendo",
        difficulty: DIFFICULTY_HARD,
        unlocked: false,
        treeGrowth: 2.0
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
    
    // Pattern length based on difficulty
    let numNotes = 30;
    let holdFrequency = 0.15;
    let swipeFrequency = 0.1;
    
    if (difficulty === DIFFICULTY_NORMAL) {
      numNotes = 50;
      holdFrequency = 0.2;
      swipeFrequency = 0.15;
    } else if (difficulty === DIFFICULTY_HARD) {
      numNotes = 70;
      holdFrequency = 0.25;
      swipeFrequency = 0.2;
    }

    // Calculate how many frames it takes for a note to reach the judgment line
    const travelDistance = JUDGMENT_LINE_Y + 50; // From spawn y=-50 to judgment line
    const framesToReachJudgment = Math.ceil(travelDistance / NOTE_SPEED);
    
    // Minimum gap to ensure notes don't overlap at judgment line
    // Add extra buffer beyond the timing window to ensure clear separation
    const minGapBetweenNotes = GOOD_TIMING + 10;

    let frame = 60; // Start after 1 second
    let lastJudgmentFrame = frame + framesToReachJudgment;

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

      // Calculate when this note will reach the judgment line
      const thisJudgmentFrame = frame + framesToReachJudgment;
      
      // If this note would reach the judgment line too close to the last note,
      // delay it further
      if (thisJudgmentFrame < lastJudgmentFrame + minGapBetweenNotes) {
        const additionalDelay = (lastJudgmentFrame + minGapBetweenNotes) - thisJudgmentFrame;
        frame += additionalDelay;
      }

      pattern.push({
        frame: frame,
        lane: lane,
        type: noteType,
        holdDuration: holdDuration
      });

      // Update last judgment frame
      lastJudgmentFrame = frame + framesToReachJudgment;

      // Add base gap before next note
      const baseGap = difficulty === DIFFICULTY_EASY ? 45 : 
                      difficulty === DIFFICULTY_NORMAL ? 35 : 25;
      frame += Math.floor(this.p.random(baseGap, baseGap + 20));
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