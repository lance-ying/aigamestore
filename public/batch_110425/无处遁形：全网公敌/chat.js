import { gameState, CASE_DATA, GAME_PHASES } from './globals.js';
import { Window } from './entities.js';

export function renderChat(p) {
  const win = new Window("Secure Chat - Social Engineering", 50, 50, 500, 330);
  win.render(p);
  
  p.push();
  
  const caseData = CASE_DATA[gameState.currentCase];
  const canChat = gameState.discoveredClues.has("email_cracked");
  
  if (!canChat) {
    p.fill(200, 100, 100);
    p.textSize(11);
    p.textAlign(p.LEFT, p.TOP);
    p.text("ACCESS DENIED", 70, 90);
    
    p.fill(180, 180, 200);
    p.textSize(10);
    p.text("You need to gather more evidence before accessing the chat server.", 70, 115, 460);
    p.text("Press Z to close", 70, 160);
  } else {
    // Chat interface
    p.fill(220, 220, 240);
    p.textSize(11);
    p.textAlign(p.LEFT, p.TOP);
    p.text("Connected to suspect's chat", 70, 90);
    
    // Chat history
    p.fill(50, 50, 60);
    p.stroke(100, 100, 120);
    p.strokeWeight(2);
    p.rect(70, 110, 460, 180, 4);
    
    p.fill(220, 220, 240);
    p.noStroke();
    p.textSize(10);
    p.textAlign(p.LEFT, p.TOP);
    
    if (gameState.chatMessages.length === 0) {
      p.fill(100, 200, 100);
      p.text("YOU: " + caseData.chatDialogue[0].question, 80, 120, 440);
      
      p.fill(180, 180, 200);
      p.textSize(9);
      p.text("Choose your response carefully...", 80, 160);
    } else {
      // Show chat history
      let yPos = 120;
      gameState.chatMessages.forEach(msg => {
        p.fill(msg.from === "YOU" ? [100, 200, 100] : [200, 200, 100]);
        p.text(`${msg.from}: ${msg.text}`, 80, yPos, 440);
        yPos += 25;
      });
    }
    
    // Dialogue choices
    if (gameState.currentDialogueStep < caseData.chatDialogue.length) {
      const dialogue = caseData.chatDialogue[gameState.currentDialogueStep];
      
      p.fill(220, 220, 240);
      p.textSize(10);
      p.text("Select response (Arrow Keys + SPACE):", 70, 300);
      
      dialogue.choices.forEach((choice, index) => {
        const isSelected = index === gameState.selectedChoiceIndex;
        p.fill(isSelected ? [100, 200, 255] : [180, 180, 200]);
        const marker = isSelected ? "▶" : " ";
        p.text(`${marker} ${index + 1}. ${choice}`, 70, 315 + index * 15, 460);
      });
    }
    
    p.fill(180, 180, 200);
    p.textSize(9);
    p.text("Press Z to close", 70, 365);
  }
  
  p.pop();
}

export function handleChatInput(p, keyCode) {
  if (keyCode === 90) { // Z to close
    gameState.openApp = null;
    return;
  }
  
  const caseData = CASE_DATA[gameState.currentCase];
  const canChat = gameState.discoveredClues.has("email_cracked");
  
  if (!canChat) return;
  
  if (gameState.currentDialogueStep >= caseData.chatDialogue.length) return;
  
  const dialogue = caseData.chatDialogue[gameState.currentDialogueStep];
  
  if (keyCode === 38) { // UP
    gameState.selectedChoiceIndex = Math.max(0, gameState.selectedChoiceIndex - 1);
  } else if (keyCode === 40) { // DOWN
    gameState.selectedChoiceIndex = Math.min(dialogue.choices.length - 1, gameState.selectedChoiceIndex + 1);
  } else if (keyCode === 32) { // SPACE to select
    const selectedChoice = dialogue.choices[gameState.selectedChoiceIndex];
    gameState.chatMessages.push({ from: "YOU", text: selectedChoice });
    
    if (gameState.selectedChoiceIndex === dialogue.correctIndex) {
      // Correct choice - confession
      gameState.chatMessages.push({ 
        from: "SUSPECT", 
        text: "Alright, you got me. I'll tell you everything. Sarah discovered our illegal operations and threatened to expose us. I was ordered to silence her. She's being held at the warehouse on 5th street." 
      });
      
      gameState.currentDialogueStep++;
      
      // Win condition
      if (gameState.objectivesCompleted === 4) {
        gameState.objectivesCompleted = 5;
        gameState.score += 1000;
        gameState.casesCompleted++;
        gameState.gamePhase = GAME_PHASES.GAME_OVER_WIN;
      }
    } else {
      // Wrong choice
      gameState.chatMessages.push({ 
        from: "SUSPECT", 
        text: "I don't know what you're talking about. Leave me alone." 
      });
      
      // Give one more chance
      if (gameState.chatMessages.filter(m => m.from === "SUSPECT").length >= 2) {
        gameState.gamePhase = GAME_PHASES.GAME_OVER_LOSE;
      }
    }
    
    gameState.selectedChoiceIndex = 0;
  }
}