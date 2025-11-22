// player.js - Player class
import { gameState, CANVAS_WIDTH, CANVAS_HEIGHT } from './globals.js';

export class Player {
  constructor(x, y) {
    this.x = x;
    this.y = y;
    this.viewAngle = 0; // degrees
    this.viewPitch = 0; // degrees
    this.rotationSpeed = 3;
    this.pitchSpeed = 2;
    this.maxPitch = 60;
  }
  
  update() {
    // Camera rotation is handled in input processing
  }
  
  rotateView(angle) {
    this.viewAngle = (this.viewAngle + angle) % 360;
    if (this.viewAngle < 0) this.viewAngle += 360;
    gameState.cameraAngle = this.viewAngle;
  }
  
  adjustPitch(pitch) {
    this.viewPitch += pitch;
    this.viewPitch = Math.max(-this.maxPitch, Math.min(this.maxPitch, this.viewPitch));
    gameState.cameraPitch = this.viewPitch;
  }
  
  getPosition() {
    return { x: this.x, y: this.y };
  }
  
  getViewDirection() {
    const rad = this.viewAngle * Math.PI / 180;
    return {
      x: Math.cos(rad),
      y: Math.sin(rad)
    };
  }
}