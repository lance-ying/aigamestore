// scenes.js - Scene management and rendering

import { gameState } from './globals.js';
import { LEVEL_DATA } from './levelData.js';

export class SceneManager {
  constructor(p) {
    this.p = p;
  }

  getCurrentScene() {
    if (!gameState.currentSceneId || !gameState.allLevelsData) return null;
    const levelData = gameState.allLevelsData[gameState.currentLevel];
    return levelData.scenes.find(s => s.id === gameState.currentSceneId);
  }

  getHotspots() {
    const scene = this.getCurrentScene();
    if (!scene) return [];
    return scene.hotspots.filter(h => this.isHotspotAvailable(h));
  }

  isHotspotAvailable(hotspot) {
    if (hotspot.requiresState) {
      return gameState.hotspotStates[hotspot.requiresState] === true;
    }
    if (hotspot.requiresItem) {
      return gameState.inventory.some(item => item.id === hotspot.requiresItem);
    }
    // Check if already collected
    if (hotspot.type === 'item' && gameState.hotspotStates[hotspot.id + '_collected']) {
      return false;
    }
    return true;
  }

  navigateScene(direction) {
    const scene = this.getCurrentScene();
    if (!scene || !scene.connectedScenes) return false;

    const nextSceneId = scene.connectedScenes[direction];
    if (nextSceneId) {
      gameState.currentSceneId = nextSceneId;
      gameState.selectedHotspotIndex = 0;
      return true;
    }
    return false;
  }

  renderScene() {
    const scene = this.getCurrentScene();
    if (!scene) return;

    const p = this.p;
    
    // Background gradient based on level
    const colors = this.getLevelColors();
    for (let y = 0; y < 400; y++) {
      const inter = p.map(y, 0, 400, 0, 1);
      const c = p.lerpColor(p.color(colors.top), p.color(colors.bottom), inter);
      p.stroke(c);
      p.line(0, y, 600, y);
    }

    // Scene decorations
    this.renderSceneDecorations(scene);

    // Render hotspots
    const hotspots = this.getHotspots();
    hotspots.forEach((hotspot, index) => {
      this.renderHotspot(hotspot, index === gameState.selectedHotspotIndex);
    });

    // Scene name
    p.fill(200, 200, 220, 180);
    p.noStroke();
    p.rect(10, 360, 200, 30, 5);
    p.fill(40);
    p.textSize(14);
    p.textAlign(p.LEFT, p.CENTER);
    p.text(scene.name, 20, 375);
  }

  getLevelColors() {
    if (gameState.currentLevel === 1) {
      return { top: [60, 50, 70], bottom: [40, 35, 50] };
    } else if (gameState.currentLevel === 2) {
      return { top: [40, 30, 50], bottom: [20, 15, 30] };
    } else {
      return { top: [20, 15, 25], bottom: [10, 8, 15] };
    }
  }

  renderSceneDecorations(scene) {
    const p = this.p;
    p.push();
    
    if (scene.id === 'entrance') {
      // Stone steps
      p.fill(80, 75, 70);
      p.noStroke();
      for (let i = 0; i < 5; i++) {
        p.rect(200, 320 - i * 15, 200, 15);
      }
      // Foliage
      p.fill(40, 60, 35);
      p.ellipse(450, 280, 80, 100);
      p.ellipse(100, 250, 60, 80);
    } else if (scene.id === 'courtyard') {
      // Ground tiles
      p.stroke(60, 55, 50);
      p.strokeWeight(1);
      for (let x = 50; x < 550; x += 40) {
        for (let y = 250; y < 390; y += 40) {
          p.fill(70, 65, 60);
          p.rect(x, y, 38, 38);
        }
      }
    } else if (scene.id === 'main_door') {
      // Door frame
      p.fill(50, 45, 40);
      p.rect(220, 120, 160, 220, 10);
      p.fill(40, 35, 30);
      p.rect(240, 140, 120, 180, 5);
    } else if (scene.id === 'altar_room') {
      // Floor patterns
      p.stroke(50, 45, 50);
      p.strokeWeight(2);
      for (let i = 0; i < 5; i++) {
        p.line(100 + i * 100, 300, 100 + i * 100, 380);
      }
    } else if (scene.id === 'crypt_entrance') {
      // Crypt entrance archway
      p.fill(30, 25, 30);
      p.arc(300, 200, 200, 200, p.PI, 0);
      p.rect(200, 200, 200, 100);
    }

    // Subtle atmospheric effects
    if (gameState.currentLevel >= 2) {
      p.fill(0, 0, 0, 10);
      p.noStroke();
      p.rect(0, 0, 600, 400);
    }

    p.pop();
  }

  renderHotspot(hotspot, isSelected) {
    const p = this.p;
    p.push();

    // Base visual for hotspot type
    if (hotspot.type === 'item') {
      p.fill(200, 180, 100);
      p.noStroke();
      p.ellipse(hotspot.x + hotspot.w / 2, hotspot.y + hotspot.h / 2, 30, 30);
      p.fill(230, 210, 130);
      p.ellipse(hotspot.x + hotspot.w / 2 - 5, hotspot.y + hotspot.h / 2 - 5, 10, 10);
    } else if (hotspot.type === 'door') {
      p.fill(60, 50, 45);
      p.stroke(80, 70, 65);
      p.strokeWeight(3);
      p.rect(hotspot.x, hotspot.y, hotspot.w, hotspot.h, 5);
      // Door handle
      p.fill(120, 100, 80);
      p.ellipse(hotspot.x + hotspot.w - 20, hotspot.y + hotspot.h / 2, 12, 12);
    } else if (hotspot.type === 'puzzle') {
      p.fill(100, 90, 120);
      p.stroke(120, 110, 140);
      p.strokeWeight(2);
      p.rect(hotspot.x, hotspot.y, hotspot.w, hotspot.h, 5);
      // Puzzle indicator
      p.fill(150, 140, 180);
      p.textSize(12);
      p.textAlign(p.CENTER, p.CENTER);
      p.text('?', hotspot.x + hotspot.w / 2, hotspot.y + hotspot.h / 2);
    } else if (hotspot.type === 'examine' || hotspot.type === 'item_use') {
      p.fill(120, 110, 100);
      p.stroke(140, 130, 120);
      p.strokeWeight(2);
      p.rect(hotspot.x, hotspot.y, hotspot.w, hotspot.h, 3);
    }

    // Selection highlight
    if (isSelected) {
      p.noFill();
      p.stroke(255, 220, 100, 200 + 55 * p.sin(p.frameCount * 0.1));
      p.strokeWeight(3);
      p.rect(hotspot.x - 5, hotspot.y - 5, hotspot.w + 10, hotspot.h + 10, 5);
    }

    p.pop();
  }
}