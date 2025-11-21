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
  
  // Search hints and instructions
  p.fill(180, 180, 200);
  p.textSize(10);
  p.textAlign(p.LEFT, p.TOP);
  p.text("Press Z to close | Type keywords and press SPACE to search", 70, 130);
  
  // Show helpful hints
  const caseData = CASE_DATA[gameState.currentCase];
  if (gameState.searchHistory.length === 0) {
    p.fill(100, 200, 255);
    p.textSize(10);
    p.text("💡 HINT: Try searching for terms related to the case:", 70, 150);
    p.fill(150, 220, 255);
    p.text(`"${caseData.keywords[0]}" or "${caseData.keywords[1]}" or "${caseData.keywords[2]}"`, 70, 165);
  }
  
  // Display search results
  if (gameState.searchHistory.length > 0) {
    const lastSearch = gameState.searchHistory[gameState.searchHistory.length - 1];
    
    p.fill(220, 220, 240);
    p.textSize(11);
    p.text(`Search results for: "${lastSearch}"`, 70, 190);
    
    // Check if search matches case keywords (more forgiving matching)
    const searchLower = lastSearch.toLowerCase();
    const matchedKeywords = caseData.keywords.filter(keyword => 
      searchLower.includes(keyword.toLowerCase()) || 
      keyword.toLowerCase().includes(searchLower)
    );
    
    // Also check for partial matches of key terms
    const partialMatches = caseData.keywords.filter(keyword => {
      const keywordWords = keyword.toLowerCase().split(' ');
      return keywordWords.some(word => 
        word.length > 3 && (searchLower.includes(word) || word.includes(searchLower))
      );
    });
    
    const hasMatch = matchedKeywords.length > 0 || partialMatches.length > 0;
    
    if (hasMatch) {
      p.fill(100, 200, 100);
      p.text("✓ Relevant information found!", 70, 210);
      
      p.fill(220, 220, 240);
      p.textSize(10);
      const resultText = `Target: ${caseData.keywords[0]}\nOccupation: ${caseData.keywords[1]}\nInvestigating: ${caseData.keywords[2]}\nBirthdate: April 15, 1985\nLast known location: Corporate HQ\n\n💡 Next: Check the Database for more details`;
      p.text(resultText, 70, 230, 460);
      
      // Add clue
      if (!gameState.discoveredClues.has("browser_search")) {
        gameState.discoveredClues.add("browser_search");
        if (gameState.objectivesCompleted === 0) {
          gameState.objectivesCompleted = 1;
        }
      }
    } else {
      p.fill(200, 100, 100);
      p.text("No relevant results found.", 70, 210);
      
      p.fill(180, 180, 200);
      p.textSize(9);
      p.text(`💡 Try: "${caseData.keywords[0]}", "${caseData.keywords[1]}", or "${caseData.keywords[2]}"`, 70, 230);
    }
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