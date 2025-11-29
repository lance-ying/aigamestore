import { gameState, CASE_DATA } from './globals.js';
import { Window } from './entities.js';

export function renderBrowser(p) {
  const win = new Window("Web Browser - HackSearch", 50, 50, 500, 330);
  win.render(p);
  
  p.push();
  
  // Search bar
  p.fill(50, 50, 60);
  p.stroke(100, 100, 120);
  p.strokeWeight(2);
  p.rect(70, 90, 460, 30, 4);
  
  p.fill(220, 220, 240);
  p.noStroke();
  p.textSize(12);
  p.textAlign(p.LEFT, p.CENTER);
  p.text(gameState.browserSearchInput + "_", 80, 105);
  
  // Search results
  p.fill(180, 180, 200);
  p.textSize(10);
  p.textAlign(p.LEFT, p.TOP);
  p.text("Press Z to close | Type keywords and press SPACE to search", 70, 130);
  
  // Display search results
  if (gameState.searchHistory.length > 0) {
    const lastSearch = gameState.searchHistory[gameState.searchHistory.length - 1];
    const caseData = CASE_DATA[gameState.currentCase];
    
    p.fill(220, 220, 240);
    p.textSize(11);
    p.text(`Search results for: "${lastSearch}"`, 70, 155);
    
    // Check if search matches case keywords
    const matchedKeywords = caseData.keywords.filter(keyword => 
      lastSearch.toLowerCase().includes(keyword.toLowerCase())
    );
    
    if (matchedKeywords.length > 0) {
      p.fill(100, 200, 100);
      p.text("✓ Relevant information found!", 70, 175);
      
      p.fill(220, 220, 240);
      p.textSize(10);
      const resultText = `Target: ${caseData.keywords[0]}\nOccupation: ${caseData.keywords[1]}\nInvestigating: ${caseData.keywords[2]}\nBirthdate: April 15, 1985\nLast known location: Corporate HQ`;
      p.text(resultText, 70, 195, 460);
      
      // Add clue
      if (!gameState.discoveredClues.has("browser_search")) {
        gameState.discoveredClues.add("browser_search");
        if (gameState.objectivesCompleted === 0) {
          gameState.objectivesCompleted = 1;
        }
      }
    } else {
      p.fill(200, 100, 100);
      p.text("No relevant results found. Try different keywords.", 70, 175);
    }
  } else {
    p.fill(180, 180, 200);
    p.textSize(10);
    p.text("Enter search terms to begin investigation...", 70, 160);
  }
  
  p.pop();
}

export function handleBrowserInput(p, key, keyCode) {
  if (keyCode === 90) { // Z to close
    gameState.openApp = null;
    return;
  }
  
  if (keyCode === 32) { // SPACE to search
    if (gameState.browserSearchInput.length > 0) {
      gameState.searchHistory.push(gameState.browserSearchInput);
      gameState.browserSearchInput = "";
    }
    return;
  }
  
  // Text input
  if (key.length === 1 && /[a-zA-Z0-9 ]/.test(key)) {
    gameState.browserSearchInput += key;
  } else if (keyCode === 8) { // Backspace
    gameState.browserSearchInput = gameState.browserSearchInput.slice(0, -1);
  }
}