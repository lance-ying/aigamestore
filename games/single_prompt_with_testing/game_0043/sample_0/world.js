// world.js - World generation and management

import { gameState, GROUND_LEVEL, WORLD_WIDTH } from './globals.js';
import { Package, Customer, Treasure, Building, Obstacle } from './entities.js';

export function generateWorld(p) {
  gameState.packages = [];
  gameState.customers = [];
  gameState.treasures = [];
  gameState.buildings = [];
  gameState.obstacles = [];
  
  // Generate customers
  const customerPositions = [
    { x: 400, y: GROUND_LEVEL - 22, name: "Bob" },
    { x: 800, y: GROUND_LEVEL - 22, name: "Sue" },
    { x: 1200, y: GROUND_LEVEL - 22, name: "Joe" },
    { x: 1600, y: GROUND_LEVEL - 22, name: "Ann" }
  ];
  
  for (let i = 0; i < customerPositions.length; i++) {
    const pos = customerPositions[i];
    gameState.customers.push(new Customer(pos.x, pos.y, i, pos.name));
  }
  
  // Generate packages (one per customer)
  const packagePositions = [
    { x: 250, y: GROUND_LEVEL - 10, dest: 0 },
    { x: 600, y: GROUND_LEVEL - 10, dest: 1 },
    { x: 1000, y: GROUND_LEVEL - 10, dest: 2 },
    { x: 1400, y: GROUND_LEVEL - 10, dest: 3 }
  ];
  
  for (let i = 0; i < packagePositions.length; i++) {
    const pos = packagePositions[i];
    gameState.packages.push(new Package(pos.x, pos.y, pos.dest));
  }
  
  // Generate treasures scattered around
  const treasurePositions = [
    { x: 300, y: GROUND_LEVEL - 50, type: 0 },
    { x: 500, y: GROUND_LEVEL - 10, type: 1 },
    { x: 700, y: GROUND_LEVEL - 80, type: 2 },
    { x: 900, y: GROUND_LEVEL - 10, type: 0 },
    { x: 1100, y: GROUND_LEVEL - 60, type: 1 },
    { x: 1300, y: GROUND_LEVEL - 10, type: 2 },
    { x: 1500, y: GROUND_LEVEL - 90, type: 0 },
    { x: 1700, y: GROUND_LEVEL - 10, type: 1 },
    { x: 1850, y: GROUND_LEVEL - 70, type: 2 }
  ];
  
  for (let i = 0; i < treasurePositions.length; i++) {
    const pos = treasurePositions[i];
    gameState.treasures.push(new Treasure(pos.x, pos.y, pos.type));
  }
  
  // Generate buildings
  gameState.buildings.push(new Building(450, GROUND_LEVEL - 80, 80, 120, [200, 180, 150], "house"));
  gameState.buildings.push(new Building(850, GROUND_LEVEL - 90, 90, 140, [180, 200, 180], "house"));
  gameState.buildings.push(new Building(1250, GROUND_LEVEL - 85, 85, 130, [190, 190, 220], "house"));
  gameState.buildings.push(new Building(1650, GROUND_LEVEL - 95, 95, 150, [220, 200, 180], "house"));
  
  // Shops
  gameState.buildings.push(new Building(150, GROUND_LEVEL - 70, 70, 100, [255, 220, 180], "shop"));
  gameState.buildings.push(new Building(1800, GROUND_LEVEL - 75, 75, 110, [220, 240, 255], "shop"));
  
  // Trees
  for (let i = 0; i < 12; i++) {
    const x = 200 + i * 150 + p.random(-30, 30);
    const y = GROUND_LEVEL - 50;
    if (x > 100 && x < WORLD_WIDTH - 100) {
      gameState.buildings.push(new Building(x, y, 60, 100, [], "tree"));
    }
  }
  
  // Generate platforms/obstacles
  gameState.obstacles.push(new Obstacle(350, GROUND_LEVEL - 70, 60, 15, "platform"));
  gameState.obstacles.push(new Obstacle(750, GROUND_LEVEL - 100, 70, 15, "platform"));
  gameState.obstacles.push(new Obstacle(1150, GROUND_LEVEL - 80, 65, 15, "platform"));
  gameState.obstacles.push(new Obstacle(1550, GROUND_LEVEL - 110, 75, 15, "platform"));
  
  // Rocks
  gameState.obstacles.push(new Obstacle(550, GROUND_LEVEL - 20, 40, 35, "rock"));
  gameState.obstacles.push(new Obstacle(950, GROUND_LEVEL - 20, 45, 40, "rock"));
  gameState.obstacles.push(new Obstacle(1350, GROUND_LEVEL - 20, 38, 32, "rock"));
}

export function renderWorld(p, cameraX, cameraY) {
  // Sky gradient
  for (let y = 0; y < 350; y++) {
    const inter = p.map(y, 0, 350, 0, 1);
    const c = p.lerpColor(p.color(135, 206, 235), p.color(255, 240, 200), inter);
    p.stroke(c);
    p.line(0, y, CANVAS_WIDTH, y);
  }
  
  // Ground
  p.fill(100, 180, 100);
  p.noStroke();
  p.rect(0, GROUND_LEVEL, CANVAS_WIDTH, 50);
  
  // Ground details
  p.fill(80, 150, 80);
  for (let x = 0; x < CANVAS_WIDTH; x += 20) {
    const worldX = x + cameraX;
    const offset = (Math.sin(worldX * 0.1) * 5);
    p.ellipse(x, GROUND_LEVEL + offset, 15, 8);
  }
  
  // Render buildings (background layer)
  for (let building of gameState.buildings) {
    if (building.type === "tree" || building.type === "house" || building.type === "shop") {
      building.render(p, cameraX, cameraY);
    }
  }
  
  // Render obstacles
  for (let obstacle of gameState.obstacles) {
    obstacle.render(p, cameraX, cameraY);
  }
  
  // Render treasures
  for (let treasure of gameState.treasures) {
    treasure.render(p, cameraX, cameraY);
  }
  
  // Render packages
  for (let pkg of gameState.packages) {
    pkg.render(p, cameraX, cameraY);
  }
  
  // Render customers
  for (let customer of gameState.customers) {
    customer.render(p, cameraX, cameraY);
  }
}

export function updateCamera(p) {
  const player = gameState.player;
  if (!player) return;
  
  // Follow player with smooth camera
  const targetX = player.x - CANVAS_WIDTH / 2;
  gameState.camera.x += (targetX - gameState.camera.x) * 0.1;
  
  // Clamp camera to world bounds
  gameState.camera.x = p.constrain(gameState.camera.x, 0, WORLD_WIDTH - CANVAS_WIDTH);
  gameState.camera.y = 0;
}

const CANVAS_WIDTH = 600;