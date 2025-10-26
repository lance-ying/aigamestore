// game.js - Main game file

import { gameState, getGameState, CANVAS_WIDTH, CANVAS_HEIGHT } from './globals.js';
import { LEVEL_DATA } from './levelData.js';
import { SceneManager } from './scenes.js';
import { InventoryManager } from './inventory.js';
import { PuzzleManager } from './puzzles.js';
import { TestController } from './testing.js';

const p5 = window.p5;

let gameInstance = new p5(p => {
  let sceneManager;
  let inventoryManager;
  let puzzleManager;
  let testController;

  // Initialize logs
  p.logs = {
    game_info: [],
    inputs: [],
    player_info: []
  };

  p.setup = function() {
    p.createCanvas(CANVAS_WIDTH, CANVAS_HEIGHT);
    p.frameRate(60);
    p.randomSeed(42);

    // Initialize managers
    sceneManager = new SceneManager(p);
    inventoryManager = new InventoryManager(p);
    puzzleManager = new PuzzleManager(p);
    testController = new TestController(p);

    // Initialize game state
    gameState.allLevelsData = LEVEL_DATA;
    
    logGameInfo('Game initialized', { gamePhase: gameState.gamePhase });
  };

  p.draw = function() {
    p.background(20, 15, 25);

    // Handle automated testing
    if (gameState.controlMode !== 'HUMAN') {
      const action = testController.update();
      if (action) {
        handleTestAction(action);
      }
    }

    // Render based on game phase
    if (gameState.gamePhase === 'START') {
      renderStartScreen();
    } else if (gameState.gamePhase === 'PLAYING') {
      renderGameplay();
      updateGameplay();
    } else if (gameState.gamePhase === 'PAUSED') {
      renderGameplay();
      renderPauseOverlay();
    } else if (gameState.gamePhase === 'GAME_OVER_WIN') {
      renderWinScreen();
    } else if (gameState.gamePhase === 'GAME_OVER_LOSE') {
      renderLoseScreen();
    }

    // Level complete overlay
    if (gameState.showLevelComplete) {
      renderLevelCompleteScreen();
    }

    // Hint display
    if (gameState.hintRequested && p.frameCount - gameState.hintDisplayTime < 180) {
      renderHint();
    }
  };

  function renderStartScreen() {
    p.background(15, 10, 20);
    
    // Title with glow effect
    p.textAlign(p.CENTER, p.CENTER);
    
    // Glow
    p.fill(150, 100, 200, 50);
    p.textSize(48);
    p.text('BELL VILLAGE', 300, 90);
    p.text('ECHOES', 300, 140);
    
    // Main text
    p.fill(200, 180, 220);
    p.textSize(48);
    p.text('BELL VILLAGE', 300, 88);
    p.fill(180, 160, 200);
    p.text('ECHOES', 300, 138);

    // Description
    p.fill(140, 130, 160);
    p.textSize(14);
    p.textAlign(p.CENTER, p.CENTER);
    p.text('Escape the haunted shrine by solving ancient puzzles', 300, 190);
    p.text('Navigate scenes, collect items, and unlock mysteries', 300, 210);

    // Instructions
    p.fill(160, 150, 180);
    p.textSize(12);
    p.textAlign(p.LEFT, p.CENTER);
    const instructionsY = 240;
    const lineHeight = 20;
    const instructions = [
      'Arrow Left/Right: Change viewpoint',
      'Arrow Up/Down: Select objects',
      'Space: Interact / Use item',
      'Z: Open/Close inventory',
      'A/D: Navigate inventory',
      'Shift: Request hint (-100 pts)',
      'ESC: Pause game'
    ];
    
    for (let i = 0; i < instructions.length; i++) {
      p.text(instructions[i], 180, instructionsY + i * lineHeight);
    }

    // Start prompt
    const alpha = 200 + 55 * p.sin(p.frameCount * 0.1);
    p.fill(200, 220, 100, alpha);
    p.textSize(20);
    p.textAlign(p.CENTER, p.CENTER);
    p.text('PRESS ENTER TO START', 300, 370);
  }

  function renderGameplay() {
    // Main scene rendering
    sceneManager.renderScene();

    // UI elements
    renderUI();

    // Inventory overlay
    inventoryManager.render();

    // Puzzle overlay
    puzzleManager.render();
  }

  function renderUI() {
    // Level indicator (top-left)
    p.fill(40, 35, 45, 200);
    p.noStroke();
    p.rect(10, 10, 100, 30, 5);
    p.fill(200, 190, 210);
    p.textSize(16);
    p.textAlign(p.LEFT, p.CENTER);
    p.text(`LEVEL: ${gameState.currentLevel}`, 20, 25);

    // Score (top-right)
    p.fill(40, 35, 45, 200);
    p.rect(490, 10, 100, 30, 5);
    p.fill(200, 190, 210);
    p.textAlign(p.RIGHT, p.CENTER);
    p.text(`${String(gameState.score).padStart(6, '0')}`, 580, 25);

    // Timer (top-center)
    const minutes = Math.floor(gameState.levelTimeRemaining / 60);
    const seconds = Math.floor(gameState.levelTimeRemaining % 60);
    const timeStr = `${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`;
    
    const timeColor = gameState.levelTimeRemaining < 60 ? [255, 100, 100] : [200, 190, 210];
    p.fill(40, 35, 45, 200);
    p.rect(250, 10, 100, 30, 5);
    p.fill(...timeColor);
    p.textAlign(p.CENTER, p.CENTER);
    p.text(timeStr, 300, 25);

    // Active item indicator
    if (gameState.activeInventoryItemId && !gameState.inventoryOpen) {
      const activeItem = inventoryManager.getActiveItem();
      if (activeItem) {
        p.fill(40, 35, 45, 200);
        p.rect(220, 360, 160, 30, 5);
        p.fill(100, 255, 100);
        p.textSize(12);
        p.textAlign(p.CENTER, p.CENTER);
        p.text(`Active: ${activeItem.name}`, 300, 375);
      }
    }

    // Current hotspot info
    const hotspots = sceneManager.getHotspots();
    if (hotspots.length > 0 && !gameState.inventoryOpen && !gameState.activePuzzleId) {
      const hotspot = hotspots[gameState.selectedHotspotIndex];
      if (hotspot) {
        p.fill(40, 35, 45, 200);
        p.rect(420, 360, 170, 30, 5);
        p.fill(200, 190, 210);
        p.textSize(12);
        p.textAlign(p.CENTER, p.CENTER);
        p.text(hotspot.name, 505, 375);
      }
    }
  }

  function renderPauseOverlay() {
    p.fill(0, 0, 0, 150);
    p.rect(0, 0, 600, 400);
    
    p.fill(200, 190, 210);
    p.textSize(12);
    p.textAlign(p.RIGHT, p.TOP);
    p.text('PAUSED', 580, 15);

    p.textSize(24);
    p.textAlign(p.CENTER, p.CENTER);
    p.text('GAME PAUSED', 300, 180);
    
    p.textSize(16);
    p.fill(160, 150, 180);
    p.text('ESC: Resume', 300, 220);
    p.text('R: Restart', 300, 245);
  }

  function renderLevelCompleteScreen() {
    p.fill(0, 0, 0, 200);
    p.rect(0, 0, 600, 400);

    p.fill(100, 255, 100);
    p.textSize(32);
    p.textAlign(p.CENTER, p.CENTER);
    p.text('LEVEL COMPLETE!', 300, 80);

    p.fill(200, 190, 210);
    p.textSize(18);
    p.text(`Level ${gameState.currentLevel} Complete`, 300, 130);

    // Score breakdown
    p.textSize(16);
    p.textAlign(p.LEFT, p.CENTER);
    const startY = 170;
    const lineHeight = 25;
    
    p.fill(180, 170, 190);
    p.text(`Level Score:`, 150, startY);
    p.textAlign(p.RIGHT, p.CENTER);
    p.text(`${gameState.levelScore}`, 450, startY);

    p.textAlign(p.LEFT, p.CENTER);
    p.text(`Time Bonus:`, 150, startY + lineHeight);
    p.textAlign(p.RIGHT, p.CENTER);
    p.text(`${gameState.bonuses.timeBonus}`, 450, startY + lineHeight);

    if (gameState.bonuses.noHintBonus > 0) {
      p.textAlign(p.LEFT, p.CENTER);
      p.text(`No Hint Bonus:`, 150, startY + lineHeight * 2);
      p.textAlign(p.RIGHT, p.CENTER);
      p.text(`${gameState.bonuses.noHintBonus}`, 450, startY + lineHeight * 2);
    }

    if (gameState.bonuses.speedRunBonus > 0) {
      p.textAlign(p.LEFT, p.CENTER);
      p.text(`Speed Bonus:`, 150, startY + lineHeight * 3);
      p.textAlign(p.RIGHT, p.CENTER);
      p.text(`${gameState.bonuses.speedRunBonus}`, 450, startY + lineHeight * 3);
    }

    // Total
    p.fill(200, 220, 100);
    p.textSize(20);
    p.textAlign(p.LEFT, p.CENTER);
    p.text(`TOTAL SCORE:`, 150, 280);
    p.textAlign(p.RIGHT, p.CENTER);
    p.text(`${gameState.score}`, 450, 280);

    // Continue prompt
    const alpha = 200 + 55 * p.sin(p.frameCount * 0.1);
    p.fill(200, 220, 100, alpha);
    p.textSize(18);
    p.textAlign(p.CENTER, p.CENTER);
    if (gameState.currentLevel < 3) {
      p.text('PRESS SPACE FOR NEXT LEVEL', 300, 340);
    } else {
      p.text('PRESS SPACE TO CONTINUE', 300, 340);
    }
  }

  function renderWinScreen() {
    p.background(10, 20, 10);

    // Victory glow
    for (let i = 0; i < 5; i++) {
      p.fill(100, 255, 100, 20);
      p.ellipse(300, 150, 400 - i * 50, 400 - i * 50);
    }

    p.fill(100, 255, 100);
    p.textSize(40);
    p.textAlign(p.CENTER, p.CENTER);
    p.text('ESCAPED!', 300, 120);

    p.fill(180, 220, 180);
    p.textSize(20);
    p.text('You have escaped the Bell Village shrine', 300, 170);

    p.fill(200, 220, 200);
    p.textSize(28);
    p.text(`Final Score: ${gameState.score}`, 300, 230);

    p.fill(160, 200, 160);
    p.textSize(16);
    p.text('All puzzles solved and mysteries unveiled', 300, 280);

    const alpha = 200 + 55 * p.sin(p.frameCount * 0.1);
    p.fill(200, 220, 100, alpha);
    p.textSize(18);
    p.text('PRESS R TO RESTART', 300, 340);
  }

  function renderLoseScreen() {
    p.background(20, 10, 10);

    p.fill(255, 100, 100);
    p.textSize(40);
    p.textAlign(p.CENTER, p.CENTER);
    p.text('TIME EXPIRED', 300, 120);

    p.fill(200, 150, 150);
    p.textSize(20);
    p.text('The shrine remains locked...', 300, 170);

    p.fill(220, 180, 180);
    p.textSize(24);
    p.text(`Score: ${gameState.score}`, 300, 230);

    p.fill(180, 140, 140);
    p.textSize(16);
    p.text(`Reached Level ${gameState.currentLevel}`, 300, 270);

    const alpha = 200 + 55 * p.sin(p.frameCount * 0.1);
    p.fill(200, 220, 100, alpha);
    p.textSize(18);
    p.text('PRESS R TO RESTART', 300, 340);
  }

  function renderHint() {
    if (!gameState.currentHint) return;

    p.fill(0, 0, 0, 180);
    p.rect(50, 50, 500, 100, 10);

    p.fill(255, 220, 100);
    p.textSize(16);
    p.textAlign(p.CENTER, p.TOP);
    p.text('HINT (-100 pts)', 300, 60);

    p.fill(220, 210, 200);
    p.textSize(14);
    p.textAlign(p.CENTER, p.CENTER);
    
    const words = gameState.currentHint.split(' ');
    let line = '';
    let y = 100;
    for (let word of words) {
      if (p.textWidth(line + word) > 460) {
        p.text(line, 300, y);
        line = word + ' ';
        y += 20;
      } else {
        line += word + ' ';
      }
    }
    p.text(line, 300, y);
  }

  function updateGameplay() {
    if (gameState.gamePhase !== 'PLAYING') return;

    // Update timer
    gameState.levelTimeRemaining -= 1 / 60;
    
    if (gameState.levelTimeRemaining <= 0) {
      gameState.gamePhase = 'GAME_OVER_LOSE';
      logGameInfo('Game Over - Time Up', { 
        gamePhase: gameState.gamePhase,
        finalScore: gameState.score 
      });
    }

    // Check win conditions
    checkWinConditions();
  }

  function checkWinConditions() {
    const levelData = gameState.allLevelsData[gameState.currentLevel];
    const winCondition = levelData.winCondition;

    if (gameState.hotspotStates[winCondition]) {
      completeLevel();
    }
  }

  function completeLevel() {
    // Calculate bonuses
    const timeBonus = Math.floor(gameState.levelTimeRemaining * 10);
    const noHintBonus = gameState.hintsUsedThisLevel === 0 ? 1000 : 0;
    const levelData = gameState.allLevelsData[gameState.currentLevel];
    const speedThreshold = levelData.timeLimit * 0.6;
    const speedBonus = gameState.levelTimeRemaining > speedThreshold ? 500 : 0;

    gameState.bonuses.timeBonus = timeBonus;
    gameState.bonuses.noHintBonus = noHintBonus;
    gameState.bonuses.speedRunBonus = speedBonus;

    gameState.score += timeBonus + noHintBonus + speedBonus;
    gameState.showLevelComplete = true;
    gameState.levelCompleteDisplayTime = p.frameCount;

    logGameInfo('Level Complete', {
      level: gameState.currentLevel,
      score: gameState.score,
      bonuses: gameState.bonuses
    });
  }

  function advanceToNextLevel() {
    gameState.showLevelComplete = false;
    gameState.currentLevel++;

    if (gameState.currentLevel > 3) {
      gameState.gamePhase = 'GAME_OVER_WIN';
      logGameInfo('Game Complete', {
        gamePhase: gameState.gamePhase,
        finalScore: gameState.score
      });
      return;
    }

    // Reset for next level
    initLevel(gameState.currentLevel);
  }

  function initLevel(level) {
    const levelData = gameState.allLevelsData[level];
    
    gameState.currentSceneId = levelData.scenes[0].id;
    gameState.levelTimeRemaining = levelData.timeLimit;
    gameState.hintsUsedThisLevel = 0;
    gameState.selectedHotspotIndex = 0;
    gameState.activeInventoryItemId = null;
    gameState.activePuzzleId = null;
    gameState.inventoryOpen = false;
    gameState.levelScore = 0;
    gameState.bonuses = { timeBonus: 0, noHintBonus: 0, speedRunBonus: 0 };

    // Keep inventory between levels
    // Reset hotspot states for new level
    const keysToKeep = Object.keys(gameState.hotspotStates).filter(key => 
      key.includes('_collected') && gameState.currentLevel > 1
    );
    gameState.hotspotStates = {};
    keysToKeep.forEach(key => {
      gameState.hotspotStates[key] = true;
    });

    logGameInfo('Level Started', {
      level: gameState.currentLevel,
      timeLimit: levelData.timeLimit
    });
  }

  function startGame() {
    gameState.gamePhase = 'PLAYING';
    gameState.currentLevel = 1;
    gameState.score = 0;
    gameState.inventory = [];
    gameState.hotspotStates = {};
    gameState.puzzleAttempts = {};
    
    initLevel(1);
    
    logGameInfo('Game Started', { gamePhase: gameState.gamePhase });
  }

  function restartGame() {
    gameState.gamePhase = 'START';
    gameState.currentLevel = 1;
    gameState.score = 0;
    gameState.inventory = [];
    gameState.hotspotStates = {};
    gameState.currentSceneId = null;
    gameState.activePuzzleId = null;
    gameState.activeInventoryItemId = null;
    gameState.inventoryOpen = false;
    gameState.showLevelComplete = false;
    gameState.puzzleAttempts = {};
    
    logGameInfo('Game Restarted', { gamePhase: gameState.gamePhase });
  }

  p.keyPressed = function() {
    logInput('keyPressed', { key: p.key, keyCode: p.keyCode });

    // Global controls
    if (p.keyCode === 13) { // ENTER
      if (gameState.gamePhase === 'START') {
        startGame();
      }
      return;
    }

    if (p.keyCode === 82) { // R
      if (gameState.gamePhase === 'GAME_OVER_WIN' || 
          gameState.gamePhase === 'GAME_OVER_LOSE') {
        restartGame();
      }
      return;
    }

    if (p.keyCode === 27) { // ESC
      if (gameState.gamePhase === 'PLAYING') {
        if (gameState.activePuzzleId) {
          puzzleManager.closePuzzle();
        } else if (gameState.inventoryOpen) {
          gameState.inventoryOpen = false;
        } else {
          gameState.gamePhase = 'PAUSED';
          logGameInfo('Game Paused', { gamePhase: gameState.gamePhase });
        }
      } else if (gameState.gamePhase === 'PAUSED') {
        gameState.gamePhase = 'PLAYING';
        logGameInfo('Game Resumed', { gamePhase: gameState.gamePhase });
      }
      return;
    }

    // Gameplay controls
    if (gameState.gamePhase === 'PLAYING') {
      handleGameplayInput(p.keyCode, p.key);
    }

    // Level complete screen
    if (gameState.showLevelComplete && p.keyCode === 32) {
      advanceToNextLevel();
    }
  };

  function handleGameplayInput(keyCode, key) {
    // Puzzle input
    if (gameState.activePuzzleId) {
      puzzleManager.handlePuzzleInput(key, keyCode);
      return;
    }

    // Inventory controls
    if (keyCode === 90) { // Z
      gameState.inventoryOpen = !gameState.inventoryOpen;
      if (!gameState.inventoryOpen && gameState.selectedInventoryIndex < gameState.inventory.length) {
        gameState.activeInventoryItemId = gameState.inventory[gameState.selectedInventoryIndex].id;
      }
      return;
    }

    if (gameState.inventoryOpen) {
      if (keyCode === 65) { // A
        gameState.selectedInventoryIndex = Math.max(0, gameState.selectedInventoryIndex - 1);
      } else if (keyCode === 68) { // D
        gameState.selectedInventoryIndex = Math.min(gameState.inventory.length - 1, 
                                                     gameState.selectedInventoryIndex + 1);
      }
      return;
    }

    // Hint system
    if (keyCode === 16) { // Shift
      requestHint();
      return;
    }

    // Scene navigation
    if (keyCode === 37) { // Left
      sceneManager.navigateScene('left');
    } else if (keyCode === 39) { // Right
      sceneManager.navigateScene('right');
    } else if (keyCode === 38) { // Up
      sceneManager.navigateScene('up');
    } else if (keyCode === 40) { // Down (also cycles hotspots)
      if (!sceneManager.navigateScene('down')) {
        cycleHotspot(1);
      }
    }

    // Hotspot selection
    if (keyCode === 38) { // Up (cycle hotspots)
      cycleHotspot(-1);
    } else if (keyCode === 40) { // Down already handled above
      // cycleHotspot(1);
    }

    // Interaction
    if (keyCode === 32) { // Space
      interactWithHotspot();
    }
  }

  function cycleHotspot(direction) {
    const hotspots = sceneManager.getHotspots();
    if (hotspots.length === 0) return;

    gameState.selectedHotspotIndex += direction;
    if (gameState.selectedHotspotIndex < 0) {
      gameState.selectedHotspotIndex = hotspots.length - 1;
    } else if (gameState.selectedHotspotIndex >= hotspots.length) {
      gameState.selectedHotspotIndex = 0;
    }
  }

  function interactWithHotspot() {
    const hotspots = sceneManager.getHotspots();
    if (hotspots.length === 0) return;

    const hotspot = hotspots[gameState.selectedHotspotIndex];
    if (!hotspot) return;

    if (hotspot.type === 'item') {
      // Collect item
      inventoryManager.addItem(hotspot.itemId);
      gameState.hotspotStates[hotspot.id + '_collected'] = true;
      logGameInfo('Item Collected', { itemId: hotspot.itemId });
    } else if (hotspot.type === 'examine') {
      // Examine object
      gameState.hotspotStates[hotspot.id + '_examined'] = true;
      if (hotspot.revealsPuzzle) {
        gameState.hotspotStates[hotspot.revealsPuzzle + '_revealed'] = true;
      }
      logGameInfo('Object Examined', { hotspotId: hotspot.id });
    } else if (hotspot.type === 'puzzle') {
      // Activate puzzle
      puzzleManager.activatePuzzle(hotspot.puzzleId);
      logGameInfo('Puzzle Activated', { puzzleId: hotspot.puzzleId });
    } else if (hotspot.type === 'item_use') {
      // Use item on hotspot
      if (hotspot.requiresItem && gameState.activeInventoryItemId === hotspot.requiresItem) {
        inventoryManager.removeItem(hotspot.requiresItem);
        if (hotspot.givesItem) {
          inventoryManager.addItem(hotspot.givesItem);
        }
        gameState.hotspotStates[hotspot.id + '_used'] = true;
        gameState.activeInventoryItemId = null;
        logGameInfo('Item Used', { 
          hotspotId: hotspot.id, 
          itemId: hotspot.requiresItem 
        });
      }
    } else if (hotspot.type === 'door') {
      // Try to open door
      if (hotspot.requiresItem && inventoryManager.hasItem(hotspot.requiresItem)) {
        gameState.hotspotStates[hotspot.id + '_opened'] = true;
        gameState.hotspotStates[gameState.allLevelsData[gameState.currentLevel].winCondition] = true;
        logGameInfo('Door Opened', { hotspotId: hotspot.id });
      }
    }
  }

  function requestHint() {
    gameState.hintsUsedThisLevel++;
    gameState.score = Math.max(0, gameState.score - 100);
    gameState.hintRequested = true;
    gameState.hintDisplayTime = p.frameCount;

    // Get relevant hint
    if (gameState.activePuzzleId) {
      const puzzle = puzzleManager.getCurrentPuzzle();
      gameState.currentHint = puzzle.hint || 'Think carefully about the puzzle...';
    } else {
      gameState.currentHint = 'Look around carefully. Some objects may hide secrets.';
    }

    logGameInfo('Hint Requested', { 
      hint: gameState.currentHint,
      scoreDeduction: 100 
    });
  }

  function handleTestAction(action) {
    if (action.type === 'keyPressed') {
      p.keyCode = action.keyCode;
      p.key = action.key || String.fromCharCode(action.keyCode);
      p.keyPressed();
    }
  }

  function logGameInfo(event, data) {
    p.logs.game_info.push({
      event,
      data,
      frameCount: p.frameCount,
      timestamp: Date.now()
    });
  }

  function logInput(inputType, data) {
    p.logs.inputs.push({
      input_type: inputType,
      data,
      frameCount: p.frameCount,
      timestamp: Date.now()
    });
  }
});

// Expose game instance globally
window.gameInstance = gameInstance;

// Control mode switching
window.setControlMode = function(mode) {
  gameState.controlMode = mode;
  
  // Update button states
  document.querySelectorAll('.control-button').forEach(btn => {
    btn.classList.remove('active');
  });
  
  if (mode === 'HUMAN') {
    document.getElementById('humanModeBtn').classList.add('active');
  } else if (mode === 'TEST_1') {
    document.getElementById('test_1_ModeBtn').classList.add('active');
  } else if (mode === 'TEST_2') {
    document.getElementById('test_2_ModeBtn').classList.add('active');
  }
};