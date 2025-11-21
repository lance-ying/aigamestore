// entities.js - Client, Date, and Venue classes
import { TRAITS } from './globals.js';

export class Client {
  constructor(name, traits, preferences, difficulty = 1) {
    this.name = name;
    this.traits = traits; // Array of 2-3 personality traits
    this.preferences = preferences; // Preferred traits in a date
    this.difficulty = difficulty;
    this.satisfied = false;
    this.color = this.generateColor();
  }
  
  generateColor() {
    const hue = Math.random() * 360;
    return [hue, 70, 80]; // HSB
  }
  
  getCompatibility(date) {
    let matches = 0;
    for (let pref of this.preferences) {
      if (date.traits.includes(pref)) {
        matches++;
      }
    }
    return matches / this.preferences.length;
  }
}

export class DateProfile {
  constructor(name, traits, difficulty = 1) {
    this.name = name;
    this.traits = traits; // Array of 2-3 personality traits
    this.difficulty = difficulty;
    this.color = this.generateColor();
  }
  
  generateColor() {
    const hue = Math.random() * 360;
    return [hue, 70, 80]; // HSB
  }
}

export class Venue {
  constructor(name, unlockCost, ambiance, miniGameTypes) {
    this.name = name;
    this.unlockCost = unlockCost;
    this.ambiance = ambiance;
    this.miniGameTypes = miniGameTypes;
    this.unlocked = false;
  }
}

export class MiniGame {
  constructor(type, duration, options, correctAnswer) {
    this.type = type;
    this.duration = duration; // in frames (e.g., 600 frames = 10 seconds at 60fps)
    this.options = options;
    this.correctAnswer = correctAnswer;
    this.playerAnswer = null;
    this.timeRemaining = duration;
    this.completed = false;
    this.success = false;
  }
  
  update() {
    if (!this.completed) {
      this.timeRemaining--;
      if (this.timeRemaining <= 0) {
        this.completed = true;
        this.success = false;
      }
    }
  }
  
  submitAnswer(answer) {
    if (!this.completed) {
      this.playerAnswer = answer;
      this.completed = true;
      this.success = (answer === this.correctAnswer);
    }
  }
}