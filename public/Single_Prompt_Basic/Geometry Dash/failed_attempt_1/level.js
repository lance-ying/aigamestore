import { CANVAS_WIDTH, CANVAS_HEIGHT, GROUND_HEIGHT, PLAYER_SIZE } from './globals.js';
import { Obstacle, Star, LevelEnd } from './entities.js';

export function generateLevel(levelLength) {
  const obstacles = [];
  const stars = [];
  let levelEnd = null;
  
  // Starting safe zone (first 200px)
  let lastX = CANVAS_WIDTH + 100;
  
  // Generate obstacles throughout the level
  while (lastX < levelLength) {
    // Random gap between obstacles
    const gap = Math.random() * 150 + 100;
    lastX += gap;
    
    if (lastX >= levelLength - 200) break; // Leave space at the end
    
    // Decide obstacle type
    const obstacleType = Math.random();
    
    if (obstacleType < 0.4) {
      // Spike
      const height = Math.random() * 20 + 20;
      const width = height * 1.5;
      obstacles.push(new Obstacle(
        lastX, 
        CANVAS_HEIGHT - GROUND_HEIGHT - height,
        width,
        height,
        'spike'
      ));
      lastX += width;
    } else if (obstacleType < 0.7) {
      // Block
      const width = Math.random() * 40 + 30;
      const height = Math.random() * 40 + 30;
      obstacles.push(new Obstacle(
        lastX,
        CANVAS_HEIGHT - GROUND_HEIGHT - height,
        width,
        height,
        'block'
      ));
      lastX += width;
    } else {
      // Pit (gap in ground)
      const width = Math.random() * 60 + 60;
      obstacles.push(new Obstacle(
        lastX,
        CANVAS_HEIGHT - GROUND_HEIGHT,
        width,
        GROUND_HEIGHT,
        'pit'
      ));
      lastX += width;
    }
    
    // 30% chance to add a star near this obstacle
    if (Math.random() < 0.3) {
      const starX = lastX - 30;
      const starY = CANVAS_HEIGHT - GROUND_HEIGHT - PLAYER_SIZE * 2 - Math.random() * 80;
      stars.push(new Star(starX, starY));
    }
  }
  
  // Add the level end marker
  levelEnd = new LevelEnd(levelLength, CANVAS_HEIGHT - GROUND_HEIGHT - 100);
  
  return { obstacles, stars, levelEnd };
}