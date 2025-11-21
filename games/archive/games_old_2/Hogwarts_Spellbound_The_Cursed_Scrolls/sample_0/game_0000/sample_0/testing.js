import { gameState, GAME_PHASES, PLAY_STATES } from './globals.js';

export function generateTestActions(testMode) {
  if (testMode === 'TEST_1') {
    return generateBasicTest();
  } else if (testMode === 'TEST_2') {
    return generateWinTest();
  }
  return [];
}

function generateBasicTest() {
  const actions = [];
  
  // Start game
  actions.push({ frame: 60, action: 'START' });
  
  // Click objects a few times
  for (let i = 0; i < 5; i++) {
    actions.push({ frame: 120 + i * 30, action: 'CLICK_OBJECT', index: 0 });
  }
  
  // Advance dialogue
  actions.push({ frame: 300, action: 'SPACE' });
  actions.push({ frame: 360, action: 'SPACE' });
  
  // Do minigame
  actions.push({ frame: 420, action: 'KEY', key: 'W' });
  actions.push({ frame: 450, action: 'KEY', key: 'A' });
  actions.push({ frame: 480, action: 'KEY', key: 'S' });
  
  return actions;
}

function generateWinTest() {
  const actions = [];
  let frame = 60;
  
  // Start game
  actions.push({ frame: frame, action: 'START' });
  frame += 60;
  
  // Year 1
  for (let chapter = 1; chapter <= 3; chapter++) {
    // Complete task
    for (let i = 0; i < 6; i++) {
      actions.push({ frame: frame, action: 'CLICK_OBJECT', index: 0 });
      frame += 20;
    }
    
    // Dialogue
    actions.push({ frame: frame, action: 'SPACE' });
    frame += 30;
    actions.push({ frame: frame, action: 'SPACE' });
    frame += 30;
    
    // Minigame
    const chapter1Data = getChapter1MiniGameKeys(1, chapter);
    for (const key of chapter1Data) {
      actions.push({ frame: frame, action: 'KEY', key: key });
      frame += 20;
    }
    frame += 60;
    
    actions.push({ frame: frame, action: 'SPACE' });
    frame += 30;
  }
  
  // Year transition
  actions.push({ frame: frame, action: 'SPACE' });
  frame += 60;
  
  // Year 2
  for (let chapter = 1; chapter <= 3; chapter++) {
    for (let i = 0; i < 8; i++) {
      actions.push({ frame: frame, action: 'CLICK_OBJECT', index: 0 });
      frame += 20;
    }
    
    actions.push({ frame: frame, action: 'SPACE' });
    frame += 30;
    actions.push({ frame: frame, action: 'SPACE' });
    frame += 30;
    
    const chapter2Data = getChapter1MiniGameKeys(2, chapter);
    for (const key of chapter2Data) {
      actions.push({ frame: frame, action: 'KEY', key: key });
      frame += 20;
    }
    frame += 60;
    
    actions.push({ frame: frame, action: 'SPACE' });
    frame += 30;
  }
  
  actions.push({ frame: frame, action: 'SPACE' });
  frame += 60;
  
  // Year 3
  for (let chapter = 1; chapter <= 3; chapter++) {
    for (let i = 0; i < 12; i++) {
      actions.push({ frame: frame, action: 'CLICK_OBJECT', index: 0 });
      frame += 20;
    }
    
    actions.push({ frame: frame, action: 'SPACE' });
    frame += 30;
    actions.push({ frame: frame, action: 'SPACE' });
    frame += 30;
    
    const chapter3Data = getChapter1MiniGameKeys(3, chapter);
    for (const key of chapter3Data) {
      actions.push({ frame: frame, action: 'KEY', key: key });
      frame += 20;
    }
    frame += 60;
    
    actions.push({ frame: frame, action: 'SPACE' });
    frame += 30;
  }
  
  return actions;
}

function getChapter1MiniGameKeys(year, chapter) {
  const keys = {
    1: { 1: ['W', 'A', 'S'], 2: [' '], 3: ['W', 'D', 'S', 'A'] },
    2: { 1: ['W', 'A', 'S', 'D', 'W'], 2: [' '], 3: ['W', 'W', 'A', 'S', 'D', 'D'] },
    3: { 1: [' '], 2: ['W', 'A', 'A', 'S', 'D', 'D', 'W'], 3: [' '] }
  };
  
  return keys[year]?.[chapter] || [' '];
}

export function executeTestAction(p, action) {
  if (!action) return;
  
  switch (action.action) {
    case 'START':
      if (gameState.gamePhase === GAME_PHASES.START) {
        // Simulate ENTER key
        simulateKeyPress(p, 13);
      }
      break;
      
    case 'SPACE':
      simulateKeyPress(p, 32);
      break;
      
    case 'KEY':
      const keyCode = action.key.charCodeAt(0);
      simulateKeyPress(p, keyCode);
      break;
      
    case 'CLICK_OBJECT':
      if (gameState.playState === PLAY_STATES.EXPLORATION && 
          gameState.interactableObjects.length > 0) {
        const obj = gameState.interactableObjects[action.index || 0];
        if (obj && obj.active) {
          const mouseX = obj.x + obj.width / 2;
          const mouseY = obj.y + obj.height / 2;
          simulateMouseClick(p, mouseX, mouseY);
        }
      }
      break;
  }
}

function simulateKeyPress(p, keyCode) {
  p.keyCode = keyCode;
  p.key = String.fromCharCode(keyCode);
  
  if (window.gameInstance.keyPressed) {
    window.gameInstance.keyPressed();
  }
}

function simulateMouseClick(p, x, y) {
  p.mouseX = x;
  p.mouseY = y;
  
  if (window.gameInstance.mousePressed) {
    window.gameInstance.mousePressed();
  }
}