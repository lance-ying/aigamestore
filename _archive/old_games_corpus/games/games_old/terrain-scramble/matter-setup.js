// matter-setup.js - Matter.js physics engine setup

export function setupMatter() {
  const Matter = window.Matter;
  
  const Engine = Matter.Engine;
  const World = Matter.World;
  const Bodies = Matter.Bodies;
  const Body = Matter.Body;
  const Constraint = Matter.Constraint;
  
  const engine = Engine.create();
  engine.world.gravity.y = 1;
  
  return {
    Matter,
    engine,
    Engine,
    World,
    Bodies,
    Body,
    Constraint
  };
}