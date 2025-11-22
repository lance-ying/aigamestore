// player.js - Player entity class

export class Player {
  constructor(x, y) {
    this.x = x;
    this.y = y;
    this.gameX = x;
    this.gameY = y;
    this.width = 30;
    this.height = 30;
  }

  update() {
    // Player is stationary in this game
  }

  render(p) {
    p.push();
    p.fill(100, 150, 255);
    p.stroke(255);
    p.strokeWeight(2);
    p.ellipse(this.x, this.y, this.width, this.height);
    
    // Corporation logo
    p.fill(255);
    p.noStroke();
    p.textAlign(p.CENTER, p.CENTER);
    p.textSize(16);
    p.text("C", this.x, this.y);
    p.pop();
  }

  logState(p) {
    p.logs.player_info.push({
      screen_x: this.x,
      screen_y: this.y,
      game_x: this.gameX,
      game_y: this.gameY,
      framecount: p.frameCount
    });
  }
}