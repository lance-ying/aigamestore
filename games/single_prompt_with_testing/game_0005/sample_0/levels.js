// levels.js
import { gameState } from './globals.js';
import { BridgeNode, Terrain } from './entities.js';

export function loadLevel(levelNum) {
  const levels = {
    1: {
      budget: 5000,
      vehicles: 3,
      startPoint: { x: 50, y: 300 },
      endPoint: { x: 550, y: 300 },
      terrain: [
        { x: 25, y: 350, width: 100, height: 100 },
        { x: 575, y: 350, width: 100, height: 100 }
      ],
      anchors: [
        { x: 50, y: 300 },
        { x: 75, y: 300 },
        { x: 525, y: 300 },
        { x: 550, y: 300 }
      ]
    },
    2: {
      budget: 4000,
      vehicles: 3,
      startPoint: { x: 50, y: 250 },
      endPoint: { x: 550, y: 300 },
      terrain: [
        { x: 25, y: 300, width: 100, height: 100 },
        { x: 575, y: 350, width: 100, height: 100 }
      ],
      anchors: [
        { x: 50, y: 250 },
        { x: 75, y: 250 },
        { x: 525, y: 300 },
        { x: 550, y: 300 }
      ]
    },
    3: {
      budget: 6000,
      vehicles: 4,
      startPoint: { x: 50, y: 280 },
      endPoint: { x: 550, y: 280 },
      terrain: [
        { x: 25, y: 330, width: 100, height: 100 },
        { x: 300, y: 380, width: 80, height: 40 },
        { x: 575, y: 330, width: 100, height: 100 }
      ],
      anchors: [
        { x: 50, y: 280 },
        { x: 75, y: 280 },
        { x: 300, y: 360 },
        { x: 525, y: 280 },
        { x: 550, y: 280 }
      ]
    }
  };
  
  const level = levels[levelNum] || levels[1];
  
  gameState.maxBudget = level.budget;
  gameState.budget = level.budget;
  gameState.totalVehicles = level.vehicles;
  gameState.startPoint = level.startPoint;
  gameState.endPoint = level.endPoint;
  
  // Clear existing terrain
  gameState.terrain = [];
  
  // Create terrain
  level.terrain.forEach(t => {
    const terrain = new Terrain(t.x, t.y, t.width, t.height);
    gameState.terrain.push(terrain);
  });
  
  // Create anchor points
  gameState.anchorPoints = [];
  level.anchors.forEach(a => {
    const node = new BridgeNode(a.x, a.y, true);
    gameState.anchorPoints.push(node);
  });
}