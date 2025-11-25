// traveler.js - Traveler and Document generation

import { VALID_CITIES } from './globals.js';

export class Document {
  constructor(type, data) {
    this.type = type; // "passport", "permit"
    this.data = data;
    this.x = 0;
    this.y = 0;
    this.width = 140;
    this.height = 180;
  }
  
  draw(p, offsetX = 0, offsetY = 0) {
    p.push();
    p.translate(this.x + offsetX, this.y + offsetY);
    
    // Document background
    if (this.type === "passport") {
      p.fill(120, 40, 40);
    } else {
      p.fill(200, 190, 170);
    }
    p.stroke(60, 50, 40);
    p.strokeWeight(2);
    p.rect(0, 0, this.width, this.height);
    
    // Header
    p.fill(0);
    p.noStroke();
    p.textAlign(p.CENTER, p.TOP);
    p.textSize(12);
    p.text(this.type.toUpperCase(), this.width / 2, 10);
    
    // Document details
    p.textAlign(p.LEFT, p.TOP);
    p.textSize(9);
    let yPos = 35;
    
    if (this.type === "passport") {
      p.text(`Name: ${this.data.name}`, 10, yPos);
      yPos += 20;
      p.text(`ID: ${this.data.idNumber}`, 10, yPos);
      yPos += 20;
      p.text(`DOB: ${this.data.dob}`, 10, yPos);
      yPos += 20;
      p.text(`City: ${this.data.city}`, 10, yPos);
      yPos += 20;
      p.text(`Exp: ${this.data.expiration}`, 10, yPos);
    } else if (this.type === "permit") {
      p.text(`Name: ${this.data.name}`, 10, yPos);
      yPos += 20;
      p.text(`ID: ${this.data.idNumber}`, 10, yPos);
      yPos += 20;
      p.text(`Purpose: ENTRY`, 10, yPos);
      yPos += 20;
      p.text(`Valid: ${this.data.validUntil}`, 10, yPos);
    }
    
    p.pop();
  }
  
  contains(x, y) {
    return x >= this.x && x <= this.x + this.width &&
           y >= this.y && y <= this.y + this.height;
  }
}

export class Traveler {
  constructor(p, makeInvalid = false) {
    this.name = this.generateName(p);
    this.idNumber = this.generateID(p);
    this.dob = this.generateDate(p, 1950, 1990);
    this.city = this.generateCity(p);
    
    // Create passport
    const passportExpiration = this.generateDate(p, 2024, 2026);
    this.passport = new Document("passport", {
      name: this.name,
      idNumber: this.idNumber,
      dob: this.dob,
      city: this.city,
      expiration: passportExpiration
    });
    
    // Create entry permit (may have discrepancies)
    let permitName = this.name;
    let permitID = this.idNumber;
    let permitValid = this.generateDate(p, 2024, 2025);
    
    if (makeInvalid) {
      const errorType = p.floor(p.random(4));
      if (errorType === 0) {
        // Wrong name
        permitName = this.generateName(p);
      } else if (errorType === 1) {
        // Wrong ID
        permitID = this.generateID(p);
      } else if (errorType === 2) {
        // Expired permit
        permitValid = this.generateDate(p, 2020, 2023);
      } else if (errorType === 3) {
        // Invalid city
        this.passport.data.city = "Kolechia City";
      }
    }
    
    this.permit = new Document("permit", {
      name: permitName,
      idNumber: permitID,
      validUntil: permitValid
    });
    
    this.documents = [this.passport, this.permit];
    this.isValid = !makeInvalid;
    
    // Position documents
    this.passport.x = 50;
    this.passport.y = 150;
    this.permit.x = 220;
    this.permit.y = 150;
  }
  
  generateName(p) {
    const firstNames = ["Ivan", "Dmitri", "Sergei", "Boris", "Alexei", "Mikhail", "Anton", "Viktor"];
    const lastNames = ["Petrov", "Ivanov", "Kowalski", "Volkov", "Sokolov", "Morozov", "Kuznetsov"];
    return `${firstNames[p.floor(p.random(firstNames.length))]} ${lastNames[p.floor(p.random(lastNames.length))]}`;
  }
  
  generateID(p) {
    let id = "";
    for (let i = 0; i < 5; i++) {
      id += p.floor(p.random(10));
    }
    return id;
  }
  
  generateDate(p, yearMin, yearMax) {
    const year = p.floor(p.random(yearMin, yearMax + 1));
    const month = p.floor(p.random(1, 13));
    const day = p.floor(p.random(1, 29));
    return `${year}.${month.toString().padStart(2, '0')}.${day.toString().padStart(2, '0')}`;
  }
  
  generateCity(p) {
    return VALID_CITIES[p.floor(p.random(VALID_CITIES.length))];
  }
  
  draw(p) {
    // Draw booth background
    p.fill(80, 70, 60);
    p.noStroke();
    p.rect(0, 100, CANVAS_WIDTH, 300);
    
    // Draw desk
    p.fill(100, 80, 60);
    p.rect(0, 340, CANVAS_WIDTH, 60);
    
    // Draw traveler silhouette
    p.fill(60, 50, 50);
    p.ellipse(300, 80, 40, 50);
    p.rect(280, 100, 40, 40);
    
    // Draw documents
    for (const doc of this.documents) {
      doc.draw(p);
    }
  }
  
  hasDiscrepancy() {
    // Check for various discrepancies
    if (this.passport.data.name !== this.permit.data.name) return true;
    if (this.passport.data.idNumber !== this.permit.data.idNumber) return true;
    
    // Check expiration dates
    const currentYear = 2024;
    const passportYear = parseInt(this.passport.data.expiration.split('.')[0]);
    const permitYear = parseInt(this.permit.data.validUntil.split('.')[0]);
    
    if (passportYear < currentYear || permitYear < currentYear) return true;
    
    // Check valid city
    if (!VALID_CITIES.includes(this.passport.data.city)) return true;
    
    return false;
  }
}