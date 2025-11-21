// input.js - Input handling
import { gameState, GAME_PHASES } from './globals.js';
import { loadLevel, nextLevel } from './level.js';

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
    if (gameState.gamePhase === GAME_PHASES.START) {
      startGame(p);
    }
    return;
  }
  
  if (keyCode === 27) { // ESC
    if (gameState.gamePhase === GAME_PHASES.PLAYING) {
      gameState.gamePhase = GAME_PHASES.PAUSED;
      p.logs.game_info.push({
        data: { phase: "PAUSED" },
        framecount: p.frameCount,
        timestamp: Date.now()
      });
    } else if (gameState.gamePhase === GAME_PHASES.PAUSED) {
      gameState.gamePhase = GAME_PHASES.PLAYING;
      p.logs.game_info.push({
        data: { phase: "PLAYING" },
        framecount: p.frameCount,
        timestamp: Date.now()
      });
    }
    return;
  }
  
  if (keyCode === 82) { // R
    if (gameState.gamePhase === GAME_PHASES.GAME_OVER || 
        gameState.gamePhase === GAME_PHASES.PAUSED) {
      restartGame(p);
    }
    return;
  }
  
  // Gameplay controls
  if (gameState.gamePhase === GAME_PHASES.PLAYING) {
    handleGameplayInput(p, key, keyCode);
  } else if (gameState.gamePhase === GAME_PHASES.LEVEL_COMPLETE) {
    if (keyCode === 32) { // SPACE
      nextLevel();
      p.logs.game_info.push({
        data: { phase: "PLAYING", level: gameState.currentLevelIndex },
        framecount: p.frameCount,
        timestamp: Date.now()
      });
    }
  }
}

function handleGameplayInput(p, key, keyCode) {
  if (!gameState.player) return;
  
  const cursor = gameState.player;
  const activeScrewId = gameState.activeScrewId;
  
  if (activeScrewId === null) {
    // Cursor movement mode
    if (keyCode === 37) { // LEFT
      cursor.move(-1, 0);
    } else if (keyCode === 39) { // RIGHT
      cursor.move(1, 0);
    } else if (keyCode === 38) { // UP
      cursor.move(0, -1);
    } else if (keyCode === 40) { // DOWN
      cursor.move(0, 1);
    } else if (keyCode === 32) { // SPACE - select screw
      const hoveredScrew = cursor.getHoveredScrew();
      if (hoveredScrew) {
        gameState.activeScrewId = hoveredScrew.id;
        gameState.levelMovesCount++;
        gameState.messageText = "Screw selected. Use UP/DOWN to move.";
        gameState.messageTimer = 90;
      }
    }
  } else {
    // Screw control mode
    const activeScrew = gameState.screws.find(s => s.id === activeScrewId);
    
    if (!activeScrew) return;
    
    if (keyCode === 38) { // UP - unscrew (move forward)
      if (activeScrew.positionOnPath < 1) {
        activeScrew.moveAlongPath(1);
        gameState.levelMovesCount++;
        
        // Log player info
        logPlayerInfo(p, activeScrew);
      }
    } else if (keyCode === 40) { // DOWN - screw in (move backward)
      if (activeScrew.positionOnPath > 0) {
        activeScrew.moveAlongPath(-1);
        gameState.levelMovesCount++;
        
        logPlayerInfo(p, activeScrew);
      }
    } else if (keyCode === 32) { // SPACE - attempt removal
      if (activeScrew.canRemove) {
        activeScrew.remove();
        gameState.activeScrewId = null;
        gameState.levelMovesCount++;
        gameState.messageText = "Screw removed!";
        gameState.messageTimer = 60;
        
        // Update all screws' canRemove status
        gameState.screws.forEach(s => s.updateCanRemove());
      } else {
        gameState.messageText = activeScrew.state === "FULLY_UNSCREWED" 
          ? "Path blocked! Remove blocking screws first."
          : "Not fully unscrewed!";
        gameState.messageTimer = 90;
      }
    } else if (keyCode === 16) { // SHIFT - deselect
      gameState.activeScrewId = null;
      gameState.levelMovesCount++;
      gameState.messageText = "Screw deselected.";
      gameState.messageTimer = 60;
    }
  }
}

function logPlayerInfo(p, screw) {
  p.logs.player_info.push({
    screen_x: screw.x,
    screen_y: screw.y,
    game_x: screw.x,
    game_y: screw.y,
    framecount: p.frameCount
  });
}

function startGame(p) {
  gameState.currentLevelIndex = 1;
  gameState.totalScore = 0;
  loadLevel(1);
  gameState.gamePhase = GAME_PHASES.PLAYING;
  
  p.logs.game_info.push({
    data: { phase: "PLAYING", level: 1 },
    framecount: p.frameCount,
    timestamp: Date.now()
  });
}

function restartGame(p) {
  gameState.currentLevelIndex = 1;
  gameState.totalScore = 0;
  gameState.gamePhase = GAME_PHASES.START;
  
  p.logs.game_info.push({
    data: { phase: "START" },
    framecount: p.frameCount,
    timestamp: Date.now()
  });
}