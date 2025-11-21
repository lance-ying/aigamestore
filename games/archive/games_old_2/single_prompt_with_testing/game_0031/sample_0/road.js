// road.js - Road rendering
export class Road {
  constructor(p) {
    this.p = p;
  }

  draw(p) {
    // Main road - horizontal
    p.fill(60, 60, 70);
    p.noStroke();
    p.rect(0, 120, 600, 60);
    p.rect(0, 270, 600, 60);

    // Road markings - dashed lines
    p.stroke(255, 255, 150);
    p.strokeWeight(2);
    p.drawingContext.setLineDash([10, 10]);
    p.line(0, 150, 600, 150);
    p.line(0, 300, 600, 300);
    p.drawingContext.setLineDash([]);

    // Vertical connectors
    p.fill(60, 60, 70);
    p.noStroke();
    p.rect(70, 120, 60, 210);
    p.rect(470, 120, 60, 210);

    // Side lanes
    p.stroke(255, 255, 150);
    p.strokeWeight(2);
    p.drawingContext.setLineDash([10, 10]);
    p.line(100, 120, 100, 330);
    p.line(500, 120, 500, 330);
    p.drawingContext.setLineDash([]);
  }
}