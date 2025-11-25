import { INSTRUCTIONS, NODE_TYPES } from './globals.js';

export class Node {
  constructor(x, y, type, id) {
    this.x = x;
    this.y = y;
    this.type = type;
    this.id = id;
    this.width = 80;
    this.height = 80;
    
    // Registers
    this.acc = 0; // Accumulator
    this.bak = 0; // Backup register
    
    // Instructions
    this.instructions = [];
    this.maxInstructions = 15;
    this.pc = 0; // Program counter
    
    // Communication
    this.readPort = null;
    this.writePort = null;
    this.blocked = false;
    
    // Neighbors
    this.neighbors = {
      UP: null,
      DOWN: null,
      LEFT: null,
      RIGHT: null
    };
    
    // For INPUT/OUTPUT nodes
    this.value = null;
    this.hasValue = false;
  }
  
  addInstruction(instruction) {
    if (this.instructions.length < this.maxInstructions) {
      this.instructions.push(instruction);
      return true;
    }
    return false;
  }
  
  removeInstruction(index) {
    if (index >= 0 && index < this.instructions.length) {
      this.instructions.splice(index, 1);
      return true;
    }
    return false;
  }
  
  clearInstructions() {
    this.instructions = [];
    this.pc = 0;
  }
  
  reset() {
    this.acc = 0;
    this.bak = 0;
    this.pc = 0;
    this.blocked = false;
    this.readPort = null;
    this.writePort = null;
    this.value = null;
    this.hasValue = false;
  }
  
  step() {
    if (this.type === NODE_TYPES.DAMAGED) return;
    if (this.type === NODE_TYPES.INPUT || this.type === NODE_TYPES.OUTPUT) return;
    
    if (this.blocked) return;
    
    if (this.pc >= this.instructions.length) {
      this.pc = 0;
    }
    
    if (this.instructions.length === 0) return;
    
    const instruction = this.instructions[this.pc];
    this.executeInstruction(instruction);
  }
  
  executeInstruction(instruction) {
    const parts = instruction.trim().split(/\s+/);
    const op = parts[0].toUpperCase();
    
    switch (op) {
      case INSTRUCTIONS.NOP:
        this.pc++;
        break;
        
      case INSTRUCTIONS.MOV:
        if (parts.length >= 3) {
          const src = parts[1].toUpperCase();
          const dst = parts[2].toUpperCase();
          const value = this.readValue(src);
          if (value !== null) {
            this.writeValue(dst, value);
            this.pc++;
          }
        } else {
          this.pc++;
        }
        break;
        
      case INSTRUCTIONS.ADD:
        if (parts.length >= 2) {
          const src = parts[1].toUpperCase();
          const value = this.readValue(src);
          if (value !== null) {
            this.acc = Math.max(-999, Math.min(999, this.acc + value));
            this.pc++;
          }
        } else {
          this.pc++;
        }
        break;
        
      case INSTRUCTIONS.SUB:
        if (parts.length >= 2) {
          const src = parts[1].toUpperCase();
          const value = this.readValue(src);
          if (value !== null) {
            this.acc = Math.max(-999, Math.min(999, this.acc - value));
            this.pc++;
          }
        } else {
          this.pc++;
        }
        break;
        
      case INSTRUCTIONS.JMP:
        if (parts.length >= 2) {
          const label = parts[1];
          const target = this.findLabel(label);
          if (target !== -1) {
            this.pc = target;
          } else {
            this.pc++;
          }
        } else {
          this.pc++;
        }
        break;
        
      case INSTRUCTIONS.JEZ:
        if (parts.length >= 2) {
          if (this.acc === 0) {
            const label = parts[1];
            const target = this.findLabel(label);
            if (target !== -1) {
              this.pc = target;
            } else {
              this.pc++;
            }
          } else {
            this.pc++;
          }
        } else {
          this.pc++;
        }
        break;
        
      case INSTRUCTIONS.JNZ:
        if (parts.length >= 2) {
          if (this.acc !== 0) {
            const label = parts[1];
            const target = this.findLabel(label);
            if (target !== -1) {
              this.pc = target;
            } else {
              this.pc++;
            }
          } else {
            this.pc++;
          }
        } else {
          this.pc++;
        }
        break;
        
      case INSTRUCTIONS.JGZ:
        if (parts.length >= 2) {
          if (this.acc > 0) {
            const label = parts[1];
            const target = this.findLabel(label);
            if (target !== -1) {
              this.pc = target;
            } else {
              this.pc++;
            }
          } else {
            this.pc++;
          }
        } else {
          this.pc++;
        }
        break;
        
      case INSTRUCTIONS.JLZ:
        if (parts.length >= 2) {
          if (this.acc < 0) {
            const label = parts[1];
            const target = this.findLabel(label);
            if (target !== -1) {
              this.pc = target;
            } else {
              this.pc++;
            }
          } else {
            this.pc++;
          }
        } else {
          this.pc++;
        }
        break;
        
      case INSTRUCTIONS.SAV:
        this.bak = this.acc;
        this.pc++;
        break;
        
      case INSTRUCTIONS.SWP:
        const temp = this.acc;
        this.acc = this.bak;
        this.bak = temp;
        this.pc++;
        break;
        
      default:
        // Check if it's a label (ends with :)
        if (instruction.trim().endsWith(':')) {
          this.pc++;
        } else {
          this.pc++;
        }
        break;
    }
  }
  
  readValue(src) {
    if (src === 'ACC') {
      return this.acc;
    } else if (src === 'NIL') {
      return 0;
    } else if (['UP', 'DOWN', 'LEFT', 'RIGHT'].includes(src)) {
      return this.readFromPort(src);
    } else if (!isNaN(parseInt(src))) {
      return parseInt(src);
    }
    return null;
  }
  
  writeValue(dst, value) {
    if (dst === 'ACC') {
      this.acc = value;
    } else if (['UP', 'DOWN', 'LEFT', 'RIGHT'].includes(dst)) {
      this.writeToPort(dst, value);
    } else if (dst === 'NIL') {
      // Do nothing
    }
  }
  
  readFromPort(port) {
    const neighbor = this.neighbors[port];
    if (!neighbor) return null;
    
    if (neighbor.type === NODE_TYPES.INPUT) {
      if (neighbor.hasValue) {
        const val = neighbor.value;
        neighbor.hasValue = false;
        return val;
      }
      this.blocked = true;
      return null;
    }
    
    if (neighbor.writePort === this.getOppositePort(port) && neighbor.readPort !== null) {
      const val = neighbor.readPort;
      neighbor.readPort = null;
      neighbor.blocked = false;
      return val;
    }
    
    this.blocked = true;
    return null;
  }
  
  writeToPort(port, value) {
    const neighbor = this.neighbors[port];
    if (!neighbor) return;
    
    if (neighbor.type === NODE_TYPES.OUTPUT) {
      if (!neighbor.hasValue) {
        neighbor.value = value;
        neighbor.hasValue = true;
      } else {
        this.blocked = true;
      }
      return;
    }
    
    this.readPort = value;
    this.writePort = port;
    this.blocked = true;
  }
  
  getOppositePort(port) {
    const opposites = {
      UP: 'DOWN',
      DOWN: 'UP',
      LEFT: 'RIGHT',
      RIGHT: 'LEFT'
    };
    return opposites[port];
  }
  
  findLabel(label) {
    for (let i = 0; i < this.instructions.length; i++) {
      const inst = this.instructions[i].trim();
      if (inst.toUpperCase() === label.toUpperCase() + ':' || inst === label + ':') {
        return i + 1; // Execute instruction after label
      }
    }
    return -1;
  }
}