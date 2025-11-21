// trial.js
import { CANVAS_WIDTH } from './globals.js';

export class Statement {
  constructor(text, isLie, correctEvidenceId, speed, yPos) {
    this.text = text;
    this.isLie = isLie;
    this.correctEvidenceId = correctEvidenceId;
    this.x = CANVAS_WIDTH + 100;
    this.y = yPos;
    this.speed = speed;
    this.width = text.length * 8;
    this.height = 30;
    this.hit = false;
    this.highlighted = false;
  }

  update(slowMo) {
    if (this.hit) return;
    
    const actualSpeed = slowMo ? this.speed * 0.3 : this.speed;
    this.x -= actualSpeed;
  }

  draw(p) {
    if (this.hit) return;

    p.push();
    
    // Background box
    if (this.isLie && !this.hit) {
      p.fill(180, 50, 50, 150);
    } else {
      p.fill(50, 50, 80, 150);
    }
    p.stroke(255);
    p.strokeWeight(2);
    p.rect(this.x - this.width / 2, this.y - this.height / 2, this.width, this.height, 5);
    
    // Text
    p.fill(255);
    p.noStroke();
    p.textAlign(p.CENTER, p.CENTER);
    p.textSize(14);
    p.text(this.text, this.x, this.y);
    
    p.pop();
  }

  isOffScreen() {
    return this.x + this.width / 2 < 0;
  }

  checkHit(bullet) {
    if (this.hit || !bullet.active) return false;
    
    return (
      bullet.x > this.x - this.width / 2 &&
      bullet.x < this.x + this.width / 2 &&
      bullet.y > this.y - this.height / 2 &&
      bullet.y < this.y + this.height / 2
    );
  }
}

export function generateStatements(chapter, evidenceList) {
  const statements = [];
  const chapterData = [
    {
      lies: [
        { text: "I was in the library", evidenceId: 0 },
        { text: "No one saw me there", evidenceId: 1 }
      ],
      truths: [
        "The door was locked",
        "It happened at midnight",
        "Everyone heard the noise"
      ]
    },
    {
      lies: [
        { text: "I didn't touch anything", evidenceId: 0 },
        { text: "The weapon was missing", evidenceId: 2 },
        { text: "I have an alibi", evidenceId: 3 }
      ],
      truths: [
        "The lights were off",
        "Security was inactive",
        "No one was around",
        "The window was open"
      ]
    },
    {
      lies: [
        { text: "I never went upstairs", evidenceId: 1 },
        { text: "The clock was broken", evidenceId: 2 },
        { text: "I was with someone", evidenceId: 3 },
        { text: "The evidence is fake", evidenceId: 4 }
      ],
      truths: [
        "The alarm didn't work",
        "Everyone was asleep",
        "The door was open",
        "No cameras were active",
        "It was very dark"
      ]
    }
  ];

  const data = chapterData[chapter - 1];
  const allStatements = [];

  // Add lies
  data.lies.forEach(lie => {
    allStatements.push({
      text: lie.text,
      isLie: true,
      evidenceId: lie.evidenceId
    });
  });

  // Add truths
  data.truths.forEach(truth => {
    allStatements.push({
      text: truth,
      isLie: false,
      evidenceId: -1
    });
  });

  // Shuffle and create statement objects
  const shuffled = allStatements.sort(() => Math.random() - 0.5);
  const baseSpeed = 1.5 + (chapter - 1) * 0.5;
  
  shuffled.forEach((stmt, i) => {
    const yPos = 150 + (i % 3) * 80;
    const speed = baseSpeed + Math.random() * 0.5;
    statements.push(new Statement(stmt.text, stmt.isLie, stmt.evidenceId, speed, yPos));
  });

  return statements;
}