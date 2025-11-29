// dialogue.js - Dialogue system

import { gameState, LOCATIONS } from './globals.js';

export const DIALOGUES = {
  witness1_initial: {
    speaker: "Old Man",
    lines: [
      "Oh, you're those young detectives, aren't you?",
      "I've seen some strange things around here lately.",
      "People in troll masks, leaving threatening messages!",
      "I found this note on the bench this morning."
    ],
    choices: [
      { text: "Can I see the note?", nextDialogue: "witness1_note", action: "give_coded_note" },
      { text: "Tell me more", nextDialogue: "witness1_more" }
    ]
  },
  
  witness1_note: {
    speaker: "Old Man",
    lines: [
      "Here you go. It's all strange symbols.",
      "I can't make heads or tails of it.",
      "Maybe you young folks can figure it out."
    ],
    choices: [
      { text: "Thank you", nextDialogue: null, action: "end_dialogue" }
    ]
  },
  
  witness1_more: {
    speaker: "Old Man",
    lines: [
      "They were here at night, wearing those creepy masks.",
      "I think they came from the direction of the dock.",
      "Be careful down there!"
    ],
    choices: [
      { text: "I'll check it out", nextDialogue: null, action: "unlock_dock" }
    ]
  },
  
  witness2_initial: {
    speaker: "Fisherman",
    lines: [
      "Ahoy there! Looking for information?",
      "I've been working these docks for 30 years.",
      "Never seen anything like this troll business."
    ],
    choices: [
      { text: "What did you see?", nextDialogue: "witness2_details" },
      { text: "Any suspicious activity?", nextDialogue: "witness2_activity" }
    ]
  },
  
  witness2_details: {
    speaker: "Fisherman",
    lines: [
      "Late at night, I saw someone sneaking around the warehouse.",
      "They were carrying something - looked like paint cans.",
      "Left some footprints in the mud by my boat."
    ],
    choices: [
      { text: "Can I check the footprints?", nextDialogue: null, action: "give_footprint_access" },
      { text: "What about the warehouse?", nextDialogue: "witness2_warehouse" }
    ]
  },
  
  witness2_activity: {
    speaker: "Fisherman",
    lines: [
      "The warehouse has been active lately.",
      "Used to be abandoned, but now there's movement at night.",
      "I wrote down what I observed - here's my statement."
    ],
    choices: [
      { text: "Thank you for the statement", nextDialogue: null, action: "give_witness_statement" }
    ]
  },
  
  witness2_warehouse: {
    speaker: "Fisherman",
    lines: [
      "The warehouse? That old place has been trouble.",
      "I'd say check it out, but be careful.",
      "There's definitely someone using it for something."
    ],
    choices: [
      { text: "I'll investigate", nextDialogue: null, action: "unlock_warehouse" }
    ]
  },
  
  suspect_initial: {
    speaker: "Suspicious Person",
    lines: [
      "What are you kids doing here?",
      "This is private property!",
      "You should leave before you get hurt."
    ],
    choices: [
      { text: "We know about the trolls", nextDialogue: "suspect_confront", action: null },
      { text: "Just looking around", nextDialogue: "suspect_deflect" }
    ]
  },
  
  suspect_deflect: {
    speaker: "Suspicious Person",
    lines: [
      "Well, there's nothing to see here.",
      "Move along!"
    ],
    choices: [
      { text: "Okay", nextDialogue: null, action: "end_dialogue" }
    ]
  },
  
  suspect_confront: {
    speaker: "Suspicious Person",
    lines: [
      "Trolls? I don't know what you're talking about!",
      "You can't prove anything!"
    ],
    choices: [
      { text: "Present evidence", nextDialogue: "suspect_evidence_check", action: "check_evidence" },
      { text: "Back off for now", nextDialogue: null, action: "end_dialogue" }
    ]
  },
  
  suspect_evidence_check: {
    speaker: "Suspicious Person",
    lines: [
      "Alright, alright! You got me.",
      "I was trying to scare people away from the old warehouse.",
      "I found something valuable inside and wanted to keep it secret.",
      "The 'troll' thing was just to keep everyone away!",
      "I guess my plan failed... Case closed, detectives."
    ],
    choices: [
      { text: "Mystery solved!", nextDialogue: null, action: "win_game" }
    ]
  }
};

export function startDialogue(dialogueId) {
  if (DIALOGUES[dialogueId]) {
    gameState.currentDialogue = {
      id: dialogueId,
      data: DIALOGUES[dialogueId],
      lineIndex: 0,
      choiceIndex: 0
    };
    return true;
  }
  return false;
}

export function advanceDialogue() {
  if (!gameState.currentDialogue) return false;
  
  const dialogue = gameState.currentDialogue;
  
  if (dialogue.lineIndex < dialogue.data.lines.length - 1) {
    dialogue.lineIndex++;
    return true;
  }
  
  return false;
}

export function selectDialogueChoice(index) {
  if (!gameState.currentDialogue) return;
  
  gameState.currentDialogue.choiceIndex = index;
}

export function confirmDialogueChoice() {
  if (!gameState.currentDialogue) return;
  
  const dialogue = gameState.currentDialogue;
  const choice = dialogue.data.choices[dialogue.choiceIndex];
  
  if (choice.action) {
    executeDialogueAction(choice.action);
  }
  
  if (choice.nextDialogue) {
    startDialogue(choice.nextDialogue);
  } else {
    gameState.currentDialogue = null;
  }
}

function executeDialogueAction(action) {
  switch (action) {
    case "give_coded_note":
      addItemToInventory("coded_note");
      addMessage("Received: Coded Note");
      gameState.score += 10;
      break;
      
    case "unlock_dock":
      LOCATIONS.dock.unlocked = true;
      addMessage("New location unlocked: Harbor Dock");
      gameState.score += 15;
      break;
      
    case "give_footprint_access":
      addItemToInventory("footprint_cast");
      addMessage("Received: Footprint Cast");
      gameState.score += 10;
      break;
      
    case "give_witness_statement":
      addItemToInventory("witness_statement");
      addMessage("Received: Witness Statement");
      gameState.score += 10;
      break;
      
    case "unlock_warehouse":
      LOCATIONS.warehouse.unlocked = true;
      addMessage("New location unlocked: Abandoned Warehouse");
      gameState.score += 15;
      break;
      
    case "check_evidence":
      if (gameState.hasCombinedEvidence) {
        // Has evidence, proceed to confession
      } else {
        addMessage("You need more evidence to confront them!");
        gameState.currentDialogue = null;
      }
      break;
      
    case "win_game":
      gameState.gamePhase = "GAME_OVER_WIN";
      gameState.culpritIdentified = true;
      gameState.score += 100;
      break;
      
    case "end_dialogue":
      gameState.currentDialogue = null;
      break;
  }
}

function addItemToInventory(itemId) {
  if (!gameState.inventory.includes(itemId)) {
    gameState.inventory.push(itemId);
  }
}

function addMessage(text) {
  gameState.messageQueue.push({ text, time: Date.now() });
}