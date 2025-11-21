// levelManager.js - Level initialization and management

import { gameState, CANVAS_WIDTH, CANVAS_HEIGHT } from './globals.js';
import { PuzzlePiece } from './piece.js';
import { getLevelData } from './levels.js';
import { generateLevelImage } from './imageGenerator.js';

export function initializeLevel(p, levelNumber) {
  // Clear existing pieces and groups
  gameState.entities = [];
  gameState.groups = [];
  gameState.selectedPieceId = null;
  
  const levelData = getLevelData(levelNumber);
  gameState.currentLevel = levelNumber;
  gameState.timeLimit = levelData.timeLimit;
  gameState.timeRemaining = levelData.timeLimit;
  
  // Generate the full image for this level
  const fullImage = generateLevelImage(p, levelNumber);
  
  // Calculate piece dimensions
  const pieceWidth = fullImage.width / levelData.gridCols;
  const pieceHeight = fullImage.height / levelData.gridRows;
  
  // Create puzzle pieces
  let pieceId = 0;
  for (let row = 0; row < levelData.gridRows; row++) {
    for (let col = 0; col < levelData.gridCols; col++) {
      // Create a graphics object for this piece's image
      const pieceImage = p.createGraphics(pieceWidth, pieceHeight);
      pieceImage.image(
        fullImage,
        0, 0, pieceWidth, pieceHeight,
        col * pieceWidth, row * pieceHeight, pieceWidth, pieceHeight
      );
      
      // Random initial position (scattered)
      const margin = 50;
      const randomX = p.random(margin + pieceWidth / 2, CANVAS_WIDTH - margin - pieceWidth / 2);
      const randomY = p.random(margin + pieceHeight / 2, CANVAS_HEIGHT - margin - pieceHeight / 2);
      
      // Random rotation for levels with rotation enabled
      let rotation = 0;
      if (levelData.rotationEnabled && levelNumber > 1) {
        rotation = p.floor(p.random(4)) * 90;
      }
      
      const piece = new PuzzlePiece(
        `piece_${pieceId}`,
        pieceImage,
        randomX,
        randomY,
        pieceWidth,
        pieceHeight,
        rotation,
        col,
        row
      );
      
      gameState.entities.push(piece);
      pieceId++;
    }
  }
  
  // Store level-specific data
  gameState.levelData = levelData;
  gameState.levelFullImage = fullImage;
}

export function isLevelComplete() {
  // Level is complete when all pieces are in a single group
  if (gameState.groups.length === 1) {
    const group = gameState.groups[0];
    return group.pieceIds.length === gameState.entities.length;
  }
  return false;
}