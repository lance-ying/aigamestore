// game_logic.js - Core game logic and initialization

import { gameState, GAME_PHASES, ZONES } from './globals.js';
import { Player } from './player.js';
import { Interactable } from './interactable.js';

export function initializeGame(p) {
  // Reset game state
  gameState.player = new Player(300, 200);
  gameState.entities = [];
  gameState.interactables = [];
  gameState.score = 0;
  gameState.playerX = 300;
  gameState.playerY = 200;
  gameState.playerAngle = 0;
  gameState.playerSpeed = 2;
  gameState.isRunning = false;
  
  gameState.inventory = [];
  gameState.keysCollected = [];
  gameState.puzzlesSolved = [];
  gameState.secretsFound = [];
  gameState.narrativeFragments = [];
  gameState.currentZone = "hub";
  
  gameState.doorsUnlocked = [];
  gameState.machineryActive = false;
  gameState.finalDoorOpen = false;
  gameState.endingReached = null;
  
  gameState.fadeAmount = 0;
  gameState.shakeAmount = 0;
  gameState.messageQueue = [];
  gameState.frameCount = 0;
  gameState.interactionCooldown = 0;
  
  // Create interactable objects
  createInteractables();
  
  // Add player to entities
  gameState.entities.push(gameState.player);
}

function createInteractables() {
  // Red Key - in Crimson Chamber
  gameState.interactables.push(new Interactable(-150, 0, 'redKey', 'key_red'));
  
  // Blue Key - in Azure Depths
  gameState.interactables.push(new Interactable(900, 200, 'blueKey', 'key_blue'));
  
  // Machinery - in Mechanical Void
  gameState.interactables.push(new Interactable(300, 600, 'machinery', 'machinery_main'));
  
  // Final Door - in The Threshold
  gameState.interactables.push(new Interactable(300, -200, 'finalDoor', 'door_final'));
  
  // Secret objects scattered around
  gameState.interactables.push(new Interactable(100, 100, 'secret', 'secret_1'));
  gameState.interactables.push(new Interactable(500, 300, 'secret', 'secret_2'));
  gameState.interactables.push(new Interactable(-200, 100, 'secret', 'secret_3'));
  gameState.interactables.push(new Interactable(800, 100, 'secret', 'secret_4'));
  gameState.interactables.push(new Interactable(400, 700, 'secret', 'secret_5'));
  gameState.interactables.push(new Interactable(200, -100, 'secret', 'secret_6'));
  
  // Narrative fragments
  gameState.interactables.push(new Interactable(50, 50, 'narrative', 'narrative_1'));
  gameState.interactables.push(new Interactable(550, 350, 'narrative', 'narrative_2'));
  gameState.interactables.push(new Interactable(-100, -50, 'narrative', 'narrative_3'));
  gameState.interactables.push(new Interactable(1000, 300, 'narrative', 'narrative_4'));
  gameState.interactables.push(new Interactable(350, 650, 'narrative', 'narrative_5'));
}

export function updateGame(p) {
  gameState.frameCount++;
  
  if (gameState.interactionCooldown > 0) {
    gameState.interactionCooldown--;
  }
  
  // Update player
  if (gameState.player) {
    gameState.player.update(p);
  }
  
  // Check for game over conditions
  if (gameState.finalDoorOpen && !gameState.endingReached) {
    gameState.endingReached = true;
    gameState.gamePhase = GAME_PHASES.GAME_OVER_WIN;
  }
}

export function handleInteraction(p) {
  if (gameState.interactionCooldown > 0) return;
  if (!gameState.player) return;
  
  // Find interactable objects the player can interact with
  for (const obj of gameState.interactables) {
    if (obj.canInteract(gameState.player)) {
      const result = obj.interact(p);
      
      if (result && result.success) {
        gameState.interactionCooldown = 30;
        
        if (result.ending) {
          // Trigger ending sequence
          setTimeout(() => {
            if (gameState.gamePhase === GAME_PHASES.PLAYING) {
              gameState.gamePhase = GAME_PHASES.GAME_OVER_WIN;
            }
          }, 2000);
        }
      }
      
      break; // Only interact with one object at a time
    }
  }
}