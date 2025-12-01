// game_logic.js - Core game logic
import {
  gameState,
  PHASE_START,
  PHASE_PLAYING,
  PHASE_PAUSED,
  PHASE_GAME_OVER_WIN,
  PHASE_GAME_OVER_LOSE,
  TREE_HEIGHT_TARGET,
  TREE_HEIGHT_STORY_1,
  TREE_HEIGHT_STORY_2,
  TREE_HEIGHT_STORY_3,
  CANVAS_WIDTH,
  NOTE_TYPE_SWIPE,
  NOTE_TYPE_HOLD,
  MAX_MISSES
} from './globals.js';
import { Note } from './note.js';

export class GameLogic {
  constructor(p, player, songManager, ui) {
    this.p = p;
    this.player = player;
    this.songManager = songManager;
    this.ui = ui;
  }

  startGame() {
    // Load first song
    gameState.currentSong = this.songManager.loadSong(0);
    gameState.gamePhase = PHASE_PLAYING;
    gameState.framesSinceStart = 0;
    gameState.notes = [];
    gameState.entities = [this.player];
    gameState.notesHitThisSong = 0;
    gameState.totalNotesThisSong = this.songManager.getTotalNotes();
    gameState.songComplete = false;
    gameState.missesInLevel = 0;
    
    this.p.logs.game_info.push({
      data: { phase: PHASE_PLAYING, song: gameState.currentSong.name },
      framecount: this.p.frameCount,
      timestamp: Date.now()
    });
  }

  update() {
    if (gameState.gamePhase !== PHASE_PLAYING) return;

    gameState.framesSinceStart++;
    this.player.update();

    // Spawn notes based on song pattern
    const nextNote = this.songManager.getNextNote(gameState.framesSinceStart);
    if (nextNote) {
      const note = new Note(
        this.p,
        nextNote.lane,
        nextNote.type,
        nextNote.holdDuration
      );
      gameState.notes.push(note);
    }

    // Update notes
    for (let i = gameState.notes.length - 1; i >= 0; i--) {
      const note = gameState.notes[i];
      note.update();

      // Update holding notes - auto-release if held too long
      if (note === gameState.holdingNote && note.updateHold()) {
        this.releaseHoldNote(note, true);
      }

      // Remove inactive notes
      if (!note.active) {
        if (!note.hit && note.type !== "HOLD") {
          this.missNote(note);
        } else if (note.type === "HOLD" && !note.hit) {
          this.missNote(note);
        }
        gameState.notes.splice(i, 1);
      }
    }

    // Check if song is complete
    if (this.songManager.isPatternComplete() && gameState.notes.length === 0) {
      if (!gameState.songComplete) {
        this.completeSong();
      }
    }

    // Check win condition
    if (gameState.treeHeight >= TREE_HEIGHT_TARGET) {
      this.winGame();
    }

    this.ui.update();
  }

  hitNote(inputType = 'STANDARD') {
    // Find the closest note in player's lane
    let closestNote = null;
    let closestDist = Infinity;

    for (const note of gameState.notes) {
      if (note.lane === this.player.lane && !note.hit && note.canHit()) {
        const dist = Math.abs(note.y - this.player.y);
        if (dist < closestDist) {
          closestDist = dist;
          closestNote = note;
        }
      }
    }

    if (closestNote) {
      // Validate Input Type
      const isSwipe = closestNote.type === NOTE_TYPE_SWIPE;
      const isHuman = gameState.controlMode === 'HUMAN';

      if (isHuman) {
        if (isSwipe && inputType !== 'SPECIAL') {
          // Yellow notes require Z (Special)
          return;
        }
        if (!isSwipe && inputType === 'SPECIAL') {
          // Normal/Hold notes require Space (Standard)
          return;
        }
      }

      if (closestNote.type === NOTE_TYPE_HOLD) {
        if (closestNote.startHold()) {
          gameState.holdingNote = closestNote;
          const timing = closestNote.getHitTiming();
          this.player.triggerGlow();
          this.ui.showFeedback("Hold Start", closestNote.x, closestNote.y);
        }
      } else {
        // Regular note (single or swipe)
        this.processHit(closestNote);
      }
    }
  }

  releaseHoldKey() {
    if (gameState.holdingNote) {
      this.releaseHoldNote(gameState.holdingNote, false);
    }
  }

  releaseHoldNote(note, autoRelease) {
    const success = note.releaseHold();
    
    if (success) {
      // Successful hold release with timing
      this.processHoldRelease(note);
    } else {
      // Auto-released because held too long or released too early - give miss
      this.ui.showFeedback("Miss", note.x, note.y);
      gameState.combo = 0;
      gameState.missedHits++;
      gameState.missesInLevel++;
      this.checkLoseCondition();
    }
    
    note.active = false;
    gameState.holdingNote = null;
  }

  processHoldRelease(note) {
    // Use tail timing for hold notes
    const timing = note.getTailHitTiming();
    
    let points = 0;
    let treeGrowth = 0;

    if (timing === "Perfect") {
      points = 100;
      treeGrowth = 0.15; // Increased from 0.1
      gameState.perfectHits++;
      gameState.combo++;
    } else if (timing === "Great") {
      points = 75;
      treeGrowth = 0.10; // Increased from 0.06
      gameState.greatHits++;
      gameState.combo++;
    } else if (timing === "Good") {
      points = 50;
      treeGrowth = 0.05; // Increased from 0.04
      gameState.goodHits++;
      gameState.combo++;
    } else {
      gameState.combo = 0;
      gameState.missedHits++;
      gameState.missesInLevel++;
      this.checkLoseCondition();
      this.ui.showFeedback("Miss", note.x, note.y);
      return;
    }

    // Apply combo multiplier
    const comboMultiplier = 1 + Math.floor(gameState.combo / 10) * 0.1;
    points = Math.floor(points * comboMultiplier);
    treeGrowth *= comboMultiplier;

    // Bonus for hold notes
    points += 50;
    treeGrowth += 0.05;

    gameState.score += points;
    gameState.treeHeight += treeGrowth;
    gameState.maxCombo = Math.max(gameState.maxCombo, gameState.combo);
    gameState.notesHitThisSong++;

    this.player.triggerGlow();
    this.ui.showFeedback(timing + " Release!", note.x, note.y - note.holdLength);

    // Check for story unlocks
    this.checkStoryUnlocks();
  }

  processHit(note, isHoldComplete = false) {
    const timing = note.getHitTiming();
    note.hit = true;
    
    if (note.type !== "HOLD") {
      note.active = false;
    }

    let points = 0;
    let treeGrowth = 0;

    if (timing === "Perfect") {
      points = 100;
      treeGrowth = 0.15; // Increased from 0.1
      gameState.perfectHits++;
      gameState.combo++;
    } else if (timing === "Great") {
      points = 75;
      treeGrowth = 0.10; // Increased from 0.06
      gameState.greatHits++;
      gameState.combo++;
    } else if (timing === "Good") {
      points = 50;
      treeGrowth = 0.05; // Increased from 0.04
      gameState.goodHits++;
      gameState.combo++;
    } else {
      gameState.combo = 0;
      this.ui.showFeedback("Miss", note.x, note.y);
      return;
    }

    // Apply combo multiplier
    const comboMultiplier = 1 + Math.floor(gameState.combo / 10) * 0.1;
    points = Math.floor(points * comboMultiplier);
    treeGrowth *= comboMultiplier;

    // Bonus for hold notes (this is for the initial hold start, not release)
    if (isHoldComplete) {
      points += 50;
      treeGrowth += 0.05;
      this.ui.showFeedback("Hold Complete!", note.x, note.y);
    } else {
      this.ui.showFeedback(timing, note.x, note.y);
    }

    gameState.score += points;
    gameState.treeHeight += treeGrowth;
    gameState.maxCombo = Math.max(gameState.maxCombo, gameState.combo);
    gameState.notesHitThisSong++;

    this.player.triggerGlow();

    // Check for story unlocks
    this.checkStoryUnlocks();
  }

  missNote(note) {
    gameState.missedHits++;
    gameState.missesInLevel++;
    gameState.combo = 0;
    this.checkLoseCondition();
  }

  checkLoseCondition() {
    if (gameState.missesInLevel >= MAX_MISSES) {
      this.loseGame();
    }
  }

  checkStoryUnlocks() {
    if (gameState.treeHeight >= TREE_HEIGHT_STORY_1 && gameState.storyProgress === 0) {
      gameState.storyProgress = 1;
      this.songManager.unlockNextSong();
      gameState.unlockedSongs++;
    } else if (gameState.treeHeight >= TREE_HEIGHT_STORY_2 && gameState.storyProgress === 1) {
      gameState.storyProgress = 2;
      this.songManager.unlockNextSong();
      gameState.unlockedSongs++;
    } else if (gameState.treeHeight >= TREE_HEIGHT_STORY_3 && gameState.storyProgress === 2) {
      gameState.storyProgress = 3;
      this.songManager.unlockNextSong();
      gameState.unlockedSongs++;
    }
  }

  completeSong() {
    gameState.songComplete = true;
    gameState.songsCompleted++;

    // Add song completion bonus
    const accuracy = gameState.notesHitThisSong / gameState.totalNotesThisSong;
    const bonus = gameState.currentSong.treeGrowth * accuracy;
    gameState.treeHeight += bonus;
    gameState.score += Math.floor(bonus * 100);

    // Load next song if available and not won yet
    if (gameState.treeHeight < TREE_HEIGHT_TARGET) {
      let nextSongId = (gameState.currentSong.id + 1) % this.songManager.songs.length;
      const nextSong = this.songManager.getSong(nextSongId);
      if (!nextSong.unlocked) {
        nextSongId = gameState.currentSong.id; // Repeat if next not unlocked
      }

      setTimeout(() => {
        if (gameState.gamePhase === PHASE_PLAYING) {
          gameState.currentSong = this.songManager.loadSong(nextSongId);
          gameState.framesSinceStart = 0;
          gameState.notesHitThisSong = 0;
          gameState.totalNotesThisSong = this.songManager.getTotalNotes();
          gameState.songComplete = false;
          gameState.notes = [];
          gameState.missesInLevel = 0; // Reset misses for new level
        }
      }, 100);
    }
  }

  winGame() {
    gameState.gamePhase = PHASE_GAME_OVER_WIN;
    this.p.logs.game_info.push({
      data: { 
        phase: PHASE_GAME_OVER_WIN, 
        finalScore: gameState.score,
        treeHeight: gameState.treeHeight 
      },
      framecount: this.p.frameCount,
      timestamp: Date.now()
    });
  }

  loseGame() {
    gameState.gamePhase = PHASE_GAME_OVER_LOSE;
    this.p.logs.game_info.push({
      data: { 
        phase: PHASE_GAME_OVER_LOSE, 
        reason: "Too many misses"
      },
      framecount: this.p.frameCount,
      timestamp: Date.now()
    });
  }

  pauseGame() {
    if (gameState.gamePhase === PHASE_PLAYING) {
      gameState.gamePhase = PHASE_PAUSED;
      this.p.logs.game_info.push({
        data: { phase: PHASE_PAUSED },
        framecount: this.p.frameCount,
        timestamp: Date.now()
      });
    }
  }

  unpauseGame() {
    if (gameState.gamePhase === PHASE_PAUSED) {
      gameState.gamePhase = PHASE_PLAYING;
      this.p.logs.game_info.push({
        data: { phase: PHASE_PLAYING },
        framecount: this.p.frameCount,
        timestamp: Date.now()
      });
    }
  }

  restartGame() {
    gameState.score = 0;
    gameState.combo = 0;
    gameState.maxCombo = 0;
    gameState.treeHeight = 0;
    gameState.perfectHits = 0;
    gameState.greatHits = 0;
    gameState.goodHits = 0;
    gameState.missedHits = 0;
    gameState.missesInLevel = 0;
    gameState.songsCompleted = 0;
    gameState.storyProgress = 0;
    gameState.unlockedSongs = 1;
    gameState.notes = [];
    gameState.holdingNote = null;
    gameState.gamePhase = PHASE_START;
    
    // Reset song manager
    this.songManager.songs.forEach((song, i) => {
      song.unlocked = (i === 0);
    });

    this.p.logs.game_info.push({
      data: { phase: PHASE_START },
      framecount: this.p.frameCount,
      timestamp: Date.now()
    });
  }
}