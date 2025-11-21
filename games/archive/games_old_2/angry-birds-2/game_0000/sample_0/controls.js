// controls.js - Input handling and automated testing

import { gameState, CANVAS_WIDTH } from './globals.js';

export function handleHumanInput(p) {
  if (!gameState.currentBird || gameState.birdInFlight) {
    // Check for ability use during flight
    if (gameState.launchedBird && !gameState.abilityUsed) {
      if (p.keyIsDown(90)) { // Z key
        gameState.launchedBird.useAbility();
        gameState.abilityUsed = true;
      }
    }
    return;
  }
  
  // Adjust angle
  if (p.keyIsDown(37)) { // LEFT
    gameState.slingshotAngle = Math.max(gameState.slingshotAngle - 2, -80);
  }
  if (p.keyIsDown(39)) { // RIGHT
    gameState.slingshotAngle = Math.min(gameState.slingshotAngle + 2, -10);
  }
  
  // Adjust power
  if (p.keyIsDown(38)) { // UP
    gameState.slingshotPower = Math.min(gameState.slingshotPower + 2, 100);
  }
  if (p.keyIsDown(40)) { // DOWN
    gameState.slingshotPower = Math.max(gameState.slingshotPower - 2, 20);
  }
  
  // Launch
  if (p.keyIsDown(32)) { // SPACE
    launchBird();
  }
}

export function launchBird() {
  if (!gameState.currentBird || gameState.birdInFlight) return;
  
  gameState.currentBird.launch(gameState.slingshotAngle, gameState.slingshotPower);
  gameState.launchedBird = gameState.currentBird;
  gameState.birdInFlight = true;
  gameState.abilityUsed = false;
  
  // Reset for next bird
  gameState.currentBird = null;
}

// Automated testing modes
export function handleTestMode(p) {
  if (gameState.controlMode === "TEST_1") {
    handleTest1(p);
  } else if (gameState.controlMode === "TEST_2") {
    handleTest2(p);
  }
}

function handleTest1(p) {
  // Basic testing - cycle through different angles and powers
  gameState.testTimer++;
  
  if (gameState.testTimer > 120 && !gameState.birdInFlight && gameState.currentBird) {
    // Vary angle and power
    const testAngles = [-70, -60, -50, -40, -30];
    const testPowers = [40, 60, 80, 100];
    
    const angleIndex = gameState.testBirdsLaunched % testAngles.length;
    const powerIndex = Math.floor(gameState.testBirdsLaunched / testAngles.length) % testPowers.length;
    
    gameState.slingshotAngle = testAngles[angleIndex];
    gameState.slingshotPower = testPowers[powerIndex];
    
    launchBird();
    gameState.testBirdsLaunched++;
    gameState.testTimer = 0;
  }
  
  // Use ability mid-flight
  if (gameState.launchedBird && !gameState.abilityUsed && gameState.testTimer === 30) {
    gameState.launchedBird.useAbility();
    gameState.abilityUsed = true;
  }
}

function handleTest2(p) {
  // Win test - aim directly at pigs
  gameState.testTimer++;
  
  if (gameState.testTimer > 100 && !gameState.birdInFlight && gameState.currentBird) {
    // Find a living pig
    const alivePigs = gameState.pigs.filter(pig => !pig.destroyed);
    
    if (alivePigs.length > 0) {
      const targetPig = alivePigs[0];
      const birdPos = gameState.currentBird.body.position;
      
      // Calculate angle to pig
      const dx = targetPig.body.position.x - birdPos.x;
      const dy = targetPig.body.position.y - birdPos.y;
      const distance = Math.sqrt(dx * dx + dy * dy);
      
      // Aim slightly above for arc
      gameState.slingshotAngle = Math.atan2(dy - 20, dx) * 180 / Math.PI;
      gameState.slingshotAngle = Math.max(-80, Math.min(-10, gameState.slingshotAngle));
      
      // Set power based on distance
      gameState.slingshotPower = Math.min(100, 50 + distance / 5);
      
      launchBird();
      gameState.testBirdsLaunched++;
      gameState.testTimer = 0;
    }
  }
  
  // Use ability when near pigs
  if (gameState.launchedBird && !gameState.abilityUsed) {
    const alivePigs = gameState.pigs.filter(pig => !pig.destroyed);
    if (alivePigs.length > 0) {
      const birdPos = gameState.launchedBird.body.position;
      const closestPig = alivePigs[0];
      const distance = Math.sqrt(
        Math.pow(birdPos.x - closestPig.body.position.x, 2) +
        Math.pow(birdPos.y - closestPig.body.position.y, 2)
      );
      
      if (distance < 100) {
        gameState.launchedBird.useAbility();
        gameState.abilityUsed = true;
      }
    }
  }
}