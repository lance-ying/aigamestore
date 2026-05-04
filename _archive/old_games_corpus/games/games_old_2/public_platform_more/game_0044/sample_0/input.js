// input.js
import { gameState, GAME_PHASES } from './globals.js';

export function handleKeyPressed(p, key, keyCode) {
  const log = {
    input_type: "keyPressed",
    data: { key, keyCode },
    framecount: p.frameCount,
    timestamp: Date.now()
  };
  p.logs.inputs.push(log);

  // Phase transitions
  if (keyCode === 13) { // ENTER
    if (gameState.gamePhase === GAME_PHASES.START) {
      startGame(p);
    }
  } else if (keyCode === 27) { // ESC
    if (gameState.gamePhase === GAME_PHASES.PLAYING) {
      gameState.gamePhase = GAME_PHASES.PAUSED;
      p.logs.game_info.push({
        data: { gamePhase: GAME_PHASES.PAUSED },
        framecount: p.frameCount,
        timestamp: Date.now()
      });
    } else if (gameState.gamePhase === GAME_PHASES.PAUSED) {
      gameState.gamePhase = GAME_PHASES.PLAYING;
      p.logs.game_info.push({
        data: { gamePhase: GAME_PHASES.PLAYING },
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
  if (gameState.gamePhase === GAME_PHASES.PLAYING && gameState.player) {
    if (keyCode === 32) { // Space - Push crate
      gameState.player.push(gameState.rooms[gameState.currentRoom]);
    } else if (keyCode === 90) { // Z - Interact
      gameState.player.interact(gameState.rooms[gameState.currentRoom]);
    }
  }
}

function startGame(p) {
  gameState.gamePhase = GAME_PHASES.PLAYING;
  gameState.currentRoom = 0;
  gameState.score = 0;
  
  // Initialize player
  const room = gameState.rooms[gameState.currentRoom];
  gameState.player.x = room.spawnPoint.x;
  gameState.player.y = room.spawnPoint.y;
  
  p.logs.game_info.push({
    data: { gamePhase: GAME_PHASES.PLAYING, room: gameState.currentRoom },
    framecount: p.frameCount,
    timestamp: Date.now()
  });
}

function resetGame(p) {
  gameState.gamePhase = GAME_PHASES.START;
  gameState.currentRoom = 0;
  gameState.score = 0;
  
  // Reset rooms
  const { createRooms } = require('./room.js');
  gameState.rooms = createRooms();
  
  // Reset player position
  const room = gameState.rooms[0];
  gameState.player.x = room.spawnPoint.x;
  gameState.player.y = room.spawnPoint.y;
  
  p.logs.game_info.push({
    data: { gamePhase: GAME_PHASES.START },
    framecount: p.frameCount,
    timestamp: Date.now()
  });
}