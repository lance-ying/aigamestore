// snapLogic.js - Snap detection and group management

import { gameState, SNAP_TOLERANCE } from './globals.js';
import { createGroup, getGroupByPieceId, mergeGroups } from './group.js';

export function checkAndSnapPieces(p) {
  let snapCount = 0;
  const snappedPairs = new Set();
  
  // Check all unsnapped pieces or pieces in different groups
  for (let i = 0; i < gameState.entities.length; i++) {
    for (let j = i + 1; j < gameState.entities.length; j++) {
      const piece1 = gameState.entities[i];
      const piece2 = gameState.entities[j];
      
      // Skip if already in same group
      const group1 = getGroupByPieceId(piece1.id);
      const group2 = getGroupByPieceId(piece2.id);
      if (group1 && group2 && group1.id === group2.id) continue;
      
      // Skip if pieces are far apart
      const distance = piece1.distanceToPoint(piece2.x, piece2.y);
      if (distance > SNAP_TOLERANCE * 4) continue;
      
      // Check if pieces should snap (adjacent in grid and close enough)
      if (shouldSnap(piece1, piece2)) {
        snapPieces(p, piece1, piece2);
        snappedPairs.add(`${piece1.id}-${piece2.id}`);
        snapCount++;
      }
    }
  }
  
  return snapCount;
}

function shouldSnap(piece1, piece2) {
  // Only snap if rotations match
  if (piece1.rotation !== piece2.rotation) return false;
  
  const gridDX = Math.abs(piece1.gridX - piece2.gridX);
  const gridDY = Math.abs(piece1.gridY - piece2.gridY);
  
  // Must be adjacent in grid (horizontally or vertically)
  if (!((gridDX === 1 && gridDY === 0) || (gridDX === 0 && gridDY === 1))) {
    return false;
  }
  
  // Check physical distance based on rotation
  const rotation = piece1.rotation % 360;
  const bounds1 = piece1.getBounds();
  const bounds2 = piece2.getBounds();
  
  // Horizontal adjacency in grid
  if (gridDX === 1 && gridDY === 0) {
    const verticalAlign = Math.abs(piece1.y - piece2.y);
    if (verticalAlign > SNAP_TOLERANCE) return false;
    
    if (piece1.gridX < piece2.gridX) {
      // piece1 is to the left of piece2
      const horizontalGap = bounds2.left - bounds1.right;
      return Math.abs(horizontalGap) < SNAP_TOLERANCE;
    } else {
      // piece1 is to the right of piece2
      const horizontalGap = bounds1.left - bounds2.right;
      return Math.abs(horizontalGap) < SNAP_TOLERANCE;
    }
  }
  
  // Vertical adjacency in grid
  if (gridDX === 0 && gridDY === 1) {
    const horizontalAlign = Math.abs(piece1.x - piece2.x);
    if (horizontalAlign > SNAP_TOLERANCE) return false;
    
    if (piece1.gridY < piece2.gridY) {
      // piece1 is above piece2
      const verticalGap = bounds2.top - bounds1.bottom;
      return Math.abs(verticalGap) < SNAP_TOLERANCE;
    } else {
      // piece1 is below piece2
      const verticalGap = bounds1.top - bounds2.bottom;
      return Math.abs(verticalGap) < SNAP_TOLERANCE;
    }
  }
  
  return false;
}

function snapPieces(p, piece1, piece2) {
  // Calculate ideal snap position
  const idealDX = (piece2.gridX - piece1.gridX) * piece1.width;
  const idealDY = (piece2.gridY - piece1.gridY) * piece1.height;
  
  // Move piece2 to align perfectly with piece1
  const targetX = piece1.x + idealDX;
  const targetY = piece1.y + idealDY;
  
  piece2.x = targetX;
  piece2.y = targetY;
  
  // Trigger snap animation
  piece1.triggerSnapAnimation();
  piece2.triggerSnapAnimation();
  
  // Update snap connections
  if (!piece1.snappedTo.includes(piece2.id)) {
    piece1.snappedTo.push(piece2.id);
  }
  if (!piece2.snappedTo.includes(piece1.id)) {
    piece2.snappedTo.push(piece1.id);
  }
  
  // Handle group management
  const group1 = getGroupByPieceId(piece1.id);
  const group2 = getGroupByPieceId(piece2.id);
  
  if (!group1 && !group2) {
    // Create new group with both pieces
    createGroup([piece1, piece2]);
  } else if (group1 && !group2) {
    // Add piece2 to group1
    group1.pieceIds.push(piece2.id);
    piece2.groupId = group1.id;
    group1.updateBounds();
  } else if (!group1 && group2) {
    // Add piece1 to group2
    group2.pieceIds.push(piece1.id);
    piece1.groupId = group2.id;
    group2.updateBounds();
  } else if (group1 && group2 && group1.id !== group2.id) {
    // Merge groups
    mergeGroups(group1, group2);
  }
  
  // Award snap points
  gameState.score += 50;
  
  // Log snap event
  p.logs.game_info.push({
    event: "snap",
    piece1: piece1.id,
    piece2: piece2.id,
    framecount: p.frameCount,
    timestamp: Date.now()
  });
}

export function updateChainSnapBonus(snapCount) {
  if (snapCount > 1) {
    // Chain snap bonus
    gameState.score += 100;
    gameState.chainSnapCount = snapCount;
    gameState.lastSnapTime = Date.now();
  }
}