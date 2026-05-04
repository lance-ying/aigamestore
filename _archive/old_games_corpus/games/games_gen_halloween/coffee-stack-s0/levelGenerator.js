// levelGenerator.js - Generate level elements

import { Collectible, Obstacle, Gate } from './entities.js';
import { GAME_LENGTH, LANE_WIDTH, NUM_LANES, CANVAS_HEIGHT } from './globals.js';

export function generateLevel(p) {
  const entities = [];
  const startY = CANVAS_HEIGHT - 50;
  
  // Generate collectibles, obstacles, and gates
  let currentY = startY - 100;
  
  while (currentY > startY - GAME_LENGTH) {
    const segmentType = p.random();
    
    if (segmentType < 0.3) {
      // Collectibles segment
      const numCollectibles = p.floor(p.random(1, 4));
      for (let i = 0; i < numCollectibles; i++) {
        const lane = p.floor(p.random(NUM_LANES));
        const x = (lane + 0.5) * LANE_WIDTH;
        const y = currentY - i * 60;
        entities.push(new Collectible(p, x, y, lane));
      }
      currentY -= numCollectibles * 60;
    } else if (segmentType < 0.5) {
      // Obstacle segment
      const numObstacles = p.floor(p.random(1, 3));
      for (let i = 0; i < numObstacles; i++) {
        const lane = p.floor(p.random(NUM_LANES));
        const x = (lane + 0.5) * LANE_WIDTH;
        const y = currentY - i * 80;
        entities.push(new Obstacle(p, x, y, lane));
      }
      currentY -= numObstacles * 80;
    } else if (segmentType < 0.7) {
      // Gate segment
      const gateTypes = ['coffee', 'sleeve', 'lid'];
      const gateType = gateTypes[p.floor(p.random(gateTypes.length))];
      const x = CANVAS_WIDTH / 2;
      entities.push(new Gate(p, x, currentY, gateType));
      currentY -= 100;
    } else {
      // Empty space
      currentY -= 150;
    }
  }
  
  return entities;
}