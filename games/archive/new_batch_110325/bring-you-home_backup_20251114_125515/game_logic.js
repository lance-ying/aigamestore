// game_logic.js - Core game logic

import { gameState, PHASE_START, PHASE_PLAYING, PHASE_PAUSED, PHASE_GAME_OVER_WIN, PHASE_GAME_OVER_LOSE, POLO_IDLE, POLO_WALKING, POLO_DEAD, POLO_SUCCESS } from './globals.js';
import { createLevelPanels } from './panel.js';
import { Polo } from './polo.js';

export function startGame(p) {
  gameState.gamePhase = PHASE_PLAYING;
  gameState.currentWorld = 0;
  gameState.currentLevel = 0;
  gameState.score = 0;
  
  loadLevel(p);
  
  p.logs.game_info.push({
    data: { phase: "PLAYING", world: gameState.currentWorld, level: gameState.currentLevel },
    framecount: p.frameCount,
    timestamp: Date.now()
  });
}

export function pauseGame(p) {
  gameState.gamePhase = PHASE_PAUSED;
  p.logs.game_info.push({
    data: { phase: "PAUSED" },
    framecount: p.frameCount,
    timestamp: Date.now()
  });
}

export function unpauseGame(p) {
  gameState.gamePhase = PHASE_PLAYING;
  p.logs.game_info.push({
    data: { phase: "PLAYING" },
    framecount: p.frameCount,
    timestamp: Date.now()
  });
}

export function restartGame(p) {
  gameState.gamePhase = PHASE_START;
  gameState.currentWorld = 0;
  gameState.currentLevel = 0;
  gameState.score = 0;
  gameState.panels = [];
  gameState.selectedPanels = [];
  gameState.poloState = POLO_IDLE;
  gameState.player = null;
  gameState.entities = [];
  
  p.logs.game_info.push({
    data: { phase: "START" },
    framecount: p.frameCount,
    timestamp: Date.now()
  });
}

export function loadLevel(p) {
  // Create panels for current level
  gameState.panels = createLevelPanels(gameState.currentWorld, gameState.currentLevel);
  gameState.selectedPanels = [];
  
  // Position panels
  positionPanels();
  
  // Create Polo
  gameState.player = new Polo();
  gameState.entities = [gameState.player];
  gameState.poloState = POLO_IDLE;
  gameState.poloPosition = { panelIndex: 0, progress: 0 };
  gameState.rewindAvailable = true;
  gameState.moveHistory = [];
  
  // Position Polo at start
  updatePoloPosition();
}

function positionPanels() {
  const panelWidth = 120;
  const panelHeight = 100;
  const startX = 10;
  const startY = 80; // Moved higher to reduce blank space
  const cols = 5;
  
  gameState.panels.forEach((panel, idx) => {
    const col = idx % cols;
    const row = Math.floor(idx / cols);
    panel.setPosition(startX + col * panelWidth, startY + row * panelHeight);
  });
}

export function startPoloWalking(p) {
  if (gameState.poloState === POLO_IDLE) {
    gameState.poloState = POLO_WALKING;
    gameState.poloPosition = { panelIndex: 0, progress: 0 };
    gameState.rewindAvailable = true;
  }
}

export function rewindPolo(p) {
  if (gameState.rewindAvailable) {
    gameState.poloState = POLO_IDLE;
    gameState.poloPosition = { panelIndex: 0, progress: 0 };
    updatePoloPosition();
    gameState.rewindAvailable = true;
  }
}

export function updateGame(p) {
  if (gameState.gamePhase !== PHASE_PLAYING) return;
  
  // Update panels
  gameState.panels.forEach(panel => {
    panel.update(p, p.frameCount);
  });
  
  // Update Polo
  if (gameState.player) {
    gameState.player.update(p.frameCount);
  }
  
  // Update Polo movement
  if (gameState.poloState === POLO_WALKING) {
    updatePoloMovement(p);
  }
}

function updatePoloMovement(p) {
  gameState.poloPosition.progress += gameState.poloSpeed;
  
  // Check if moved to next panel
  if (gameState.poloPosition.progress >= 1.0) {
    gameState.poloPosition.progress = 0;
    gameState.poloPosition.panelIndex++;
    
    // Check if reached end
    if (gameState.poloPosition.panelIndex >= gameState.panels.length) {
      // Should have reached exit by now
      const lastPanel = gameState.panels[gameState.panels.length - 1];
      if (lastPanel.isExit()) {
        handleLevelComplete(p);
      } else {
        handlePoloDeath(p);
      }
      return;
    }
    
    // Check current panel for hazards
    const currentPanel = gameState.panels[gameState.poloPosition.panelIndex];
    
    if (currentPanel.isExit()) {
      handleLevelComplete(p);
      return;
    }
    
    if (currentPanel.isDangerous()) {
      handlePoloDeath(p);
      return;
    }
  }
  
  updatePoloPosition();
  
  // Log player info
  if (p.frameCount % 30 === 0) {
    p.logs.player_info.push({
      screen_x: gameState.player.x,
      screen_y: gameState.player.y,
      game_x: gameState.poloPosition.panelIndex + gameState.poloPosition.progress,
      game_y: 0,
      framecount: p.frameCount
    });
  }
}

function updatePoloPosition() {
  if (gameState.panels.length === 0 || !gameState.player) return;
  
  const panelIndex = Math.min(gameState.poloPosition.panelIndex, gameState.panels.length - 1);
  const panel = gameState.panels[panelIndex];
  const progress = gameState.poloPosition.progress;
  
  // Position Polo on the path
  const poloX = panel.x + 20 + (panel.width - 40) * progress;
  const poloY = panel.y + panel.height - 30;
  
  gameState.player.setPosition(poloX, poloY);
}

function handlePoloDeath(p) {
  gameState.poloState = POLO_DEAD;
  gameState.player.state = POLO_DEAD;
  
  // Allow rewind
  gameState.rewindAvailable = true;
  
  p.logs.game_info.push({
    data: { event: "POLO_DIED", panel: gameState.poloPosition.panelIndex },
    framecount: p.frameCount,
    timestamp: Date.now()
  });
}

function handleLevelComplete(p) {
  gameState.poloState = POLO_SUCCESS;
  gameState.player.state = POLO_SUCCESS;
  gameState.score += 100;
  
  // Move to next level
  setTimeout(() => {
    advanceLevel(p);
  }, 1000);
  
  p.logs.game_info.push({
    data: { event: "LEVEL_COMPLETE", world: gameState.currentWorld, level: gameState.currentLevel, score: gameState.score },
    framecount: p.frameCount,
    timestamp: Date.now()
  });
}

function advanceLevel(p) {
  gameState.currentLevel++;
  
  if (gameState.currentLevel >= gameState.levelsPerWorld) {
    // Advance world
    gameState.currentLevel = 0;
    gameState.currentWorld++;
    
    if (gameState.currentWorld >= gameState.totalWorlds) {
      // Win game
      gameState.gamePhase = PHASE_GAME_OVER_WIN;
      p.logs.game_info.push({
        data: { phase: "GAME_OVER_WIN", finalScore: gameState.score },
        framecount: p.frameCount,
        timestamp: Date.now()
      });
      return;
    }
  }
  
  // Load next level
  loadLevel(p);
}