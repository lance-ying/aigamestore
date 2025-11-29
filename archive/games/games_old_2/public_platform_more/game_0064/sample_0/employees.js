// employees.js - Employee management system

import { gameState } from './globals.js';
import { addMessage } from './products.js';

export class Employee {
  constructor(id, name, stockingSkill, registerSkill, salary) {
    this.id = id;
    this.name = name;
    this.stockingSkill = stockingSkill;
    this.registerSkill = registerSkill;
    this.salary = salary;
    this.assignment = "idle"; // "idle", "stocking", "register"
    this.efficiency = 1.0;
  }
}

const FIRST_NAMES = ["Alex", "Jordan", "Sam", "Casey", "Taylor", "Morgan", "Riley", "Avery", "Quinn", "Reese", "Jamie", "Dakota", "Skyler", "Sage", "River"];
const LAST_NAMES = ["Smith", "Johnson", "Brown", "Davis", "Wilson", "Moore", "Taylor", "Anderson", "Thomas", "Lee", "White", "Harris", "Clark", "Lewis", "Walker"];

export function generateEmployee(id, p) {
  const firstName = p.random(FIRST_NAMES);
  const lastName = p.random(LAST_NAMES);
  const name = `${firstName} ${lastName.charAt(0)}.`;
  
  const stockingSkill = Math.floor(p.random(3, 9));
  const registerSkill = Math.floor(p.random(3, 9));
  const salary = 5 + Math.floor((stockingSkill + registerSkill) / 2);
  
  return new Employee(id, name, stockingSkill, registerSkill, salary);
}

export function hireEmployee(p) {
  if (gameState.employees.length >= gameState.maxEmployees) {
    addMessage("Max employees reached!");
    return false;
  }
  
  const hireCost = 50 + gameState.employees.length * 20;
  if (gameState.money < hireCost) {
    addMessage("Not enough money to hire!");
    return false;
  }
  
  const employee = generateEmployee(gameState.employees.length, p);
  gameState.employees.push(employee);
  gameState.money -= hireCost;
  addMessage(`Hired ${employee.name}!`);
  return true;
}

export function assignEmployee(employee, task) {
  if (["idle", "stocking", "register"].includes(task)) {
    employee.assignment = task;
    addMessage(`${employee.name} assigned to ${task}`);
  }
}

export function updateEmployees(deltaTime) {
  gameState.employees.forEach(employee => {
    if (employee.assignment === "stocking") {
      // Employees restock shelves automatically
      const emptyShelf = gameState.shelves.find(s => s.stock < s.capacity * 0.5);
      if (emptyShelf && gameState.inventory.length > 0) {
        const restockAmount = Math.min(1, emptyShelf.capacity - emptyShelf.stock);
        emptyShelf.stock += restockAmount * (employee.stockingSkill / 10);
      }
    }
  });
}

export function calculateEmployeeCosts() {
  return gameState.employees.reduce((sum, emp) => sum + emp.salary, 0);
}