// game_logic.js - Core game logic
import {
  gameState,
  PHASE_START,
  PHASE_PLAYING,
  PHASE_PAUSED,
  PHASE_LOADING_LEVEL,
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
    if (gameState.gamePhase === PHASE_LOADING_LEVEL) {
      gameState.loadingFrame++;
      if (gameState.loadingFrame > 120) {
        this.startNextLevel();
      }
      return;
    }

    if (gameState.gamePhase !== PHASE_PLAYING) return;

    gameState.framesSinceStart++;
    this.player.update();

    const nextNote = this.songManager.getNextNote(gameState.framesSinceStart);
    if (nextNote) {
      const note = new Note(
        this.p,
        nextNote.lane,
        nextNote.type,
        nextNote.holdDuration,
        nextNote.speed
      );
      gameState.notes.push(note);
    }

    for (let i = gameState.notes.length - 1; i >= 0; i--) {
      const note = gameState.notes[i];
      note.update();

      if (note === gameState.holdingNote && note.updateHold()) {
        this.releaseHoldNote(note, true);
      }

      if (!note.active) {
        if (!note.hit && note.type !== "HOLD") {
          this.missNote(note);
        } else if (note.type === "HOLD" && !note.hit) {
          this.missNote(note);
        }
        gameState.notes.splice(i, 1);
      }
    }

    if (this.songManager.isPatternComplete() && gameState.notes.length === 0) {
      if (!gameState.songComplete) {
        this.completeSong();
      }
    }

    this.ui.update();
  }

  hitNote(inputType = 'STANDARD') {
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
      const isSwipe = closestNote.type === NOTE_TYPE_SWIPE;
      const isHuman = gameState.controlMode === 'HUMAN';

      if (isHuman) {
        if (isSwipe && inputType !== 'SPECIAL') {
          return;
        }
        if (!isSwipe && inputType === 'SPECIAL') {
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
      this.processHoldRelease(note);
    } else {
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
    const timing = note.getTailHitTiming();
    
    let points = 0;
    let treeGrowth = 0;

    if (timing === "Perfect") {
      points = 100;
      treeGrowth = 0.15;
      gameState.perfectHits++;
      gameState.combo++;
    } else if (timing === "Great") {
      points = 75;
      treeGrowth = 0.10;
      gameState.greatHits++;
      gameState.combo++;
    } else if (timing === "Good") {
      points = 50;
      treeGrowth = 0.05;
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

    const comboMultiplier = 1 + Math.floor(gameState.combo / 10) * 0.1;
    points = Math.floor(points * comboMultiplier);
    treeGrowth *= comboMultiplier;

    points += 50;
    treeGrowth += 0.05;

    gameState.score += points;
    gameState.treeHeight += treeGrowth;
    gameState.maxCombo = Math.max(gameState.maxCombo, gameState.combo);
    gameState.notesHitThisSong++;

    this.player.triggerGlow();
    this.ui.showFeedback(timing + " Release!", note.x, note.y - note.holdLength);

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
      treeGrowth = 0.15;
      gameState.perfectHits++;
      gameState.combo++;
    } else if (timing === "Great") {
      points = 75;
      treeGrowth = 0.10;
      gameState.greatHits++;
      gameState.combo++;
    } else if (timing === "Good") {
      points = 50;
      treeGrowth = 0.05;
      gameState.goodHits++;
      gameState.combo++;
    } else {
      gameState.combo = 0;
      this.ui.showFeedback("Miss", note.x, note.y);
      return;
    }

    const comboMultiplier = 1 + Math.floor(gameState.combo / 10) * 0.1;
    points = Math.floor(points * comboMultiplier);
    treeGrowth *= comboMultiplier;

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

    const accuracy = gameState.notesHitThisSong / gameState.totalNotesThisSong;
    const bonus = gameState.currentSong.treeGrowth * accuracy;
    gameState.treeHeight += bonus;
    gameState.score += Math.floor(bonus * 100);

    gameState.gamePhase = PHASE_LOADING_LEVEL;
    gameState.loadingFrame = 0;
  }

  startNextLevel() {
    let nextSongId = (gameState.currentSong.id + 1) % this.songManager.songs.length;
    
    const nextSong = this.songManager.getSong(nextSongId);
    if (!nextSong.unlocked) {
      nextSong.unlocked = true;
      gameState.unlockedSongs++;
    }

    gameState.currentSong = this.songManager.loadSong(nextSongId);
    
    gameState.framesSinceStart = 0;
    gameState.notesHitThisSong = 0;
    gameState.totalNotesThisSong = this.songManager.getTotalNotes();
    gameState.songComplete = false;
    gameState.notes = [];
    gameState.holdingNote = null;
    
    gameState.combo = 0;
    gameState.missesInLevel = 0;
    
    gameState.gamePhase = PHASE_PLAYING;
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
    // Clear any pending auto-restart if a manual restart (R key) occurs
    if (gameState.autoRestartTimeoutId) {
      window.clearTimeout(gameState.autoRestartTimeoutId);
      gameState.autoRestartTimeoutId = null;
    }
    gameState.autoRestartScheduled = false; // Ensure this flag is always reset

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