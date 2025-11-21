import { DialogueNode } from './dialogue.js';

export function getChapterData(year, chapter) {
  const chapters = {
    1: {
      1: {
        title: "Welcome to Hogwarts",
        location: "Great Hall",
        taskEnergy: 20,
        taskDescription: "Explore the Great Hall and meet your classmates",
        dialogue: createYear1Chapter1Dialogue(),
        miniGame: { type: "SPELL_TRACE", pattern: ['W', 'A', 'S'], difficulty: 1 }
      },
      2: {
        title: "First Potions Class",
        location: "Potions Classroom",
        taskEnergy: 25,
        taskDescription: "Prepare ingredients for your first potion",
        dialogue: createYear1Chapter2Dialogue(),
        miniGame: { type: "QTE", difficulty: 1 }
      },
      3: {
        title: "Library Investigation",
        location: "Library",
        taskEnergy: 30,
        taskDescription: "Search for clues about the Cursed Vaults",
        dialogue: createYear1Chapter3Dialogue(),
        miniGame: { type: "SPELL_TRACE", pattern: ['W', 'D', 'S', 'A'], difficulty: 1 }
      }
    },
    2: {
      1: {
        title: "Mysterious Messages",
        location: "Corridor",
        taskEnergy: 35,
        taskDescription: "Investigate strange messages in the corridors",
        dialogue: createYear2Chapter1Dialogue(),
        miniGame: { type: "SPELL_TRACE", pattern: ['W', 'A', 'S', 'D', 'W'], difficulty: 2 }
      },
      2: {
        title: "Defense Against Dark Arts",
        location: "DADA Classroom",
        taskEnergy: 40,
        taskDescription: "Learn defensive spells",
        dialogue: createYear2Chapter2Dialogue(),
        miniGame: { type: "QTE", difficulty: 2 }
      },
      3: {
        title: "The First Vault",
        location: "Forbidden Corridor",
        taskEnergy: 45,
        taskDescription: "Approach the first Cursed Vault",
        dialogue: createYear2Chapter3Dialogue(),
        miniGame: { type: "SPELL_TRACE", pattern: ['W', 'W', 'A', 'S', 'D', 'D'], difficulty: 2 }
      }
    },
    3: {
      1: {
        title: "Deeper Secrets",
        location: "Dungeon",
        taskEnergy: 50,
        taskDescription: "Explore the dungeons for more clues",
        dialogue: createYear3Chapter1Dialogue(),
        miniGame: { type: "QTE", difficulty: 3 }
      },
      2: {
        title: "The Final Confrontation",
        location: "Vault Chamber",
        taskEnergy: 55,
        taskDescription: "Prepare for the final challenge",
        dialogue: createYear3Chapter2Dialogue(),
        miniGame: { type: "SPELL_TRACE", pattern: ['W', 'A', 'A', 'S', 'D', 'D', 'W'], difficulty: 3 }
      },
      3: {
        title: "Mystery Solved",
        location: "Vault Chamber",
        taskEnergy: 60,
        taskDescription: "Unlock the final Cursed Vault",
        dialogue: createYear3Chapter3Dialogue(),
        miniGame: { type: "QTE", difficulty: 3 }
      }
    }
  };
  
  return chapters[year]?.[chapter] || null;
}

function createYear1Chapter1Dialogue() {
  const end = new DialogueNode(
    "Narrator",
    "You've completed your first day at Hogwarts. The adventure has just begun!",
    [],
    null
  );
  
  const choice = new DialogueNode(
    "Headmaster",
    "How do you feel about joining us?",
    [
      { text: "I'm excited to learn magic!", nextNode: end, onSelect: (gs) => { gs.courageLevel++; } },
      { text: "I'm nervous but ready.", nextNode: end, onSelect: (gs) => { gs.empathyLevel++; } },
      { text: "I want to know everything!", nextNode: end, onSelect: (gs) => { gs.knowledgeLevel++; } }
    ]
  );
  
  const start = new DialogueNode(
    "Headmaster",
    "Welcome to Hogwarts! Here you will learn the ways of magic and uncover ancient mysteries.",
    [],
    null
  );
  
  start.onComplete = () => choice;
  
  return start;
}

function createYear1Chapter2Dialogue() {
  const end = new DialogueNode(
    "Professor Snape",
    "Acceptable work. You may proceed.",
    [],
    null
  );
  
  const start = new DialogueNode(
    "Professor Snape",
    "Today we will brew a simple potion. Pay attention to every detail.",
    [],
    null
  );
  
  start.onComplete = () => end;
  
  return start;
}

function createYear1Chapter3Dialogue() {
  const end = new DialogueNode(
    "Madam Pince",
    "The library holds many secrets. Use your knowledge wisely.",
    [],
    null
  );
  
  const choice = new DialogueNode(
    "Madam Pince",
    "What are you looking for?",
    [
      { text: "Books about the Cursed Vaults", nextNode: end, attributeRequired: { attribute: 'knowledge', level: 2 } },
      { text: "Just browsing", nextNode: end }
    ]
  );
  
  const start = new DialogueNode(
    "Narrator",
    "You've heard rumors of Cursed Vaults hidden within Hogwarts. The library might have answers.",
    [],
    null
  );
  
  start.onComplete = () => choice;
  
  return start;
}

function createYear2Chapter1Dialogue() {
  const end = new DialogueNode(
    "Friend",
    "This is getting dangerous. We need to be careful.",
    [],
    null
  );
  
  const start = new DialogueNode(
    "Friend",
    "Did you see those strange symbols on the wall? They appeared overnight!",
    [],
    null
  );
  
  start.onComplete = () => end;
  
  return start;
}

function createYear2Chapter2Dialogue() {
  const end = new DialogueNode(
    "Professor",
    "Well done! You're becoming quite skilled.",
    [],
    null
  );
  
  const choice = new DialogueNode(
    "Professor",
    "Why do you want to learn defensive magic?",
    [
      { text: "To protect my friends", nextNode: end, attributeRequired: { attribute: 'empathy', level: 3 }, onSelect: (gs) => { gs.empathyLevel++; } },
      { text: "To face the Cursed Vaults", nextNode: end, attributeRequired: { attribute: 'courage', level: 3 }, onSelect: (gs) => { gs.courageLevel++; } },
      { text: "To understand magic better", nextNode: end, onSelect: (gs) => { gs.knowledgeLevel++; } }
    ]
  );
  
  const start = new DialogueNode(
    "Professor",
    "Today's lesson will be challenging. Dark forces are real, and you must be prepared.",
    [],
    null
  );
  
  start.onComplete = () => choice;
  
  return start;
}

function createYear2Chapter3Dialogue() {
  const end = new DialogueNode(
    "Narrator",
    "You've found the entrance to the first vault. The mystery deepens...",
    [],
    null
  );
  
  const start = new DialogueNode(
    "Friend",
    "This is it! The door to the first Cursed Vault. Are you ready?",
    [],
    null
  );
  
  start.onComplete = () => end;
  
  return start;
}

function createYear3Chapter1Dialogue() {
  const end = new DialogueNode(
    "Narrator",
    "The dungeons reveal more secrets. You're getting closer to the truth.",
    [],
    null
  );
  
  const start = new DialogueNode(
    "Friend",
    "The deeper we go, the more dangerous it becomes. But we can't turn back now.",
    [],
    null
  );
  
  start.onComplete = () => end;
  
  return start;
}

function createYear3Chapter2Dialogue() {
  const end = new DialogueNode(
    "Narrator",
    "You stand before the final vault. Everything has led to this moment.",
    [],
    null
  );
  
  const choice = new DialogueNode(
    "Friend",
    "This is our last chance. How should we proceed?",
    [
      { text: "Face it head-on with courage", nextNode: end, attributeRequired: { attribute: 'courage', level: 5 }, onSelect: (gs) => { gs.courageLevel++; } },
      { text: "Work together as a team", nextNode: end, attributeRequired: { attribute: 'empathy', level: 5 }, onSelect: (gs) => { gs.empathyLevel++; } },
      { text: "Use all our knowledge", nextNode: end, attributeRequired: { attribute: 'knowledge', level: 5 }, onSelect: (gs) => { gs.knowledgeLevel++; } }
    ]
  );
  
  const start = new DialogueNode(
    "Friend",
    "We've learned so much on this journey. Now it's time to face the final vault.",
    [],
    null
  );
  
  start.onComplete = () => choice;
  
  return start;
}

function createYear3Chapter3Dialogue() {
  const end = new DialogueNode(
    "Narrator",
    "Congratulations! You've solved the mystery of the Cursed Vaults and become a true wizard!",
    [],
    null
  );
  
  const start = new DialogueNode(
    "Friend",
    "We did it! The curse is broken. Hogwarts is safe again!",
    [],
    null
  );
  
  start.onComplete = () => end;
  
  return start;
}

export function getLocationBackground(location) {
  const backgrounds = {
    "Great Hall": [80, 50, 30],
    "Potions Classroom": [40, 60, 40],
    "Library": [60, 50, 70],
    "Corridor": [70, 70, 80],
    "DADA Classroom": [50, 50, 80],
    "Forbidden Corridor": [30, 30, 40],
    "Dungeon": [20, 25, 30],
    "Vault Chamber": [30, 20, 40]
  };
  
  return backgrounds[location] || [50, 50, 50];
}