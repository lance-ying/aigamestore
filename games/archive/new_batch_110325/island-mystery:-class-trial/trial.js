// Trial phase logic
import { gameState, GAME_PHASES, PLAY_PHASES } from './globals.js';

export class Statement {
  constructor(text, correctEvidence, speaker) {
    this.text = text;
    this.correctEvidence = correctEvidence;
    this.speaker = speaker;
    this.contradicted = false;
  }
}

export function initializeTrialStatements() {
  return [
    new Statement(
      "I was at the beach all night!",
      "camera",
      "Suspect A"
    ),
    new Statement(
      "The victim died from blunt trauma!",
      "poison",
      "Suspect B"
    ),
    new Statement(
      "Nobody had a reason to hurt them!",
      "letter",
      "Suspect C"
    ),
    new Statement(
      "I never touched any weapons!",
      "knife",
      "Suspect A"
    ),
    new Statement(
      "The footprints could be anyone's!",
      "guestbook",
      "Suspect D"
    )
  ];
}

export function checkEvidenceMatch(evidenceId, statement) {
  return evidenceId === statement.correctEvidence;
}

export function advanceStatement() {
  gameState.currentStatement++;
  gameState.statementTimer = 0;
  
  if (gameState.currentStatement >= gameState.trialStatements.length) {
    // Trial complete - WIN
    gameState.gamePhase = GAME_PHASES.GAME_OVER_WIN;
    gameState.score += 1000;
    return true;
  }
  return false;
}

export function handleWrongEvidence() {
  gameState.mistakes++;
  gameState.statementTimer = 0;
  
  if (gameState.mistakes >= gameState.maxMistakes) {
    // Too many mistakes - LOSE
    gameState.gamePhase = GAME_PHASES.GAME_OVER_LOSE;
    return true;
  }
  return false;
}