// world.js - World/level management

import { NPC, DIALOGUE_TREES } from './npc.js';
import { Puzzle } from './puzzle.js';
import { AREA, gameState } from './globals.js';

export function initializeWorld() {
  // Clear existing entities
  gameState.npcs = [];
  gameState.interactables = [];
  gameState.entities = [];
  
  // Create NPCs
  createNPCs();
  
  // Create puzzles
  createPuzzles();
  
  // Add all to entities array
  gameState.entities = [...gameState.npcs, ...gameState.interactables];
}

function createNPCs() {
  // Central hub NPCs
  const logicUnit = new NPC(150, 150, "Logic Unit", DIALOGUE_TREES.LOGIC_UNIT, 'logic');
  const emotionCore = new NPC(450, 150, "Emotion Core", DIALOGUE_TREES.EMOTION_CORE, 'emotion');
  const memoryKeeper = new NPC(150, 300, "Memory Keeper", DIALOGUE_TREES.MEMORY_KEEPER, 'memory');
  const balancedSage = new NPC(450, 300, "Balanced Sage", DIALOGUE_TREES.BALANCED_SAGE, 'balanced');
  
  gameState.npcs.push(logicUnit, emotionCore, memoryKeeper, balancedSage);
}

function createPuzzles() {
  const puzzle1 = new Puzzle(300, 100, 'pattern', 'puzzle_1');
  const puzzle2 = new Puzzle(100, 200, 'sequence', 'puzzle_2');
  const puzzle3 = new Puzzle(500, 200, 'choice', 'puzzle_3');
  const puzzle4 = new Puzzle(300, 350, 'pattern', 'puzzle_4');
  
  gameState.interactables.push(puzzle1, puzzle2, puzzle3, puzzle4);
}

export function drawWorld(p) {
  // Background
  p.background(30, 35, 50);
  
  // Grid pattern
  p.stroke(40, 45, 60);
  p.strokeWeight(1);
  for (let x = 0; x < 600; x += 40) {
    p.line(x, 0, x, 400);
  }
  for (let y = 0; y < 400; y += 40) {
    p.line(0, y, 600, y);
  }
  
  // Area decorations
  drawAreaDecorations(p);
  
  // World boundaries
  p.noFill();
  p.stroke(80, 100, 120);
  p.strokeWeight(3);
  p.rect(2, 2, 596, 396);
}

function drawAreaDecorations(p) {
  // Decorative elements based on current area
  p.noStroke();
  
  // Corner accents
  const accentColor = [80, 120, 160];
  p.fill(...accentColor, 150);
  
  // Top left
  p.triangle(0, 0, 50, 0, 0, 50);
  // Top right
  p.triangle(600, 0, 550, 0, 600, 50);
  // Bottom left
  p.triangle(0, 400, 50, 400, 0, 350);
  // Bottom right
  p.triangle(600, 400, 550, 400, 600, 350);
  
  // Floating particles
  for (let i = 0; i < 15; i++) {
    const x = (i * 73 + p.frameCount * 0.3) % 600;
    const y = (i * 97 + Math.sin(p.frameCount * 0.01 + i) * 50) % 400;
    p.fill(100, 150, 200, 80);
    p.circle(x, y, 3);
  }
}