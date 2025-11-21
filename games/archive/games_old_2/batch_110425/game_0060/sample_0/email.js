import { gameState, CASE_DATA } from './globals.js';
import { Window } from './entities.js';

export function renderEmail(p) {
  const win = new Window("Email Client - Secure Login", 50, 50, 500, 330);
  win.render(p);
  
  p.push();
  
  const caseData = CASE_DATA[gameState.currentCase];
  const isUnlocked = gameState.crackedAccounts.includes(caseData.targetEmail);
  
  if (!isUnlocked) {
    // Password cracking interface
    p.fill(220, 220, 240);
    p.textSize(12);
    p.textAlign(p.LEFT, p.TOP);
    p.text(`Target: ${caseData.targetEmail}`, 70, 90);
    
    p.textSize(10);
    p.fill(180, 180, 200);
    p.text(`Password attempts: ${gameState.passwordAttempts}/${gameState.maxPasswordAttempts}`, 70, 110);
    
    // Password input
    p.fill(50, 50, 60);
    p.stroke(100, 100, 120);
    p.strokeWeight(2);
    p.rect(70, 135, 460, 30, 4);
    
    p.fill(220, 220, 240);
    p.noStroke();
    p.textSize(12);
    p.textAlign(p.LEFT, p.CENTER);
    const maskedPassword = "*".repeat(gameState.passwordInput.length);
    p.text("PASSWORD> " + maskedPassword + "_", 80, 150);
    
    // Instructions
    p.fill(180, 180, 200);
    p.textSize(10);
    p.textAlign(p.LEFT, p.TOP);
    p.text("Press Z to close | Enter password and press SPACE to attempt crack", 70, 175);
    
    // Hint
    if (gameState.discoveredClues.has("database_query")) {
      p.fill(100, 200, 150);
      p.text(`HINT: Password related to ${caseData.passwordClue}`, 70, 200);
    }
    
    // Previous attempts
    if (gameState.passwordAttempts > 0) {
      p.fill(200, 100, 100);
      p.text("Previous attempts failed!", 70, 225);
    }
  } else {
    // Email inbox
    p.fill(100, 200, 100);
    p.textSize(12);
    p.textAlign(p.LEFT, p.TOP);
    p.text("✓ ACCESS GRANTED", 70, 90);
    
    p.fill(220, 220, 240);
    p.textSize(11);
    p.text("INBOX (1 new message)", 70, 115);
    
    // Email content
    p.fill(50, 50, 60);
    p.stroke(100, 100, 120);
    p.strokeWeight(2);
    p.rect(70, 140, 460, 220, 4);
    
    p.fill(220, 220, 240);
    p.noStroke();
    p.textSize(10);
    p.textAlign(p.LEFT, p.TOP);
    const emailContent = `FROM: corporate_exec@corp.net
TO: ${caseData.targetEmail}
SUBJECT: RE: The journalist situation

We need to talk about Sarah Chen. She was getting
too close to the truth about our operations. I took
care of it like you asked. She won't be a problem
anymore. The evidence is stored in the secure chat
server. Use the usual protocol.

Don't contact me again through this channel.`;
    
    p.text(emailContent, 80, 150, 440);
    
    p.fill(180, 180, 200);
    p.textSize(9);
    p.text("Press Z to close | This is critical evidence!", 70, 310);
    
    // Add clue
    if (!gameState.discoveredClues.has("email_cracked")) {
      gameState.discoveredClues.add("email_cracked");
      if (gameState.objectivesCompleted === 3) {
        gameState.objectivesCompleted = 4;
      }
    }
  }
  
  p.pop();
}

export function handleEmailInput(p, key, keyCode) {
  if (keyCode === 90) { // Z to close
    gameState.openApp = null;
    return;
  }
  
  const caseData = CASE_DATA[gameState.currentCase];
  const isUnlocked = gameState.crackedAccounts.includes(caseData.targetEmail);
  
  if (isUnlocked) return;
  
  if (keyCode === 32) { // SPACE to attempt crack
    if (gameState.passwordInput.length > 0) {
      gameState.passwordAttempts++;
      
      if (gameState.passwordInput === caseData.correctPassword) {
        gameState.crackedAccounts.push(caseData.targetEmail);
        gameState.passwordInput = "";
        if (gameState.objectivesCompleted === 2) {
          gameState.objectivesCompleted = 3;
        }
      } else {
        gameState.passwordInput = "";
        
        if (gameState.passwordAttempts >= gameState.maxPasswordAttempts) {
          // Game over - too many failed attempts
          gameState.gamePhase = "GAME_OVER_LOSE";
        }
      }
    }
    return;
  }
  
  // Text input
  if (key.length === 1 && /[a-zA-Z0-9]/.test(key)) {
    gameState.passwordInput += key;
  } else if (keyCode === 8) { // Backspace
    gameState.passwordInput = gameState.passwordInput.slice(0, -1);
  }
}