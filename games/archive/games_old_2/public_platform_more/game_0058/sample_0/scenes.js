// scenes.js - Scene management and rendering

import { gameState, LOCATIONS, CANVAS_WIDTH, CANVAS_HEIGHT } from './globals.js';
import { Hotspot } from './entities.js';

export class SceneManager {
  constructor(p) {
    this.p = p;
    this.hotspots = [];
    this.transitionAlpha = 0;
    this.transitioning = false;
  }
  
  loadLocation(locationId) {
    if (!LOCATIONS[locationId]) return;
    
    const location = LOCATIONS[locationId];
    
    // Check if location requires a flag
    if (location.requiresFlag && !gameState.storyFlags.has(location.requiresFlag)) {
      return false;
    }
    
    gameState.previousLocation = gameState.currentLocation;
    gameState.currentLocation = locationId;
    gameState.unlockedLocations.add(locationId);
    
    this.hotspots = [];
    
    // Create hotspots
    location.hotspots.forEach(spot => {
      const hotspot = new Hotspot(this.p, spot.x, spot.y, spot.type, spot.id, spot.label);
      
      // Check if hint coin already collected
      if (spot.type === "hint_coin" && gameState.collectedItems.includes(spot.id)) {
        hotspot.collected = true;
      }
      
      this.hotspots.push(hotspot);
    });
    
    this.transitionAlpha = 255;
    this.transitioning = true;
    
    return true;
  }
  
  update() {
    if (this.transitioning) {
      this.transitionAlpha -= 10;
      if (this.transitionAlpha <= 0) {
        this.transitionAlpha = 0;
        this.transitioning = false;
      }
    }
    
    // Update hotspot hover states
    this.hotspots.forEach(spot => {
      spot.hovered = spot.isHovered(gameState.cursorX, gameState.cursorY);
    });
  }
  
  renderBackground() {
    const p = this.p;
    const location = LOCATIONS[gameState.currentLocation];
    
    if (!location) return;
    
    // Background color based on location
    const bgColors = {
      village_square: [135, 206, 235],
      mystery_shop: [160, 120, 90],
      park: [100, 180, 100],
      library: [80, 60, 100]
    };
    
    const color = bgColors[gameState.currentLocation] || [100, 100, 100];
    p.background(...color);
    
    // Ground
    p.fill(90, 70, 50);
    p.noStroke();
    p.rect(0, CANVAS_HEIGHT - 80, CANVAS_WIDTH, 80);
    
    // Location-specific decorations
    this.renderLocationDecor();
    
    // Location name
    p.fill(0, 0, 0, 150);
    p.rect(10, 10, 200, 30, 5);
    p.fill(255);
    p.textAlign(p.LEFT, p.CENTER);
    p.textSize(16);
    p.text(location.name, 20, 25);
  }
  
  renderLocationDecor() {
    const p = this.p;
    const loc = gameState.currentLocation;
    
    p.push();
    
    switch(loc) {
      case "village_square":
        // Fountain
        p.fill(200, 200, 220);
        p.ellipse(300, 200, 80, 60);
        p.fill(100, 150, 255, 150);
        p.ellipse(300, 195, 60, 40);
        
        // Buildings
        p.fill(180, 140, 100);
        p.rect(50, 150, 80, 100);
        p.rect(470, 150, 80, 100);
        break;
        
      case "mystery_shop":
        // Shelves
        p.fill(139, 90, 60);
        p.rect(50, 120, 100, 150);
        p.rect(450, 120, 100, 150);
        
        // Items on shelves
        for (let i = 0; i < 5; i++) {
          p.fill(200, 100 + i * 20, 150);
          p.rect(60 + i * 18, 140, 15, 20, 2);
        }
        break;
        
      case "park":
        // Trees
        p.fill(101, 67, 33);
        p.rect(100, 100, 20, 80);
        p.rect(480, 120, 20, 60);
        
        p.fill(34, 139, 34);
        p.ellipse(110, 90, 80, 80);
        p.ellipse(490, 110, 60, 60);
        
        // Flowers
        for (let i = 0; i < 8; i++) {
          p.fill(255, 100 + i * 15, 150);
          p.ellipse(200 + i * 40, 300, 10, 10);
        }
        break;
        
      case "library":
        // Bookshelves
        p.fill(101, 67, 33);
        p.rect(40, 100, 120, 180);
        p.rect(440, 100, 120, 180);
        
        // Books
        for (let i = 0; i < 10; i++) {
          p.fill(150 + i * 10, 100, 200 - i * 10);
          p.rect(50 + i * 11, 110 + (i % 3) * 50, 10, 40);
        }
        break;
    }
    
    p.pop();
  }
  
  renderHotspots() {
    this.hotspots.forEach(spot => spot.render());
  }
  
  renderTransition() {
    if (this.transitionAlpha > 0) {
      this.p.fill(0, 0, 0, this.transitionAlpha);
      this.p.noStroke();
      this.p.rect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);
    }
  }
  
  getHoveredHotspot() {
    return this.hotspots.find(spot => spot.hovered && !spot.collected);
  }
  
  navigate(direction) {
    const location = LOCATIONS[gameState.currentLocation];
    if (!location) return false;
    
    const nextLocation = location.connections[direction];
    if (!nextLocation) return false;
    
    return this.loadLocation(nextLocation);
  }
}