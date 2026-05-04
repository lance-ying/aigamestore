// game_logic.js - Core game logic

import { gameState, GRID_SIZE, PHASE_GAME_OVER_WIN, PHASE_GAME_OVER_LOSE, PHASE_PLAYING } from './globals.js';
import { Player } from './player.js';
import { Board } from './board.js';
import { createRandomTile } from './tile.js';

export function initializeGame(p) {
  // Create board
  gameState.board = new Board();
  
  // Create players
  gameState.players = [];
  
  // Human player (always first)
  const humanPlayer = new Player(0, 0, 0, [100, 150, 255], false);
  humanPlayer.entryDirection = 2; // From west
  gameState.players.push(humanPlayer);
  
  // AI players
  const aiColors = [
    [255, 100, 100],
    [100, 255, 100],
  ];
  
  const startPositions = [
    [5, 0], // Top right
    [5, 5], // Bottom right
  ];
  
  for (let i = 0; i < Math.min(2, startPositions.length); i++) {
    const aiPlayer = new Player(
      i + 1,
      startPositions[i][0],
      startPositions[i][1],
      aiColors[i],
      true
    );
    aiPlayer.entryDirection = 6; // From east
    gameState.players.push(aiPlayer);
  }
  
  // Initialize screen positions
  for (let player of gameState.players) {
    player.updateScreenPosition();
  }
  
  // Create initial tile hand
  gameState.tileHand = [];
  for (let i = 0; i < 3; i++) {
    gameState.tileHand.push(createRandomTile(p));
  }
  
  gameState.currentPlayerIndex = 0;
  gameState.selectedTileIndex = 0;
  gameState.score = 0;
  gameState.turnCount = 0;
  gameState.animatingMove = false;
  gameState.animationQueue = [];
}

export function placeTileAndMove(p, x, y, tile) {
  const player = gameState.players[gameState.currentPlayerIndex];
  
  // Place tile
  gameState.board.placeTile(x, y, tile);
  
  // Calculate entry direction to new tile
  let entryDir = -1;
  if (x < player.boardX) entryDir = 2; // Coming from east
  else if (x > player.boardX) entryDir = 6; // Coming from west
  else if (y < player.boardY) entryDir = 4; // Coming from south
  else if (y > player.boardY) entryDir = 0; // Coming from north
  
  // Move player
  player.boardX = x;
  player.boardY = y;
  player.entryDirection = entryDir;
  
  // Follow path until reaching edge or endpoint
  followPath(p, player);
  
  // Remove used tile and add new one
  gameState.tileHand.splice(gameState.selectedTileIndex, 1);
  gameState.tileHand.push(createRandomTile(p));
  gameState.selectedTileIndex = 0;
  
  gameState.turnCount++;
  
  // Check win/lose conditions
  checkGameOver();
  
  // Next player's turn
  if (gameState.gamePhase === PHASE_PLAYING) {
    nextPlayer();
  }
}

function followPath(p, player) {
  let maxSteps = 20; // Prevent infinite loops
  
  while (maxSteps > 0) {
    maxSteps--;
    
    const tile = gameState.board.getTile(player.boardX, player.boardY);
    if (!tile) break;
    
    // Get exit direction
    const exitDir = tile.getExitDirection(player.entryDirection);
    if (exitDir === -1) break;
    
    // Calculate next position
    let nextX = player.boardX;
    let nextY = player.boardY;
    
    switch(exitDir) {
      case 0: nextY--; break; // N
      case 2: nextX++; break; // E
      case 4: nextY++; break; // S
      case 6: nextX--; break; // W
    }
    
    // Check if off board
    if (nextX < 0 || nextX >= GRID_SIZE || nextY < 0 || nextY >= GRID_SIZE) {
      player.isActive = false;
      break;
    }
    
    // Check if next tile exists
    const nextTile = gameState.board.getTile(nextX, nextY);
    if (!nextTile) {
      // Stop at edge of placed tiles
      break;
    }
    
    // Move to next tile
    player.boardX = nextX;
    player.boardY = nextY;
    player.entryDirection = (exitDir + 4) % 8; // Opposite direction
  }
  
  player.updateScreenPosition();
}

function nextPlayer() {
  // Find next active player
  let attempts = 0;
  do {
    gameState.currentPlayerIndex = (gameState.currentPlayerIndex + 1) % gameState.players.length;
    attempts++;
    
    if (attempts > gameState.players.length) {
      // No active players left somehow
      break;
    }
  } while (!gameState.players[gameState.currentPlayerIndex].isActive);
  
  // Update tile hand for new player
  if (gameState.currentPlayerIndex === 0) {
    // Human player - keep existing hand
  } else {
    // AI player - generate new hand
    // (In simplified version, we share the tile hand)
  }
}

function checkGameOver() {
  const activePlayers = gameState.players.filter(p => p.isActive);
  
  if (activePlayers.length === 1) {
    if (activePlayers[0].id === 0) {
      // Human won
      gameState.gamePhase = PHASE_GAME_OVER_WIN;
      gameState.score = gameState.turnCount * 100;
    } else {
      // AI won
      gameState.gamePhase = PHASE_GAME_OVER_LOSE;
    }
  } else if (activePlayers.length === 0) {
    // Everyone eliminated (rare)
    gameState.gamePhase = PHASE_GAME_OVER_LOSE;
  }
}

export function executeAITurn(p) {
  const player = gameState.players[gameState.currentPlayerIndex];
  if (!player.isAI || !player.isActive) return;
  
  const validPlacements = gameState.board.getValidPlacements(player);
  if (validPlacements.length === 0) {
    player.isActive = false;
    checkGameOver();
    if (gameState.gamePhase === PHASE_PLAYING) {
      nextPlayer();
    }
    return;
  }
  
  // AI decision making based on personality
  let bestPlacement = null;
  let bestTileIndex = 0;
  let bestRotation = 0;
  
  if (player.aiPersonality === 0) {
    // Aggressive: Try to stay away from edges
    let bestScore = -1000;
    for (let placement of validPlacements) {
      for (let tileIdx = 0; tileIdx < gameState.tileHand.length; tileIdx++) {
        for (let rot = 0; rot < 4; rot++) {
          const tile = gameState.tileHand[tileIdx].clone();
          tile.rotation = rot;
          
          // Simulate placement
          const distFromEdge = Math.min(
            placement.x, GRID_SIZE - 1 - placement.x,
            placement.y, GRID_SIZE - 1 - placement.y
          );
          
          if (distFromEdge > bestScore) {
            bestScore = distFromEdge;
            bestPlacement = placement;
            bestTileIndex = tileIdx;
            bestRotation = rot;
          }
        }
      }
    }
  } else {
    // Random or defensive
    bestPlacement = validPlacements[Math.floor(p.random() * validPlacements.length)];
    bestTileIndex = Math.floor(p.random() * gameState.tileHand.length);
    bestRotation = Math.floor(p.random() * 4);
  }
  
  if (bestPlacement) {
    const tile = gameState.tileHand[bestTileIndex].clone();
    tile.rotation = bestRotation;
    placeTileAndMove(p, bestPlacement.x, bestPlacement.y, tile);
  }
}