// world.js - World generation and management

import { TILE_SIZE, CANVAS_WIDTH, CANVAS_HEIGHT } from './globals.js';
import { createStoryNPC, createTrainerNPC, createHealerNPC } from './npc.js';

export class World {
  constructor(p, biome = "FOREST") {
    this.p = p;
    this.biome = biome;
    this.width = CANVAS_WIDTH * 3;
    this.height = CANVAS_HEIGHT * 2;
    this.tiles = [];
    this.npcs = [];
    
    this.generateTerrain();
    this.generateNPCs();
  }
  
  generateTerrain() {
    const cols = Math.floor(this.width / TILE_SIZE);
    const rows = Math.floor(this.height / TILE_SIZE);
    
    for (let y = 0; y < rows; y++) {
      this.tiles[y] = [];
      for (let x = 0; x < cols; x++) {
        // Simple biome-based terrain
        const rand = this.p.random();
        let tile = "GRASS";
        
        if (this.biome === "FOREST") {
          if (rand < 0.15) tile = "TREE";
          else if (rand < 0.25) tile = "FLOWER";
        }
        
        this.tiles[y][x] = tile;
      }
    }
  }
  
  generateNPCs() {
    const p = this.p;
    
    // Story NPC - Mission 1
    this.npcs.push(createStoryNPC(
      TILE_SIZE * 3,
      TILE_SIZE * 2,
      0,
      [
        "Welcome, young trainer!",
        "Your journey begins now.",
        "Explore the world and capture Creo!",
        "Complete 3 trainer battles to progress."
      ]
    ));
    
    // Healer NPC
    this.npcs.push(createHealerNPC(
      TILE_SIZE * 2,
      TILE_SIZE * 2
    ));
    
    // Trainer NPCs scattered around
    this.npcs.push(createTrainerNPC(
      TILE_SIZE * 10,
      TILE_SIZE * 5,
      "Alice",
      ["AQUATAIL"],
      [6]
    ));
    
    this.npcs.push(createTrainerNPC(
      TILE_SIZE * 20,
      TILE_SIZE * 8,
      "Bob",
      ["LEAFLING", "SPARKBIT"],
      [7, 6]
    ));
    
    this.npcs.push(createTrainerNPC(
      TILE_SIZE * 30,
      TILE_SIZE * 12,
      "Charlie",
      ["FLAMEPUP", "ROCKLING"],
      [8, 8]
    ));
    
    // Story NPC - Mission 2 (after 3 trainers)
    this.npcs.push(createStoryNPC(
      TILE_SIZE * 35,
      TILE_SIZE * 10,
      1,
      [
        "Impressive! You've proven yourself.",
        "But a greater challenge awaits...",
        "Defeat the legendary Infernox!",
        "It lurks in the eastern caves."
      ]
    ));
    
    // Boss NPC (Final battle)
    this.npcs.push(createTrainerNPC(
      TILE_SIZE * 50,
      TILE_SIZE * 15,
      "Champion",
      ["INFERNOX"],
      [15]
    ));
  }
  
  getTileAt(x, y) {
    const col = Math.floor(x / TILE_SIZE);
    const row = Math.floor(y / TILE_SIZE);
    
    if (row >= 0 && row < this.tiles.length && 
        col >= 0 && col < this.tiles[0].length) {
      return this.tiles[row][col];
    }
    return null;
  }
  
  isWalkable(x, y, width, height) {
    // Check all corners of the entity
    const corners = [
      { x, y },
      { x: x + width, y },
      { x, y: y + height },
      { x: x + width, y: y + height }
    ];
    
    for (let corner of corners) {
      const tile = this.getTileAt(corner.x, corner.y);
      if (tile === "TREE") {
        return false;
      }
    }
    
    return true;
  }
  
  checkRandomEncounter(p) {
    // 2% chance per frame when moving
    return p.random() < 0.02;
  }
}

export function drawTile(p, tile, x, y) {
  const size = TILE_SIZE;
  
  switch (tile) {
    case "GRASS":
      p.fill(80, 160, 60);
      p.rect(x, y, size, size);
      // Add some grass texture
      p.stroke(70, 150, 50);
      for (let i = 0; i < 3; i++) {
        const gx = x + p.random(size);
        const gy = y + p.random(size);
        p.line(gx, gy, gx, gy - 3);
      }
      p.noStroke();
      break;
      
    case "TREE":
      p.fill(80, 160, 60);
      p.rect(x, y, size, size);
      p.fill(101, 67, 33);
      p.rect(x + size * 0.4, y + size * 0.5, size * 0.2, size * 0.5);
      p.fill(34, 139, 34);
      p.ellipse(x + size * 0.5, y + size * 0.3, size * 0.6, size * 0.6);
      break;
      
    case "FLOWER":
      p.fill(80, 160, 60);
      p.rect(x, y, size, size);
      p.fill(255, 200, 50);
      p.ellipse(x + size * 0.5, y + size * 0.5, size * 0.3, size * 0.3);
      break;
      
    default:
      p.fill(100, 100, 100);
      p.rect(x, y, size, size);
  }
}