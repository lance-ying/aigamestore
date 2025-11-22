// level_generator.js - Level generation and configuration

import { CANVAS_WIDTH, CANVAS_HEIGHT, gameState } from './globals.js';
import { Gate, Obstacle, SpeedPad } from './entities.js';

export function generateLevel(levelNum) {
  const gates = [];
  const obstacles = [];
  const speedPads = [];
  
  // Level progression
  const difficulty = Math.min(levelNum, 8);
  
  // Generate gates based on level
  if (levelNum === 1) {
    // Tutorial level - simple blue gates
    gates.push(new Gate(200, 200, 2, 70, 110));
    gates.push(new Gate(350, 250, 2, 70, 110));
    gates.push(new Gate(480, 200, 3, 70, 110));
  } else if (levelNum === 2) {
    // Introduce red gates
    gates.push(new Gate(180, 180, 2, 60, 100));
    gates.push(new Gate(250, 260, 0.5, 60, 100));
    gates.push(new Gate(380, 200, 3, 70, 110));
    gates.push(new Gate(500, 240, 2, 60, 100));
  } else if (levelNum === 3) {
    // Moving gates
    const g1 = new Gate(200, 200, 2, 60, 100);
    g1.oscillateSpeed = 0.02;
    g1.oscillateRange = 40;
    gates.push(g1);
    
    gates.push(new Gate(300, 240, 0.5, 55, 95));
    
    const g2 = new Gate(420, 190, 3, 65, 105);
    g2.oscillateSpeed = 0.025;
    g2.oscillateRange = 35;
    gates.push(g2);
    
    gates.push(new Gate(520, 230, 2, 60, 100));
  } else {
    // Advanced levels - complex patterns
    const gateCount = 4 + Math.floor(difficulty / 2);
    const startX = 150;
    const spacing = (CANVAS_WIDTH - startX - 100) / (gateCount - 1);
    
    for (let i = 0; i < gateCount; i++) {
      const x = startX + i * spacing;
      const y = 180 + Math.sin(i * 0.8) * 60;
      const mult = (i % 3 === 0 && i > 0) ? 0.5 : (i % 2 === 0 ? 2 : 3);
      const gate = new Gate(x, y, mult, 60, 100);
      
      if (difficulty >= 5 && i % 2 === 1) {
        gate.oscillateSpeed = 0.015 + Math.random() * 0.015;
        gate.oscillateRange = 30 + Math.random() * 20;
      }
      
      gates.push(gate);
    }
  }
  
  // Generate obstacles based on level
  if (levelNum >= 2) {
    const obstacleCount = Math.min(1 + Math.floor(difficulty / 2), 5);
    
    for (let i = 0; i < obstacleCount; i++) {
      const x = 250 + (i * 80);
      const y = 280 + Math.sin(i) * 30;
      const type = (levelNum >= 4 && i === obstacleCount - 1) ? 'fortified' : 'block';
      obstacles.push(new Obstacle(x, y, type));
    }
  }
  
  // Generate speed pads for advanced levels
  if (levelNum >= 3) {
    const padCount = Math.min(Math.floor(difficulty / 2), 3);
    for (let i = 0; i < padCount; i++) {
      const x = 220 + i * 140;
      const y = 320;
      speedPads.push(new SpeedPad(x, y, 1.8));
    }
  }
  
  return { gates, obstacles, speedPads };
}