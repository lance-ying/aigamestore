// group.js - Group management for connected pieces

import { gameState } from './globals.js';

export class PieceGroup {
  constructor(id, pieces) {
    this.id = id;
    this.pieceIds = pieces.map(p => p.id);
    this.updateBounds();
  }

  updateBounds() {
    const pieces = this.getPieces();
    if (pieces.length === 0) return;
    
    let minX = Infinity, maxX = -Infinity;
    let minY = Infinity, maxY = -Infinity;
    
    pieces.forEach(piece => {
      const bounds = piece.getBounds();
      minX = Math.min(minX, bounds.left);
      maxX = Math.max(maxX, bounds.right);
      minY = Math.min(minY, bounds.top);
      maxY = Math.max(maxY, bounds.bottom);
    });
    
    this.x = (minX + maxX) / 2;
    this.y = (minY + maxY) / 2;
    this.width = maxX - minX;
    this.height = maxY - minY;
  }

  getPieces() {
    return gameState.entities.filter(p => this.pieceIds.includes(p.id));
  }

  move(dx, dy) {
    this.getPieces().forEach(piece => {
      piece.move(dx, dy);
    });
    this.updateBounds();
  }

  contains(pieceId) {
    return this.pieceIds.includes(pieceId);
  }
}

export function createGroup(pieces) {
  const groupId = `group_${Date.now()}_${Math.random()}`;
  const group = new PieceGroup(groupId, pieces);
  
  pieces.forEach(piece => {
    piece.groupId = groupId;
  });
  
  gameState.groups.push(group);
  return group;
}

export function getGroupByPieceId(pieceId) {
  return gameState.groups.find(g => g.contains(pieceId));
}

export function mergeGroups(group1, group2) {
  // Merge group2 into group1
  group2.pieceIds.forEach(pieceId => {
    if (!group1.pieceIds.includes(pieceId)) {
      group1.pieceIds.push(pieceId);
      const piece = gameState.entities.find(p => p.id === pieceId);
      if (piece) piece.groupId = group1.id;
    }
  });
  
  // Remove group2
  const index = gameState.groups.indexOf(group2);
  if (index > -1) {
    gameState.groups.splice(index, 1);
  }
  
  group1.updateBounds();
  return group1;
}