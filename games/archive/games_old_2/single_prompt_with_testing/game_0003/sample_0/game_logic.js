// game_logic.js - Core game logic and puzzle handling

import { gameState, GAME_PHASES, resetGameState } from './globals.js';
import { createInventoryItems } from './inventory.js';

const inventoryItems = createInventoryItems();

export function handleHotspotInteraction(hotspot, p) {
  if (!hotspot || !hotspot.active) return;
  
  const scene = gameState.currentScene;
  
  // Log interaction
  p.logs.inputs.push({
    input_type: "interaction",
    data: { hotspot: hotspot.id, scene: scene },
    framecount: p.frameCount,
    timestamp: Date.now()
  });
  
  switch (hotspot.id) {
    case "newspaper":
      if (!hotspot.examined) {
        showDialogue("You examine the newspaper. There's an article about a mysterious art gallery.", p);
        hotspot.examined = true;
        gameState.puzzleFlags.examinedNewspaper = true;
        addToInventory("newspaper", p);
        hotspot.active = false;
        addScore(10, p);
      }
      break;
      
    case "table2":
      showDialogue("Just an empty table with some coffee stains.", p);
      break;
      
    case "waiter":
      if (!gameState.puzzleFlags.talkedToWaiter) {
        showDialogue("Waiter: 'Bonjour! Looking for something? I saw someone drop a key by the trash bin outside.'", p);
        gameState.puzzleFlags.talkedToWaiter = true;
        addScore(15, p);
        unlockAchievement("First Conversation", p);
      } else {
        showDialogue("Waiter: 'Check the street outside if you need that key!'", p);
      }
      break;
      
    case "trashbin":
      if (!gameState.puzzleFlags.foundKey) {
        showDialogue("You search the trash bin and find a rusty key!", p);
        addToInventory("key", p);
        gameState.puzzleFlags.foundKey = true;
        hotspot.active = false;
        addScore(20, p);
      }
      break;
      
    case "building":
      if (gameState.selectedInventoryIndex >= 0) {
        const selectedItem = gameState.inventory[gameState.selectedInventoryIndex];
        if (selectedItem.id === "key") {
          showDialogue("The key fits! The door to the art gallery opens.", p);
          gameState.puzzleFlags.unlockedDoor = true;
          removeFromInventory(gameState.selectedInventoryIndex, p);
          gameState.selectedInventoryIndex = -1;
          unlockScene("gallery", p);
          addScore(30, p);
          unlockAchievement("Gallery Access", p);
          transitionToScene("gallery", p);
        } else {
          showDialogue("That item doesn't work here.", p);
        }
      } else {
        showDialogue("The door is locked. You need a key.", p);
      }
      break;
      
    case "painting1":
      if (!hotspot.examined) {
        showDialogue("An abstract painting with strange symbols. You take a photograph of it.", p);
        addToInventory("photograph", p);
        hotspot.examined = true;
        addScore(15, p);
      } else {
        showDialogue("You've already examined this painting.", p);
      }
      break;
      
    case "painting2":
      if (!gameState.puzzleFlags.solvedPaintingPuzzle) {
        showDialogue("This landscape painting shows the location from the newspaper article!", p);
        gameState.puzzleFlags.solvedPaintingPuzzle = true;
        addScore(20, p);
      } else {
        showDialogue("A beautiful landscape painting.", p);
      }
      break;
      
    case "pedestal":
      if (!hotspot.examined) {
        showDialogue("You find a map fragment on the pedestal!", p);
        addToInventory("map", p);
        hotspot.examined = true;
        addScore(25, p);
      }
      break;
      
    case "artifact":
      if (gameState.selectedInventoryIndex >= 0) {
        const selectedItem = gameState.inventory[gameState.selectedInventoryIndex];
        if (selectedItem.id === "masterkey") {
          showDialogue("The Master Key activates the artifact! You've solved the mystery!", p);
          gameState.puzzleFlags.finalPuzzleSolved = true;
          addScore(100, p);
          unlockAchievement("Mystery Solved!", p);
          setTimeout(() => {
            gameState.gamePhase = GAME_PHASES.GAME_OVER_WIN;
            p.logs.game_info.push({
              data: { phase: "GAME_OVER_WIN", final_score: gameState.score },
              framecount: p.frameCount,
              timestamp: Date.now()
            });
          }, 2000);
        } else {
          showDialogue("You need something special to activate this artifact.", p);
        }
      } else {
        showDialogue("A mystical artifact glowing with ancient power. It needs to be activated.", p);
      }
      break;
      
    case "door":
    case "backtocafe":
    case "exitgallery":
      if (hotspot.data.targetScene) {
        transitionToScene(hotspot.data.targetScene, p);
      }
      break;
  }
}

export function handleInventoryCombination(item1Index, item2Index, p) {
  const item1 = gameState.inventory[item1Index];
  const item2 = gameState.inventory[item2Index];
  
  if (!item1 || !item2) return;
  
  // Combine newspaper and photograph to create clue
  if ((item1.id === "newspaper" && item2.id === "photograph") ||
      (item1.id === "photograph" && item2.id === "newspaper")) {
    if (!gameState.puzzleFlags.combinedClues) {
      showDialogue("You combine the newspaper and photograph - they reveal a hidden location!", p);
      addToInventory("clue", p);
      gameState.puzzleFlags.combinedClues = true;
      addScore(40, p);
      unlockAchievement("Detective Work", p);
    }
  }
  
  // Combine clue and map to create master key
  if ((item1.id === "clue" && item2.id === "map") ||
      (item1.id === "map" && item2.id === "clue")) {
    showDialogue("The clue and map reveal the location of a secret chamber! You forge a Master Key!", p);
    addToInventory("masterkey", p);
    unlockScene("finalroom", p);
    addScore(50, p);
    unlockAchievement("Master Detective", p);
    
    // Update hotspot to allow transition
    const scenes = window.gameInstance._scenes;
    if (scenes && scenes.gallery) {
      scenes.gallery.addHotspot({
        x: 500,
        y: 150,
        width: 80,
        height: 120,
        type: "exit",
        id: "secretdoor",
        active: true,
        data: { name: "Secret Door", targetScene: "finalroom" },
        contains: function(px, py) {
          return px >= this.x && px <= this.x + this.width &&
                 py >= this.y && py <= this.y + this.height;
        },
        isPlayerNear: function(player) {
          const centerX = this.x + this.width / 2;
          return Math.abs(player.x - centerX) < 40;
        },
        render: function(p, highlighted) {
          p.push();
          p.fill(60, 30, 80);
          p.stroke(highlighted ? 255 : 100);
          p.strokeWeight(highlighted ? 3 : 1);
          p.rect(this.x, this.y, this.width, this.height);
          if (highlighted) {
            p.fill(255, 255, 0);
            p.noStroke();
            p.textAlign(p.CENTER, p.BOTTOM);
            p.textSize(12);
            p.text("Secret Door", this.x + this.width / 2, this.y - 5);
          }
          p.pop();
        }
      });
    }
  }
}

export function addToInventory(itemId, p) {
  if (!inventoryItems[itemId]) return;
  
  const item = inventoryItems[itemId];
  if (!gameState.inventory.find(i => i.id === itemId)) {
    gameState.inventory.push(item);
    p.logs.player_info.push({
      screen_x: gameState.player.x,
      screen_y: gameState.player.y,
      game_x: gameState.player.x,
      game_y: gameState.player.y,
      data: { action: "pickup", item: itemId },
      framecount: p.frameCount
    });
  }
}

export function removeFromInventory(index, p) {
  if (index >= 0 && index < gameState.inventory.length) {
    const item = gameState.inventory[index];
    gameState.inventory.splice(index, 1);
    p.logs.player_info.push({
      screen_x: gameState.player.x,
      screen_y: gameState.player.y,
      game_x: gameState.player.x,
      game_y: gameState.player.y,
      data: { action: "use", item: item.id },
      framecount: p.frameCount
    });
  }
}

export function showDialogue(text, p) {
  gameState.dialogueActive = true;
  gameState.dialogueText = text;
  gameState.dialogueTimer = 180; // 3 seconds at 60fps
}

export function updateDialogue() {
  if (gameState.dialogueActive && gameState.dialogueTimer > 0) {
    gameState.dialogueTimer--;
    if (gameState.dialogueTimer === 0) {
      gameState.dialogueActive = false;
    }
  }
}

export function addScore(points, p) {
  gameState.score += points;
  p.logs.game_info.push({
    data: { action: "score", points: points, total: gameState.score },
    framecount: p.frameCount,
    timestamp: Date.now()
  });
}

export function unlockScene(sceneId, p) {
  if (!gameState.unlockedScenes.includes(sceneId)) {
    gameState.unlockedScenes.push(sceneId);
    p.logs.game_info.push({
      data: { action: "unlock_scene", scene: sceneId },
      framecount: p.frameCount,
      timestamp: Date.now()
    });
  }
}

export function unlockAchievement(achievement, p) {
  if (!gameState.achievements.includes(achievement)) {
    gameState.achievements.push(achievement);
    p.logs.game_info.push({
      data: { action: "achievement", name: achievement },
      framecount: p.frameCount,
      timestamp: Date.now()
    });
  }
}

export function transitionToScene(sceneId, p) {
  if (gameState.unlockedScenes.includes(sceneId)) {
    gameState.transitioning = true;
    gameState.transitionTimer = 30;
    gameState.nextScene = sceneId;
  }
}

export function updateSceneTransition() {
  if (gameState.transitioning) {
    gameState.transitionTimer--;
    if (gameState.transitionTimer <= 0) {
      gameState.currentScene = gameState.nextScene;
      gameState.transitioning = false;
      gameState.nextScene = null;
      // Reset player position
      gameState.player.x = 100;
      gameState.player.targetX = 100;
    }
  }
}