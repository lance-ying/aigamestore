// panel.js - Panel class for managing individual puzzle panels
import { PANEL_SIZE } from './globals.js';

export class Panel {
  constructor(index, sceneType, zoomLevel = 0) {
    this.index = index;
    this.sceneType = sceneType; // Type of scene this panel displays
    this.zoomLevel = zoomLevel; // 0: wide, 1: medium, 2: close
    this.maxZoom = 2;
    this.offset = { x: 0, y: 0 }; // For panning in zoomed views
    this.connectedTo = []; // Other panels this connects to
    this.hasOrb = false;
    this.orbRevealed = false;
    this.interactive = true;
    this.overlayAlpha = 0;
    this.glowIntensity = 0;
  }

  canZoomIn() {
    return this.zoomLevel < this.maxZoom;
  }

  canZoomOut() {
    return this.zoomLevel > 0;
  }

  zoomIn() {
    if (this.canZoomIn()) {
      this.zoomLevel++;
      return true;
    }
    return false;
  }

  zoomOut() {
    if (this.canZoomOut()) {
      this.zoomLevel--;
      return true;
    }
    return false;
  }

  checkOrbReveal(panels) {
    // Check if conditions are met to reveal orb
    if (this.hasOrb && !this.orbRevealed) {
      // Orb revealed at max zoom
      if (this.zoomLevel === this.maxZoom) {
        this.orbRevealed = true;
        return true;
      }
    }
    return false;
  }

  getState() {
    return {
      index: this.index,
      sceneType: this.sceneType,
      zoomLevel: this.zoomLevel,
      offset: { ...this.offset },
      hasOrb: this.hasOrb,
      orbRevealed: this.orbRevealed,
      overlayAlpha: this.overlayAlpha,
      glowIntensity: this.glowIntensity
    };
  }

  setState(state) {
    this.sceneType = state.sceneType;
    this.zoomLevel = state.zoomLevel;
    this.offset = { ...state.offset };
    this.hasOrb = state.hasOrb;
    this.orbRevealed = state.orbRevealed;
    this.overlayAlpha = state.overlayAlpha;
    this.glowIntensity = state.glowIntensity;
  }
}