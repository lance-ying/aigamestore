// scenes.js - Scene management and definitions

import { ItemObject, PuzzleObject, DoorObject } from './interactable.js';

export function createScenes(p) {
  return [
    // Scene 0: Starting area
    {
      id: 0,
      name: "City Square",
      background: (p) => {
        // Sky
        p.fill(180, 200, 230);
        p.rect(0, 0, 600, 200);
        
        // Ground
        p.fill(140, 140, 130);
        p.rect(0, 300, 600, 100);
        
        // Buildings in background
        p.fill(100, 100, 120);
        p.rect(50, 150, 80, 150);
        p.fill(120, 120, 140);
        p.rect(150, 120, 100, 180);
        p.fill(90, 90, 110);
        p.rect(400, 140, 120, 160);
        
        // Windows
        p.fill(200, 220, 255);
        for (let i = 0; i < 3; i++) {
          for (let j = 0; j < 4; j++) {
            p.rect(60 + i * 20, 170 + j * 25, 15, 20);
            p.rect(165 + i * 30, 140 + j * 30, 20, 25);
            p.rect(415 + i * 30, 160 + j * 30, 20, 25);
          }
        }
      },
      interactables: [
        { type: "item", x: 150, y: 280, id: "gear1", itemName: "gear" },
        { type: "puzzle", x: 450, y: 270, id: "puzzle1", puzzleType: "gears" },
        { type: "door", x: 550, y: 270, id: "door1", targetScene: 1, requiredItem: null }
      ]
    },
    // Scene 1: Workshop
    {
      id: 1,
      name: "Workshop",
      background: (p) => {
        // Interior wall
        p.fill(120, 100, 80);
        p.rect(0, 0, 600, 300);
        
        // Floor
        p.fill(100, 80, 60);
        p.rect(0, 300, 600, 100);
        
        // Workbench
        p.fill(140, 110, 70);
        p.rect(350, 250, 150, 50);
        p.rect(360, 270, 15, 30);
        p.rect(475, 270, 15, 30);
        
        // Shelves
        p.fill(100, 80, 50);
        for (let i = 0; i < 3; i++) {
          p.rect(100, 100 + i * 60, 120, 8);
        }
        
        // Tools on wall
        p.stroke(80, 80, 90);
        p.strokeWeight(2);
        p.line(130, 50, 150, 80);
        p.line(170, 40, 180, 75);
        
        // Window
        p.fill(150, 180, 220);
        p.rect(250, 80, 80, 60);
        p.line(290, 80, 290, 140);
        p.line(250, 110, 330, 110);
      },
      interactables: [
        { type: "item", x: 120, y: 120, id: "wrench1", itemName: "wrench" },
        { type: "item", x: 420, y: 230, id: "key1", itemName: "key" },
        { type: "door", x: 50, y: 270, id: "door2", targetScene: 0, requiredItem: null },
        { type: "door", x: 550, y: 270, id: "door3", targetScene: 2, requiredItem: "key1" }
      ]
    },
    // Scene 2: Control Room
    {
      id: 2,
      name: "Control Room",
      background: (p) => {
        // Dark interior
        p.fill(60, 60, 80);
        p.rect(0, 0, 600, 300);
        
        // Floor
        p.fill(50, 50, 70);
        p.rect(0, 300, 600, 100);
        
        // Control panels
        p.fill(40, 40, 60);
        p.rect(100, 200, 100, 100);
        p.rect(350, 200, 150, 100);
        
        // Screens
        p.fill(100, 150, 100);
        p.rect(110, 210, 80, 50);
        p.fill(150, 100, 100);
        p.rect(360, 210, 130, 50);
        
        // Buttons on panels
        p.fill(200, 50, 50);
        for (let i = 0; i < 3; i++) {
          p.circle(120 + i * 20, 275, 8);
          p.circle(375 + i * 35, 275, 8);
        }
        
        // Pipes
        p.stroke(80, 80, 100);
        p.strokeWeight(5);
        p.noFill();
        p.line(0, 100, 150, 100);
        p.line(150, 100, 150, 200);
        p.line(450, 100, 600, 100);
        p.line(450, 100, 450, 200);
      },
      interactables: [
        { type: "item", x: 300, y: 280, id: "fuse1", itemName: "fuse" },
        { type: "puzzle", x: 150, y: 250, id: "puzzle2", puzzleType: "pattern" },
        { type: "door", x: 50, y: 270, id: "door4", targetScene: 1, requiredItem: null },
        { type: "door", x: 550, y: 270, id: "door5", targetScene: 3, requiredItem: "fuse1" }
      ]
    },
    // Scene 3: Fireworks Tower (Final)
    {
      id: 3,
      name: "Fireworks Tower",
      background: (p) => {
        // Night sky
        p.fill(20, 20, 50);
        p.rect(0, 0, 600, 300);
        
        // Stars
        p.fill(255, 255, 200);
        p.noStroke();
        for (let i = 0; i < 30; i++) {
          const sx = (i * 73) % 600;
          const sy = (i * 41) % 200;
          p.circle(sx, sy, 2);
        }
        
        // Ground
        p.fill(80, 80, 90);
        p.rect(0, 300, 600, 100);
        
        // Tower structure
        p.fill(60, 60, 70);
        p.rect(250, 100, 100, 200);
        p.triangle(250, 100, 300, 50, 350, 100);
        
        // Fireworks launcher
        p.fill(100, 50, 50);
        p.rect(275, 120, 50, 40);
        p.fill(80, 40, 40);
        p.triangle(285, 120, 300, 100, 315, 120);
      },
      interactables: [
        { type: "puzzle", x: 300, y: 250, id: "puzzle_final", puzzleType: "gears" },
        { type: "door", x: 50, y: 270, id: "door6", targetScene: 2, requiredItem: null }
      ]
    }
  ];
}

export function createInteractables(p, scenes, currentScene) {
  const interactables = [];
  const sceneData = scenes[currentScene];
  
  for (const def of sceneData.interactables) {
    let obj;
    if (def.type === "item") {
      obj = new ItemObject(p, def.x, def.y, def.id, def.itemName, currentScene);
    } else if (def.type === "puzzle") {
      obj = new PuzzleObject(p, def.x, def.y, def.id, def.puzzleType, currentScene);
    } else if (def.type === "door") {
      obj = new DoorObject(p, def.x, def.y, def.id, def.targetScene, def.requiredItem, currentScene);
    }
    
    if (obj) {
      interactables.push(obj);
    }
  }
  
  return interactables;
}