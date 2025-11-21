// player.js
import { gameState } from './globals.js';
import { SCENES, getAvailableDirections } from './scenes.js';
import { canCombineItems, combineItems } from './items.js';
import { initializePuzzle, solvePuzzle } from './puzzles.js';

export class Player {
  constructor() {
    this.x = 300;
    this.y = 350;
    this.inventoryHover = -1;
  }
  
  moveToScene(direction) {
    const scene = SCENES[gameState.currentScene];
    const targetScene = scene.connections[direction];
    
    if (targetScene) {
      const target = SCENES[targetScene];
      if (!target.requiresUnlock || gameState.unlockedAreas.includes(targetScene)) {
        gameState.currentScene = targetScene;
        gameState.availableDirections = getAvailableDirections(targetScene, gameState);
        gameState.score += 10;
        return true;
      }
    }
    return false;
  }
  
  interact(p) {
    const scene = SCENES[gameState.currentScene];
    
    // Check for object collection
    for (let i = 0; i < scene.objects.length; i++) {
      const obj = scene.objects[i];
      if (obj.collectible && !gameState.inventory.includes(obj.id)) {
        const dist = p.dist(this.x, this.y, obj.x + obj.w/2, obj.y + obj.h/2);
        if (dist < 80) {
          gameState.inventory.push(obj.id);
          gameState.score += 20;
          return true;
        }
      }
    }
    
    // Check for interactable objects
    for (const interactable of scene.interactables) {
      const dist = p.dist(this.x, this.y, interactable.x + interactable.w/2, interactable.y + interactable.h/2);
      if (dist < 80) {
        return this.handleInteractable(interactable);
      }
    }
    
    return false;
  }
  
  handleInteractable(interactable) {
    if (interactable.requiresItem) {
      const hasRequiredItem = gameState.selectedItems.includes(interactable.requiresItem);
      if (hasRequiredItem) {
        // Use item on object
        if (interactable.id === "door") {
          gameState.unlockedAreas.push("tower");
          gameState.progressFlags.doorUnlocked = true;
          gameState.score += 150;
          // Remove used item
          const idx = gameState.inventory.indexOf(interactable.requiresItem);
          if (idx > -1) gameState.inventory.splice(idx, 1);
          gameState.selectedItems = [];
          return true;
        } else if (interactable.id === "bridgeGap") {
          gameState.progressFlags.bridgeFixed = true;
          gameState.score += 150;
          const idx = gameState.inventory.indexOf(interactable.requiresItem);
          if (idx > -1) gameState.inventory.splice(idx, 1);
          gameState.selectedItems = [];
          return true;
        } else if (interactable.id === "rockPile") {
          // Remove rock pile, reveal something
          gameState.score += 50;
          return true;
        }
      }
      return false;
    }
    
    if (interactable.type === "puzzle") {
      initializePuzzle(interactable.id);
      gameState.interactionTarget = interactable.id;
      return true;
    }
    
    if (interactable.type === "switch") {
      if (interactable.id === "lever") {
        gameState.progressFlags.leverPulled = true;
        gameState.unlockedAreas.push("bridge");
        gameState.score += 100;
        return true;
      }
    }
    
    if (interactable.type === "final") {
      if (interactable.id === "boat") {
        if (gameState.progressFlags.bridgeFixed && gameState.progressFlags.leverPulled) {
          // Win condition
          gameState.gamePhase = "GAME_OVER_WIN";
          gameState.score += 500;
          return true;
        }
      }
    }
    
    return false;
  }
  
  toggleItemSelection(index) {
    if (index >= 0 && index < gameState.inventory.length) {
      const itemId = gameState.inventory[index];
      const selectedIndex = gameState.selectedItems.indexOf(itemId);
      
      if (selectedIndex > -1) {
        gameState.selectedItems.splice(selectedIndex, 1);
      } else {
        if (gameState.selectedItems.length < 2) {
          gameState.selectedItems.push(itemId);
        }
      }
    }
  }
  
  combineSelectedItems() {
    if (gameState.selectedItems.length === 2) {
      const [item1, item2] = gameState.selectedItems;
      
      if (canCombineItems(item1, item2)) {
        const result = combineItems(item1, item2);
        
        // Remove components from inventory
        const idx1 = gameState.inventory.indexOf(item1);
        const idx2 = gameState.inventory.indexOf(item2);
        
        if (idx1 > -1) gameState.inventory.splice(idx1, 1);
        if (idx2 > -1) {
          const newIdx2 = gameState.inventory.indexOf(item2);
          if (newIdx2 > -1) gameState.inventory.splice(newIdx2, 1);
        }
        
        // Add combined item
        gameState.inventory.push(result.result);
        gameState.selectedItems = [];
        gameState.score += 50;
        return true;
      }
    }
    return false;
  }
  
  update(p) {
    // Player is stationary in point-and-click style
  }
  
  render(p) {
    // Draw player as a simple avatar
    p.push();
    p.fill(100, 150, 255);
    p.noStroke();
    p.ellipse(this.x, this.y, 30, 30);
    p.fill(255);
    p.ellipse(this.x - 6, this.y - 4, 6, 8);
    p.ellipse(this.x + 6, this.y - 4, 6, 8);
    p.fill(50);
    p.ellipse(this.x - 6, this.y - 4, 3, 4);
    p.ellipse(this.x + 6, this.y - 4, 3, 4);
    p.pop();
  }
}