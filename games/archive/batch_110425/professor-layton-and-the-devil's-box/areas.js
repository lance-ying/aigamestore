// areas.js - Game areas and level design

import { HintCoin, PuzzleHotspot, Obstacle } from './entities.js';

export function createAreas(p) {
  return [
    // Area 0: Village Square (Tutorial)
    {
      name: "Village Square",
      background: { r: 180, g: 200, b: 160 },
      obstacles: [
        new Obstacle(p, 50, 50, 80, 60, "building"),
        new Obstacle(p, 470, 50, 80, 60, "building"),
        new Obstacle(p, 250, 280, 100, 80, "fountain")
      ],
      hintCoins: [
        { x: 100, y: 150 },
        { x: 500, y: 150 },
        { x: 300, y: 100 },
        { x: 150, y: 300 }
      ],
      puzzleHotspots: [
        { x: 200, y: 150, width: 60, height: 60, puzzleId: 0, mandatory: true },
        { x: 400, y: 250, width: 60, height: 60, puzzleId: 1, mandatory: true }
      ],
      description: "A quaint village square.\nSearch for hint coins!"
    },
    
    // Area 1: Town Library
    {
      name: "Town Library",
      background: { r: 140, g: 120, b: 100 },
      obstacles: [
        new Obstacle(p, 100, 80, 120, 40, "bookshelf"),
        new Obstacle(p, 380, 80, 120, 40, "bookshelf"),
        new Obstacle(p, 100, 260, 120, 40, "bookshelf"),
        new Obstacle(p, 380, 260, 120, 40, "bookshelf")
      ],
      hintCoins: [
        { x: 50, y: 200 },
        { x: 550, y: 200 },
        { x: 300, y: 350 },
        { x: 250, y: 50 }
      ],
      puzzleHotspots: [
        { x: 260, y: 160, width: 80, height: 60, puzzleId: 2, mandatory: true },
        { x: 450, y: 180, width: 60, height: 60, puzzleId: 3, mandatory: false }
      ],
      description: "Ancient books line the\nshelves. Knowledge awaits!"
    },
    
    // Area 2: Mysterious Tower (Final)
    {
      name: "Devil's Tower",
      background: { r: 80, g: 60, b: 90 },
      obstacles: [
        new Obstacle(p, 50, 150, 60, 100, "pillar"),
        new Obstacle(p, 490, 150, 60, 100, "pillar"),
        new Obstacle(p, 270, 50, 60, 80, "altar")
      ],
      hintCoins: [
        { x: 150, y: 100 },
        { x: 450, y: 100 },
        { x: 300, y: 320 },
        { x: 100, y: 300 },
        { x: 500, y: 300 }
      ],
      puzzleHotspots: [
        { x: 150, y: 250, width: 70, height: 70, puzzleId: 4, mandatory: true },
        { x: 380, y: 250, width: 70, height: 70, puzzleId: 5, mandatory: true }
      ],
      description: "The heart of the mystery.\nSolve the final puzzles!"
    }
  ];
}

export function initializeArea(p, gameState, areaIndex) {
  const areaData = gameState.areas[areaIndex];
  
  // Clear and reinitialize entities
  gameState.hintCoins = [];
  gameState.puzzleHotspots = [];
  
  // Create hint coins
  areaData.hintCoins.forEach((coinData, idx) => {
    const coin = new HintCoin(p, coinData.x, coinData.y, `${areaIndex}-${idx}`);
    gameState.hintCoins.push(coin);
    gameState.entities.push(coin);
  });
  
  // Create puzzle hotspots
  areaData.puzzleHotspots.forEach(hotspotData => {
    const hotspot = new PuzzleHotspot(
      p,
      hotspotData.x,
      hotspotData.y,
      hotspotData.width,
      hotspotData.height,
      hotspotData.puzzleId,
      hotspotData.mandatory
    );
    gameState.puzzleHotspots.push(hotspot);
    gameState.entities.push(hotspot);
  });
  
  // Reset player position
  if (gameState.player) {
    gameState.player.x = 300;
    gameState.player.y = 350;
  }
}