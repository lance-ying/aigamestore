// game_logic.js - Core game logic

import {
  gameState,
  PHASE_START,
  PHASE_PLAYING,
  PHASE_PAUSED,
  PHASE_GAME_OVER_WIN,
  PHASE_GAME_OVER_LOSE,
  HIT_PERFECT,
  HIT_GREAT,
  HIT_GOOD,
  HIT_MISS,
  NOTE_TYPE_HOLD
} from './globals.js';
import { Note } from './note.js';
import { Particle } from './particle.js';
import { createSongList } from './song.js';

export function initializeGame(p) {
  gameState.notes = [];
  gameState.particles = [];
  gameState.score = 0;
  gameState.combo = 0;
  gameState.maxCombo = 0;
  gameState.health = gameState.maxHealth;
  gameState.songProgress = 0;
  gameState.notesHit = 0;
  gameState.notesMissed = 0;
  gameState.perfectHits = 0;
  gameState.greatHits = 0;
  gameState.goodHits = 0;
  gameState.activeHoldNotes = new Set();
  gameState.lastJudgment = null;
  gameState.judgmentTimer = 0;
  
  // Load song
  const songs = createSongList();
  gameState.currentSong = songs[Math.min(gameState.currentDifficulty - 1, songs.length - 1)];
  gameState.totalNotes = gameState.currentSong.getTotalNotes();
  gameState.songStartTime = p.frameCount;
  
  // Log game start
  p.logs.game_info.push({
    data: { gamePhase: PHASE_PLAYING, song: gameState.currentSong.name },
    framecount: p.frameCount,
    timestamp: Date.now()
  });
}

export function updateGame(p, inputHandler) {
  // Only update if in PLAYING phase
  if (gameState.gamePhase !== PHASE_PLAYING) {
    return;
  }
  
  gameState.songProgress++;
  
  // Spawn notes based on song pattern
  const notesToSpawn = gameState.currentSong.getNotesForFrame(gameState.songProgress);
  notesToSpawn.forEach(noteData => {
    const note = new Note(
      p,
      noteData.type,
      noteData.lane,
      noteData.spawnDistance,
      noteData.requiredKey,
      noteData.holdDuration
    );
    gameState.notes.push(note);
  });
  
  // Update notes
  gameState.notes.forEach(note => note.update());
  
  // Handle input for notes
  handleNoteInputs(p, inputHandler);
  
  // Clean up dead notes
  gameState.notes = gameState.notes.filter(note => {
    if (!note.alive) {
      if (note.missed && !note.hit) {
        handleMiss(p, note);
      }
      return false;
    }
    return true;
  });
  
  // Update particles
  gameState.particles.forEach(particle => particle.update());
  gameState.particles = gameState.particles.filter(particle => !particle.isDead());
  
  // Update judgment timer
  if (gameState.judgmentTimer > 0) {
    gameState.judgmentTimer--;
  }
  
  // Check game over conditions
  if (gameState.health <= 0) {
    gameState.gamePhase = PHASE_GAME_OVER_LOSE;
    p.logs.game_info.push({
      data: { gamePhase: PHASE_GAME_OVER_LOSE, reason: "health depleted" },
      framecount: p.frameCount,
      timestamp: Date.now()
    });
  } else if (gameState.songProgress >= gameState.currentSong.duration) {
    gameState.gamePhase = PHASE_GAME_OVER_WIN;
    p.logs.game_info.push({
      data: { gamePhase: PHASE_GAME_OVER_WIN, finalScore: gameState.score },
      framecount: p.frameCount,
      timestamp: Date.now()
    });
  }
  
  // Log player info periodically
  if (p.frameCount % 30 === 0) {
    p.logs.player_info.push({
      screen_x: 0,
      screen_y: 0,
      game_x: 0,
      game_y: 0,
      health: gameState.health,
      score: gameState.score,
      combo: gameState.combo,
      framecount: p.frameCount
    });
  }
}

function handleNoteInputs(p, inputHandler) {
  const gameplayKeys = [32, 37, 38, 39, 40, 90, 16]; // Space, Arrows, Z, Shift
  
  // Check for key presses on notes
  gameplayKeys.forEach(keyCode => {
    if (inputHandler.isKeyJustPressed(keyCode)) {
      checkNoteHits(p, keyCode);
    }
  });
  
  // Check for hold note releases
  if (inputHandler.isKeyJustReleased(16)) { // Shift
    checkHoldNoteReleases(p);
  }
}

function checkNoteHits(p, keyCode) {
  let hitNote = false;
  
  // Find the closest note that matches the key
  let closestNote = null;
  let closestDist = Infinity;
  
  gameState.notes.forEach(note => {
    if (!note.hit && !note.missed && note.alive) {
      const distFromTarget = p.abs(note.distance - 40); // TARGET_RADIUS
      if ((note.requiredKey === null || note.requiredKey === keyCode) && distFromTarget < closestDist) {
        closestDist = distFromTarget;
        closestNote = note;
      }
    }
  });
  
  if (closestNote) {
    const judgment = closestNote.checkHit(keyCode);
    if (judgment) {
      handleHit(p, closestNote, judgment);
      hitNote = true;
    }
  }
  
  return hitNote;
}

function checkHoldNoteReleases(p) {
  gameState.notes.forEach(note => {
    if (note.type === NOTE_TYPE_HOLD && note.isBeingHeld) {
      const judgment = note.releaseHold();
      if (judgment) {
        if (judgment !== HIT_MISS) {
          handleHit(p, note, judgment);
        } else {
          handleMiss(p, note);
        }
      }
    }
  });
}

function handleHit(p, note, judgment) {
  gameState.notesHit++;
  gameState.lastJudgment = judgment;
  gameState.judgmentTimer = 30;
  
  // Score and combo
  let scoreGain = 0;
  switch (judgment) {
    case HIT_PERFECT:
      scoreGain = 100;
      gameState.perfectHits++;
      gameState.combo++;
      gameState.health = Math.min(gameState.maxHealth, gameState.health + 2);
      break;
    case HIT_GREAT:
      scoreGain = 75;
      gameState.greatHits++;
      gameState.combo++;
      gameState.health = Math.min(gameState.maxHealth, gameState.health + 1);
      break;
    case HIT_GOOD:
      scoreGain = 50;
      gameState.goodHits++;
      gameState.combo++;
      break;
  }
  
  // Combo multiplier
  const comboMultiplier = 1 + Math.floor(gameState.combo / 10) * 0.1;
  scoreGain = Math.floor(scoreGain * comboMultiplier);
  gameState.score += scoreGain;
  
  // Update max combo
  gameState.maxCombo = Math.max(gameState.maxCombo, gameState.combo);
  
  // Create particles
  const pos = note.getPosition();
  for (let i = 0; i < 8; i++) {
    gameState.particles.push(new Particle(p, pos.x, pos.y, note.hue, 'hit'));
  }
  
  // Combo particles
  if (gameState.combo % 10 === 0 && gameState.combo > 0) {
    for (let i = 0; i < 15; i++) {
      gameState.particles.push(new Particle(p, pos.x, pos.y, note.hue, 'combo'));
    }
  }
}

function handleMiss(p, note) {
  gameState.notesMissed++;
  gameState.combo = 0;
  gameState.lastJudgment = HIT_MISS;
  gameState.judgmentTimer = 30;
  
  // Lose health
  gameState.health = Math.max(0, gameState.health - 10);
  
  // Create miss particles
  const pos = note.getPosition();
  for (let i = 0; i < 5; i++) {
    gameState.particles.push(new Particle(p, pos.x, pos.y, 0, 'miss'));
  }
}