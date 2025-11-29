// vehicle.js - Vehicle creation and control

import Matter from 'https://cdn.jsdelivr.net/npm/matter-js@0.19.0/+esm';
const { Bodies, Body, Constraint, World } = Matter;

import { gameState } from './globals.js';

export function createVehicle(p, x, y) {
  // Chassis
  const chassisWidth = 80;
  const chassisHeight = 30;
  const chassis = Bodies.trapezoid(x, y, chassisWidth, chassisHeight, 0.3, {
    label: 'chassis',
    friction: 0.8,
    restitution: 0.2,
    density: 0.002
  });
  
  // Wheels
  const wheelRadius = 12.5;
  const rearWheel = Bodies.circle(x - 25, y + 20, wheelRadius, {
    label: 'rearWheel',
    friction: 1.5,
    restitution: 0.2,
    density: 0.01
  });
  
  const frontWheel = Bodies.circle(x + 25, y + 20, wheelRadius, {
    label: 'frontWheel',
    friction: 1.5,
    restitution: 0.2,
    density: 0.01
  });
  
  // Driver head
  const driverHead = Bodies.circle(x, y - 20, 7.5, {
    label: 'driverHead',
    friction: 0.5,
    restitution: 0.1,
    density: 0.001
  });
  
  // Add to world
  World.add(gameState.world, [chassis, rearWheel, frontWheel, driverHead]);
  
  // Suspension constraints
  const rearSuspension = Constraint.create({
    bodyA: chassis,
    pointA: { x: -25, y: 15 },
    bodyB: rearWheel,
    stiffness: 0.5,
    damping: 0.1,
    length: 10
  });
  
  const frontSuspension = Constraint.create({
    bodyA: chassis,
    pointA: { x: 25, y: 15 },
    bodyB: frontWheel,
    stiffness: 0.5,
    damping: 0.1,
    length: 10
  });
  
  // Driver constraint
  const driverConstraint = Constraint.create({
    bodyA: chassis,
    pointA: { x: 0, y: -15 },
    bodyB: driverHead,
    stiffness: 0.8,
    damping: 0.5,
    length: 10
  });
  
  World.add(gameState.world, [rearSuspension, frontSuspension, driverConstraint]);
  
  gameState.vehicleBody = chassis;
  gameState.rearWheel = rearWheel;
  gameState.frontWheel = frontWheel;
  gameState.driverHead = driverHead;
  
  return { chassis, rearWheel, frontWheel, driverHead };
}

export function applyGas(torque = 0.002) {
  if (gameState.rearWheel && gameState.fuelLevel > 0) {
    Body.setAngularVelocity(
      gameState.rearWheel,
      gameState.rearWheel.angularVelocity + torque
    );
  }
}

export function applyBrake(force = 0.001) {
  if (gameState.rearWheel && gameState.fuelLevel > 0) {
    Body.setAngularVelocity(
      gameState.rearWheel,
      gameState.rearWheel.angularVelocity - force
    );
  }
}

export function checkCrashConditions(p) {
  if (!gameState.vehicleBody || !gameState.driverHead) return false;
  
  // Check if driver head is below a certain threshold (hit ground)
  if (gameState.driverHead.position.y > 290) {
    return true;
  }
  
  // Check if vehicle is inverted
  const angle = gameState.vehicleBody.angle % (2 * Math.PI);
  const normalizedAngle = angle < 0 ? angle + 2 * Math.PI : angle;
  const isInverted = normalizedAngle > Math.PI / 2 && normalizedAngle < 3 * Math.PI / 2;
  
  if (isInverted) {
    if (gameState.invertedStartTime === null) {
      gameState.invertedStartTime = Date.now();
    } else if (Date.now() - gameState.invertedStartTime > 2000) {
      return true;
    }
  } else {
    gameState.invertedStartTime = null;
  }
  
  return false;
}