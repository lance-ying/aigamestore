// puzzle_elements.js - Puzzle element classes
import { gameState } from './globals.js';

export class PuzzleElement {
  constructor(x, y, z, type, id) {
    this.x = x; // world x
    this.y = y; // world y
    this.z = z; // depth/distance
    this.type = type;
    this.id = id;
    this.solved = false;
    this.state = 0; // generic state variable
    this.requiredState = 1; // what state counts as solved
    this.visible = true;
    this.requiresOculus = false;
    this.dependencies = []; // IDs of other elements that must be solved first
    this.angle = 0; // for rotating elements
  }
  
  isAccessible() {
    // Check if dependencies are met
    for (let depId of this.dependencies) {
      const dep = gameState.puzzleElements.find(e => e.id === depId);
      if (dep && !dep.solved) {
        return false;
      }
    }
    return true;
  }
  
  interact() {
    if (!this.isAccessible()) return false;
    
    // Different interaction based on type
    switch (this.type) {
      case 'lever':
        this.state = 1 - this.state; // toggle
        this.angle = this.state * 90;
        break;
      case 'gear':
        this.state = (this.state + 1) % 4;
        this.angle = this.state * 90;
        break;
      case 'compartment':
        this.state = 1;
        break;
      case 'valve':
        this.state = (this.state + 1) % 3;
        this.angle = this.state * 120;
        break;
    }
    
    if (this.state === this.requiredState) {
      this.solved = true;
      return true;
    }
    return false;
  }
  
  getScreenPosition(player) {
    // Project 3D position to 2D screen
    const dx = this.x - player.x;
    const dy = this.y - player.y;
    
    // Calculate angle to this element
    const angleToElement = Math.atan2(dy, dx) * 180 / Math.PI;
    const relativeAngle = angleToElement - player.viewAngle;
    
    // Normalize angle to -180 to 180
    let normAngle = relativeAngle;
    if (normAngle > 180) normAngle -= 360;
    if (normAngle < -180) normAngle += 360;
    
    // Check if in view (field of view ~90 degrees)
    if (Math.abs(normAngle) > 45) {
      return null; // not in view
    }
    
    // Calculate screen x position
    const screenX = 300 + (normAngle / 45) * 250;
    
    // Calculate screen y based on pitch and element z
    const screenY = 200 - player.viewPitch * 2 + (this.z - 100) * 0.5;
    
    // Calculate distance for scaling
    const distance = Math.sqrt(dx * dx + dy * dy);
    const scale = Math.max(0.3, 1 - distance / 500);
    
    return { x: screenX, y: screenY, scale, distance };
  }
}

export class Gear extends PuzzleElement {
  constructor(x, y, z, id, requiredRotations) {
    super(x, y, z, 'gear', id);
    this.requiredState = requiredRotations || 2;
    this.radius = 30;
    this.teeth = 12;
  }
}

export class Lever extends PuzzleElement {
  constructor(x, y, z, id) {
    super(x, y, z, 'lever', id);
    this.requiredState = 1;
    this.length = 40;
  }
}

export class HiddenCompartment extends PuzzleElement {
  constructor(x, y, z, id) {
    super(x, y, z, 'compartment', id);
    this.requiredState = 1;
    this.requiresOculus = true;
  }
}

export class Valve extends PuzzleElement {
  constructor(x, y, z, id, requiredPosition) {
    super(x, y, z, 'valve', id);
    this.requiredState = requiredPosition || 2;
    this.radius = 25;
  }
}