// renderer.js - Rendering functions

import { gameState, GAME_PHASES, PLAY_PHASES, ROLES, ROLE_INFO, CANVAS_WIDTH, CANVAS_HEIGHT } from './globals.js';

export function renderGame(p) {
  p.background(20, 15, 30);
  
  const phase = gameState.gamePhase;
  
  if (phase === GAME_PHASES.START) {
    renderStartScreen(p);
  } else if (phase === GAME_PHASES.PLAYING) {
    renderPlayingScreen(p);
  } else if (phase === GAME_PHASES.PAUSED) {
    renderPlayingScreen(p);
    renderPauseOverlay(p);
  } else if (phase === GAME_PHASES.GAME_OVER_WIN || phase === GAME_PHASES.GAME_OVER_LOSE) {
    renderGameOverScreen(p);
  }
}

function renderStartScreen(p) {
  // Background
  p.fill(40, 30, 50);
  p.noStroke();
  p.rect(50, 50, CANVAS_WIDTH - 100, CANVAS_HEIGHT - 100, 10);
  
  // Title
  p.fill(255, 200, 100);
  p.textAlign(p.CENTER);
  p.textSize(36);
  p.text("MIDNIGHT MANOR", CANVAS_WIDTH / 2, 100);
  
  p.textSize(16);
  p.fill(200, 200, 255);
  p.text("A Social Deduction Mystery", CANVAS_WIDTH / 2, 130);
  
  // Instructions
  p.textSize(14);
  p.fill(255);
  p.textAlign(p.LEFT);
  const startX = 100;
  let y = 170;
  
  p.text("OBJECTIVE:", startX, y);
  y += 20;
  p.fill(220);
  p.text("• Town members: Find and eliminate the Killer", startX, y);
  y += 18;
  p.text("• Killer: Eliminate Town members without being caught", startX, y);
  
  y += 30;
  p.fill(255);
  p.text("CONTROLS:", startX, y);
  y += 20;
  p.fill(220);
  p.text("• Arrow Keys: Navigate menus", startX, y);
  y += 18;
  p.text("• Space: Confirm selection / Vote", startX, y);
  y += 18;
  p.text("• Z: View your role card", startX, y);
  y += 18;
  p.text("• Shift: Skip your turn (when applicable)", startX, y);
  
  // Start prompt
  p.fill(255, 255, 100);
  p.textAlign(p.CENTER);
  p.textSize(18);
  const alpha = Math.abs(Math.sin(p.frameCount * 0.05)) * 255;
  p.fill(255, 255, 100, alpha);
  p.text("PRESS ENTER TO START", CANVAS_WIDTH / 2, CANVAS_HEIGHT - 40);
}

function renderPlayingScreen(p) {
  const phase = gameState.playPhase;
  
  // Background gradient
  for (let i = 0; i < CANVAS_HEIGHT; i++) {
    const inter = i / CANVAS_HEIGHT;
    const c1 = p.color(20, 15, 30);
    const c2 = p.color(40, 30, 60);
    const c = p.lerpColor(c1, c2, inter);
    p.stroke(c);
    p.line(0, i, CANVAS_WIDTH, i);
  }
  
  // Header
  renderHeader(p);
  
  // Main game area
  if (phase === PLAY_PHASES.NIGHT) {
    renderNightPhase(p);
  } else if (phase === PLAY_PHASES.NIGHT_RESULT) {
    renderNightResult(p);
  } else if (phase === PLAY_PHASES.DAY_DISCUSSION) {
    renderDayDiscussion(p);
  } else if (phase === PLAY_PHASES.DAY_VOTING) {
    renderDayVoting(p);
  } else if (phase === PLAY_PHASES.TRIAL_DEFENSE) {
    renderTrialDefense(p);
  } else if (phase === PLAY_PHASES.TRIAL_JUDGMENT) {
    renderTrialJudgment(p);
  } else if (phase === PLAY_PHASES.TRIAL_RESULT) {
    renderTrialResult(p);
  }
  
  // Role card overlay
  if (gameState.showRoleCard) {
    renderRoleCard(p);
  }
}

function renderHeader(p) {
  // Top bar
  p.fill(10, 5, 15, 200);
  p.noStroke();
  p.rect(0, 0, CANVAS_WIDTH, 40);
  
  // Day counter
  p.fill(255, 200, 100);
  p.textAlign(p.LEFT);
  p.textSize(16);
  p.text(`Day ${gameState.currentDay}`, 10, 25);
  
  // Score
  p.fill(255);
  p.text(`Score: ${gameState.score}`, 120, 25);
  
  // Alive count
  p.fill(100, 255, 100);
  p.text(`Alive: ${gameState.aliveCount}`, 250, 25);
  
  // Phase indicator
  const phase = gameState.playPhase;
  let phaseText = "";
  let phaseColor = [255, 255, 255];
  
  switch(phase) {
    case PLAY_PHASES.NIGHT:
      phaseText = "NIGHT";
      phaseColor = [100, 100, 200];
      break;
    case PLAY_PHASES.DAY_DISCUSSION:
      phaseText = "DAY - DISCUSSION";
      phaseColor = [255, 200, 100];
      break;
    case PLAY_PHASES.DAY_VOTING:
      phaseText = "DAY - VOTING";
      phaseColor = [255, 150, 100];
      break;
    case PLAY_PHASES.TRIAL_DEFENSE:
    case PLAY_PHASES.TRIAL_JUDGMENT:
      phaseText = "TRIAL";
      phaseColor = [255, 100, 100];
      break;
  }
  
  p.fill(...phaseColor);
  p.textAlign(p.RIGHT);
  p.text(phaseText, CANVAS_WIDTH - 10, 25);
}

function renderNightPhase(p) {
  p.fill(255);
  p.textAlign(p.CENTER);
  p.textSize(20);
  p.text("Night Phase", CANVAS_WIDTH / 2, 70);
  
  // Moon
  p.fill(200, 200, 230);
  p.noStroke();
  p.circle(CANVAS_WIDTH - 80, 100, 50);
  
  // Stars
  p.fill(255);
  for (let i = 0; i < 20; i++) {
    const x = (i * 37) % CANVAS_WIDTH;
    const y = 60 + (i * 23) % 60;
    p.circle(x, y, 2);
  }
  
  // Show players
  renderPlayerGrid(p, 110);
  
  // Night action UI
  if (gameState.player.alive) {
    renderNightActionUI(p);
  } else {
    p.fill(200);
    p.textSize(16);
    p.text("You are dead. Watching from the shadows...", CANVAS_WIDTH / 2, 300);
  }
}

function renderNightActionUI(p) {
  const role = gameState.player.role;
  
  if (role === ROLES.TOWNIE) {
    p.fill(200);
    p.textSize(16);
    p.textAlign(p.CENTER);
    p.text("You have no night action.", CANVAS_WIDTH / 2, 280);
    p.textSize(12);
    p.text("Waiting for others to complete their actions...", CANVAS_WIDTH / 2, 305);
    return;
  }
  
  let actionText = "";
  if (role === ROLES.KILLER) actionText = "Choose someone to eliminate:";
  else if (role === ROLES.DOCTOR) actionText = "Choose someone to protect:";
  else if (role === ROLES.SHERIFF) actionText = "Choose someone to investigate:";
  
  p.fill(255, 200, 100);
  p.textSize(16);
  p.textAlign(p.CENTER);
  p.text(actionText, CANVAS_WIDTH / 2, 260);
  
  // Menu
  const menuX = CANVAS_WIDTH / 2 - 120;
  let menuY = 280;
  
  gameState.menuOptions.forEach((option, i) => {
    const selected = i === gameState.selectedOption;
    
    p.fill(selected ? 60 : 40, 50, selected ? 80 : 60);
    p.stroke(selected ? 255 : 150, selected ? 255 : 150, selected ? 100 : 150);
    p.strokeWeight(selected ? 2 : 1);
    p.rect(menuX, menuY, 240, 25, 5);
    
    p.fill(255);
    p.noStroke();
    p.textAlign(p.LEFT);
    p.textSize(14);
    p.text(option.name, menuX + 10, menuY + 17);
    
    menuY += 30;
  });
  
  // Instructions
  p.fill(200);
  p.textSize(11);
  p.textAlign(p.CENTER);
  p.text("↑↓ to select | SPACE to confirm | SHIFT to skip", CANVAS_WIDTH / 2, CANVAS_HEIGHT - 20);
  
  // Show if action taken
  let targetIndex = -1;
  if (role === ROLES.KILLER) targetIndex = gameState.killerTarget;
  else if (role === ROLES.DOCTOR) targetIndex = gameState.doctorTarget;
  else if (role === ROLES.SHERIFF) targetIndex = gameState.sheriffTarget;
  
  if (targetIndex >= 0) {
    p.fill(100, 255, 100);
    p.textSize(14);
    p.text(`Target selected: ${gameState.players[targetIndex].name}`, CANVAS_WIDTH / 2, CANVAS_HEIGHT - 40);
  }
}

function renderNightResult(p) {
  p.fill(255);
  p.textAlign(p.CENTER);
  p.textSize(20);
  p.text("Night Results", CANVAS_WIDTH / 2, 70);
  
  // Show what happened
  const killerTarget = gameState.killerTarget;
  const doctorTarget = gameState.doctorTarget;
  
  let y = 120;
  
  if (killerTarget === doctorTarget) {
    p.fill(100, 255, 100);
    p.textSize(18);
    p.text("Someone was saved by the Doctor!", CANVAS_WIDTH / 2, y);
  } else if (killerTarget >= 0) {
    const victim = gameState.players[killerTarget];
    p.fill(255, 100, 100);
    p.textSize(18);
    p.text(`${victim.name} was killed during the night!`, CANVAS_WIDTH / 2, y);
  } else {
    p.fill(200);
    p.textSize(18);
    p.text("No one died last night.", CANVAS_WIDTH / 2, y);
  }
  
  // Show players
  renderPlayerGrid(p, 160);
  
  // Show investigation results to Sheriff
  if (gameState.player.role === ROLES.SHERIFF && gameState.player.alive) {
    const lastInvestigation = gameState.investigationResults[gameState.investigationResults.length - 1];
    if (lastInvestigation && lastInvestigation.day === gameState.currentDay) {
      y = 310;
      p.fill(255, 200, 100);
      p.textSize(14);
      p.text("Investigation Result:", CANVAS_WIDTH / 2, y);
      y += 25;
      
      const target = gameState.players[lastInvestigation.target];
      if (lastInvestigation.isKiller) {
        p.fill(255, 100, 100);
        p.text(`${target.name} is SUSPICIOUS!`, CANVAS_WIDTH / 2, y);
      } else {
        p.fill(100, 255, 100);
        p.text(`${target.name} is NOT SUSPICIOUS.`, CANVAS_WIDTH / 2, y);
      }
    }
  }
}

function renderDayDiscussion(p) {
  p.fill(255, 200, 100);
  p.textAlign(p.CENTER);
  p.textSize(20);
  p.text("Day Phase - Discussion", CANVAS_WIDTH / 2, 70);
  
  // Sun
  p.fill(255, 220, 100);
  p.noStroke();
  p.circle(CANVAS_WIDTH - 80, 100, 60);
  p.stroke(255, 220, 100, 100);
  p.strokeWeight(2);
  for (let i = 0; i < 12; i++) {
    const angle = (i / 12) * p.TWO_PI;
    const x1 = CANVAS_WIDTH - 80 + Math.cos(angle) * 35;
    const y1 = 100 + Math.sin(angle) * 35;
    const x2 = CANVAS_WIDTH - 80 + Math.cos(angle) * 45;
    const y2 = 100 + Math.sin(angle) * 45;
    p.line(x1, y1, x2, y2);
  }
  
  // Show players
  renderPlayerGrid(p, 110);
  
  // Discussion text
  p.fill(255);
  p.textSize(14);
  p.text("The Town discusses who might be the Killer...", CANVAS_WIDTH / 2, 280);
  
  // Timer
  const timeLeft = Math.max(0, 240 - gameState.phaseTimer);
  p.fill(200);
  p.textSize(12);
  p.text(`Voting starts in ${Math.ceil(timeLeft / 60)}s`, CANVAS_WIDTH / 2, 310);
}

function renderDayVoting(p) {
  p.fill(255, 150, 100);
  p.textAlign(p.CENTER);
  p.textSize(20);
  p.text("Day Phase - Voting", CANVAS_WIDTH / 2, 70);
  
  // Show players
  renderPlayerGrid(p, 110);
  
  // Voting UI
  if (gameState.player.alive && !gameState.hasVoted) {
    p.fill(255, 200, 100);
    p.textSize(16);
    p.text("Vote to put someone on trial:", CANVAS_WIDTH / 2, 260);
    
    const menuX = CANVAS_WIDTH / 2 - 120;
    let menuY = 280;
    
    gameState.menuOptions.forEach((option, i) => {
      const selected = i === gameState.selectedOption;
      
      p.fill(selected ? 60 : 40, 50, selected ? 80 : 60);
      p.stroke(selected ? 255 : 150, selected ? 255 : 150, selected ? 100 : 150);
      p.strokeWeight(selected ? 2 : 1);
      p.rect(menuX, menuY, 240, 25, 5);
      
      p.fill(255);
      p.noStroke();
      p.textAlign(p.LEFT);
      p.textSize(14);
      p.text(option.name, menuX + 10, menuY + 17);
      
      menuY += 30;
    });
    
    p.fill(200);
    p.textSize(11);
    p.textAlign(p.CENTER);
    p.text("↑↓ to select | SPACE to vote", CANVAS_WIDTH / 2, CANVAS_HEIGHT - 20);
  } else {
    p.fill(200);
    p.textSize(16);
    p.text(gameState.player.alive ? "Vote cast. Waiting for others..." : "Watching from beyond...", 
           CANVAS_WIDTH / 2, 300);
  }
}

function renderTrialDefense(p) {
  p.fill(255, 100, 100);
  p.textAlign(p.CENTER);
  p.textSize(20);
  p.text("Trial - Defense Phase", CANVAS_WIDTH / 2, 70);
  
  // Show accused
  const accused = gameState.players[gameState.onTrial];
  p.fill(255);
  p.textSize(16);
  p.text(`${accused.name} is on trial!`, CANVAS_WIDTH / 2, 110);
  
  // Render accused player large
  accused.render(p, CANVAS_WIDTH / 2, 180, false, 255);
  
  // Defense text
  p.fill(200);
  p.textSize(14);
  p.text(`${accused.name} pleads their case...`, CANVAS_WIDTH / 2, 260);
  
  // Show role if player is accused
  if (gameState.onTrial === gameState.playerIndex) {
    p.fill(255, 200, 100);
    p.textSize(12);
    p.text(`(You are ${ROLE_INFO[accused.role].name})`, CANVAS_WIDTH / 2, 285);
  }
}

function renderTrialJudgment(p) {
  p.fill(255, 100, 100);
  p.textAlign(p.CENTER);
  p.textSize(20);
  p.text("Trial - Judgment Phase", CANVAS_WIDTH / 2, 70);
  
  const accused = gameState.players[gameState.onTrial];
  p.fill(255);
  p.textSize(16);
  p.text(`Vote on ${accused.name}'s fate`, CANVAS_WIDTH / 2, 110);
  
  // Render accused
  accused.render(p, CANVAS_WIDTH / 2, 180, false, 255);
  
  // Voting UI
  if (gameState.player.alive && gameState.playerIndex !== gameState.onTrial && !gameState.hasVoted) {
    const options = ["GUILTY", "INNOCENT", "ABSTAIN"];
    const menuX = CANVAS_WIDTH / 2 - 180;
    const menuY = 260;
    
    options.forEach((option, i) => {
      const selected = i === gameState.selectedOption;
      const x = menuX + i * 120;
      
      p.fill(selected ? 60 : 40, 50, selected ? 80 : 60);
      p.stroke(selected ? 255 : 150, selected ? 255 : 150, selected ? 100 : 150);
      p.strokeWeight(selected ? 2 : 1);
      p.rect(x, menuY, 110, 30, 5);
      
      p.fill(255);
      p.noStroke();
      p.textSize(14);
      p.text(option, x + 55, menuY + 20);
    });
    
    p.fill(200);
    p.textSize(11);
    p.text("← → to select | SPACE to vote", CANVAS_WIDTH / 2, CANVAS_HEIGHT - 20);
  } else {
    // Show current vote counts
    p.fill(200);
    p.textSize(14);
    if (gameState.playerIndex === gameState.onTrial) {
      p.text("You cannot vote on your own trial.", CANVAS_WIDTH / 2, 300);
    } else if (gameState.hasVoted) {
      p.text("Vote cast. Waiting for others...", CANVAS_WIDTH / 2, 300);
    }
    
    // Show vote tally
    p.textSize(12);
    p.fill(255, 100, 100);
    p.text(`Guilty: ${gameState.trialVotes.guilty}`, CANVAS_WIDTH / 2 - 80, 330);
    p.fill(100, 255, 100);
    p.text(`Innocent: ${gameState.trialVotes.innocent}`, CANVAS_WIDTH / 2, 330);
    p.fill(200);
    p.text(`Abstain: ${gameState.trialVotes.abstain}`, CANVAS_WIDTH / 2 + 80, 330);
  }
}

function renderTrialResult(p) {
  p.fill(255, 100, 100);
  p.textAlign(p.CENTER);
  p.textSize(20);
  p.text("Trial Result", CANVAS_WIDTH / 2, 70);
  
  const accused = gameState.players[gameState.onTrial];
  const guilty = gameState.trialVotes.guilty;
  const innocent = gameState.trialVotes.innocent;
  
  // Show result
  let y = 120;
  if (guilty > innocent) {
    p.fill(255, 100, 100);
    p.textSize(18);
    p.text(`${accused.name} was found GUILTY!`, CANVAS_WIDTH / 2, y);
    y += 30;
    p.textSize(14);
    p.text(`They were: ${ROLE_INFO[accused.role].name}`, CANVAS_WIDTH / 2, y);
  } else {
    p.fill(100, 255, 100);
    p.textSize(18);
    p.text(`${accused.name} was found INNOCENT!`, CANVAS_WIDTH / 2, y);
  }
  
  // Render accused
  accused.render(p, CANVAS_WIDTH / 2, 200, false, accused.alive ? 255 : 150);
  
  // Vote tally
  y = 280;
  p.fill(200);
  p.textSize(12);
  p.text(`Guilty: ${guilty} | Innocent: ${innocent} | Abstain: ${gameState.trialVotes.abstain}`, 
         CANVAS_WIDTH / 2, y);
}

function renderPlayerGrid(p, startY) {
  const cols = 4;
  const spacing = 120;
  const offsetX = (CANVAS_WIDTH - (cols - 1) * spacing) / 2;
  
  gameState.players.forEach((player, i) => {
    const col = i % cols;
    const row = Math.floor(i / cols);
    const x = offsetX + col * spacing;
    const y = startY + row * 70;
    
    player.render(p, x, y, false, 255);
  });
}

function renderRoleCard(p) {
  // Semi-transparent overlay
  p.fill(0, 0, 0, 180);
  p.noStroke();
  p.rect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);
  
  // Card background
  p.fill(50, 40, 70);
  p.stroke(255, 200, 100);
  p.strokeWeight(3);
  p.rect(150, 100, 300, 200, 10);
  
  const role = gameState.player.role;
  const info = ROLE_INFO[role];
  
  // Title
  p.fill(255, 200, 100);
  p.noStroke();
  p.textAlign(p.CENTER);
  p.textSize(24);
  p.text(info.name, CANVAS_WIDTH / 2, 140);
  
  // Alignment
  const alignColor = info.alignment === "TOWN" ? [100, 255, 100] : [255, 100, 100];
  p.fill(...alignColor);
  p.textSize(14);
  p.text(info.alignment, CANVAS_WIDTH / 2, 165);
  
  // Description
  p.fill(255);
  p.textSize(13);
  p.text(info.description, CANVAS_WIDTH / 2, 195);
  
  // Ability
  p.fill(200, 200, 255);
  p.textSize(12);
  p.text(`Ability: ${info.ability}`, CANVAS_WIDTH / 2, 225);
  
  // Close instruction
  p.fill(150);
  p.textSize(11);
  p.text("Press Z to close", CANVAS_WIDTH / 2, 270);
}

function renderPauseOverlay(p) {
  p.fill(255);
  p.textAlign(p.RIGHT, p.TOP);
  p.textSize(14);
  p.text("PAUSED", CANVAS_WIDTH - 10, 10);
}

function renderGameOverScreen(p) {
  const isWin = gameState.gamePhase === GAME_PHASES.GAME_OVER_WIN;
  
  // Background
  p.fill(isWin ? 40 : 30, isWin ? 60 : 20, isWin ? 40 : 20);
  p.noStroke();
  p.rect(50, 50, CANVAS_WIDTH - 100, CANVAS_HEIGHT - 100, 10);
  
  // Title
  p.fill(isWin ? 100 : 255, isWin ? 255 : 100, isWin ? 100 : 100);
  p.textAlign(p.CENTER);
  p.textSize(40);
  p.text(isWin ? "TOWN WINS!" : "KILLER WINS!", CANVAS_WIDTH / 2, 130);
  
  // Message
  p.fill(255);
  p.textSize(16);
  if (isWin) {
    p.text("The Killer has been eliminated!", CANVAS_WIDTH / 2, 180);
    p.text("The Town is safe once more.", CANVAS_WIDTH / 2, 205);
  } else {
    p.text("The Killer has overcome the Town.", CANVAS_WIDTH / 2, 180);
    p.text("Darkness falls over Midnight Manor...", CANVAS_WIDTH / 2, 205);
  }
  
  // Score
  p.fill(255, 200, 100);
  p.textSize(24);
  p.text(`Final Score: ${gameState.score}`, CANVAS_WIDTH / 2, 250);
  
  // Restart prompt
  p.fill(200);
  p.textSize(16);
  p.text("PRESS R TO RESTART", CANVAS_WIDTH / 2, CANVAS_HEIGHT - 80);
}