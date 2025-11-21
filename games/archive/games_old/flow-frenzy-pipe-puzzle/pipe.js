// pipe.js - Pipe class and related functions

import { PIPE_TYPES } from './globals.js';

export class Pipe {
  constructor(type, rotation = 0) {
    this.type = type;
    this.rotation = rotation; // 0, 90, 180, 270
  }

  rotate(clockwise = true) {
    if (this.type === PIPE_TYPES.BLOCKED || 
        this.type === PIPE_TYPES.START || 
        this.type === PIPE_TYPES.END) {
      return; // Can't rotate these
    }
    
    if (clockwise) {
      this.rotation = (this.rotation + 90) % 360;
    } else {
      this.rotation = (this.rotation - 90 + 360) % 360;
    }
  }

  // Get connection points based on type and rotation
  getConnections() {
    const base = this.getBaseConnections();
    return this.rotateConnections(base, this.rotation);
  }

  getBaseConnections() {
    switch (this.type) {
      case PIPE_TYPES.STRAIGHT:
        return ['top', 'bottom'];
      case PIPE_TYPES.BEND:
        return ['top', 'right'];
      case PIPE_TYPES.T_JUNCTION:
        return ['top', 'right', 'bottom'];
      case PIPE_TYPES.CROSS:
        return ['top', 'right', 'bottom', 'left'];
      case PIPE_TYPES.START:
        return ['right'];
      case PIPE_TYPES.END:
        return ['left'];
      default:
        return [];
    }
  }

  rotateConnections(connections, rotation) {
    const rotationMap = {
      0: { 'top': 'top', 'right': 'right', 'bottom': 'bottom', 'left': 'left' },
      90: { 'top': 'right', 'right': 'bottom', 'bottom': 'left', 'left': 'top' },
      180: { 'top': 'bottom', 'right': 'left', 'bottom': 'top', 'left': 'right' },
      270: { 'top': 'left', 'right': 'top', 'bottom': 'right', 'left': 'bottom' }
    };
    
    return connections.map(dir => rotationMap[rotation][dir]);
  }
}

export function createPipe(type, rotation = 0) {
  return new Pipe(type, rotation);
}