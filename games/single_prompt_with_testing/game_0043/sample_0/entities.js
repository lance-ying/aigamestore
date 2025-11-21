// entities.js - Game entities and data structures

export class City {
  constructor(name, x, y) {
    this.name = name;
    this.x = x;
    this.y = y;
  }
}

export class Route {
  constructor(city1, city2, color, length, x1, y1, x2, y2) {
    this.city1 = city1;
    this.city2 = city2;
    this.color = color; // train color needed
    this.length = length; // number of segments
    this.x1 = x1;
    this.y1 = y1;
    this.x2 = x2;
    this.y2 = y2;
    this.claimed = false;
    this.claimedBy = null;
  }
  
  getPoints() {
    const pointsMap = {1: 1, 2: 2, 3: 4, 4: 7, 5: 10, 6: 15};
    return pointsMap[this.length] || 0;
  }
}

export class DestinationTicket {
  constructor(city1, city2, points) {
    this.city1 = city1;
    this.city2 = city2;
    this.points = points;
    this.completed = false;
  }
}

export class Player {
  constructor() {
    this.hand = [];
    this.destinations = [];
    this.claimedRoutes = [];
    this.trainsRemaining = 45;
    this.score = 0;
  }
}