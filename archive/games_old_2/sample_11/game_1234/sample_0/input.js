// input.js - Input handling
import { gameState, STYLES } from './globals.js';

export function handleKeyPressed(p, key, keyCode) {
  // Log input
  p.logs.inputs.push({
    input_type: "keyPressed",
    data: { key, keyCode },
    framecount: p.frameCount,
    timestamp: Date.now()
  });
  
  // Phase-specific controls
  if (keyCode === 13) { // ENTER
    if (gameState.gamePhase === "START") {
      startGame(p);
    } else if (gameState.showLevelComplete) {
      advanceToNextLevel(p);
    }
  } else if (keyCode === 27) { // ESC
    if (gameState.gamePhase === "PLAYING") {
      pauseGame(p);
    } else if (gameState.gamePhase === "PAUSED") {
      unpauseGame(p);
    }
  } else if (keyCode === 82) { // R
    restartGame(p);
  }
  
  // Gameplay controls
  if (gameState.gamePhase === "PLAYING" && !gameState.showLevelComplete) {
    handleGameplayInput(p, keyCode);
  }
}

function handleGameplayInput(p, keyCode) {
  if (keyCode === 37) { // Arrow Left
    if (gameState.focusedIconIndex >= 0) {
      gameState.focusedIconIndex = Math.max(0, gameState.focusedIconIndex - 1);
      recordInteraction(p);
    }
  } else if (keyCode === 39) { // Arrow Right
    if (gameState.focusedIconIndex >= 0) {
      const maxIndex = gameState.availableIcons.length - 1;
      gameState.focusedIconIndex = Math.min(maxIndex, gameState.focusedIconIndex + 1);
      recordInteraction(p);
    } else {
      gameState.focusedIconIndex = 0;
      recordInteraction(p);
    }
  } else if (keyCode === 38) { // Arrow Up
    if (gameState.focusedBeatboxerIndex >= 0) {
      gameState.focusedBeatboxerIndex = Math.max(0, gameState.focusedBeatboxerIndex - 1);
      recordInteraction(p);
    }
  } else if (keyCode === 40) { // Arrow Down
    if (gameState.focusedBeatboxerIndex >= 0) {
      const maxIndex = gameState.beatboxers.length - 1;
      gameState.focusedBeatboxerIndex = Math.min(maxIndex, gameState.focusedBeatboxerIndex + 1);
      recordInteraction(p);
    } else {
      gameState.focusedBeatboxerIndex = 0;
      recordInteraction(p);
    }
  } else if (keyCode === 32) { // Space
    handleSpaceKey(p);
  } else if (keyCode === 90) { // Z
    clearAllIcons(p);
  } else if (keyCode === 16) { // Shift (for style switching)
    // Handled in combination with arrow keys
  }
  
  // Shift + Arrow keys for style switching
  if (p.keyIsDown(16)) { // Shift is held
    if (keyCode === 37 && gameState.unlockedStyles.length > 1) {
      switchToPreviousStyle(p);
    } else if (keyCode === 39 && gameState.unlockedStyles.length > 1) {
      switchToNextStyle(p);
    }
  }
}

function handleSpaceKey(p) {
  if (gameState.pickedUpIcon !== null) {
    // Drop icon onto focused beatboxer
    if (gameState.focusedBeatboxerIndex >= 0) {
      const beatboxer = gameState.beatboxers[gameState.focusedBeatboxerIndex];
      beatboxer.assignIcon(gameState.pickedUpIcon);
      gameState.score += 10;
      gameState.pickedUpIcon = null;
      recordInteraction(p);
      checkForCombos(p);
    }
  } else if (gameState.focusedIconIndex >= 0) {
    // Pick up focused icon
    const icon = gameState.availableIcons[gameState.focusedIconIndex];
    gameState.pickedUpIcon = icon.id;
    recordInteraction(p);
  } else if (gameState.focusedBeatboxerIndex >= 0) {
    // Toggle mute on focused beatboxer
    const beatboxer = gameState.beatboxers[gameState.focusedBeatboxerIndex];
    if (beatboxer.toggleMute()) {
      recordInteraction(p);
    }
  }
}

function clearAllIcons(p) {
  gameState.beatboxers.forEach(b => b.removeIcon());
  gameState.pickedUpIcon = null;
  recordInteraction(p);
}

function switchToPreviousStyle(p) {
  const currentIndex = gameState.unlockedStyles.indexOf(gameState.currentStyleId);
  if (currentIndex > 0) {
    gameState.currentStyleId = gameState.unlockedStyles[currentIndex - 1];
    loadStyle(p);
    recordInteraction(p);
  }
}

function switchToNextStyle(p) {
  const currentIndex = gameState.unlockedStyles.indexOf(gameState.currentStyleId);
  if (currentIndex < gameState.unlockedStyles.length - 1) {
    gameState.currentStyleId = gameState.unlockedStyles[currentIndex + 1];
    loadStyle(p);
    recordInteraction(p);
  }
}

function startGame(p) {
  gameState.gamePhase = "PLAYING";
  gameState.score = 0;
  gameState.currentStyleId = 0;
  gameState.unlockedStyles = [0];
  gameState.discoveredCombos = new Set();
  gameState.satisfactionMeter = 100;
  gameState.lastInteractionTime = Date.now();
  gameState.showLevelComplete = false;
  
  loadStyle(p);
  
  p.logs.game_info.push({
    data: { phase: "PLAYING", level: STYLES[0].name },
    framecount: p.frameCount,
    timestamp: Date.now()
  });
}

function pauseGame(p) {
  gameState.gamePhase = "PAUSED";
  p.logs.game_info.push({
    data: { phase: "PAUSED" },
    framecount: p.frameCount,
    timestamp: Date.now()
  });
}

function unpauseGame(p) {
  gameState.gamePhase = "PLAYING";
  gameState.lastInteractionTime = Date.now();
  p.logs.game_info.push({
    data: { phase: "PLAYING" },
    framecount: p.frameCount,
    timestamp: Date.now()
  });
}

function restartGame(p) {
  gameState.gamePhase = "START";
  gameState.beatboxers = [];
  gameState.availableIcons = [];
  gameState.focusedIconIndex = -1;
  gameState.focusedBeatboxerIndex = -1;
  gameState.pickedUpIcon = null;
  gameState.comboAnimationActive = false;
  gameState.showLevelComplete = false;
  
  p.logs.game_info.push({
    data: { phase: "START" },
    framecount: p.frameCount,
    timestamp: Date.now()
  });
}

function loadStyle(p) {
  import('./entities.js').then(module => {
    const { Beatboxer, MusicalIcon } = module;
    
    const style = STYLES[gameState.currentStyleId];
    
    // Clear previous state
    gameState.beatboxers = [];
    gameState.availableIcons = [];
    gameState.discoveredCombos = new Set();
    gameState.focusedIconIndex = -1;
    gameState.focusedBeatboxerIndex = -1;
    gameState.pickedUpIcon = null;
    
    // Create beatboxers
    const beatboxerY = 200;
    const spacing = 500 / (style.beatboxerCount + 1);
    for (let i = 0; i < style.beatboxerCount; i++) {
      const x = spacing * (i + 1) + 50;
      gameState.beatboxers.push(new Beatboxer(x, beatboxerY, i, p));
    }
    
    // Create icons
    const iconY = 360;
    const iconSpacing = 550 / (style.iconCount + 1);
    for (let i = 0; i < style.iconCount; i++) {
      const x = iconSpacing * (i + 1) + 25;
      const type = ['beat', 'effect', 'melody', 'voice'][i % 4];
      gameState.availableIcons.push(new MusicalIcon(i, type, x, iconY, p));
    }
    
    gameState.entities = [...gameState.beatboxers, ...gameState.availableIcons];
  });
}

function advanceToNextLevel(p) {
  gameState.showLevelComplete = false;
  gameState.currentStyleId++;
  gameState.unlockedStyles.push(gameState.currentStyleId);
  
  if (gameState.currentStyleId >= STYLES.length) {
    // Won the game
    gameState.gamePhase = "GAME_OVER_WIN";
    p.logs.game_info.push({
      data: { phase: "GAME_OVER_WIN", finalScore: gameState.score },
      framecount: p.frameCount,
      timestamp: Date.now()
    });
  } else {
    loadStyle(p);
    gameState.lastInteractionTime = Date.now();
    p.logs.game_info.push({
      data: { phase: "PLAYING", level: STYLES[gameState.currentStyleId].name },
      framecount: p.frameCount,
      timestamp: Date.now()
    });
  }
}

function recordInteraction(p) {
  gameState.lastInteractionTime = Date.now();
  gameState.satisfactionMeter = Math.min(100, gameState.satisfactionMeter + 5);
}

function checkForCombos(p) {
  const style = STYLES[gameState.currentStyleId];
  const assignedIcons = gameState.beatboxers
    .filter(b => b.assignedIconId !== null && !b.isMuted)
    .map(b => b.assignedIconId)
    .sort((a, b) => a - b);
  
  if (assignedIcons.length < 3) return;
  
  for (const combo of style.combos) {
    const comboKey = combo.icons.slice().sort((a, b) => a - b).join('-');
    
    if (gameState.discoveredCombos.has(comboKey)) continue;
    
    const hasAllIcons = combo.icons.every(iconId => assignedIcons.includes(iconId));
    
    if (hasAllIcons) {
      gameState.discoveredCombos.add(comboKey);
      gameState.score += 500;
      gameState.lastDiscoveredCombo = combo.name;
      gameState.comboAnimationActive = true;
      gameState.comboAnimationTimer = 0;
      gameState.satisfactionMeter = 100;
      
      // Check if level is complete
      if (gameState.discoveredCombos.size >= style.requiredCombos) {
        gameState.score += 1000;
        gameState.showLevelComplete = true;
        gameState.levelCompleteTimer = 0;
      }
      
      break;
    }
  }
}

export { startGame, pauseGame, unpauseGame, restartGame, loadStyle, checkForCombos, recordInteraction };