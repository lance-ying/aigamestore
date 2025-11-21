// interactions.js - Handle interactions with hotspots

import { gameState, LOCATIONS, ITEMS, PUZZLES } from './globals.js';
import { startDialogue } from './dialogue.js';

export function interactWithHotspot(hotspot) {
  const location = gameState.currentLocation;
  
  switch (hotspot.type) {
    case "travel":
      if (hotspot.target && LOCATIONS[hotspot.target].unlocked) {
        gameState.currentLocation = hotspot.target;
        addMessage(`Traveled to ${LOCATIONS[hotspot.target].name}`);
      } else {
        addMessage("This location is not accessible yet.");
      }
      break;
      
    case "examine":
      handleExamine(hotspot);
      break;
      
    case "talk":
      handleTalk(hotspot);
      break;
  }
  
  hotspot.interacted = true;
}

function handleExamine(hotspot) {
  const location = gameState.currentLocation;
  
  // Location-specific examine interactions
  if (location === "office") {
    if (hotspot.id === "desk") {
      addMessage("Your detective desk. Nothing suspicious here.");
    } else if (hotspot.id === "phone") {
      if (!gameState.inventory.includes("decoder_key")) {
        addMessage("Found a decoder key in the phone book!");
        gameState.inventory.push("decoder_key");
        gameState.score += 10;
      } else {
        addMessage("Just a phone and a phone book.");
      }
    }
  } else if (location === "park") {
    if (hotspot.id === "bench") {
      addMessage("An old wooden bench. Someone sat here recently.");
    } else if (hotspot.id === "trashcan") {
      if (!gameState.inventory.includes("photo")) {
        addMessage("Found a discarded photo in the trash!");
        gameState.inventory.push("photo");
        gameState.score += 10;
      } else {
        addMessage("Just an ordinary trash can.");
      }
    }
  } else if (location === "dock") {
    if (hotspot.id === "boat") {
      if (!gameState.inventory.includes("boat_schedule")) {
        addMessage("Found a boat schedule with suspicious entries!");
        gameState.inventory.push("boat_schedule");
        gameState.score += 10;
      } else {
        addMessage("A small fishing boat.");
      }
    } else if (hotspot.id === "crate") {
      addMessage("Old shipping crate. Looks like it hasn't been moved in years.");
    }
  } else if (location === "warehouse") {
    if (hotspot.id === "door") {
      addMessage("The door is locked tight. Need another way in.");
    } else if (hotspot.id === "window") {
      addMessage("You can see paint cans and troll masks inside!");
      gameState.cluesFound.push("troll_masks_seen");
    } else if (hotspot.id === "footprints") {
      addMessage("Fresh footprints. Same pattern as the cast you found!");
    }
  }
}

function handleTalk(hotspot) {
  const location = gameState.currentLocation;
  
  if (location === "park" && hotspot.id === "witness1") {
    if (!gameState.dialogueHistory["witness1_initial"]) {
      startDialogue("witness1_initial");
      gameState.dialogueHistory["witness1_initial"] = true;
    } else {
      addMessage("The old man has nothing more to add.");
    }
  } else if (location === "dock" && hotspot.id === "witness2") {
    if (!gameState.dialogueHistory["witness2_initial"]) {
      startDialogue("witness2_initial");
      gameState.dialogueHistory["witness2_initial"] = true;
    } else {
      addMessage("The fisherman waves at you.");
    }
  } else if (location === "warehouse" && hotspot.id === "suspect") {
    if (!gameState.dialogueHistory["suspect_initial"]) {
      startDialogue("suspect_initial");
      gameState.dialogueHistory["suspect_initial"] = true;
    } else if (gameState.hasCombinedEvidence) {
      startDialogue("suspect_confront");
    } else {
      addMessage("They're avoiding you. Need more evidence!");
    }
  }
}

export function tryItemCombination(item1Id, item2Id) {
  // Check puzzles
  for (const puzzleId in PUZZLES) {
    const puzzle = PUZZLES[puzzleId];
    
    if (puzzle.solved) continue;
    
    const hasAllRequirements = puzzle.requires.every(reqId => 
      gameState.inventory.includes(reqId)
    );
    
    if (hasAllRequirements) {
      const items = [item1Id, item2Id];
      const matchesRequirement = puzzle.requires.every(reqId => items.includes(reqId));
      
      if (matchesRequirement || puzzle.requires.length === 1) {
        solvePuzzle(puzzleId);
        return true;
      }
    }
  }
  
  addMessage("These items don't combine in any useful way.");
  return false;
}

function solvePuzzle(puzzleId) {
  const puzzle = PUZZLES[puzzleId];
  puzzle.solved = true;
  gameState.puzzlesSolved.push(puzzleId);
  
  if (puzzleId === "decode_message") {
    addMessage("You decoded the message: 'Warehouse at midnight'");
    gameState.hasDecodedMessage = true;
    gameState.score += 30;
  } else if (puzzleId === "identify_suspect") {
    addMessage("All evidence points to the person at the warehouse!");
    gameState.hasCombinedEvidence = true;
    gameState.score += 50;
  }
}

function addMessage(text) {
  gameState.messageQueue.push({ text, time: Date.now() });
}