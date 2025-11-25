// rendering.js - All rendering functions

import { gameState, GAME_PHASES, CANVAS_WIDTH, CANVAS_HEIGHT, FISHING_STATES, FISH_TYPES, ROD_UPGRADES, WATER_ZONES } from './globals.js';

export function drawStartScreen(p) {
  p.background(135, 206, 235);
  
  // Draw water background
  p.fill(70, 130, 180, 150);
  p.noStroke();
  p.rect(0, CANVAS_HEIGHT - 150, CANVAS_WIDTH, 150);
  
  // Animated waves
  p.stroke(90, 150, 200);
  p.strokeWeight(2);
  p.noFill();
  for (let i = 0; i < 3; i++) {
    p.beginShape();
    for (let x = 0; x < CANVAS_WIDTH; x += 20) {
      const y = CANVAS_HEIGHT - 150 + i * 15 + p.sin((x + p.frameCount * 2) * 0.02) * 5;
      p.vertex(x, y);
    }
    p.endShape();
  }
  
  // Title
  p.fill(255, 255, 255);
  p.textAlign(p.CENTER, p.CENTER);
  p.textSize(48);
  p.text("WEBFISHING", CANVAS_WIDTH / 2, 80);
  
  // Subtitle
  p.textSize(20);
  p.fill(255, 255, 200);
  p.text("Relax and Fish!", CANVAS_WIDTH / 2, 130);
  
  // Instructions box
  p.fill(50, 50, 80, 200);
  p.rect(CANVAS_WIDTH / 2 - 200, 160, 400, 170, 10);
  
  p.fill(255);
  p.textSize(14);
  p.textAlign(p.LEFT, p.TOP);
  const instructions = [
    "OBJECTIVE: Catch all fish species and reach mastery level 5!",
    "",
    "CONTROLS:",
    "  Arrow Keys - Move around",
    "  Space - Cast line / Reel in when fish bites",
    "  Z - Open/Close fish journal",
    "",
    "Earn money to upgrade your rod for better catches!"
  ];
  
  for (let i = 0; i < instructions.length; i++) {
    p.text(instructions[i], CANVAS_WIDTH / 2 - 180, 170 + i * 18);
  }
  
  // Start prompt
  p.textAlign(p.CENTER, p.CENTER);
  p.textSize(20);
  p.fill(255, 255, 100);
  const alpha = p.map(p.sin(p.frameCount * 0.1), -1, 1, 100, 255);
  p.fill(255, 255, 100, alpha);
  p.text("PRESS ENTER TO START", CANVAS_WIDTH / 2, CANVAS_HEIGHT - 40);
}

export function drawGameOverScreen(p) {
  p.background(20, 20, 40);
  
  const isWin = gameState.gamePhase === GAME_PHASES.GAME_OVER_WIN;
  
  // Result text
  p.fill(isWin ? [100, 255, 100] : [255, 100, 100]);
  p.textAlign(p.CENTER, p.CENTER);
  p.textSize(48);
  p.text(isWin ? "MASTER ANGLER!" : "GAME OVER", CANVAS_WIDTH / 2, 80);
  
  // Stats
  p.fill(255);
  p.textSize(18);
  p.text(`Final Score: $${gameState.score}`, CANVAS_WIDTH / 2, 140);
  p.text(`Total Fish Caught: ${gameState.totalFishCaught}`, CANVAS_WIDTH / 2, 170);
  p.text(`Unique Species: ${gameState.journal.size}/${FISH_TYPES.length}`, CANVAS_WIDTH / 2, 200);
  p.text(`Mastery Level: ${gameState.masteryLevel}`, CANVAS_WIDTH / 2, 230);
  
  if (isWin) {
    p.textSize(16);
    p.fill(255, 255, 150);
    p.text("You've become the ultimate fisherman!", CANVAS_WIDTH / 2, 270);
    p.text("All fish caught and mastery achieved!", CANVAS_WIDTH / 2, 295);
  }
  
  // Restart prompt
  p.textSize(20);
  const alpha = p.map(p.sin(p.frameCount * 0.1), -1, 1, 100, 255);
  p.fill(255, 255, 100, alpha);
  p.text("PRESS R TO RESTART", CANVAS_WIDTH / 2, CANVAS_HEIGHT - 50);
}

export function drawGameWorld(p) {
  // Sky
  p.background(135, 206, 235);
  
  // Ground
  p.fill(139, 115, 85);
  p.noStroke();
  p.rect(0, CANVAS_HEIGHT - 100, CANVAS_WIDTH, 100);
  
  // Grass
  p.fill(100, 150, 80);
  p.rect(0, CANVAS_HEIGHT - 110, CANVAS_WIDTH, 15);
  
  // Water zones
  drawWaterZones(p);
  
  // Fishing line and bobber
  if (gameState.fishingState !== FISHING_STATES.IDLE && gameState.player) {
    drawFishingLine(p);
  }
  
  // Player
  if (gameState.player) {
    gameState.player.draw(p);
  }
  
  // UI
  drawUI(p);
  
  // Fish caught popup
  if (gameState.fishingState === FISHING_STATES.CAUGHT && gameState.currentFish) {
    drawCaughtFishPopup(p);
  }
  
  // Journal
  if (gameState.journalOpen) {
    drawJournal(p);
  }
  
  // Paused indicator
  if (gameState.gamePhase === GAME_PHASES.PAUSED) {
    p.fill(255);
    p.textAlign(p.RIGHT, p.TOP);
    p.textSize(16);
    p.text("PAUSED", CANVAS_WIDTH - 10, 10);
  }
}

function drawWaterZones(p) {
  // Shallow water
  p.fill(100, 180, 220, 150);
  p.rect(WATER_ZONES.SHALLOW.minX, WATER_ZONES.SHALLOW.y, 
         WATER_ZONES.SHALLOW.maxX - WATER_ZONES.SHALLOW.minX, 
         CANVAS_HEIGHT - WATER_ZONES.SHALLOW.y);
  
  // Deep water
  p.fill(50, 120, 180, 150);
  p.rect(WATER_ZONES.DEEP.minX, WATER_ZONES.DEEP.y, 
         WATER_ZONES.DEEP.maxX - WATER_ZONES.DEEP.minX, 
         CANVAS_HEIGHT - WATER_ZONES.DEEP.y);
  
  // Golden spot
  p.fill(255, 215, 100, 100);
  p.stroke(255, 215, 0);
  p.strokeWeight(2);
  p.ellipse((WATER_ZONES.SPECIAL.minX + WATER_ZONES.SPECIAL.maxX) / 2, 
            WATER_ZONES.SPECIAL.y + 30, 60, 60);
  p.noStroke();
  
  // Animated waves
  for (let zoneKey in WATER_ZONES) {
    const zone = WATER_ZONES[zoneKey];
    p.stroke(zoneKey === "DEEP" ? [70, 140, 200] : [120, 200, 240]);
    p.strokeWeight(1);
    p.noFill();
    
    for (let i = 0; i < 2; i++) {
      p.beginShape();
      for (let x = zone.minX; x <= zone.maxX; x += 10) {
        const y = zone.y + i * 10 + p.sin((x + p.frameCount * 1.5) * 0.03) * 3;
        p.vertex(x, y);
      }
      p.endShape();
    }
  }
  p.noStroke();
}

function drawFishingLine(p) {
  const player = gameState.player;
  const rodTipX = player.x + player.width / 2 + 15 * player.facing;
  const rodTipY = player.y + player.height / 2 - 20;
  
  // Fishing line
  p.stroke(200, 200, 200, 150);
  p.strokeWeight(1);
  p.line(rodTipX, rodTipY, gameState.bobberPosition.x, gameState.bobberPosition.y);
  
  // Bobber
  const bobberY = gameState.bobberPosition.y + 
    (gameState.fishingState === FISHING_STATES.BITING ? 
     p.sin(p.frameCount * 0.3) * 5 : 0);
  
  p.fill(gameState.fishingState === FISHING_STATES.BITING ? 
         [255, 100, 100] : [255, 255, 255]);
  p.noStroke();
  p.ellipse(gameState.bobberPosition.x, bobberY, 8, 8);
  
  // Red top when biting
  if (gameState.fishingState === FISHING_STATES.BITING) {
    p.fill(255, 0, 0);
    p.ellipse(gameState.bobberPosition.x, bobberY - 4, 4, 4);
  }
  
  p.noStroke();
}

function drawUI(p) {
  // Top bar background
  p.fill(50, 50, 50, 200);
  p.rect(0, 0, CANVAS_WIDTH, 80);
  
  // Money
  p.fill(255, 215, 0);
  p.textAlign(p.LEFT, p.TOP);
  p.textSize(16);
  p.text(`$${gameState.money}`, 10, 10);
  
  // Rod info
  const rod = ROD_UPGRADES[gameState.rodLevel];
  p.fill(255);
  p.text(`Rod: ${rod.name}`, 10, 35);
  
  // Next upgrade
  const nextRod = ROD_UPGRADES[gameState.rodLevel + 1];
  if (nextRod) {
    p.textSize(12);
    p.fill(gameState.money >= nextRod.cost ? [100, 255, 100] : [255, 100, 100]);
    p.text(`Next: ${nextRod.name} ($${nextRod.cost})`, 10, 58);
  } else {
    p.textSize(12);
    p.fill(255, 215, 0);
    p.text("MAX LEVEL!", 10, 58);
  }
  
  // Stats
  p.fill(255);
  p.textAlign(p.RIGHT, p.TOP);
  p.textSize(14);
  p.text(`Fish: ${gameState.journal.size}/${FISH_TYPES.length}`, CANVAS_WIDTH - 10, 10);
  p.text(`Caught: ${gameState.totalFishCaught}`, CANVAS_WIDTH - 10, 30);
  p.text(`Mastery Lv: ${gameState.masteryLevel}`, CANVAS_WIDTH - 10, 50);
  
  // Fishing state indicator
  if (gameState.fishingState !== FISHING_STATES.IDLE) {
    p.fill(255, 255, 150);
    p.textAlign(p.CENTER, p.TOP);
    p.textSize(12);
    let stateText = "";
    switch (gameState.fishingState) {
      case FISHING_STATES.CASTING:
        stateText = "Casting...";
        break;
      case FISHING_STATES.WAITING:
        stateText = "Waiting for bite...";
        break;
      case FISHING_STATES.BITING:
        stateText = "FISH BITING! Press SPACE!";
        break;
      case FISHING_STATES.REELING:
        stateText = "Reeling in...";
        break;
    }
    p.text(stateText, CANVAS_WIDTH / 2, 90);
  }
  
  // Instructions
  p.fill(200, 200, 200);
  p.textAlign(p.CENTER, p.BOTTOM);
  p.textSize(10);
  p.text("Z: Journal | Arrows: Move | Space: Fish", CANVAS_WIDTH / 2, CANVAS_HEIGHT - 5);
}

function drawCaughtFishPopup(p) {
  if (!gameState.currentFish) return;
  
  const fish = gameState.currentFish;
  
  // Popup background
  p.fill(50, 50, 80, 230);
  p.stroke(255, 215, 0);
  p.strokeWeight(3);
  p.rect(CANVAS_WIDTH / 2 - 120, CANVAS_HEIGHT / 2 - 60, 240, 120, 10);
  p.noStroke();
  
  // Fish icon
  drawFishIcon(p, CANVAS_WIDTH / 2 - 80, CANVAS_HEIGHT / 2, fish<game_description>
Welcome to WEBFISHING! Cast your line, catch a variety of fish and sea creatures, and build your collection. Earn money by selling your catches, upgrade your fishing rod for better performance, and complete your journal by discovering all the fish species. Watch for bite indicators and reel in your catch at the right moment. Can you become the ultimate angler and catch them all?
</game_description>

<game_controls>
Arrow Keys: Move your character around the fishing spots
Space: Cast fishing line / Reel in when fish bites
Z: Open/Close shop to buy upgrades
Shift: Sprint (move faster)
Enter: Start game
ESC: Pause/Unpause
R: Restart to main menu
</game_controls>

<automated_testing>
<TEST_1>
<test_description>Basic movement and fishing mechanics test. Validates that the player can move around, cast line, and catch fish successfully.</test_description>
<strategy_description>Move to a fishing spot near water, cast the line, wait for a bite, and reel in the fish. Repeat this process to catch multiple fish and validate the catching mechanic works consistently.</strategy_description>
<expected_outcome>Player successfully moves to water, casts line, catches fish when biting, and earns money. The test confirms basic gameplay loop functions correctly.</expected_outcome>
</TEST_1>

<TEST_2>
<test_description>Win condition test - complete the fish journal. Tests the full progression system including catching all fish types and upgrading equipment.</test_description>
<strategy_description>Systematically fish in different water areas, upgrade rod when possible to catch rarer fish, and continue until all fish species are discovered and the journal is complete.</strategy_description>
<expected_outcome>Successfully catch all fish types, fill the journal to 100%, trigger GAME_OVER_WIN condition. Validates progression system and win condition work correctly.</expected_outcome>
</TEST_2>

<TEST_3>
<test_description>Shop and upgrade system test. Validates purchasing mechanics and rod upgrades improve fishing performance.</test_description>
<strategy_description>Fish to earn money, open shop, purchase rod upgrades in sequence, verify upgrades affect fishing range and catch quality.</strategy_description>
<expected_outcome>Successfully earn money, purchase upgrades, and observe improved fishing capabilities with better rods. Confirms economy and upgrade systems function properly.</expected_outcome>
</TEST_3>

<TEST_4>
<test_description>Movement and collision test. Ensures player movement is smooth and boundaries are respected.</test_description>
<strategy_description>Move player in all directions including diagonal, test sprint functionality, attempt to move beyond canvas boundaries, and verify collision with obstacles.</strategy_description>
<expected_outcome>Player moves smoothly, sprinting works, stays within playable area, and collides properly with boundaries. Movement system is responsive and correct.</expected_outcome>
</TEST_4>

<TEST_5>
<test_description>Random exploration test. Simulates casual play with random movements and fishing attempts.</test_description>
<strategy_description>Perform random movements, cast lines at various locations, explore different areas of the map, and fish randomly to test general stability.</strategy_description>
<expected_outcome>Game remains stable during random actions, no crashes occur, fish can be caught from valid locations, and game state remains consistent.</expected_outcome>
</TEST_5>
</automated_testing>

<code filename="globals.js">
// globals.js - Global constants and game state

export const CANVAS_WIDTH = 600;
export const CANVAS_HEIGHT = 400;

export const GAME_PHASES = {
  START: "START",
  PLAYING: "PLAYING",
  PAUSED: "PAUSED",
  GAME_OVER_WIN: "GAME_OVER_WIN",
  GAME_OVER_LOSE: "GAME_OVER_LOSE"
};

export const CONTROL_MODES = {
  HUMAN: "HUMAN",
  TEST_1: "TEST_1",
  TEST_2: "TEST_2",
  TEST_3: "TEST_3",
  TEST_4: "TEST_4",
  TEST_5: "TEST_5"
};

// Fish types with rarity and value
export const FISH_TYPES = [
  { name: "Minnow", rarity: 0.4, value: 5, minRodLevel: 0, color: [200, 200, 200] },
  { name: "Carp", rarity: 0.25, value: 10, minRodLevel: 0, color: [180, 140, 80] },
  { name: "Bass", rarity: 0.15, value: 20, minRodLevel: 0, color: [100, 150, 100] },
  { name: "Trout", rarity: 0.1, value: 30, minRodLevel: 1, color: [200, 150, 180] },
  { name: "Pike", rarity: 0.05, value: 50, minRodLevel: 1, color: [150, 180, 150] },
  { name: "Salmon", rarity: 0.025, value: 75, minRodLevel: 2, color: [255, 150, 120] },
  { name: "Tuna", rarity: 0.015, value: 100, minRodLevel: 2, color: [100, 100, 150] },
  { name: "Swordfish", rarity: 0.008, value: 150, minRodLevel: 3, color: [150, 150, 200] },
  { name: "Shark", rarity: 0.005, value: 250, minRodLevel: 3, color: [120, 120, 140] },
  { name: "Golden Fish", rarity: 0.002, value: 500, minRodLevel: 4, color: [255, 215, 0] }
];

// Rod upgrades
export const ROD_UPGRADES = [
  { level: 0, name: "Basic Rod", cost: 0, castRange: 80, catchSpeed: 1.0 },
  { level: 1, name: "Wooden Rod", cost: 100, castRange: 100, catchSpeed: 1.2 },
  { level: 2, name: "Iron Rod", cost: 300, castRange: 120, catchSpeed: 1.4 },
  { level: 3, name: "Steel Rod", cost: 700, castRange: 140, catchSpeed: 1.6 },
  { level: 4, name: "Master Rod", cost: 1500, castRange: 160, catchSpeed: 2.0 }
];

export const gameState = {
  player: null,
  entities: [],
  score: 0,
  money: 0,
  gamePhase: GAME_PHASES.START,
  controlMode: CONTROL_MODES.HUMAN,
  fishingLine: null,
  fishJournal: new Set(),
  rodLevel: 0,
  shopOpen: false,
  lastCatch: null,
  totalFishCaught: 0,
  waterAreas: [],
  trees: [],
  rocks: []
};

// Expose gameState globally
window.getGameState = function() {
  return gameState;
};

export function resetGameState() {
  gameState.score = 0;
  gameState.money = 0;
  gameState.fishingLine = null;
  gameState.fishJournal = new Set();
  gameState.rodLevel = 0;
  gameState.shopOpen = false;
  gameState.lastCatch = null;
  gameState.totalFishCaught = 0;
  gameState.entities = gameState.entities.filter(e => e.type === 'player');
  if (gameState.player) {
    gameState.player.x = CANVAS_WIDTH / 2;
    gameState.player.y = CANVAS_HEIGHT - 60;
    gameState.player.velocityX = 0;
    gameState.player.velocityY = 0;
  }
}