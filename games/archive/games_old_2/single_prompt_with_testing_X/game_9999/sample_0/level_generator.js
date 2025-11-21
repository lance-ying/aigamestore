// level_generator.js - Level generation and configuration

import { CANVAS_WIDTH, CANVAS_HEIGHT, gameState } from './globals.js';
import { Gate, Obstacle, SpeedPad } from './entities.js';

export function generateLevel(levelNum) {
  const gates = [];
  const obstacles = [];
  const speedPads = [];
  
  // Level progression
  const difficulty = Math.min(levelNum, 8);
  
  // Generate gates in horizontal layout (left to right progression)
  if (levelNum === 1) {
    // Tutorial level - simple blue gates in a line
    const g1 = new Gate(200, CANVAS_HEIGHT / 2 - 60, 2, 70, 110);
    g1.oscillateSpeed = 0.015;
    g1.oscillateRange = 25;
    gates.push(g1);
    
    gates.push(new Gate(320, CANVAS_HEIGHT / 2, 2, 70, 110));
    
    const g2 = new Gate(440, CANVAS_HEIGHT / 2 + 60, 3, 70, 110);
    g2.oscillateSpeed = 0.02;
    g2.oscillateRange = 30;
    gates.push(g2);
  } else if (levelNum === 2) {
    // Introduce red gates and more movement
    const g1 = new Gate(180, CANVAS_HEIGHT / 2 - 80, 2, 60, 100);
    g1.oscillateSpeed = 0.02;
    g1.oscillateRange = 35;
    gates.push(g1);
    
    gates.push(new Gate(250, CANVAS_HEIGHT / 2 + 60, 0.5, 60, 100));
    
    const g2 = new Gate(360, CANVAS_HEIGHT / 2 - 40, 3, 70, 110);
    g2.oscillateSpeed = 0.025;
    g2.oscillateRange = 40;
    gates.push(g2);
    
    const g3 = new Gate(470, CANVAS_HEIGHT / 2 + 40, 2, 60, 100);
    g3.oscillateSpeed = 0.018;
    g3.oscillateRange = 30;
    gates.push(g3);
  } else if (levelNum === 3) {
    // More moving gates
    const g1 = new Gate(200, CANVAS_HEIGHT / 2, 2, 60, 100);
    g1.oscillateSpeed = 0.025;
    g1.oscillateRange = 45;
    gates.push(g1);
    
    const g2 = new Gate(300, CANVAS_HEIGHT / 2 + 60, 0.5, 55, 95);
    g2.oscillateSpeed = 0.03;
    g2.oscillateRange = 35;
    gates.push(g2);
    
    const g3 = new Gate(400, CANVAS_HEIGHT / 2 - 50, 3, 65, 105);
    g3.oscillateSpeed = 0.028;
    g3.oscillateRange = 50;
    gates.push(g3);
    
    const g4 = new Gate(490, CANVAS_HEIGHT / 2, 2, 60, 100);
    g4.oscillateSpeed = 0.022;
    g4.oscillateRange = 40;
    gates.push(g4);
  } else {
    // Advanced levels - complex patterns with lots of movement
    const gateCount = 4 + Math.floor(difficulty / 2);
    const startX = 150;
    const spacing = (CANVAS_WIDTH - startX - 150) / (gateCount - 1);
    
    for (let i = 0; i < gateCount; i++) {
      const x = startX + i * spacing;
      const y = CANVAS_HEIGHT / 2 + Math.sin(i * 0.8) * 80;
      const mult = (i % 3 === 0 && i > 0) ? 0.5 : (i % 2 === 0 ? 2 : 3);
      const gate = new Gate(x, y, mult, 60, 100);
      
      // Make most gates move in higher levels
      if (difficulty >= 4) {
        gate.oscillateSpeed = 0.015 + Math.random() * 0.02;
        gate.oscillateRange = 30 + Math.random() * 30;
      } else if (i % 2 === 1) {
        gate.oscillateSpeed = 0.015 + Math.random() * 0.015;
        gate.oscillateRange = 30 + Math.random() * 20;
      }
      
      gates.push(gate);
    }
  }
  
  // Generate obstacles based on level
  if (levelNum >= 2) {
    const obstacleCount = Math.min(1 + Math.floor(difficulty / 2), 4);
    
    for (let i = 0; i < obstacleCount; i++) {
      const x = 250 + (i * 80);
      const y = CANVAS_HEIGHT / 2 + ((i % 2 === 0) ? -80 : 80);
      const type = (levelNum >= 4 && i === obstacleCount - 1) ? 'fortified' : 'block';
      obstacles.push(new Obstacle(x, y, type));
    }
  }
  
  // Generate speed pads for advanced levels
  if (levelNum >= 3) {
    const padCount = Math.min(Math.floor(difficulty / 2), 2);
    for (let i = 0; i < padCount; i++) {
      const x = 220 + i * 180;
      const y = CANVAS_HEIGHT / 2 + ((i % 2 === 0) ? 100 : -100);
      speedPads.push(new SpeedPad(x, y, 1.8));
    }
  }
  
  return { gates, obstacles, speedPads };
}