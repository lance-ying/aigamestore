import { NODE_TYPES } from './globals.js';

export const PUZZLES = [
  {
    name: "SELF-TEST DIAGNOSTIC",
    description: "Copy input to output",
    gridWidth: 3,
    gridHeight: 2,
    nodeLayout: [
      [NODE_TYPES.INPUT, NODE_TYPES.COMPUTE, NODE_TYPES.OUTPUT],
      [NODE_TYPES.DAMAGED, NODE_TYPES.COMPUTE, NODE_TYPES.DAMAGED]
    ],
    inputs: [1, 2, 3, 4, 5],
    expectedOutputs: [1, 2, 3, 4, 5]
  },
  {
    name: "SIGNAL AMPLIFIER",
    description: "Double each input value",
    gridWidth: 3,
    gridHeight: 2,
    nodeLayout: [
      [NODE_TYPES.INPUT, NODE_TYPES.COMPUTE, NODE_TYPES.OUTPUT],
      [NODE_TYPES.DAMAGED, NODE_TYPES.COMPUTE, NODE_TYPES.DAMAGED]
    ],
    inputs: [1, 2, 3, 4, 5],
    expectedOutputs: [2, 4, 6, 8, 10]
  },
  {
    name: "DIFFERENTIAL CONVERTER",
    description: "Output difference between consecutive inputs",
    gridWidth: 3,
    gridHeight: 3,
    nodeLayout: [
      [NODE_TYPES.INPUT, NODE_TYPES.COMPUTE, NODE_TYPES.OUTPUT],
      [NODE_TYPES.DAMAGED, NODE_TYPES.COMPUTE, NODE_TYPES.DAMAGED],
      [NODE_TYPES.DAMAGED, NODE_TYPES.COMPUTE, NODE_TYPES.DAMAGED]
    ],
    inputs: [5, 8, 3, 7, 2, 9],
    expectedOutputs: [3, -5, 4, -5, 7]
  },
  {
    name: "SIGNAL COMPARATOR",
    description: "Output 1 if input > 5, else 0",
    gridWidth: 3,
    gridHeight: 2,
    nodeLayout: [
      [NODE_TYPES.INPUT, NODE_TYPES.COMPUTE, NODE_TYPES.OUTPUT],
      [NODE_TYPES.DAMAGED, NODE_TYPES.COMPUTE, NODE_TYPES.DAMAGED]
    ],
    inputs: [3, 7, 2, 8, 6, 1, 9],
    expectedOutputs: [0, 1, 0, 1, 1, 0, 1]
  }
];