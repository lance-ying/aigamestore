// shapes.js - Target shape generation and validation
import { CANVAS_WIDTH, CANVAS_HEIGHT, gameState } from './globals.js';

export class TargetShape {
  constructor(p, complexity) {
    this.p = p;
    this.complexity = complexity;
    this.points = [];
    this.generateShape();
  }

  generateShape() {
    const p = this.p;
    const centerX = CANVAS_WIDTH / 2;
    const centerY = CANVAS_HEIGHT / 2;
    const baseRadius = 50;

    switch (this.complexity) {
      case 'simple':
        // Circle
        for (let i = 0; i <= 20; i++) {
          const angle = (i / 20) * p.TWO_PI;
          this.points.push({
            x: centerX + p.cos(angle) * baseRadius,
            y: centerY + p.sin(angle) * baseRadius
          });
        }
        break;

      case 'medium':
        // Heart shape
        for (let i = 0; i <= 30; i++) {
          const t = (i / 30) * p.TWO_PI;
          const x = 16 * p.pow(p.sin(t), 3);
          const y = -(13 * p.cos(t) - 5 * p.cos(2 * t) - 2 * p.cos(3 * t) - p.cos(4 * t));
          this.points.push({
            x: centerX + x * 2.5,
            y: centerY + y * 2.5
          });
        }
        break;

      case 'complex':
        // Star shape
        const points = 5;
        const outerRadius = 60;
        const innerRadius = 25;
        for (let i = 0; i <= points * 2; i++) {
          const angle = (i / (points * 2)) * p.TWO_PI - p.HALF_PI;
          const radius = i % 2 === 0 ? outerRadius : innerRadius;
          this.points.push({
            x: centerX + p.cos(angle) * radius,
            y: centerY + p.sin(angle) * radius
          });
        }
        break;

      case 'veryComplex':
        // Figure-eight
        for (let i = 0; i <= 40; i++) {
          const t = (i / 40) * p.TWO_PI;
          const scale = 50;
          this.points.push({
            x: centerX + p.sin(t) * scale,
            y: centerY + p.sin(t) * p.cos(t) * scale
          });
        }
        break;

      case 'master':
        // Complex spiral
        for (let i = 0; i <= 50; i++) {
          const t = (i / 50) * p.TWO_PI * 2;
          const radius = 20 + (i / 50) * 40;
          this.points.push({
            x: centerX + p.cos(t) * radius,
            y: centerY + p.sin(t) * radius
          });
        }
        break;
    }
  }

  draw(alpha = 100) {
    const p = this.p;
    p.push();
    p.noFill();
    p.stroke(100, 200, 255, alpha);
    p.strokeWeight(3);
    p.beginShape();
    for (const point of this.points) {
      p.vertex(point.x, point.y);
    }
    p.endShape();
    p.pop();
  }

  calculateAccuracy(drawnPath) {
    if (drawnPath.length < 5) return 0;

    let totalDistance = 0;
    let sampleCount = 0;

    // Sample drawn path and find closest target points
    for (let i = 0; i < drawnPath.length; i++) {
      const drawnPoint = drawnPath[i];
      let minDist = Infinity;

      for (const targetPoint of this.points) {
        const dist = this.p.dist(
          drawnPoint.x, drawnPoint.y,
          targetPoint.x, targetPoint.y
        );
        minDist = Math.min(minDist, dist);
      }

      totalDistance += minDist;
      sampleCount++;
    }

    const avgDistance = totalDistance / sampleCount;
    const maxAllowedDist = 30;
    const accuracy = Math.max(0, (1 - avgDistance / maxAllowedDist) * 100);

    return Math.min(100, accuracy);
  }
}