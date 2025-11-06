// gameplay.js - Core gameplay logic

import { gameState, SCORE_VALUES, LIFE_CHANGES, getComboMultiplier, TIMING_PERFECT, TIMING_GREAT } from './globals.js';
import { Note, Particle, HitFeedback } from './entities.js';
import { LEVEL_DEFINITIONS } from './levels.js';

export function updateGameplay(p) {
  if (gameState.gamePhase !== 'PLAYING') return;
  
  // Update song time
  gameState.songTimeElapsed = Date.now() - gameState.songStartTime;
  
  // Get current level definition
  const levelDef = LEVEL_DEFINITIONS[gameState.currentLevel - 1];
  
  // Spawn notes from chart
  spawnNotes(p);
  
  // Update active notes
  updateNotes(p, levelDef.scrollSpeed);
  
  // Update hold notes
  updateHoldNotes(p);
  
  // Update particles
  updateParticles(p);
  
  // Update hit feedback
  updateHitFeedback(p);
  
  // Check game over conditions
  checkGameOver(p);
  
  // Check level complete
  checkLevelComplete(p);
}

function spawnNotes(p) {
  const chart = gameState.currentChart;
  
  while (gameState.chartIndex < chart.length) {
    const noteData = chart[gameState.chartIndex];
    const spawnTime = noteData.time - 2000; // Spawn 2 seconds before hit
    
    if (gameState.songTimeElapsed >= spawnTime) {
      const note = new Note(noteData.time, noteData.lane, noteData.type, noteData.duration || 0);
      gameState.activeNotes.push(note);
      gameState.entities.push(note);
      gameState.chartIndex++;
    } else {
      break;
    }
  }
}

function updateNotes(p, scrollSpeed) {
  for (let i = gameState.activeNotes.length - 1; i >= 0; i--) {
    const note = gameState.activeNotes[i];
    const result = note.update(p, scrollSpeed);
    
    if (result === 'miss' && note.type === 'tap') {
      handleMiss(p, note);
      gameState.activeNotes.splice(i, 1);
    }
    
    if (note.status !== 'active') {
      if (note.type === 'tap' || (note.type === 'hold' && note.status !== 'active')) {
        gameState.activeNotes.splice(i, 1);
      }
    }
  }
}

function updateHoldNotes(p) {
  for (const note of gameState.activeNotes) {
    if (note.type === 'hold' && note.holdPressed) {
      const laneKey = gameState.keyBindings[note.lane];
      const keyPressed = gameState.keyState[laneKey] || false;
      const result = note.updateHold(p, keyPressed);
      
      if (result === 'hold_interval') {
        const multiplier = getComboMultiplier(gameState.combo);
        const points = Math.floor(SCORE_VALUES.holdInterval * multiplier);
        gameState.score += points;
        gameState.lifeBar = Math.min(100, gameState.lifeBar + LIFE_CHANGES.holdInterval);
      } else if (result === 'hold_complete') {
        handleHit(p, note, 'great');
      } else if (result === 'miss') {
        handleMiss(p, note);
      }
    }
  }
}

function updateParticles(p) {
  for (let i = gameState.particleEffects.length - 1; i >= 0; i--) {
    const particle = gameState.particleEffects[i];
    particle.update();
    if (particle.isDead()) {
      gameState.particleEffects.splice(i, 1);
    }
  }
}

function updateHitFeedback(p) {
  for (let i = gameState.recentHitFeedback.length - 1; i >= 0; i--) {
    const feedback = gameState.recentHitFeedback[i];
    feedback.update();
    if (feedback.isDead()) {
      gameState.recentHitFeedback.splice(i, 1);
    }
  }
}

export function handleNoteHit(p, keyCode) {
  if (gameState.gamePhase !== 'PLAYING') return;
  
  const levelDef = LEVEL_DEFINITIONS[gameState.currentLevel - 1];
  
  // Find closest note in the lane
  let closestNote = null;
  let closestDist = Infinity;
  
  for (const note of gameState.activeNotes) {
    const laneKey = gameState.keyBindings[note.lane];
    if (keyCode === laneKey && note.status === 'active') {
      const timeDiff = Math.abs(note.time - gameState.songTimeElapsed);
      if (timeDiff < closestDist && timeDiff <= levelDef.timingGoodWindow) {
        closestDist = timeDiff;
        closestNote = note;
      }
    }
  }
  
  if (closestNote) {
    const result = closestNote.checkHit(p, keyCode, levelDef.timingGoodWindow);
    
    if (result === 'perfect' || result === 'great' || result === 'good') {
      handleHit(p, closestNote, result);
    } else if (result === 'hold_start') {
      // Hold note started successfully
      gameState.combo++;
      createParticles(p, closestNote);
    }
  } else {
    // Wrong key or bad timing - break combo
    gameState.combo = 0;
  }
}

function handleHit(p, note, accuracy) {
  // Update accuracy count
  gameState.accuracyCount[accuracy]++;
  
  // Calculate score
  const multiplier = getComboMultiplier(gameState.combo);
  const baseScore = SCORE_VALUES[accuracy];
  const points = Math.floor(baseScore * multiplier);
  gameState.score += points;
  
  // Update combo
  gameState.combo++;
  gameState.maxCombo = Math.max(gameState.maxCombo, gameState.combo);
  
  // Update life bar
  gameState.lifeBar = Math.min(100, gameState.lifeBar + LIFE_CHANGES[accuracy]);
  
  // Create visual feedback
  createHitFeedback(p, note, accuracy);
  createParticles(p, note);
  
  // Log player info
  logPlayerInfo(p);
}

function handleMiss(p, note) {
  gameState.accuracyCount.miss++;
  gameState.combo = 0;
  gameState.lifeBar = Math.max(0, gameState.lifeBar + LIFE_CHANGES.miss);
  
  createHitFeedback(p, note, 'miss');
  
  logPlayerInfo(p);
}

function createParticles(p, note) {
  const x = 100 + note.lane * 100 + 50;
  const y = note.y;
  const color = [255, 255, 255];
  
  for (let i = 0; i < 10; i++) {
    gameState.particleEffects.push(new Particle(x, y, color));
  }
}

function createHitFeedback(p, note, accuracy) {
  const x = 100 + note.lane * 100 + 50;
  const y = note.y - 40;
  gameState.recentHitFeedback.push(new HitFeedback(accuracy, x, y));
}

function checkGameOver(p) {
  if (gameState.lifeBar <= 0) {
    gameState.gamePhase = 'GAME_OVER';
    p.logs.game_info.push({
      data: { phase: 'GAME_OVER', result: 'LOSE', finalScore: gameState.score },
      framecount: p.frameCount,
      timestamp: Date.now()
    });
  }
}

function checkLevelComplete(p) {
  // Check if all notes have been processed
  if (gameState.chartIndex >= gameState.currentChart.length && gameState.activeNotes.length === 0) {
    if (gameState.lifeBar > 0) {
      gameState.gamePhase = 'LEVEL_COMPLETE';
      
      // Update unlocked levels
      if (gameState.currentLevel === gameState.unlockedLevels && gameState.currentLevel < gameState.totalLevels) {
        gameState.unlockedLevels++;
      }
      
      p.logs.game_info.push({
        data: { phase: 'LEVEL_COMPLETE', result: 'WIN', finalScore: gameState.score, level: gameState.currentLevel },
        framecount: p.frameCount,
        timestamp: Date.now()
      });
    }
  }
}

function logPlayerInfo(p) {
  p.logs.player_info.push({
    screen_x: 0,
    screen_y: 0,
    game_x: 0,
    game_y: 0,
    score: gameState.score,
    combo: gameState.combo,
    lifeBar: gameState.lifeBar,
    framecount: p.frameCount
  });
}