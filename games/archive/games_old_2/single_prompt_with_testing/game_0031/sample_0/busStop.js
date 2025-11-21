// busStop.js - Bus stop entity
import { STOP_RADIUS } from './globals.js';

export class BusStop {
  constructor(p, x, y, name, index) {
    this.p = p;
    this.x = x;
    this.y = y;
    this.name = name;
    this.index = index;
    this.radius = STOP_RADIUS;
    this.visited = false;
    this.waitingPassengers = this.p.floor(this.p.random(3, 8));
  }

  draw(p, isNext) {
    p.push();

    // Stop circle
    if (isNext) {
      p.fill(255, 255, 100, 100);
      p.stroke(255, 255, 100);
    } else if (this.visited) {
      p.fill(100, 255, 100, 80);
      p.stroke(100, 255, 100);
    } else {
      p.fill(255, 255, 255, 80);
      p.stroke(255);
    }
    p.strokeWeight(3);
    p.circle(this.x, this.y, this.radius * 2);

    // Stop sign
    p.fill(255);
    p.noStroke();
    p.rect(this.x - 2, this.y - 30, 4, 25);
    p.fill(100, 150, 255);
    p.stroke(255);
    p.strokeWeight(2);
    p.rect(this.x - 10, this.y - 35, 20, 12, 2);

    // Name label
    p.fill(255);
    p.noStroke();
    p.textAlign(p.CENTER);
    p.textSize(10);
    p.text(this.name, this.x, this.y + this.radius + 15);

    // Waiting passengers indicator
    if (!this.visited && this.waitingPassengers > 0) {
      p.fill(255, 200, 100);
      p.textSize(8);
      p.text(`${this.waitingPassengers} waiting`, this.x, this.y + this.radius + 25);
    }

    p.pop();
  }

  checkArrival(busX, busY) {
    const dist = this.p.dist(busX, busY, this.x, this.y);
    return dist < this.radius;
  }
}