import { gameState } from './globals.js';

export function runTests() {
  console.log("Running automated tests...");
  
  // Test 1: Basic movement and combat
  if (gameState.controlMode === "TEST_1") {
    testBasicGameplay();
  }
  
  // Test 2: Win condition
  if (gameState.controlMode === "TEST_2") {
    testWinCondition();
  }
}

function testBasicGameplay() {
  // This is called each frame in TEST_1 mode
  // The movement AI in input.js handles basic testing
}

function testWinCondition() {
  // Give player everything needed to win quickly
  if (gameState.frameCount === 1 && gameState.player) {
    gameState.player.health = 100;
    gameState.player.maxHealth = 100;
    gameState.inventory = ['DASH_BOOTS', 'HOOKSHOT', 'BOW', 'HAMMER', 'REALM_MIRROR'];
    gameState.smallKeys = 10;
    gameState.hasBigKey = true;
  }
}