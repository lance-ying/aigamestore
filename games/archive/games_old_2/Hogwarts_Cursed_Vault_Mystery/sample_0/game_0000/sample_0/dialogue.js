import { gameState } from './globals.js';

export class Dialogue {
  constructor(text, choices, year) {
    this.text = text;
    this.choices = choices;
    this.year = year;
    this.active = true;
  }
  
  selectChoice(index, p) {
    if (index >= 0 && index < this.choices.length) {
      const choice = this.choices[index];
      
      if (choice.attributeReq) {
        const attr = gameState[choice.attributeReq.attr];
        if (attr < choice.attributeReq.value) {
          return false;
        }
      }
      
      if (choice.attributeGain) {
        gameState[choice.attributeGain.attr] += choice.attributeGain.value;
      }
      
      if (choice.pointsGain) {
        gameState.housePoints += choice.pointsGain;
        this.showPointPopup(choice.pointsGain, p);
      }
      
      this.active = false;
      return true;
    }
    return false;
  }
  
  showPointPopup(points, p) {
    // Point popup handled in rendering
  }
  
  render(p) {
    if (!this.active) return;
    
    p.push();
    p.fill(0, 0, 0, 200);
    p.rect(50, 280, 500, 100);
    
    p.fill(255);
    p.textSize(14);
    p.textAlign(p.LEFT, p.TOP);
    p.text(this.text, 60, 290, 480);
    
    const startY = 330;
    for (let i = 0; i < this.choices.length; i++) {
      const choice = this.choices[i];
      const isSelected = gameState.selectedDialogueOption === i;
      
      let canSelect = true;
      if (choice.attributeReq) {
        const attr = gameState[choice.attributeReq.attr];
        canSelect = attr >= choice.attributeReq.value;
      }
      
      p.fill(...(isSelected ? [255, 220, 100] : [200, 200, 200]));
      if (!canSelect) p.fill(100, 100, 100);
      
      p.textSize(12);
      let displayText = `${i + 1}. ${choice.text}`;
      if (choice.attributeReq && !canSelect) {
        displayText += ` [Requires ${choice.attributeReq.attr} ${choice.attributeReq.value}+]`;
      }
      p.text(displayText, 70, startY + i * 20);
    }
    p.pop();
  }
}

export function createDialoguesForYear(year, p) {
  const dialogues = [];
  
  if (year === 1) {
    dialogues.push(new Dialogue(
      "Welcome to Hogwarts! How are you feeling?",
      [
        { text: "Excited and ready!", attributeGain: { attr: 'courage', value: 1 }, pointsGain: 5 },
        { text: "A bit nervous...", attributeGain: { attr: 'empathy', value: 1 }, pointsGain: 5 },
        { text: "Curious about everything!", attributeGain: { attr: 'knowledge', value: 1 }, pointsGain: 5 }
      ],
      year
    ));
  } else if (year === 2) {
    dialogues.push(new Dialogue(
      "You've heard rumors about the Cursed Vaults. What do you think?",
      [
        { text: "We should investigate!", attributeGain: { attr: 'courage', value: 1 }, pointsGain: 5 },
        { text: "We should be careful.", attributeGain: { attr: 'empathy', value: 1 }, pointsGain: 5 }
      ],
      year
    ));
  } else if (year === 3) {
    dialogues.push(new Dialogue(
      "The mystery deepens. A friend needs help with a difficult choice.",
      [
        { text: "Help them bravely", attributeReq: { attr: 'courage', value: 5 }, attributeGain: { attr: 'courage', value: 1 }, pointsGain: 10 },
        { text: "Offer emotional support", attributeGain: { attr: 'empathy', value: 1 }, pointsGain: 5 },
        { text: "Research the problem", attributeGain: { attr: 'knowledge', value: 1 }, pointsGain: 5 }
      ],
      year
    ));
  } else if (year === 4) {
    dialogues.push(new Dialogue(
      "You're close to finding a Cursed Vault. How do you proceed?",
      [
        { text: "Charge ahead!", attributeReq: { attr: 'courage', value: 8 }, attributeGain: { attr: 'courage', value: 2 }, pointsGain: 15 },
        { text: "Plan carefully", attributeReq: { attr: 'knowledge', value: 8 }, attributeGain: { attr: 'knowledge', value: 2 }, pointsGain: 15 },
        { text: "Consider everyone's safety", attributeGain: { attr: 'empathy', value: 1 }, pointsGain: 5 }
      ],
      year
    ));
  } else if (year === 5) {
    dialogues.push(new Dialogue(
      "The final vault awaits. This is your moment.",
      [
        { text: "Face it with courage!", attributeReq: { attr: 'courage', value: 12 }, attributeGain: { attr: 'courage', value: 2 }, pointsGain: 20 },
        { text: "Use all your knowledge!", attributeReq: { attr: 'knowledge', value: 12 }, attributeGain: { attr: 'knowledge', value: 2 }, pointsGain: 20 },
        { text: "Protect everyone!", attributeReq: { attr: 'empathy', value: 12 }, attributeGain: { attr: 'empathy', value: 2 }, pointsGain: 20 }
      ],
      year
    ));
  }
  
  return dialogues;
}