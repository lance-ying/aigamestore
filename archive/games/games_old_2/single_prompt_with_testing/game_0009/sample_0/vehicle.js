// vehicle.js - Vehicle entity and behavior

import {
  VEHICLE_LENGTH,
  VEHICLE_WIDTH,
  VEHICLE_MAX_SPEED,
  VEHICLE_MIN_SPEED,
  VEHICLE_ACCEL,
  VEHICLE_DECEL,
  SAFE_DISTANCE,
  gameState
} from './globals.js';

export class Vehicle {
  constructor(entryPoint, exitPoint, path) {
    this.x = entryPoint.x;
    this.y = entryPoint.y;
    this.entryPoint = entryPoint;
    this.exitPoint = exitPoint;
    this.path = path; // Array of road segments to follow
    
    this.speed = VEHICLE_MIN_SPEED;
    this.targetSpeed = VEHICLE_MAX_SPEED;
    this.angle = 0;
    
    this.currentSegmentIndex = 0;
    this.segmentProgress = 0;
    
    this.color = this.randomColor();
    this.stuck = false;
    this.stuckTimer = 0;
    this.completed = false;
    this.active = true;
  }
  
  randomColor() {
    const colors = [
      [255, 80, 80],
      [80, 150, 255],
      [100, 255, 100],
      [255, 200, 80],
      [255, 100, 255],
      [150, 150, 255]
    ];
    return colors[Math.floor(Math.random() * colors.length)];
  }
  
  update(p) {
    if (this.completed || !this.active) return;
    
    // Check if reached destination
    const distToExit = Math.sqrt(
      (this.x - this.exitPoint.x) ** 2 +
      (this.y - this.exitPoint.y) ** 2
    );
    
    if (distToExit < 15) {
      this.completed = true;
      this.active = false;
      gameState.completedVehicles++;
      return;
    }
    
    // Check if path exists
    if (!this.path || this.path.length === 0) {
      this.stuck = true;
      this.stuckTimer++;
      return;
    }
    
    // Get current segment
    if (this.currentSegmentIndex >= this.path.length) {
      // Try to reach exit directly
      const dx = this.exitPoint.x - this.x;
      const dy = this.exitPoint.y - this.y;
      const dist = Math.sqrt(dx * dx + dy * dy);
      
      if (dist > 0) {
        this.angle = Math.atan2(dy, dx);
        this.x += (dx / dist) * this.speed;
        this.y += (dy / dist) * this.speed;
      }
      return;
    }
    
    const currentPath = this.path[this.currentSegmentIndex];
    const segment = currentPath.segment;
    const forward = currentPath.forward;
    
    // Calculate target position on segment
    const targetX = forward
      ? segment.x1 + (segment.x2 - segment.x1) * this.segmentProgress
      : segment.x2 - (segment.x2 - segment.x1) * this.segmentProgress;
    const targetY = forward
      ? segment.y1 + (segment.y2 - segment.y1) * this.segmentProgress
      : segment.y2 - (segment.y2 - segment.y1) * this.segmentProgress;
    
    // Update angle
    const dx = targetX - this.x;
    const dy = targetY - this.y;
    this.angle = Math.atan2(dy, dx);
    
    // Check for vehicles ahead
    const vehicleAhead = this.checkVehicleAhead();
    
    if (vehicleAhead && vehicleAhead.distance < SAFE_DISTANCE) {
      // Slow down
      this.speed = Math.max(VEHICLE_MIN_SPEED, this.speed - VEHICLE_DECEL);
      this.stuck = true;
      this.stuckTimer++;
    } else {
      // Speed up
      this.speed = Math.min(this.targetSpeed, this.speed + VEHICLE_ACCEL);
      this.stuck = false;
      this.stuckTimer = 0;
    }
    
    // Move along segment
    const moveDistance = this.speed;
    this.segmentProgress += moveDistance / segment.length;
    
    if (this.segmentProgress >= 1.0) {
      this.segmentProgress = 0;
      this.currentSegmentIndex++;
      
      // Update position to start of next segment
      if (this.currentSegmentIndex < this.path.length) {
        const nextPath = this.path[this.currentSegmentIndex];
        const nextSeg = nextPath.segment;
        if (nextPath.forward) {
          this.x = nextSeg.x1;
          this.y = nextSeg.y1;
        } else {
          this.x = nextSeg.x2;
          this.y = nextSeg.y2;
        }
      }
    } else {
      this.x = targetX;
      this.y = targetY;
    }
  }
  
  checkVehicleAhead() {
    let closestVehicle = null;
    let minDistance = Infinity;
    
    for (const other of gameState.vehicles) {
      if (other === this || !other.active || other.completed) continue;
      
      // Calculate distance
      const dx = other.x - this.x;
      const dy = other.y - this.y;
      const distance = Math.sqrt(dx * dx + dy * dy);
      
      // Check if ahead (roughly in direction of travel)
      const angleToOther = Math.atan2(dy, dx);
      const angleDiff = Math.abs(angleToOther - this.angle);
      
      if (distance < minDistance && angleDiff < Math.PI / 3) {
        minDistance = distance;
        closestVehicle = { vehicle: other, distance };
      }
    }
    
    return closestVehicle;
  }
  
  draw(p) {
    if (!this.active) return;
    
    p.push();
    p.translate(this.x, this.y);
    p.rotate(this.angle);
    
    // Draw vehicle body
    p.fill(...(this.stuck ? [200, 50, 50] : this.color));
    p.stroke(40);
    p.strokeWeight(1);
    p.rectMode(p.CENTER);
    p.rect(0, 0, VEHICLE_LENGTH, VEHICLE_WIDTH, 2);
    
    // Draw windshield
    p.fill(100, 150, 200);
    p.noStroke();
    p.rect(VEHICLE_LENGTH / 4, 0, VEHICLE_LENGTH / 3, VEHICLE_WIDTH - 2);
    
    p.pop();
  }
}