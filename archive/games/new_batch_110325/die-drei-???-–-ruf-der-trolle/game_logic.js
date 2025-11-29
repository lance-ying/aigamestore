// game_logic.js - Main game logic
import { gameState, GAME_PHASES, CLUE_DATA, PUZZLES } from './globals.js';
import { LocationManager } from './location_manager.js';
import { PuzzleSystem } from './puzzle_system.js';

export class GameLogic {
  constructor(p, locationManager, puzzleSystem) {
    this.p = p;
    this.locationManager = locationManager;
    this.puzzleSystem = puzzleSystem;
    this.actionCooldown = 0;
  }
  
  update() {
    if (this.actionCooldown > 0) {
      this.actionCooldown--;
    }
    
    // Check win condition
    if (gameState.gamePhase === GAME_PHASES.PLAYING) {
      if (this.puzzleSystem.checkWinCondition() && 
          gameState.solvedPuzzles.includes("identify_culprit")) {
        this.winGame();
      }
    }
  }
  
  handleInput(action) {
    if (gameState.gamePhase !== GAME_PHASES.PLAYING) return;
    if (this.actionCooldown > 0) return;
    
    const location = this.locationManager.getCurrentLocation();
    if (!location) return;
    
    switch (action) {
      case "LEFT":
        this.navigateLeft();
        break;
      case "RIGHT":
        this.navigateRight();
        break;
      case "UP":
        this.navigateUp();
        break;
      case "DOWN":
        this.navigateDown();
        break;
      case "SPACE":
        this.interact();
        break;
      case "Z":
        this.toggleInventory();
        break;
      case "SHIFT":
        this.combineItems();
        break;
    }
  }
  
  navigateLeft() {
    if (gameState.inventoryOpen) {
      // Navigate inventory
      const items = gameState.inventory;
      if (items.length > 0) {
        const currentIndex = items.indexOf(gameState.selectedInventoryItem);
        if (currentIndex > 0) {
          gameState.selectedInventoryItem = items[currentIndex - 1];
        }
      }
    } else if (gameState.currentDialogue) {
      // In dialogue, no navigation
    } else {
      // Navigate locations
      const currentIndex = gameState.unlockedLocations.indexOf(gameState.currentLocation);
      if (currentIndex > 0) {
        gameState.currentLocation = gameState.unlockedLocations[currentIndex - 1];
        gameState.selectedHotspot = 0;
        this.actionCooldown = 15;
      }
    }
  }
  
  navigateRight() {
    if (gameState.inventoryOpen) {
      // Navigate inventory
      const items = gameState.inventory;
      if (items.length > 0) {
        const currentIndex = items.indexOf(gameState.selectedInventoryItem);
        if (currentIndex < items.length - 1) {
          gameState.selectedInventoryItem = items[currentIndex + 1];
        }
      }
    } else if (gameState.currentDialogue) {
      // In dialogue, no navigation
    } else {
      // Navigate locations
      const currentIndex = gameState.unlockedLocations.indexOf(gameState.currentLocation);
      if (currentIndex < gameState.unlockedLocations.length - 1) {
        gameState.currentLocation = gameState.unlockedLocations[currentIndex + 1];
        gameState.selectedHotspot = 0;
        this.actionCooldown = 15;
      }
    }
  }
  
  navigateUp() {
    if (gameState.currentDialogue) return;
    
    const location = this.locationManager.getCurrentLocation();
    const hotspots = location.hotspots.filter(h => h.active && !h.collected);
    
    if (hotspots.length > 0) {
      gameState.selectedHotspot = (gameState.selectedHotspot - 1 + hotspots.length) % hotspots.length;
      this.actionCooldown = 10;
    }
  }
  
  navigateDown() {
    if (gameState.currentDialogue) return;
    
    const location = this.locationManager.getCurrentLocation();
    const hotspots = location.hotspots.filter(h => h.active && !h.collected);
    
    if (hotspots.length > 0) {
      gameState.selectedHotspot = (gameState.selectedHotspot + 1) % hotspots.length;
      this.actionCooldown = 10;
    }
  }
  
  interact() {
    this.actionCooldown = 15;
    
    // Handle dialogue
    if (gameState.currentDialogue) {
      this.advanceDialogue();
      return;
    }
    
    // Handle puzzle display
    if (gameState.currentPuzzle) {
      gameState.currentPuzzle = null;
      return;
    }
    
    // Interact with hotspot
    const location = this.locationManager.getCurrentLocation();
    const hotspots = location.hotspots.filter(h => h.active && !h.collected);
    
    if (hotspots.length > 0 && gameState.selectedHotspot < hotspots.length) {
      const hotspot = hotspots[gameState.selectedHotspot];
      this.interactWithHotspot(hotspot);
    }
    
    // Check for NPCs
    const npc = location.npcs[0]; // Simplified: one NPC per location
    if (npc && !gameState.currentDialogue) {
      this.startDialogue(npc);
    }
  }
  
  interactWithHotspot(hotspot) {
    if (hotspot.type === "pickup" && hotspot.data.clue) {
      const clueId = hotspot.data.clue;
      if (!gameState.inventory.includes(clueId)) {
        gameState.inventory.push(clueId);
        gameState.cluesCollected.push(clueId);
        gameState.mysteryCluesFound++;
        gameState.score += 20;
        hotspot.collected = true;
        
        // Check for unlocks
        this.checkForUnlocks();
      }
    } else if (hotspot.type === "examine" && hotspot.data.clue) {
      const clueId = hotspot.data.clue;
      if (!gameState.inventory.includes(clueId)) {
        gameState.inventory.push(clueId);
        gameState.cluesCollected.push(clueId);
        gameState.mysteryCluesFound++;
        gameState.score += 20;
        hotspot.examined = true;
        
        this.checkForUnlocks();
      }
    }
  }
  
  startDialogue(npc) {
    gameState.currentDialogue = npc;
    gameState.dialogueIndex = 0;
    
    // Update NPC state
    if (!gameState.npcStates[npc.id]) {
      gameState.npcStates[npc.id] = { timesSpokenTo: 0 };
    }
    gameState.npcStates[npc.id].timesSpokenTo++;
  }
  
  advanceDialogue() {
    if (!gameState.currentDialogue) return;
    
    const dialogues = gameState.currentDialogue.getDialogues();
    gameState.dialogueIndex++;
    
    if (gameState.dialogueIndex >= dialogues.length) {
      // End dialogue
      const npc = gameState.currentDialogue;
      if (gameState.npcStates[npc.id].timesSpokenTo === 1) {
        // First conversation complete, give testimony
        if (npc.id === "witness1" && !gameState.inventory.includes("witness_testimony")) {
          gameState.inventory.push("witness_testimony");
          gameState.cluesCollected.push("witness_testimony");
          gameState.mysteryCluesFound++;
          gameState.score += 25;
        }
      }
      
      gameState.currentDialogue = null;
      gameState.dialogueIndex = 0;
      
      this.checkForUnlocks();
    }
  }
  
  toggleInventory() {
    gameState.inventoryOpen = !gameState.inventoryOpen;
    
    if (gameState.inventoryOpen && gameState.inventory.length > 0) {
      gameState.selectedInventoryItem = gameState.inventory[0];
    } else {
      gameState.selectedInventoryItem = null;
    }
    
    this.actionCooldown = 10;
  }
  
  combineItems() {
    if (!gameState.inventoryOpen) return;
    if (!gameState.selectedInventoryItem) return;
    
    // Try to solve puzzles with current items
    for (const puzzleId in PUZZLES) {
      const puzzle = PUZZLES[puzzleId];
      if (!gameState.solvedPuzzles.includes(puzzleId)) {
        const hasAll = puzzle.requiredItems.every(item => 
          gameState.inventory.includes(item)
        );
        
        if (hasAll && puzzle.solution === "combined") {
          this.puzzleSystem.solvePuzzle(puzzleId);
          gameState.currentPuzzle = puzzle;
          this.actionCooldown = 30;
          return;
        }
      }
    }
    
    this.actionCooldown = 15;
  }
  
  checkForUnlocks() {
    // Unlock park after examining HQ
    if (gameState.mysteryCluesFound >= 1 && !gameState.unlockedLocations.includes("park")) {
      this.locationManager.unlockLocation("park");
    }
    
    // Unlock library after park
    if (gameState.mysteryCluesFound >= 2 && !gameState.unlockedLocations.includes("library")) {
      this.locationManager.unlockLocation("library");
    }
    
    // Warehouse unlocked by puzzle
    // Pier unlocked by puzzle
  }
  
  winGame() {
    gameState.gamePhase = GAME_PHASES.GAME_OVER_WIN;
    gameState.score += 200;
    
    this.p.logs.game_info.push({
      data: { phase: "GAME_OVER_WIN", score: gameState.score },
      framecount: this.p.frameCount,
      timestamp: Date.now()
    });
  }
}