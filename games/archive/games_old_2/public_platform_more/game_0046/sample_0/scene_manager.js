// scene_manager.js - Scene and navigation management

import { gameState, SCENE_DATA, PUZZLES } from './globals.js';
import { Item } from './entities.js';

export function getCurrentScene() {
  return SCENE_DATA[gameState.currentScene];
}

export function navigateToScene(direction) {
  const currentScene = getCurrentScene();
  const nextSceneId = currentScene.exits[direction];
  
  if (nextSceneId !== undefined) {
    gameState.currentScene = nextSceneId;
    
    // Track visited scenes
    if (!gameState.visitedScenes.includes(nextSceneId)) {
      gameState.visitedScenes.push(nextSceneId);
    }
    
    return true;
  }
  return false;
}

export function getVisibleHotspots() {
  const scene = getCurrentScene();
  return scene.hotspots.filter(h => h.visible);
}

export function interactWithHotspot(hotspot) {
  if (hotspot.type === "item") {
    collectItem(hotspot);
  } else if (hotspot.type === "puzzle") {
    return attemptPuzzle(hotspot);
  }
  return false;
}

function collectItem(hotspot) {
  const item = new Item(hotspot.item, `A ${hotspot.item}`);
  gameState.inventory.push(item);
  hotspot.visible = false;
  
  // Track interaction
  if (!gameState.interactedHotspots.includes(hotspot.id)) {
    gameState.interactedHotspots.push(hotspot.id);
  }
  
  gameState.score += 10;
}

function attemptPuzzle(hotspot) {
  const puzzle = PUZZLES[hotspot.puzzle];
  
  if (puzzle.solved) {
    return false;
  }
  
  // Check if puzzle requires an item
  if (puzzle.requiredItem) {
    const hasItem = gameState.inventory.some(item => item.name === puzzle.requiredItem);
    
    if (hasItem && gameState.selectedItemIndex >= 0) {
      const selectedItem = gameState.inventory[gameState.selectedItemIndex];
      
      if (selectedItem.name === puzzle.requiredItem) {
        puzzle.solved = true;
        gameState.score += 50;
        
        // Track interaction
        if (!gameState.interactedHotspots.includes(hotspot.id)) {
          gameState.interactedHotspots.push(hotspot.id);
        }
        
        // Check for win condition
        if (hotspot.puzzle === "final_sequence") {
          const allPuzzlesSolved = puzzle.requiresPuzzles.every(p => PUZZLES[p].solved);
          if (allPuzzlesSolved) {
            return "WIN";
          }
        }
        
        return true;
      }
    }
  } else if (hotspot.puzzle === "final_sequence") {
    // Final puzzle requires all other puzzles solved
    const allPuzzlesSolved = puzzle.requiresPuzzles.every(p => PUZZLES[p].solved);
    if (allPuzzlesSolved) {
      puzzle.solved = true;
      gameState.score += 100;
      return "WIN";
    }
  }
  
  return false;
}

export function renderScene(p) {
  const scene = getCurrentScene();
  
  // Background
  p.fill(...scene.bgColor);
  p.rect(0, 50, 600, 300);
  
  // Scene border and details
  p.stroke(100, 150, 180);
  p.strokeWeight(3);
  p.noFill();
  p.rect(10, 60, 580, 280);
  
  // Draw atmospheric effects
  drawAtmosphere(p, scene);
  
  // Draw hotspots
  const hotspots = getVisibleHotspots();
  hotspots.forEach(hotspot => {
    drawHotspot(p, hotspot);
  });
  
  // Draw navigation arrows
  drawNavigationArrows(p, scene);
  
  // Scene name
  p.fill(200, 220, 240);
  p.noStroke();
  p.textAlign(p.CENTER, p.TOP);
  p.textSize(16);
  p.text(scene.name, 300, 20);
}

function drawAtmosphere(p, scene) {
  // Ice particles for atmosphere
  p.push();
  p.noStroke();
  for (let i = 0; i < 20; i++) {
    const x = (scene.id * 100 + i * 30) % 580 + 10;
    const y = (i * 50 + p.frameCount * 0.5) % 280 + 60;
    p.fill(200, 220, 240, 100);
    p.ellipse(x, y, 3, 3);
  }
  p.pop();
}

function drawHotspot(p, hotspot) {
  p.push();
  
  if (hotspot.type === "item") {
    // Draw item on scene
    const item = new Item(hotspot.item, "");
    item.render(p, hotspot.x, hotspot.y, 35);
    
    // Glow effect
    p.noFill();
    p.stroke(255, 255, 0, 150);
    p.strokeWeight(2);
    p.ellipse(hotspot.x, hotspot.y, 50 + Math.sin(p.frameCount * 0.1) * 5, 50 + Math.sin(p.frameCount * 0.1) * 5);
  } else if (hotspot.type === "puzzle") {
    const puzzle = PUZZLES[hotspot.puzzle];
    
    if (puzzle.solved) {
      p.fill(100, 255, 100, 150);
    } else {
      p.fill(255, 200, 100, 150);
    }
    
    p.stroke(255);
    p.strokeWeight(2);
    p.rect(hotspot.x, hotspot.y, hotspot.w, hotspot.h, 5);
    
    // Draw puzzle icon
    p.fill(255);
    p.noStroke();
    p.textAlign(p.CENTER, p.CENTER);
    p.textSize(12);
    
    if (puzzle.solved) {
      p.text("✓", hotspot.x + hotspot.w/2, hotspot.y + hotspot.h/2);
    } else {
      p.text("?", hotspot.x + hotspot.w/2, hotspot.y + hotspot.h/2);
    }
  }
  
  p.pop();
}

function drawNavigationArrows(p, scene) {
  const arrowSize = 30;
  const exits = scene.exits;
  
  p.push();
  p.fill(100, 200, 255, 200);
  p.stroke(255);
  p.strokeWeight(2);
  
  if (exits.left !== undefined) {
    p.triangle(30, 200, 60, 180, 60, 220);
  }
  if (exits.right !== undefined) {
    p.triangle(570, 200, 540, 180, 540, 220);
  }
  if (exits.up !== undefined) {
    p.triangle(300, 80, 280, 110, 320, 110);
  }
  if (exits.down !== undefined) {
    p.triangle(300, 320, 280, 290, 320, 290);
  }
  
  p.pop();
}