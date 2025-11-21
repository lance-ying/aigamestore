// levels.js - Level generation and management
import { Platform, Hazard, EnchantedParrot, Collectible, Chest } from './entities.js';

export function generateLevel(levelNumber) {
  const levelData = {
    platforms: [],
    hazards: [],
    enemies: [],
    collectibles: [],
    chests: [],
    spawnX: 50,
    spawnY: 200,
    theme: 'tropical'
  };

  if (levelNumber === 0) {
    // Tutorial level - simple platforming
    levelData.platforms = [
      new Platform(0, 350, 600, 50, 'grass'),
      new Platform(150, 300, 100, 20, 'grass'),
      new Platform(300, 250, 100, 20, 'grass'),
      new Platform(450, 200, 120, 20, 'grass')
    ];
    levelData.collectibles = [
      new Collectible(200, 270),
      new Collectible(350, 220),
      new Collectible(500, 170)
    ];
    levelData.chests = [new Chest(520, 175, 0)];
    
  } else if (levelNumber === 1) {
    // Introduction to hazards
    levelData.platforms = [
      new Platform(0, 350, 150, 50, 'grass'),
      new Platform(200, 320, 100, 20, 'grass'),
      new Platform(350, 280, 120, 20, 'stone'),
      new Platform(500, 320, 100, 20, 'grass')
    ];
    levelData.hazards = [
      new Hazard(160, 350, 30, 50, 'quicksand')
    ];
    levelData.collectibles = [
      new Collectible(250, 290),
      new Collectible(400, 250)
    ];
    levelData.chests = [new Chest(530, 295, 1)];
    
  } else if (levelNumber === 2) {
    // Enchanted parrots introduced
    levelData.platforms = [
      new Platform(0, 350, 100, 50, 'grass'),
      new Platform(150, 300, 80, 20, 'stone'),
      new Platform(280, 250, 80, 20, 'stone'),
      new Platform(410, 200, 80, 20, 'stone'),
      new Platform(520, 280, 80, 20, 'grass')
    ];
    levelData.enemies = [
      new EnchantedParrot(200, 220, 150)
    ];
    levelData.collectibles = [
      new Collectible(190, 270),
      new Collectible(320, 220),
      new Collectible(450, 170)
    ];
    levelData.chests = [new Chest(540, 255, 2)];
    
  } else if (levelNumber === 3) {
    // Complex platforming with multiple hazards
    levelData.platforms = [
      new Platform(0, 350, 120, 50, 'grass'),
      new Platform(170, 300, 60, 20, 'stone'),
      new Platform(280, 260, 60, 20, 'stone'),
      new Platform(390, 220, 60, 20, 'stone'),
      new Platform(500, 180, 100, 20, 'grass')
    ];
    levelData.hazards = [
      new Hazard(130, 350, 30, 50, 'quicksand'),
      new Hazard(250, 350, 20, 10, 'spikes')
    ];
    levelData.enemies = [
      new EnchantedParrot(300, 180, 100)
    ];
    levelData.collectibles = [
      new Collectible(200, 270),
      new Collectible(310, 230),
      new Collectible(420, 190),
      new Collectible(540, 150, 'spyglass')
    ];
    levelData.chests = [new Chest(540, 155, 3)];
    
  } else if (levelNumber === 4) {
    // Advanced island
    levelData.theme = 'volcanic';
    levelData.platforms = [
      new Platform(0, 350, 100, 50, 'stone'),
      new Platform(150, 300, 70, 20, 'stone'),
      new Platform(270, 250, 70, 20, 'stone'),
      new Platform(390, 200, 70, 20, 'stone'),
      new Platform(510, 250, 90, 20, 'stone')
    ];
    levelData.hazards = [
      new Hazard(110, 350, 30, 50, 'quicksand'),
      new Hazard(230, 350, 30, 10, 'spikes'),
      new Hazard(350, 350, 30, 10, 'spikes')
    ];
    levelData.enemies = [
      new EnchantedParrot(200, 220, 120),
      new EnchantedParrot(400, 150, 100)
    ];
    levelData.collectibles = [
      new Collectible(190, 270),
      new Collectible(310, 220),
      new Collectible(430, 170),
      new Collectible(540, 220)
    ];
    levelData.chests = [new Chest(540, 225, 4)];
    
  } else {
    // Final challenge level
    levelData.theme = 'mystical';
    levelData.platforms = [
      new Platform(0, 350, 80, 50, 'stone'),
      new Platform(130, 300, 60, 20, 'stone'),
      new Platform(240, 250, 60, 20, 'stone'),
      new Platform(350, 200, 60, 20, 'stone'),
      new Platform(460, 250, 60, 20, 'stone'),
      new Platform(540, 300, 60, 20, 'grass')
    ];
    levelData.hazards = [
      new Hazard(90, 350, 30, 50, 'quicksand'),
      new Hazard(200, 350, 30, 10, 'spikes'),
      new Hazard(310, 350, 30, 10, 'spikes'),
      new Hazard(420, 350, 30, 10, 'spikes')
    ];
    levelData.enemies = [
      new EnchantedParrot(180, 220, 80),
      new EnchantedParrot(300, 170, 80),
      new EnchantedParrot(410, 220, 80)
    ];
    levelData.collectibles = [
      new Collectible(160, 270),
      new Collectible(270, 220),
      new Collectible(380, 170),
      new Collectible(490, 220),
      new Collectible(560, 270)
    ];
    levelData.chests = [new Chest(560, 275, 5)];
  }

  return levelData;
}

export function loadLevel(levelNumber) {
  const levelData = generateLevel(levelNumber);
  return levelData;
}