import { gameState, PLAY_SUBSTATES } from './globals.js';

export class Duel {
  constructor(opponentName, difficulty, year, p) {
    this.opponentName = opponentName;
    this.difficulty = difficulty;
    this.year = year;
    this.playerHealth = 100;
    this.opponentHealth = 100;
    this.round = 0;
    this.maxRounds = 5;
    this.result = null;
    this.stances = ['Aggressive', 'Defensive', 'Sneaky'];
    this.lastPlayerStance = null;
    this.lastOpponentStance = null;
    this.roundResult = null;
    this.resultTimer = 0;
    this.p = p;
  }
  
  playRound(playerStance) {
    this.lastPlayerStance = playerStance;
    this.lastOpponentStance = this.getOpponentStance();
    
    const outcome = this.determineOutcome(playerStance, this.lastOpponentStance);
    this.roundResult = outcome;
    this.resultTimer = 60;
    
    if (outcome === 'win') {
      this.opponentHealth -= 20;
    } else if (outcome === 'lose') {
      this.playerHealth -= 20;
    }
    
    this.round++;
    
    if (this.playerHealth <= 0) {
      this.result = 'lose';
      return 'lose';
    } else if (this.opponentHealth <= 0) {
      this.result = 'win';
      return 'win';
    } else if (this.round >= this.maxRounds) {
      if (this.playerHealth > this.opponentHealth) {
        this.result = 'win';
        return 'win';
      } else if (this.playerHealth < this.opponentHealth) {
        this.result = 'lose';
        return 'lose';
      } else {
        this.result = 'tie';
        return 'tie';
      }
    }
    
    return 'continue';
  }
  
  getOpponentStance() {
    if (this.difficulty === 'easy') {
      return this.stances[Math.floor(this.p.random() * 3)];
    } else if (this.difficulty === 'medium') {
      if (this.p.random() < 0.3) {
        return this.stances[Math.floor(this.p.random() * 3)];
      }
      if (this.lastPlayerStance === 'Aggressive') return 'Sneaky';
      if (this.lastPlayerStance === 'Defensive') return 'Aggressive';
      if (this.lastPlayerStance === 'Sneaky') return 'Defensive';
      return this.stances[0];
    } else {
      if (this.p.random() < 0.15) {
        return this.stances[Math.floor(this.p.random() * 3)];
      }
      if (this.lastPlayerStance === 'Aggressive') return 'Sneaky';
      if (this.lastPlayerStance === 'Defensive') return 'Aggressive';
      if (this.lastPlayerStance === 'Sneaky') return 'Defensive';
      return this.stances[0];
    }
  }
  
  determineOutcome(playerStance, opponentStance) {
    if (playerStance === opponentStance) return 'tie';
    if (playerStance === 'Aggressive' && opponentStance === 'Defensive') return 'win';
    if (playerStance === 'Aggressive' && opponentStance === 'Sneaky') return 'lose';
    if (playerStance === 'Defensive' && opponentStance === 'Sneaky') return 'win';
    if (playerStance === 'Defensive' && opponentStance === 'Aggressive') return 'lose';
    if (playerStance === 'Sneaky' && opponentStance === 'Aggressive') return 'win';
    if (playerStance === 'Sneaky' && opponentStance === 'Defensive') return 'lose';
    return 'tie';
  }
  
  update() {
    if (this.resultTimer > 0) {
      this.resultTimer--;
    }
  }
  
  render(p) {
    p.push();
    
    p.fill(0, 0, 0, 220);
    p.rect(0, 0, 600, 400);
    
    p.fill(255);
    p.textSize(24);
    p.textAlign(p.CENTER, p.CENTER);
    p.text(`DUEL: ${this.opponentName}`, 300, 30);
    
    p.textSize(16);
    p.text(`Round ${this.round + 1}/${this.maxRounds}`, 300, 60);
    
    p.fill(100, 200, 100);
    p.rect(50, 100, this.playerHealth * 2, 20);
    p.fill(255);
    p.textSize(14);
    p.textAlign(p.LEFT, p.CENTER);
    p.text(`You: ${this.playerHealth}`, 50, 90);
    
    p.fill(200, 100, 100);
    p.rect(350, 100, this.opponentHealth * 2, 20);
    p.fill(255);
    p.textAlign(p.RIGHT, p.CENTER);
    p.text(`${this.opponentName}: ${this.opponentHealth}`, 550, 90);
    
    const buttonY = 280;
    const buttonWidth = 150;
    const buttonHeight = 40;
    const spacing = 20;
    const startX = 75;
    
    for (let i = 0; i < this.stances.length; i++) {
      const x = startX + i * (buttonWidth + spacing);
      const isSelected = gameState.selectedDuelStance === i;
      
      p.fill(...(isSelected ? [255, 220, 100] : [80, 80, 120]));
      p.rect(x, buttonY, buttonWidth, buttonHeight);
      
      p.fill(255);
      p.textAlign(p.CENTER, p.CENTER);
      p.textSize(14);
      p.text(this.stances[i], x + buttonWidth / 2, buttonY + buttonHeight / 2);
    }
    
    if (this.resultTimer > 0 && this.roundResult) {
      p.fill(255, 255, 255, this.resultTimer * 4);
      p.textSize(32);
      p.textAlign(p.CENTER, p.CENTER);
      let resultText = '';
      if (this.roundResult === 'win') resultText = 'HIT!';
      else if (this.roundResult === 'lose') resultText = 'BLOCKED!';
      else resultText = 'TIE!';
      p.text(resultText, 300, 180);
      
      if (this.lastPlayerStance && this.lastOpponentStance) {
        p.textSize(16);
        p.text(`You: ${this.lastPlayerStance}`, 150, 220);
        p.text(`Opponent: ${this.lastOpponentStance}`, 450, 220);
      }
    }
    
    p.pop();
  }
}

export function createDuelsForYear(year, p) {
  const duels = [];
  
  if (year === 2) {
    duels.push(new Duel("Practice Dummy", "easy", year, p));
  } else if (year === 3) {
    duels.push(new Duel("Rival Student", "medium", year, p));
    duels.push(new Duel("Cursed Portrait", "medium", year, p));
  } else if (year === 4) {
    duels.push(new Duel("Dark Wizard", "hard", year, p));
    duels.push(new Duel("Vault Guardian", "hard", year, p));
    duels.push(new Duel("Cursed Knight", "hard", year, p));
  } else if (year === 5) {
    duels.push(new Duel("Vault Master", "hard", year, p));
    duels.push(new Duel("Final Guardian", "hard", year, p));
  }
  
  return duels;
}