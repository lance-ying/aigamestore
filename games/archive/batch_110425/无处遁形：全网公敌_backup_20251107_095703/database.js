import { gameState, CASE_DATA } from './globals.js';
import { Window } from './entities.js';

export function renderDatabase(p) {
  const win = new Window("Database Query Terminal", 50, 50, 500, 330);
  win.render(p);
  
  p.push();
  
  // Query input
  p.fill(50, 50, 60);
  p.stroke(100, 100, 120);
  p.strokeWeight(2);
  p.rect(70, 90, 460, 30, 4);
  
  p.fill(220, 220, 240);
  p.noStroke();
  p.textSize(12);
  p.textAlign(p.LEFT, p.CENTER);
  p.text("QUERY> " + gameState.databaseQueryInput + "_", 80, 105);
  
  // Instructions
  p.fill(180, 180, 200);
  p.textSize(10);
  p.textAlign(p.LEFT, p.TOP);
  p.text("Press Z to close | Enter name to query records (SPACE to execute)", 70, 130);
  
  // Display query results
  if (gameState.databaseEntries.length > 0) {
    const lastQuery = gameState.databaseEntries[gameState.databaseEntries.length - 1];
    const caseData = CASE_DATA[gameState.currentCase];
    
    p.fill(220, 220, 240);
    p.textSize(11);
    p.text(`Query results for: "${lastQuery}"`, 70, 155);
    
    // Check if query matches database key
    if (lastQuery.toLowerCase().includes(caseData.databaseKey.toLowerCase())) {
      p.fill(100, 200, 100);
      p.text("✓ Records found!", 70, 175);
      
      p.fill(220, 220, 240);
      p.textSize(10);
      const recordText = `NAME: ${caseData.keywords[0]}\nSTATUS: Missing\nAFFILIATION: Independent ${caseData.keywords[1]}\nSUSPECT EMAIL: ${caseData.targetEmail}\nPASSWORD HINT: ${caseData.passwordClue}\nNOTES: Last contact 3 days ago`;
      p.text(recordText, 70, 195, 460);
      
      // Add clue
      if (!gameState.discoveredClues.has("database_query")) {
        gameState.discoveredClues.add("database_query");
        if (gameState.objectivesCompleted === 1) {
          gameState.objectivesCompleted = 2;
        }
      }
    } else {
      p.fill(200, 100, 100);
      p.text("No records found. Try a different query.", 70, 175);
    }
  } else {
    p.fill(180, 180, 200);
    p.textSize(10);
    p.text("Database ready. Enter query...", 70, 160);
  }
  
  p.pop();
}

export function handleDatabaseInput(p, key, keyCode) {
  if (keyCode === 90) { // Z to close
    gameState.openApp = null;
    return;
  }
  
  if (keyCode === 32) { // SPACE to execute query
    if (gameState.databaseQueryInput.length > 0) {
      gameState.databaseEntries.push(gameState.databaseQueryInput);
      gameState.databaseQueryInput = "";
    }
    return;
  }
  
  // Text input
  if (key.length === 1 && /[a-zA-Z0-9 ]/.test(key)) {
    gameState.databaseQueryInput += key;
  } else if (keyCode === 8) { // Backspace
    gameState.databaseQueryInput = gameState.databaseQueryInput.slice(0, -1);
  }
}