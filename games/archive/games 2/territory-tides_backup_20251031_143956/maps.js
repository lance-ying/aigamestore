export const mapData = {
  1: {
    name: "The First Stand",
    territories: [
      { id: 0, name: "North Vale", coords: [[150, 85], [250, 85], [250, 155], [150, 155]], adjacentIds: [1, 3], ownerId: 0, armies: 5 },
      { id: 1, name: "East Ridge", coords: [[250, 85], [350, 85], [350, 155], [250, 155]], adjacentIds: [0, 2, 4], ownerId: 0, armies: 4 },
      { id: 2, name: "South Peak", coords: [[350, 85], [450, 85], [450, 155], [350, 155]], adjacentIds: [1, 5], ownerId: 0, armies: 3 },
      { id: 3, name: "West Harbor", coords: [[150, 155], [250, 155], [250, 235], [150, 235]], adjacentIds: [0, 4, 6], ownerId: 0, armies: 4 },
      { id: 4, name: "Central Plains", coords: [[250, 155], [350, 155], [350, 235], [250, 235]], adjacentIds: [1, 3, 5, 7], ownerId: 0, armies: 6 },
      { id: 5, name: "East Coast", coords: [[350, 155], [450, 155], [450, 235], [350, 235]], adjacentIds: [2, 4, 8], ownerId: 1, armies: 3 },
      { id: 6, name: "Southwest Bay", coords: [[150, 235], [250, 235], [250, 315], [150, 315]], adjacentIds: [3, 7], ownerId: 0, armies: 3 },
      { id: 7, name: "South Valley", coords: [[250, 235], [350, 235], [350, 315], [250, 315]], adjacentIds: [4, 6, 8], ownerId: 1, armies: 4 },
      { id: 8, name: "Southeast Point", coords: [[350, 235], [450, 235], [450, 315], [350, 315]], adjacentIds: [5, 7], ownerId: 1, armies: 5 }
    ],
    continents: [
      { id: 0, name: "Northern Lands", territoryIds: [0, 1, 2], bonusArmies: 2 },
      { id: 1, name: "Southern Seas", territoryIds: [6, 7, 8], bonusArmies: 2 }
    ],
    playerStarts: [
      { playerId: 0, territoryIds: [0, 1, 2, 3, 4, 6] },
      { playerId: 1, territoryIds: [5, 7, 8] }
    ]
  },
  2: {
    name: "Continental Clash",
    territories: [
      { id: 0, name: "Iceland", coords: [[95, 85], [145, 85], [145, 125], [95, 125]], adjacentIds: [1, 5], ownerId: 0, armies: 3 },
      { id: 1, name: "Scandinavia", coords: [[145, 85], [225, 85], [225, 135], [145, 135]], adjacentIds: [0, 2, 6], ownerId: 0, armies: 4 },
      { id: 2, name: "Moscow", coords: [[225, 85], [305, 85], [305, 135], [225, 135]], adjacentIds: [1, 3, 7], ownerId: 1, armies: 5 },
      { id: 3, name: "Ural", coords: [[305, 85], [385, 85], [385, 135], [305, 135]], adjacentIds: [2, 4, 8], ownerId: 1, armies: 4 },
      { id: 4, name: "Siberia", coords: [[385, 85], [465, 85], [465, 135], [385, 135]], adjacentIds: [3, 9], ownerId: 1, armies: 3 },
      { id: 5, name: "Britain", coords: [[95, 135], [175, 135], [175, 195], [95, 195]], adjacentIds: [0, 6, 10], ownerId: 0, armies: 4 },
      { id: 6, name: "Northern Europe", coords: [[175, 135], [265, 135], [265, 195], [175, 195]], adjacentIds: [1, 5, 7, 11], ownerId: 0, armies: 5 },
      { id: 7, name: "Ukraine", coords: [[265, 135], [345, 135], [345, 195], [265, 195]], adjacentIds: [2, 6, 8, 12], ownerId: 1, armies: 4 },
      { id: 8, name: "Afghanistan", coords: [[345, 135], [425, 135], [425, 195], [345, 195]], adjacentIds: [3, 7, 9, 13], ownerId: 2, armies: 4 },
      { id: 9, name: "China", coords: [[425, 135], [505, 135], [505, 195], [425, 195]], adjacentIds: [4, 8, 14], ownerId: 2, armies: 5 },
      { id: 10, name: "Western Europe", coords: [[95, 195], [175, 195], [175, 255], [95, 255]], adjacentIds: [5, 11, 15], ownerId: 0, armies: 3 },
      { id: 11, name: "Southern Europe", coords: [[175, 195], [265, 195], [265, 255], [175, 255]], adjacentIds: [6, 10, 12, 16], ownerId: 0, armies: 4 },
      { id: 12, name: "Middle East", coords: [[265, 195], [345, 195], [345, 255], [265, 255]], adjacentIds: [7, 11, 13, 17], ownerId: 2, armies: 5 },
      { id: 13, name: "India", coords: [[345, 195], [425, 195], [425, 255], [345, 255]], adjacentIds: [8, 12, 14, 18], ownerId: 2, armies: 4 },
      { id: 14, name: "Southeast Asia", coords: [[425, 195], [505, 195], [505, 255], [425, 255]], adjacentIds: [9, 13], ownerId: 2, armies: 3 },
      { id: 15, name: "North Africa", coords: [[95, 255], [195, 255], [195, 315], [95, 315]], adjacentIds: [10, 16], ownerId: 0, armies: 2 },
      { id: 16, name: "Egypt", coords: [[195, 255], [295, 255], [295, 315], [195, 315]], adjacentIds: [11, 15, 17], ownerId: 1, armies: 3 },
      { id: 17, name: "East Africa", coords: [[295, 255], [395, 255], [395, 315], [295, 315]], adjacentIds: [12, 16, 18], ownerId: 1, armies: 4 },
      { id: 18, name: "South Africa", coords: [[395, 255], [495, 255], [495, 315], [395, 315]], adjacentIds: [13, 17], ownerId: 2, armies: 3 }
    ],
    continents: [
      { id: 0, name: "Europe", territoryIds: [0, 1, 2, 5, 6, 7, 10, 11], bonusArmies: 5 },
      { id: 1, name: "Asia", territoryIds: [3, 4, 8, 9, 13, 14], bonusArmies: 7 },
      { id: 2, name: "Africa", territoryIds: [15, 16, 17, 18], bonusArmies: 3 }
    ],
    playerStarts: [
      { playerId: 0, territoryIds: [0, 1, 5, 6, 10, 11, 15] },
      { playerId: 1, territoryIds: [2, 3, 7, 16, 17] },
      { playerId: 2, territoryIds: [4, 8, 9, 12, 13, 14, 18] }
    ]
  },
  3: {
    name: "Global Gauntlet",
    territories: [
      { id: 0, name: "Alaska", coords: [[50, 100], [100, 100], [100, 140], [50, 140]], adjacentIds: [1, 3], ownerId: 0, armies: 3 },
      { id: 1, name: "Northwest Territory", coords: [[100, 100], [150, 100], [150, 140], [100, 140]], adjacentIds: [0, 2, 4], ownerId: 1, armies: 3 },
      { id: 2, name: "Greenland", coords: [[150, 100], [200, 100], [200, 140], [150, 140]], adjacentIds: [1, 5], ownerId: 0, armies: 2 },
      { id: 3, name: "Alberta", coords: [[50, 140], [100, 140], [100, 180], [50, 180]], adjacentIds: [0, 4, 6], ownerId: 1, armies: 4 },
      { id: 4, name: "Ontario", coords: [[100, 140], [150, 140], [150, 180], [100, 180]], adjacentIds: [1, 3, 5, 7], ownerId: 0, armies: 3 },
      { id: 5, name: "Quebec", coords: [[150, 140], [200, 140], [200, 180], [150, 180]], adjacentIds: [2, 4, 8], ownerId: 2, armies: 3 },
      { id: 6, name: "Western US", coords: [[50, 180], [100, 180], [100, 220], [50, 220]], adjacentIds: [3, 7, 9], ownerId: 1, armies: 4 },
      { id: 7, name: "Eastern US", coords: [[100, 180], [150, 180], [150, 220], [100, 220]], adjacentIds: [4, 6, 8, 10], ownerId: 0, armies: 5 },
      { id: 8, name: "Central America", coords: [[150, 180], [200, 180], [200, 220], [150, 220]], adjacentIds: [5, 7, 11], ownerId: 2, armies: 3 },
      { id: 9, name: "Venezuela", coords: [[50, 220], [100, 220], [100, 260], [50, 260]], adjacentIds: [6, 10, 12], ownerId: 1, armies: 3 },
      { id: 10, name: "Brazil", coords: [[100, 220], [150, 220], [150, 260], [100, 260]], adjacentIds: [7, 9, 11, 13], ownerId: 3, armies: 4 },
      { id: 11, name: "Peru", coords: [[150, 220], [200, 220], [200, 260], [150, 260]], adjacentIds: [8, 10, 14], ownerId: 2, armies: 3 },
      { id: 12, name: "Argentina", coords: [[50, 260], [100, 260], [100, 300], [50, 300]], adjacentIds: [9, 13], ownerId: 3, armies: 2 },
      { id: 13, name: "North Africa", coords: [[100, 260], [150, 260], [150, 300], [100, 300]], adjacentIds: [10, 12, 15, 16], ownerId: 3, armies: 4 },
      { id: 14, name: "Iceland", coords: [[200, 100], [250, 100], [250, 140], [200, 140]], adjacentIds: [11, 15], ownerId: 0, armies: 2 },
      { id: 15, name: "Great Britain", coords: [[200, 140], [250, 140], [250, 180], [200, 180]], adjacentIds: [13, 14, 16, 17], ownerId: 2, armies: 3 },
      { id: 16, name: "Western Europe", coords: [[200, 180], [250, 180], [250, 220], [200, 220]], adjacentIds: [13, 15, 18], ownerId: 3, armies: 3 },
      { id: 17, name: "Scandinavia", coords: [[250, 100], [300, 100], [300, 140], [250, 140]], adjacentIds: [15, 18, 20], ownerId: 1, armies: 3 },
      { id: 18, name: "Northern Europe", coords: [[250, 140], [300, 140], [300, 180], [250, 180]], adjacentIds: [16, 17, 19, 21], ownerId: 2, armies: 4 },
      { id: 19, name: "Southern Europe", coords: [[250, 180], [300, 180], [300, 220], [250, 220]], adjacentIds: [18, 22, 23], ownerId: 3, armies: 3 },
      { id: 20, name: "Ukraine", coords: [[300, 100], [350, 100], [350, 140], [300, 140]], adjacentIds: [17, 21, 24], ownerId: 1, armies: 4 },
      { id: 21, name: "Ural", coords: [[300, 140], [350, 140], [350, 180], [300, 180]], adjacentIds: [18, 20, 24, 25], ownerId: 2, armies: 3 },
      { id: 22, name: "Egypt", coords: [[300, 180], [350, 180], [350, 220], [300, 220]], adjacentIds: [19, 23, 26], ownerId: 3, armies: 3 },
      { id: 23, name: "East Africa", coords: [[300, 220], [350, 220], [350, 260], [300, 260]], adjacentIds: [19, 22, 26, 27], ownerId: 3, armies: 2 },
      { id: 24, name: "Siberia", coords: [[350, 100], [400, 100], [400, 140], [350, 140]], adjacentIds: [20, 21, 28], ownerId: 1, armies: 3 },
      { id: 25, name: "Afghanistan", coords: [[350, 140], [400, 140], [400, 180], [350, 180]], adjacentIds: [21, 26, 28, 29], ownerId: 2, armies: 4 },
      { id: 26, name: "Middle East", coords: [[350, 180], [400, 180], [400, 220], [350, 220]], adjacentIds: [22, 23, 25, 29], ownerId: 3, armies: 4 },
      { id: 27, name: "South Africa", coords: [[350, 220], [400, 220], [400, 260], [350, 260]], adjacentIds: [23, 26], ownerId: 3, armies: 2 },
      { id: 28, name: "China", coords: [[400, 100], [450, 100], [450, 140], [400, 140]], adjacentIds: [24, 25, 29, 30], ownerId: 1, armies: 5 },
      { id: 29, name: "India", coords: [[400, 140], [450, 140], [450, 180], [400, 180]], adjacentIds: [25, 26, 28, 31], ownerId: 2, armies: 4 },
      { id: 30, name: "Mongolia", coords: [[450, 100], [500, 100], [500, 140], [450, 140]], adjacentIds: [28, 32], ownerId: 1, armies: 3 },
      { id: 31, name: "Siam", coords: [[450, 140], [500, 140], [500, 180], [450, 180]], adjacentIds: [29, 32], ownerId: 2, armies: 3 },
      { id: 32, name: "Japan", coords: [[500, 100], [550, 100], [550, 140], [500, 140]], adjacentIds: [30, 31], ownerId: 1, armies: 4 },
      { id: 33, name: "Indonesia", coords: [[450, 180], [500, 180], [500, 220], [450, 220]], adjacentIds: [31, 34], ownerId: 2, armies: 2 },
      { id: 34, name: "New Guinea", coords: [[500, 180], [550, 180], [550, 220], [500, 220]], adjacentIds: [33, 35], ownerId: 1, armies: 2 },
      { id: 35, name: "Eastern Australia", coords: [[500, 220], [550, 220], [550, 260], [500, 260]], adjacentIds: [34, 36], ownerId: 1, armies: 3 },
      { id: 36, name: "Western Australia", coords: [[450, 220], [500, 220], [500, 260], [450, 260]], adjacentIds: [33, 35], ownerId: 1, armies: 2 }
    ],
    continents: [
      { id: 0, name: "North America", territoryIds: [0, 1, 2, 3, 4, 5, 6, 7, 8], bonusArmies: 5 },
      { id: 1, name: "South America", territoryIds: [9, 10, 11, 12], bonusArmies: 2 },
      { id: 2, name: "Europe", territoryIds: [14, 15, 16, 17, 18, 19, 20], bonusArmies: 5 },
      { id: 3, name: "Africa", territoryIds: [13, 22, 23, 26, 27], bonusArmies: 3 },
      { id: 4, name: "Asia", territoryIds: [21, 24, 25, 28, 29, 30, 31, 32], bonusArmies: 7 },
      { id: 5, name: "Australia", territoryIds: [33, 34, 35, 36], bonusArmies: 2 }
    ],
    playerStarts: [
      { playerId: 0, territoryIds: [0, 2, 4, 7, 14] },
      { playerId: 1, territoryIds: [1, 3, 6, 9, 17, 20, 24, 28, 30, 32, 34, 35, 36] },
      { playerId: 2, territoryIds: [5, 8, 11, 15, 18, 21, 25, 29, 31, 33] },
      { playerId: 3, territoryIds: [10, 12, 13, 16, 19, 22, 23, 26, 27] }
    ]
  }
};