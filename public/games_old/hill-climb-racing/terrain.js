import Matter from 'https://cdn.jsdelivr.net/npm/matter-js@0.19.0/+esm';
const { Bodies, World } = Matter;
import { gameState, CANVAS_HEIGHT } from './globals.js';
import { Coin } from './entities.js';

export function generateTerrain(p) {
  const points = [];
  const segments = 80;
  const segmentWidth = 100;
  
  let currentX = 0;
  let currentY = CANVAS_HEIGHT - 100;
  
  points.push({ x: currentX, y: currentY });
  
  // Generate varied terrain
  for (let i = 0; i < segments; i++) {
    currentX += segmentWidth;
    
    // Create varied terrain features
    if (i < 5) {
      // Gentle start
      currentY += p.random(-10, 5);
    } else if (i < 15) {
      // First hill
      currentY += p.random(-20, -5);
    } else if (i < 25) {
      // Valley
      currentY += p.random(0, 15);
    } else if (i < 35) {
      // Big hill
      currentY += p.random(-25, -10);
    } else if (i < 45) {
      // Plateau
      currentY += p.random(-5, 5);
    } else if (i < 55) {
      // Descent
      currentY += p.random(5, 20);
    } else if (i < 65) {
      // Final climb
      currentY += p.random(-30, -15);
    } else {
      // Finish area
      currentY += p.random(-5, 5);
    }
    
    // Keep within bounds
    currentY = p.constrain(currentY, CANVAS_HEIGHT / 3, CANVAS_HEIGHT - 50);
    
    points.push({ x: currentX, y: currentY });
  }
  
  gameState.terrain = points;
  
  // Create ground bodies
  for (let i = 0; i < points.length - 1; i++) {
    const p1 = points[i];
    const p2 = points[i + 1];
    
    const angle = Math.atan2(p2.y - p1.y, p2.x - p1.x);
    const length = Math.sqrt(Math.pow(p2.x - p1.x, 2) + Math.pow(p2.y - p1.y, 2));
    const midX = (p1.x + p2.x) / 2;
    const midY = (p1.y + p2.y) / 2;
    
    const ground = Bodies.rectangle(midX, midY, length, 20, {
      isStatic: true,
      angle: angle,
      friction: 0.8,
      restitution: 0,
      label: 'ground'
    });
    
    World.add(gameState.world, ground);
    gameState.groundBodies.push(ground);
  }
  
  // Set finish line
  gameState.finishLine = currentX - 200;
}

export function generateCoins(p) {
  const coins = [];
  
  // Place coins along terrain
  for (let i = 5; i < gameState.terrain.length - 5; i += 3) {
    const point = gameState.terrain[i];
    const coin = new Coin(p, point.x, point.y - 50);
    coins.push(coin);
  }
  
  gameState.collectibles = coins;
  gameState.entities.push(...coins);
}

export function renderTerrain(p) {
  const camX = gameState.camera.x;
  const camY = gameState.camera.y;
  
  // Draw ground
  p.push();
  p.fill(101, 67, 33);
  p.stroke(70, 50, 30);
  p.strokeWeight(2);
  p.beginShape();
  
  for (let point of gameState.terrain) {
    p.vertex(point.x - camX, point.y - camY);
  }
  
  p.vertex(gameState.terrain[gameState.terrain.length - 1].x - camX, CANVAS_HEIGHT);
  p.vertex(gameState.terrain[0].x - camX, CANVAS_HEIGHT);
  p.endShape(p.CLOSE);
  p.pop();
  
  // Draw grass on top
  p.push();
  p.stroke(34, 139, 34);
  p.strokeWeight(3);
  for (let i = 0; i < gameState.terrain.length - 1; i++) {
    const p1 = gameState.terrain[i];
    const p2 = gameState.terrain[i + 1];
    p.line(p1.x - camX, p1.y - camY, p2.x - camX, p2.y - camY);
  }
  p.pop();
  
  // Draw finish line
  if (gameState.finishLine) {
    const finishY = getTerrainHeightAt(gameState.finishLine);
    p.push();
    p.stroke(255, 0, 0);
    p.strokeWeight(4);
    p.fill(255, 255, 255, 100);
    for (let i = 0; i < 8; i++) {
      if (i % 2 === 0) {
        p.fill(255, 255, 255, 150);
      } else {
        p.fill(0, 0, 0, 150);
      }
      p.rect(gameState.finishLine - camX, finishY - camY - 80 + i * 10, 20, 10);
    }
    p.pop();
  }
}

function getTerrainHeightAt(x) {
  for (let i = 0; i < gameState.terrain.length - 1; i++) {
    const p1 = gameState.terrain[i];
    const p2 = gameState.terrain[i + 1];
    
    if (x >= p1.x && x <= p2.x) {
      const t = (x - p1.x) / (p2.x - p1.x);
      return p1.y + (p2.y - p1.y) * t;
    }
  }
  return CANVAS_HEIGHT - 100;
}