// automated_testing_controller.js - Automated testing logic

import { gameState, GAME_PHASES, LANGUAGES } from './globals.js';

let testState = {
  phase: "explore",
  targetNPCIndex: 0,
  targetObjectIndex: 0,
  waitTimer: 0,
  stuckTimer: 0,
  lastX: 0,
  lastY: 0,
  notebookPhase: "open",
  currentGlyphIndex: 0,
  currentMeaningIndex: 0
};

function getTestWinAction(gameState) {
  if (gameState.gamePhase !== GAME_PHASES.PLAYING) {
    return { left: false, right: false, up: false, down: false, space: false, z: false, shift: false };
  }

  const player = gameState.player;
  if (!player) return { left: false, right: false, up: false, down: false, space: false, z: false, shift: false };

  const action = { left: false, right: false, up: false, down: false, space: false, z: false, shift: false };

  // Check if stuck
  if (Math.abs(player.x - testState.lastX) < 1 && Math.abs(player.y - testState.lastY) < 1) {
    testState.stuckTimer++;
    if (testState.stuckTimer > 60) {
      testState.phase = "explore";
      testState.stuckTimer = 0;
    }
  } else {
    testState.stuckTimer = 0;
  }
  testState.lastX = player.x;
  testState.lastY = player.y;

  // Main logic based on phase
  if (testState.phase === "explore") {
    // Collect all glyphs first
    const allCollected = areAllGlyphsCollected();
    
    if (!allCollected) {
      // Find nearest uncollected NPC or object
      const target = findNearestUncollectedTarget(player);
      
      if (target) {
        navigateToTarget(player, target, action);
        
        // Try interaction if close
        const dist = Math.sqrt(Math.pow(player.x - target.x, 2) + Math.pow(player.y - target.y, 2));
        if (dist < 40) {
          action.space = true;
          testState.waitTimer = 30;
        }
      } else {
        // Move to next floor if possible
        moveToNextFloor(player, action);
      }
    } else {
      // All glyphs collected, start translation
      testState.phase = "translate";
      testState.notebookPhase = "open";
      testState.currentGlyphIndex = 0;
    }
  } else if (testState.phase === "translate") {
    // Translation logic
    if (testState.waitTimer > 0) {
      testState.waitTimer--;
      return action;
    }

    if (testState.notebookPhase === "open") {
      if (!gameState.notebookOpen) {
        action.z = true;
        testState.waitTimer = 20;
      } else {
        testState.notebookPhase = "select_glyph";
      }
    } else if (testState.notebookPhase === "select_glyph") {
      // Find next untranslated glyph
      let found = false;
      for (let i = testState.currentGlyphIndex; i < gameState.collectedGlyphs.length; i++) {
        const glyph = gameState.collectedGlyphs[i];
        const isTranslated = gameState.translatedGlyphs.some(g => g.symbol === glyph.symbol);
        if (!isTranslated) {
          testState.currentGlyphIndex = i;
          gameState.selectedGlyph = i;
          testState.notebookPhase = "select_meaning";
          testState.waitTimer = 10;
          found = true;
          break;
        }
      }
      
      if (!found) {
        // All translated, close notebook
        testState.notebookPhase = "close";
      }
    } else if (testState.notebookPhase === "select_meaning") {
      // Find correct meaning
      const glyph = gameState.collectedGlyphs[testState.currentGlyphIndex];
      const meanings = getAllMeanings();
      const correctIndex = meanings.indexOf(glyph.meaning);
      
      if (correctIndex >= 0) {
        gameState.selectedMeaning = correctIndex;
        testState.notebookPhase = "confirm";
        testState.waitTimer = 15;
      }
    } else if (testState.notebookPhase === "confirm") {
      // Simulate confirm button click by directly calling the notebook method
      if (gameState.selectedGlyph !== null && gameState.selectedMeaning !== null) {
        // This would be handled by notebook.confirmTranslation() but we simulate the result
        testState.currentGlyphIndex++;
        testState.notebookPhase = "select_glyph";
        testState.waitTimer = 10;
      }
    } else if (testState.notebookPhase === "close") {
      if (gameState.notebookOpen) {
        action.z = true;
        testState.waitTimer = 20;
      }
      testState.phase = "explore";
      testState.notebookPhase = "open";
    }
  }

  return action;
}

function getTestBasicAction(gameState) {
  if (gameState.gamePhase !== GAME_PHASES.PLAYING) {
    return { left: false, right: false, up: false, down: false, space: false, z: false, shift: false };
  }

  const player = gameState.player;
  if (!player) return { left: false, right: false, up: false, down: false, space: false, z: false, shift: false };

  const action = { left: false, right: false, up: false, down: false, space: false, z: false, shift: false };

  // Simple movement pattern: move around and interact
  const frameCount = testState.waitTimer++;
  const pattern = Math.floor(frameCount / 60) % 8;

  switch (pattern) {
    case 0: action.right = true; break;
    case 1: action.down = true; break;
    case 2: action.left = true; break;
    case 3: action.up = true; break;
    case 4: action.space = true; break;
    case 5: action.z = true; break;
    case 6: action.shift = true; action.right = true; break;
    case 7: action.shift = true; action.left = true; break;
  }

  return action;
}

function areAllGlyphsCollected() {
  const totalGlyphs = LANGUAGES.reduce((sum, lang) => sum + lang.glyphs.length, 0);
  return gameState.collectedGlyphs.length >= totalGlyphs;
}

function findNearestUncollectedTarget(player) {
  let nearestTarget = null;
  let minDist = Infinity;

  // Check NPCs
  gameState.npcs.forEach(npc => {
    if (!npc.hasInteracted) {
      const dist = Math.sqrt(Math.pow(player.x - npc.x, 2) + Math.pow(player.y - npc.y, 2));
      if (dist < minDist) {
        minDist = dist;
        nearestTarget = npc;
      }
    }
  });

  // Check objects
  gameState.glyphObjects.forEach(obj => {
    if (!obj.collected) {
      const dist = Math.sqrt(Math.pow(player.x - obj.x, 2) + Math.pow(player.y - obj.y, 2));
      if (dist < minDist) {
        minDist = dist;
        nearestTarget = obj;
      }
    }
  });

  return nearestTarget;
}

function navigateToTarget(player, target, action) {
  const dx = target.x - player.x;
  const dy = target.y - player.y;
  const dist = Math.sqrt(dx * dx + dy * dy);

  if (dist > 5) {
    if (Math.abs(dx) > Math.abs(dy)) {
      action.right = dx > 0;
      action.left = dx < 0;
    } else {
      action.down = dy > 0;
      action.up = dy < 0;
    }
    action.shift = dist > 100;
  }
}

function moveToNextFloor(player, action) {
  // Try to move up to access next floor
  action.up = true;
}

function getAllMeanings() {
  const meanings = [];
  LANGUAGES.forEach(lang => {
    lang.glyphs.forEach(glyph => {
      if (!meanings.includes(glyph.meaning)) {
        meanings.push(glyph.meaning);
      }
    });
  });
  return meanings.sort();
}

export function get_automated_testing_action(gameState) {
  switch (gameState.controlMode) {
    case "TEST_1":
      return getTestBasicAction(gameState);
    case "TEST_2":
      return getTestWinAction(gameState);
    default:
      return { left: false, right: false, up: false, down: false, space: false, z: false, shift: false };
  }
}

// Expose globally
if (typeof window !== 'undefined') {
  window.get_automated_testing_action = get_automated_testing_action;
}

export default get_automated_testing_action;