// game_logic.js
import { gameState, GAME_PHASES, CHAPTER_DATA } from './globals.js';
import { Player } from './player.js';
import { EvidencePoint } from './evidence.js';
import { generateStatements } from './trial.js';

export function initializeGame(p) {
  gameState.player = new Player(300, 350);
  gameState.entities = [gameState.player];
  gameState.score = 0;
  gameState.currentChapter = 1;
  gameState.health = 3;
  gameState.combo = 0;
  gameState.maxCombo = 0;
  
  startInvestigation(p);
}

export function startInvestigation(p) {
  gameState.gamePhase = GAME_PHASES.INVESTIGATION;
  gameState.truthBullets = [];
  gameState.collectedBullets = [];
  gameState.evidencePoints = [];
  
  const chapterData = CHAPTER_DATA[gameState.currentChapter - 1];
  
  // Create evidence points
  const positions = [
    { x: 150, y: 150 },
    { x: 450, y: 150 },
    { x: 300, y: 200 },
    { x: 100, y: 280 },
    { x: 500, y: 280 }
  ];
  
  for (let i = 0; i < chapterData.evidenceCount; i++) {
    const pos = positions[i % positions.length];
    const evidence = new EvidencePoint(
      pos.x,
      pos.y,
      i,
      `Evidence ${i + 1}`,
      `Clue found at the scene`
    );
    gameState.evidencePoints.push(evidence);
    gameState.entities.push(evidence);
  }
  
  // Reset player position
  gameState.player.x = 300;
  gameState.player.y = 350;
}

export function startClassTrial(p) {
  gameState.gamePhase = GAME_PHASES.CLASS_TRIAL;
  
  const chapterData = CHAPTER_DATA[gameState.currentChapter - 1];
  
  // Generate statements
  gameState.trialStatements = generateStatements(gameState.currentChapter, gameState.collectedBullets);
  
  // Initialize trial state
  gameState.statementProgress = 0;
  gameState.liesFound = 0;
  gameState.totalLies = chapterData.lies;
  gameState.trialTimeRemaining = chapterData.trialTime;
  gameState.slowMoCharges = 3;
  gameState.slowMoActive = false;
  gameState.slowMoDuration = 0;
}

export function completeChapter(p) {
  gameState.score += 1000;
  gameState.score += Math.floor(gameState.trialTimeRemaining * 10);
  gameState.score += gameState.combo * 100;
  
  if (gameState.currentChapter >= gameState.maxChapters) {
    gameState.gamePhase = GAME_PHASES.GAME_OVER_WIN;
  } else {
    gameState.currentChapter++;
    startInvestigation(p);
  }
}

export function handleGameOver() {
  gameState.gamePhase = GAME_PHASES.GAME_OVER_LOSE;
}

export function checkAllEvidenceCollected() {
  return gameState.collectedBullets.length === gameState.evidencePoints.length;
}