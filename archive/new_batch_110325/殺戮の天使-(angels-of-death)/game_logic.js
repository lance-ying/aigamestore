// game_logic.js - Core game logic and state management
import { gameState, FLOOR_CONFIGS, PHASE_PLAYING, PHASE_GAME_OVER_WIN, PHASE_GAME_OVER_LOSE } from './globals.js';
import { Player } from './player.js';
import { Item, InteractableObject } from './items.js';
import { Platform, Ladder, Trap } from './environment.js';

export class GameLogic {
  constructor(p, ui) {
    this.p = p;
    this.ui = ui;
    this.platforms = [];
    this.ladders = [];
  }

  initializeGame() {
    gameState.player = new Player(this.p, 50, 200);
    gameState.entities = [gameState.player];
    gameState.inventory = [];
    gameState.currentFloor = 0;
    gameState.score = 0;
    gameState.puzzlesSolved = [];
    gameState.showInventory = false;
    gameState.selectedInventoryIndex = -1;
    gameState.framesSinceLastAction = 0;
    
    this.loadFloor(0);
  }

  loadFloor(floorIndex) {
    if (floorIndex >= FLOOR_CONFIGS.length) {
      this.winGame();
      return;
    }

    gameState.currentFloor = floorIndex;
    const config = FLOOR_CONFIGS[floorIndex];
    
    // Clear existing entities
    gameState.items = [];
    gameState.interactables = [];
    gameState.traps = [];
    gameState.doors = [];
    gameState.requiredPuzzles = config.puzzles;
    
    // Create platforms
    this.platforms = [];
    // Main ground is always at bottom
    // Add some platforms for each floor
    if (floorIndex === 0) {
      this.platforms.push(new Platform(this.p, 100, 250, 150, 20));
      this.platforms.push(new Platform(this.p, 350, 200, 120, 20));
    } else if (floorIndex === 1) {
      this.platforms.push(new Platform(this.p, 150, 280, 100, 20));
      this.platforms.push(new Platform(this.p, 300, 230, 150, 20));
      this.platforms.push(new Platform(this.p, 450, 180, 100, 20));
    } else if (floorIndex === 2) {
      this.platforms.push(new Platform(this.p, 100, 200, 150, 20));
      this.platforms.push(new Platform(this.p, 350, 150, 120, 20));
    }
    
    // Spawn items
    for (let itemData of config.itemSpawns) {
      const item = new Item(this.p, itemData.x, itemData.y, itemData.type, itemData.id);
      gameState.items.push(item);
    }
    
    // Spawn traps
    for (let trapData of config.traps) {
      const trap = new Trap(this.p, trapData.x, trapData.y, trapData.width, trapData.height, trapData.type);
      gameState.traps.push(trap);
    }
    
    // Spawn doors
    for (let doorData of config.doors) {
      const door = new InteractableObject(
        this.p, 
        doorData.x, 
        doorData.y, 
        doorData.width, 
        doorData.height, 
        "door",
        doorData.requiredItem
      );
      door.isExit = doorData.isExit || false;
      door.requiresPuzzle = doorData.requiresPuzzle || null;
      gameState.doors.push(door);
      gameState.interactables.push(door);
    }
    
    // Create ladders
    this.ladders = [];
    for (let ladderData of config.ladders) {
      this.ladders.push(new Ladder(this.p, ladderData.x, ladderData.y, ladderData.width, ladderData.height));
    }
    
    // Add special interactables based on floor
    if (floorIndex === 0) {
      const lever = new InteractableObject(this.p, 250, 210, 30, 40, "lever", "lever_piece");
      gameState.interactables.push(lever);
    } else if (floorIndex === 1) {
      const vault = new InteractableObject(this.p, 400, 140, 60, 60, "vault", "code_note");
      gameState.interactables.push(vault);
    }
    
    // Reset player position
    gameState.player.x = 50;
    gameState.player.y = 200;
    gameState.player.vx = 0;
    gameState.player.vy = 0;
    gameState.player.health = gameState.player.maxHealth;
    
    this.ui.showMessage(`Floor ${floorIndex + 1}: ${config.name}`, 120);
  }

  update(keys) {
    if (gameState.gamePhase !== PHASE_PLAYING) return;
    
    gameState.framesSinceLastAction++;
    
    // Update player
    if (gameState.player) {
      gameState.player.update(keys, this.ladders, this.platforms, gameState.traps);
      
      // Check if player died
      if (gameState.player.health <= 0) {
        this.loseGame();
        return;
      }
      
      // Check item collection
      for (let item of gameState.items) {
        if (!item.collected && this.p.collideRectRect(
          gameState.player.x, gameState.player.y, gameState.player.width, gameState.player.height,
          item.x, item.y, item.width, item.height
        )) {
          item.collected = true;
          gameState.inventory.push(item);
          gameState.score += 10;
          this.ui.showMessage(`Collected: ${item.type.replace(/_/g, ' ')}`, 90);
          gameState.framesSinceLastAction = 0;
        }
      }
      
      // Check door progression
      for (let door of gameState.doors) {
        if (!door.locked && this.p.collideRectRect(
          gameState.player.x, gameState.player.y, gameState.player.width, gameState.player.height,
          door.x, door.y, door.width, door.height
        )) {
          if (door.isExit) {
            this.winGame();
            return;
          } else {
            this.loadFloor(gameState.currentFloor + 1);
            gameState.score += 50;
            return;
          }
        }
      }
    }
    
    // Update items
    for (let item of gameState.items) {
      item.update();
    }
    
    // Update traps
    for (let trap of gameState.traps) {
      trap.update();
    }
    
    // Update UI
    this.ui.update();
  }

  handleInteraction() {
    if (!gameState.player) return;
    
    const nearbyObj = gameState.player.canInteract(gameState.interactables);
    if (nearbyObj) {
      const result = nearbyObj.interact(gameState.inventory);
      this.ui.showMessage(result.message, 90);
      
      if (result.success) {
        gameState.score += 20;
        
        // Check puzzle completion
        if (nearbyObj.type === "lever" && nearbyObj.activated) {
          if (!gameState.puzzlesSolved.includes("activate_lever")) {
            gameState.puzzlesSolved.push("activate_lever");
            gameState.score += 30;
          }
        }
        
        if (nearbyObj.type === "vault" && nearbyObj.activated) {
          if (!gameState.puzzlesSolved.includes("open_vault")) {
            gameState.puzzlesSolved.push("open_vault");
            gameState.score += 30;
          }
        }
        
        if (nearbyObj.type === "door" && !nearbyObj.locked) {
          const keyUsed = gameState.inventory.findIndex(item => item.id === nearbyObj.requiredItem);
          if (keyUsed !== -1) {
            if (!gameState.puzzlesSolved.includes("unlock_door")) {
              gameState.puzzlesSolved.push("unlock_door");
            }
          }
        }
        
        gameState.framesSinceLastAction = 0;
      }
    }
  }

  winGame() {
    gameState.gamePhase = PHASE_GAME_OVER_WIN;
    gameState.score += 100;
    this.p.logs.game_info.push({
      data: { phase: PHASE_GAME_OVER_WIN, result: "win" },
      framecount: this.p.frameCount,
      timestamp: Date.now()
    });
  }

  loseGame() {
    gameState.gamePhase = PHASE_GAME_OVER_LOSE;
    this.p.logs.game_info.push({
      data: { phase: PHASE_GAME_OVER_LOSE, result: "lose" },
      framecount: this.p.frameCount,
      timestamp: Date.now()
    });
  }

  getPlatforms() {
    return this.platforms;
  }

  getLadders() {
    return this.ladders;
  }
}