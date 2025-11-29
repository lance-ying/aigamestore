// camera.js - Camera and zoom management

import { gameState, CANVAS_WIDTH, CANVAS_HEIGHT } from './globals.js';

export class Camera {
  constructor(p) {
    this.p = p;
    this.x = 0;
    this.y = 0;
    this.panSpeed = 2;
    this.minZoom = 1;
    this.maxZoom = 4;
    this.zoomStep = 0.5;
    this.quickScopeZoom = 2;
  }

  update(keys) {
    // Pan with arrow keys
    if (keys.left) {
      this.x -= this.panSpeed / gameState.zoomLevel;
    }
    if (keys.right) {
      this.x += this.panSpeed / gameState.zoomLevel;
    }
    if (keys.up) {
      this.y -= this.panSpeed / gameState.zoomLevel;
    }
    if (keys.down) {
      this.y += this.panSpeed / gameState.zoomLevel;
    }

    // Clamp camera position
    const maxPanX = 100 / gameState.zoomLevel;
    const maxPanY = 50 / gameState.zoomLevel;
    this.x = this.p.constrain(this.x, -maxPanX, maxPanX);
    this.y = this.p.constrain(this.y, -maxPanY, maxPanY);

    gameState.cameraX = this.x;
    gameState.cameraY = this.y;
  }

  zoomIn() {
    gameState.zoomLevel = Math.min(gameState.zoomLevel + this.zoomStep, this.maxZoom);
  }

  zoomOut() {
    gameState.zoomLevel = Math.max(gameState.zoomLevel - this.zoomStep, this.minZoom);
  }

  toggleQuickScope() {
    if (gameState.zoomLevel === this.quickScopeZoom) {
      gameState.zoomLevel = this.minZoom;
    } else {
      gameState.zoomLevel = this.quickScopeZoom;
    }
  }
}