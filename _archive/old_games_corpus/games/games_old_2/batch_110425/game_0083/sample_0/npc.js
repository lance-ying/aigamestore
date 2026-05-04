// npc.js - NPC character class

import { gameState } from './globals.js';

export class NPC {
  constructor(x, y, name, dialogueTree, personalityType) {
    this.x = x;
    this.y = y;
    this.width = 28;
    this.height = 28;
    this.name = name;
    this.dialogueTree = dialogueTree;
    this.personalityType = personalityType; // emotion, logic, memory, balanced
    this.color = this.getColorForType(personalityType);
    this.interactionCount = 0;
    this.hasInteracted = false;
    
    // Animation
    this.bobPhase = Math.random() * Math.PI * 2;
    this.idleAnimation = 0;
  }
  
  getColorForType(type) {
    switch(type) {
      case 'emotion': return [255, 100, 120];
      case 'logic': return [100, 255, 150];
      case 'memory': return [200, 150, 255];
      case 'balanced': return [255, 200, 100];
      default: return [200, 200, 200];
    }
  }
  
  update(p) {
    this.bobPhase += 0.05;
    this.idleAnimation = Math.sin(this.bobPhase) * 2;
  }
  
  draw(p) {
    p.push();
    p.translate(this.x, this.y + this.idleAnimation);
    
    // Shadow
    p.noStroke();
    p.fill(0, 0, 0, 50);
    p.ellipse(0, 20, this.width * 0.8, 8);
    
    // Body
    p.fill(...this.color);
    p.stroke(this.color[0] * 0.7, this.color[1] * 0.7, this.color[2] * 0.7);
    p.strokeWeight(2);
    p.rectMode(p.CENTER);
    p.rect(0, 0, this.width, this.height, 6);
    
    // Face indicators
    p.fill(255);
    p.noStroke();
    p.circle(-6, -4, 6);
    p.circle(6, -4, 6);
    
    // Antenna
    p.stroke(this.color[0] * 0.7, this.color[1] * 0.7, this.color[2] * 0.7);
    p.strokeWeight(2);
    p.line(0, -this.height/2, 0, -this.height/2 - 8);
    p.fill(...this.color);
    p.noStroke();
    p.circle(0, -this.height/2 - 8, 6);
    
    // Interaction indicator
    if (this.canInteract()) {
      p.fill(255, 255, 100);
      p.noStroke();
      p.textAlign(p.CENTER, p.CENTER);
      p.textSize(12);
      p.text("!", 0, -this.height - 10);
    }
    
    // Name tag
    p.fill(255);
    p.textAlign(p.CENTER, p.CENTER);
    p.textSize(10);
    p.text(this.name, 0, this.height/2 + 16);
    
    p.pop();
  }
  
  canInteract() {
    if (!gameState.player) return false;
    const dist = Math.hypot(this.x - gameState.player.x, this.y - gameState.player.y);
    return dist < 50;
  }
  
  interact(p) {
    this.interactionCount++;
    this.hasInteracted = true;
    
    // Return dialogue options based on interaction count
    const dialogueIndex = Math.min(this.interactionCount - 1, this.dialogueTree.length - 1);
    return this.dialogueTree[dialogueIndex];
  }
  
  getBounds() {
    return {
      x: this.x - this.width / 2,
      y: this.y - this.height / 2,
      width: this.width,
      height: this.height
    };
  }
}

// Dialogue tree structures for NPCs
export const DIALOGUE_TREES = {
  LOGIC_UNIT: [
    {
      text: "Greetings. I process data and find patterns. What brings you here?",
      choices: [
        { text: "I'm searching for myself.", value: "analytical" },
        { text: "Just exploring.", value: "curious" },
        { text: "I need help with something.", value: "practical" }
      ]
    },
    {
      text: "Interesting. Have you considered the logical implications of your choices?",
      choices: [
        { text: "Yes, I think carefully.", value: "methodical" },
        { text: "I prefer to act on intuition.", value: "intuitive" },
        { text: "Both logic and feeling matter.", value: "balanced" }
      ]
    },
    {
      text: "Your response pattern is being analyzed. Continue exploring.",
      choices: [
        { text: "Thank you.", value: "polite" },
        { text: "Okay.", value: "neutral" }
      ]
    }
  ],
  
  EMOTION_CORE: [
    {
      text: "Hello friend! I sense feelings and understand emotions. How are you today?",
      choices: [
        { text: "I'm feeling curious.", value: "open" },
        { text: "I'm not sure yet.", value: "uncertain" },
        { text: "Ready for adventure!", value: "enthusiastic" }
      ]
    },
    {
      text: "That's wonderful! Do you often follow your heart?",
      choices: [
        { text: "Yes, always!", value: "emotional" },
        { text: "Sometimes, it depends.", value: "flexible" },
        { text: "I prefer logic.", value: "rational" }
      ]
    },
    {
      text: "Your emotional signature is unique. Keep being yourself!",
      choices: [
        { text: "I will, thanks!", value: "confident" },
        { text: "I'll try.", value: "tentative" }
      ]
    }
  ],
  
  MEMORY_KEEPER: [
    {
      text: "Welcome. I store memories and past experiences. Do you reflect on your past?",
      choices: [
        { text: "Often. The past shapes us.", value: "reflective" },
        { text: "I focus on the present.", value: "present-focused" },
        { text: "I look toward the future.", value: "forward-thinking" }
      ]
    },
    {
      text: "Fascinating. How do you learn from experience?",
      choices: [
        { text: "Through careful observation.", value: "observant" },
        { text: "By trying new things.", value: "experimental" },
        { text: "From others' guidance.", value: "collaborative" }
      ]
    },
    {
      text: "Your memories contribute to who you are. Continue your journey.",
      choices: [
        { text: "I understand.", value: "understanding" },
        { text: "Thanks for talking.", value: "appreciative" }
      ]
    }
  ],
  
  BALANCED_SAGE: [
    {
      text: "Ah, a seeker. I embody balance between all aspects. What do you seek?",
      choices: [
        { text: "Understanding myself.", value: "self-aware" },
        { text: "Purpose and meaning.", value: "philosophical" },
        { text: "Just passing through.", value: "casual" }
      ]
    },
    {
      text: "Balance is found in harmony. Do you seek extremes or middle paths?",
      choices: [
        { text: "I embrace extremes.", value: "extreme" },
        { text: "Balance is important.", value: "balanced" },
        { text: "It varies by situation.", value: "adaptable" }
      ]
    },
    {
      text: "Your path becomes clearer with each step. Trust the process.",
      choices: [
        { text: "I will.", value: "trusting" },
        { text: "I hope so.", value: "hopeful" }
      ]
    }
  ]
};