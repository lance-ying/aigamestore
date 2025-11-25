// input_handler.js - Input handling

import { gameState, PHASE_START, PHASE_PLAYING, PHASE_PAUSED, PHASE_GAME_OVER_WIN, PHASE_GAME_OVER_LOSE } from './globals.js';
import { initializeGame, placeTileAndMove } from './game_logic.js';

export function handleKeyPressed(p, keyCode) {
  // Log input
  p.logs.inputs.push({
    input_type: "keyPressed",
    data: { key: p.key, keyCode: keyCode },
    framecount: p.frameCount,
    timestamp: Date.now()
  });
  
  // Phase transitions
  if (keyCode === 13) { // ENTER
    if (gameState.gamePhase === PHASE_START) {
      gameState.gamePhase = PHASE_PLAYING;
      initializeGame(p);
      
      p.logs.game_info.push({
        data: { gamePhase: gameState.gamePhase, event: "game_started" },
        framecount: p.frameCount,
        timestamp: Date.now()
      });
    }
    return;
  }
  
  if (keyCode === 27) { // ESC
    if (gameState.gamePhase === PHASE_PLAYING) {
      gameState.gamePhase = PHASE_PAUSED;
      p.logs.game_info.push({
        data: { gamePhase: gameState.gamePhase },
        framecount: p.frameCount,
        timestamp: Date.now()
      });
    } else if (gameState.gamePhase === PHASE_PAUSED) {
      gameState.gamePhase = PHASE_PLAYING;
      p.logs.game_info.push({
        data: { gamePhase: gameState.gamePhase },
        framecount: p.frameCount,
        timestamp: Date.now()
      });
    }
    return;
  }
  
  if (keyCode === 82) { // R
    if (gameState.gamePhase === PHASE_GAME_OVER_WIN || gameState.gamePhase === PHASE_GAME_OVER_LOSE || gameState.gamePhase === PHASE_PAUSED) {
      gameState.gamePhase = PHASE_START;
      p.logs.game_info.push({
        data: { gamePhase: gameState.gamePhase, event: "restart" },
        framecount: p.frameCount,
        timestamp: Date.now()
      });
    }
    return;
  }
  
  // Playing controls (only for human player)
  if (gameState.gamePhase === PHASE_PLAYING && gameState.currentPlayerIndex === 0) {
    handlePlayingInput(p, keyCode);
  }
}

function handlePlayingInput(p, keyCode) {
  // Arrow keys - select tile
  if (keyCode === 37 || keyCode === 39) { // LEFT or RIGHT
    if (keyCode === 37) {
      gameState.selectedTileIndex = (gameState.selectedTileIndex - 1 + gameState.tileHand.length) % gameState.tileHand.length;
    } else {
      gameState.selectedTileIndex = (gameState.selectedTileIndex + 1) % gameState.tileHand.length;
    }
  }
  
  // Space - rotate tile
  if (keyCode === 32) {
    gameState.tileHand[gameState.selectedTileIndex].rotate();
  }
  
  // Z - place tile
  if (keyCode === 90) {
    tryPlaceTile(p);
  }
}

function tryPlaceTile(p) {
  const player = gameState.players[0];
  const validPlacements = gameState.board.getValidPlacements(player);
  
  if (validPlacements.length > 0) {
    // Place at first valid position (could be improved with selection cursor)
    const pos = validPlacements[0];
    const tile = gameState.tileHand[gameState.selectedTileIndex].clone();
    placeTileAndMove(p, pos.x, pos.y, tile);
    
    // Log player info
    logPlayerInfo(p);
  }
}

export function logPlayerInfo(p) {
  const player = gameState.players[0];
  if (player) {
    p.logs.player_info.push({
      screen_x: player.screenX,
      screen_y: player.screenY,
      game_x: player.boardX,
      game_y: player.boardY,
      framecount: p.frameCount
    });
  }
}