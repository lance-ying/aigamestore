// input.js - Input handling
import { gameState, GAME_PHASES } from './globals.js';

export function handleKeyPressed(p, key, keyCode) {
  // Log input
  p.logs.inputs.push({
    input_type: "keyPressed",
    data: { key, keyCode },
    framecount: p.frameCount,
    timestamp: Date.now()
  });
  
  // Game phase transitions
  if (keyCode === 13) { // ENTER
    if (gameState.gamePhase === GAME_PHASES.START) {
      startGame(p);
    }
  } else if (keyCode === 27) { // ESC
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
  } else if (keyCode === 82) { // R
    if (gameState.gamePhase === GAME_PHASES.GAME_OVER_WIN || 
        gameState.gamePhase === GAME_PHASES.GAME_OVER_LOSE) {
      resetGame(p);
    }
  }
  
  // Gameplay inputs
  if (gameState.gamePhase === GAME_PHASES.PLAYING) {
    if (keyCode === 32) { // SPACE - interact
      handleInteraction(p);
    } else if (keyCode === 90) { // Z - use keycard
      handleKeycardUse(p);
    }
  }
}

export function handleKeyReleased(p, key, keyCode) {
  p.logs.inputs.push({
    input_type: "keyReleased",
    data: { key, keyCode },
    framecount: p.frameCount,
    timestamp: Date.now()
  });
}

function startGame(p) {
  gameState.gamePhase = GAME_PHASES.PLAYING;
  p.logs.game_info.push({
    data: { phase: "PLAYING" },
    framecount: p.frameCount,
    timestamp: Date.now()
  });
}

function resetGame(p) {
  // Reset game state
  gameState.score = 0;
  gameState.currentRoom = 0;
  gameState.inventory = [];
  gameState.hasRedKeycard = false;
  gameState.hasBlueKeycard = false;
  gameState.hasGreenKeycard = false;
  gameState.redDoorUnlocked = false;
  gameState.blueDoorUnlocked = false;
  gameState.greenDoorUnlocked = false;
  gameState.journalEntries = [];
  gameState.endingsFound = [];
  gameState.stamina = 100;
  gameState.showingMessage = false;
  gameState.messageTimer = 0;
  
  // Reset interactables
  for (let interactable of gameState.interactables) {
    interactable.interacted = false;
  }
  
  // Reset player position
  gameState.player.x = 150;
  gameState.player.y = 125;
  gameState.player.angle = 0;
  
  gameState.gamePhase = GAME_PHASES.START;
  p.logs.game_info.push({
    data: { phase: "START", action: "restart" },
    framecount: p.frameCount,
    timestamp: Date.now()
  });
}

function handleInteraction(p) {
  if (gameState.nearestInteractable) {
    const message = gameState.nearestInteractable.interact(gameState);
    if (message) {
      gameState.showingMessage = true;
      gameState.messageText = message;
      gameState.messageTimer = 180; // Show for 3 seconds
    }
  }
}

function handleKeycardUse(p) {
  const room = gameState.rooms[gameState.currentRoom];
  const player = gameState.player;
  
  for (let conn of room.connections) {
    const distToDoor = Math.sqrt(
      (conn.x - player.x) ** 2 + (conn.y - player.y) ** 2
    );
    
    if (distToDoor < 40 && conn.locked) {
      if (conn.keycardType === "red" && gameState.hasRedKeycard && !gameState.redDoorUnlocked) {
        gameState.redDoorUnlocked = true;
        gameState.showingMessage = true;
        gameState.messageText = "RED door unlocked!";
        gameState.messageTimer = 120;
        gameState.score += 50;
      } else if (conn.keycardType === "blue" && gameState.hasBlueKeycard && !gameState.blueDoorUnlocked) {
        gameState.blueDoorUnlocked = true;
        gameState.showingMessage = true;
        gameState.messageText = "BLUE door unlocked!";
        gameState.messageTimer = 120;
        gameState.score += 50;
      } else if (conn.keycardType === "green" && gameState.hasGreenKeycard && !gameState.greenDoorUnlocked) {
        gameState.greenDoorUnlocked = true;
        gameState.showingMessage = true;
        gameState.messageText = "GREEN door unlocked!";
        gameState.messageTimer = 120;
        gameState.score += 50;
      }
    }
  }
}