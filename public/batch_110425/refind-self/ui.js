// ui.js - UI rendering functions

import { gameState, GAME_PHASE } from './globals.js';

export function drawStartScreen(p) {
  p.background(20, 25, 40);
  
  // Animated background elements
  for (let i = 0; i < 30; i++) {
    const x = (i * 67 + p.frameCount * 0.5) % 600;
    const y = (i * 43) % 400;
    p.noStroke();
    p.fill(50, 60, 80, 100);
    p.circle(x, y, 4);
  }
  
  // Title
  p.fill(100, 200, 255);
  p.noStroke();
  p.textAlign(p.CENTER, p.CENTER);
  p.textSize(48);
  p.text("REFIND SELF", 300, 80);
  
  // Subtitle
  p.fill(150, 180, 220);
  p.textSize(16);
  p.text("性格診断ゲーム", 300, 120);
  
  // Description
  p.fill(200, 210, 230);
  p.textSize(14);
  p.textAlign(p.CENTER, p.CENTER);
  const desc = [
    "You are a robot exploring a world of personalities.",
    "Every action you take reveals who you are.",
    "",
    "Interact with other robots, solve puzzles,",
    "and discover your true self."
  ];
  
  for (let i = 0; i < desc.length; i++) {
    p.text(desc[i], 300, 160 + i * 20);
  }
  
  // Controls
  p.fill(180, 190, 210);
  p.textSize(12);
  p.textAlign(p.CENTER, p.CENTER);
  const controls = [
    "ARROW KEYS: Move",
    "SHIFT: Sprint",
    "SPACE: Interact",
    "Z: Confirm dialogue",
    "ESC: Pause"
  ];
  
  for (let i = 0; i < controls.length; i++) {
    p.text(controls[i], 300, 270 + i * 18);
  }
  
  // Press Enter prompt (animated)
  const alpha = Math.sin(p.frameCount * 0.1) * 127 + 128;
  p.fill(255, 255, 100, alpha);
  p.textSize(18);
  p.text("PRESS ENTER TO START", 300, 370);
}

export function drawGameOverScreen(p) {
  p.background(20, 25, 40);
  
  // Results panel
  p.fill(40, 45, 60);
  p.stroke(100, 150, 200);
  p.strokeWeight(3);
  p.rectMode(p.CENTER);
  p.rect(300, 200, 500, 320, 10);
  
  // Title
  p.fill(100, 255, 150);
  p.noStroke();
  p.textAlign(p.CENTER, p.CENTER);
  p.textSize(36);
  p.text("ANALYSIS COMPLETE", 300, 70);
  
  // Personality profile
  const profile = calculatePersonalityProfile();
  
  p.fill(255);
  p.textSize(24);
  p.text(`Your Personality: ${profile.type}`, 300, 130);
  
  // Traits
  p.textSize(16);
  p.textAlign(p.LEFT, p.CENTER);
  
  const traits = [
    `Analytical: ${profile.analytical}%`,
    `Emotional: ${profile.emotional}%`,
    `Reflective: ${profile.reflective}%`,
    `Balanced: ${profile.balanced}%`
  ];
  
  for (let i = 0; i < traits.length; i++) {
    const y = 180 + i * 35;
    p.fill(200);
    p.text(traits[i], 100, y);
    
    // Progress bar
    const values = [profile.analytical, profile.emotional, profile.reflective, profile.balanced];
    const barWidth = values[i] * 3;
    p.fill(60, 60, 80);
    p.noStroke();
    p.rect(100, y + 12, 300, 15, 3);
    p.fill(100, 200, 255);
    p.rect(100, y + 12, barWidth, 15, 3);
  }
  
  // Stats
  p.fill(220);
  p.textAlign(p.CENTER, p.CENTER);
  p.textSize(14);
  p.text(`Actions Recorded: ${gameState.actionsRecorded}`, 300, 320);
  p.text(`NPCs Met: ${gameState.npcs.filter(n => n.hasInteracted).length}`, 300, 345);
  p.text(`Puzzles Solved: ${gameState.puzzlesSolved.length}`, 300, 370);
  
  // Restart prompt
  p.fill(255, 255, 100);
  p.textSize(16);
  p.text("PRESS R TO RESTART", 300, 410);
}

export function drawPauseIndicator(p) {
  p.fill(255, 255, 100);
  p.noStroke();
  p.textAlign(p.RIGHT, p.TOP);
  p.textSize(14);
  p.text("PAUSED", 590, 10);
}

export function drawUI(p) {
  // Personality meter
  p.fill(40, 40, 60, 200);
  p.noStroke();
  p.rectMode(p.CORNER);
  p.rect(10, 10, 200, 40, 5);
  
  // Meter label
  p.fill(255);
  p.textAlign(p.LEFT, p.TOP);
  p.textSize(12);
  p.text("Personality Analysis", 15, 15);
  
  // Progress bar
  const meterWidth = gameState.personalityMeter * 1.8; // 0-100 to 0-180 pixels
  p.fill(60, 60, 80);
  p.rect(15, 32, 180, 12, 3);
  p.fill(100, 200, 255);
  p.rect(15, 32, meterWidth, 12, 3);
  
  // Percentage
  p.fill(255);
  p.textAlign(p.RIGHT, p.TOP);
  p.text(`${Math.floor(gameState.personalityMeter)}%`, 195, 15);
  
  // Area indicator
  p.textAlign(p.LEFT, p.TOP);
  p.text(`Area: ${gameState.currentArea}`, 15, 60);
  
  // Actions recorded
  p.textSize(10);
  p.fill(200);
  p.text(`Actions: ${gameState.actionsRecorded}`, 15, 78);
}

export function drawDialogue(p) {
  if (!gameState.activeDialogue) return;
  
  const dialogue = gameState.activeDialogue;
  
  // Dialogue panel
  p.fill(20, 25, 35, 240);
  p.noStroke();
  p.rectMode(p.CORNER);
  p.rect(50, 280, 500, 110, 5);
  
  // Speaker name
  p.fill(100, 200, 255);
  p.textAlign(p.LEFT, p.TOP);
  p.textSize(14);
  p.text(dialogue.speaker, 60, 290);
  
  // Dialogue text
  p.fill(255);
  p.textSize(12);
  p.text(dialogue.text, 60, 310, 480);
  
  // Choices
  if (dialogue.choices && dialogue.choices.length > 0) {
    p.textSize(11);
    for (let i = 0; i < dialogue.choices.length; i++) {
      const y = 340 + i * 20;
      const isSelected = i === dialogue.selectedChoice;
      
      p.fill(isSelected ? [100, 200, 255] : [150, 150, 170]);
      p.text(`${i + 1}. ${dialogue.choices[i].text}`, 70, y);
    }
    
    // Instruction
    p.fill(200);
    p.textAlign(p.RIGHT, p.TOP);
    p.textSize(10);
    p.text("Use ARROW KEYS + Z", 540, 370);
  } else {
    // Continue prompt
    p.fill(255, 255, 100);
    p.textAlign(p.RIGHT, p.TOP);
    p.textSize(10);
    p.text("Press Z to continue", 540, 370);
  }
}

function calculatePersonalityProfile() {
  // Analyze action history
  const actionCounts = {
    analytical: 0,
    emotional: 0,
    reflective: 0,
    balanced: 0
  };
  
  // Count action types
  gameState.actionHistory.forEach(action => {
    if (action.value) {
      if (['analytical', 'methodical', 'practical'].includes(action.value)) {
        actionCounts.analytical++;
      }
      if (['emotional', 'open', 'enthusiastic'].includes(action.value)) {
        actionCounts.emotional++;
      }
      if (['reflective', 'observant', 'understanding'].includes(action.value)) {
        actionCounts.reflective++;
      }
      if (['balanced', 'flexible', 'adaptable'].includes(action.value)) {
        actionCounts.balanced++;
      }
    }
  });
  
  // Calculate percentages
  const total = Math.max(1, actionCounts.analytical + actionCounts.emotional + 
                         actionCounts.reflective + actionCounts.balanced);
  
  const analytical = Math.round((actionCounts.analytical / total) * 100);
  const emotional = Math.round((actionCounts.emotional / total) * 100);
  const reflective = Math.round((actionCounts.reflective / total) * 100);
  const balanced = Math.round((actionCounts.balanced / total) * 100);
  
  // Determine primary type
  let type = "Exploratory";
  const max = Math.max(analytical, emotional, reflective, balanced);
  if (max === analytical) type = "Analytical";
  else if (max === emotional) type = "Emotional";
  else if (max === reflective) type = "Reflective";
  else if (max === balanced) type = "Balanced";
  
  return { type, analytical, emotional, reflective, balanced };
}