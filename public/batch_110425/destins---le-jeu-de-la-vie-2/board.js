// board.js - Board generation and management

import { SPACE_TYPES } from './globals.js';

export class BoardSpace {
  constructor(x, y, type, index) {
    this.x = x;
    this.y = y;
    this.type = type;
    this.index = index;
  }
}

export function generateBoard() {
  const spaces = [];
  const numSpaces = 50;
  
  // Create a winding path
  const centerX = 300;
  const centerY = 200;
  const radiusX = 220;
  const radiusY = 140;
  
  for (let i = 0; i < numSpaces; i++) {
    const progress = i / (numSpaces - 1);
    const angle = progress * Math.PI * 2.8 - Math.PI / 2;
    
    const spiralFactor = 0.7 + progress * 0.3;
    const x = centerX + Math.cos(angle) * radiusX * spiralFactor;
    const y = centerY + Math.sin(angle) * radiusY * spiralFactor;
    
    let type = SPACE_TYPES.NORMAL;
    
    if (i === 0) {
      type = SPACE_TYPES.START;
    } else if (i === numSpaces - 1) {
      type = SPACE_TYPES.RETIREMENT;
    } else if (i % 10 === 0) {
      type = SPACE_TYPES.PAYDAY;
    } else if (i % 8 === 3) {
      type = SPACE_TYPES.EDUCATION;
    } else if (i % 9 === 4) {
      type = SPACE_TYPES.CAREER;
    } else if (i % 7 === 2) {
      type = SPACE_TYPES.RELATIONSHIP;
    } else if (i % 11 === 6) {
      type = SPACE_TYPES.PROPERTY;
    } else if (i % 6 === 0 && i > 0) {
      type = SPACE_TYPES.EVENT;
    }
    
    spaces.push(new BoardSpace(x, y, type, i));
  }
  
  return spaces;
}

export function getSpaceColor(type) {
  switch (type) {
    case SPACE_TYPES.START: return [100, 255, 100];
    case SPACE_TYPES.RETIREMENT: return [255, 215, 0];
    case SPACE_TYPES.EDUCATION: return [100, 150, 255];
    case SPACE_TYPES.CAREER: return [255, 150, 50];
    case SPACE_TYPES.RELATIONSHIP: return [255, 100, 150];
    case SPACE_TYPES.PROPERTY: return [150, 100, 255];
    case SPACE_TYPES.EVENT: return [255, 255, 100];
    case SPACE_TYPES.PAYDAY: return [100, 255, 200];
    case SPACE_TYPES.CROSSROAD: return [200, 100, 100];
    default: return [200, 200, 200];
  }
}