// questionBank.js - Question database

export const QUESTION_BANK = {
  Science: {
    easy: [
      { q: "What planet is known as the Red Planet?", options: ["Mars", "Venus", "Jupiter", "Saturn"], correct: 0 },
      { q: "What is H2O commonly known as?", options: ["Water", "Oxygen", "Hydrogen", "Salt"], correct: 0 },
      { q: "How many bones are in the human body?", options: ["206", "198", "215", "183"], correct: 0 },
      { q: "What gas do plants absorb from the atmosphere?", options: ["Carbon Dioxide", "Oxygen", "Nitrogen", "Helium"], correct: 0 },
      { q: "What is the center of an atom called?", options: ["Nucleus", "Electron", "Proton", "Neutron"], correct: 0 },
      { q: "What force keeps us on the ground?", options: ["Gravity", "Magnetism", "Friction", "Inertia"], correct: 0 }
    ],
    medium: [
      { q: "What is the chemical symbol for gold?", options: ["Au", "Ag", "Fe", "Cu"], correct: 0 },
      { q: "How many chambers does a human heart have?", options: ["Four", "Three", "Two", "Five"], correct: 0 },
      { q: "What is the speed of light?", options: ["300,000 km/s", "150,000 km/s", "450,000 km/s", "200,000 km/s"], correct: 0 },
      { q: "What is the smallest unit of life?", options: ["Cell", "Atom", "Molecule", "Tissue"], correct: 0 },
      { q: "What type of bond involves sharing electrons?", options: ["Covalent", "Ionic", "Metallic", "Hydrogen"], correct: 0 }
    ],
    hard: [
      { q: "What is Avogadro's number approximately?", options: ["6.022 × 10²³", "3.14 × 10²³", "9.81 × 10²³", "1.60 × 10²³"], correct: 0 },
      { q: "What particle has no electric charge?", options: ["Neutron", "Proton", "Electron", "Positron"], correct: 0 },
      { q: "What is the half-life of Carbon-14?", options: ["5,730 years", "1,200 years", "10,000 years", "500 years"], correct: 0 },
      { q: "What law states energy cannot be created or destroyed?", options: ["Conservation of Energy", "Newton's First", "Thermodynamics", "Relativity"], correct: 0 }
    ]
  },
  History: {
    easy: [
      { q: "Who was the first President of the United States?", options: ["George Washington", "Thomas Jefferson", "Abraham Lincoln", "John Adams"], correct: 0 },
      { q: "In what year did World War II end?", options: ["1945", "1944", "1946", "1943"], correct: 0 },
      { q: "What ancient wonder was located in Egypt?", options: ["Pyramids", "Gardens", "Colossus", "Lighthouse"], correct: 0 },
      { q: "Who discovered America in 1492?", options: ["Christopher Columbus", "Vasco da Gama", "Ferdinand Magellan", "Marco Polo"], correct: 0 },
      { q: "What was the Roman numeral for 10?", options: ["X", "V", "L", "C"], correct: 0 },
      { q: "Where was Julius Caesar from?", options: ["Rome", "Greece", "Egypt", "Persia"], correct: 0 }
    ],
    medium: [
      { q: "What year did the Berlin Wall fall?", options: ["1989", "1987", "1991", "1985"], correct: 0 },
      { q: "Who was the first man on the moon?", options: ["Neil Armstrong", "Buzz Aldrin", "Yuri Gagarin", "John Glenn"], correct: 0 },
      { q: "What empire did Genghis Khan rule?", options: ["Mongol", "Ottoman", "Byzantine", "Persian"], correct: 0 },
      { q: "In what year did the Titanic sink?", options: ["1912", "1910", "1915", "1920"], correct: 0 },
      { q: "Who wrote the Declaration of Independence?", options: ["Thomas Jefferson", "John Adams", "Benjamin Franklin", "James Madison"], correct: 0 }
    ],
    hard: [
      { q: "What year did the French Revolution begin?", options: ["1789", "1776", "1800", "1750"], correct: 0 },
      { q: "Who was the last Pharaoh of Egypt?", options: ["Cleopatra VII", "Tutankhamun", "Ramses II", "Nefertiti"], correct: 0 },
      { q: "What treaty ended World War I?", options: ["Treaty of Versailles", "Treaty of Paris", "Treaty of Vienna", "Treaty of Ghent"], correct: 0 },
      { q: "What year was the Magna Carta signed?", options: ["1215", "1066", "1492", "1776"], correct: 0 }
    ]
  },
  Sports: {
    easy: [
      { q: "How many players are on a soccer team?", options: ["11", "10", "9", "12"], correct: 0 },
      { q: "What sport is played at Wimbledon?", options: ["Tennis", "Cricket", "Golf", "Soccer"], correct: 0 },
      { q: "How many rings are in the Olympic logo?", options: ["5", "4", "6", "7"], correct: 0 },
      { q: "What color is a basketball?", options: ["Orange", "Brown", "Red", "Yellow"], correct: 0 },
      { q: "How many points is a touchdown in football?", options: ["6", "7", "5", "8"], correct: 0 },
      { q: "What sport uses a puck?", options: ["Hockey", "Soccer", "Baseball", "Basketball"], correct: 0 }
    ],
    medium: [
      { q: "Who holds the record for most Olympic gold medals?", options: ["Michael Phelps", "Usain Bolt", "Carl Lewis", "Mark Spitz"], correct: 0 },
      { q: "What is the length of a marathon in miles?", options: ["26.2", "25.0", "30.0", "20.0"], correct: 0 },
      { q: "In which country did the Olympics originate?", options: ["Greece", "Italy", "Egypt", "China"], correct: 0 },
      { q: "What is a perfect score in bowling?", options: ["300", "250", "200", "350"], correct: 0 },
      { q: "How many Grand Slam tournaments are there in tennis?", options: ["4", "3", "5", "6"], correct: 0 }
    ],
    hard: [
      { q: "What year did baseball's Jackie Robinson break the color barrier?", options: ["1947", "1945", "1950", "1940"], correct: 0 },
      { q: "Who won the first FIFA World Cup?", options: ["Uruguay", "Brazil", "Argentina", "Italy"], correct: 0 },
      { q: "What is the diameter of a basketball hoop in inches?", options: ["18", "16", "20", "15"], correct: 0 },
      { q: "How many holes are on a standard golf course?", options: ["18", "16", "20", "22"], correct: 0 }
    ]
  },
  Art: {
    easy: [
      { q: "Who painted the Mona Lisa?", options: ["Leonardo da Vinci", "Michelangelo", "Raphael", "Donatello"], correct: 0 },
      { q: "What are the primary colors?", options: ["Red, Blue, Yellow", "Red, Green, Blue", "Orange, Purple, Green", "Black, White, Gray"], correct: 0 },
      { q: "What is a sculpture made of stone called?", options: ["Statue", "Painting", "Drawing", "Mural"], correct: 0 },
      { q: "Who painted the ceiling of the Sistine Chapel?", options: ["Michelangelo", "Leonardo da Vinci", "Raphael", "Botticelli"], correct: 0 },
      { q: "What tool do painters use to apply paint?", options: ["Brush", "Pencil", "Chisel", "Hammer"], correct: 0 },
      { q: "What color do you get when you mix red and blue?", options: ["Purple", "Green", "Orange", "Brown"], correct: 0 }
    ],
    medium: [
      { q: "Who painted 'The Starry Night'?", options: ["Vincent van Gogh", "Claude Monet", "Pablo Picasso", "Salvador Dali"], correct: 0 },
      { q: "What art movement was Picasso associated with?", options: ["Cubism", "Impressionism", "Surrealism", "Realism"], correct: 0 },
      { q: "What museum houses the Mona Lisa?", options: ["The Louvre", "The Met", "The Uffizi", "The Prado"], correct: 0 },
      { q: "Who sculpted 'David'?", options: ["Michelangelo", "Donatello", "Bernini", "Rodin"], correct: 0 },
      { q: "What is the technique of painting on wet plaster?", options: ["Fresco", "Tempera", "Oil", "Acrylic"], correct: 0 }
    ],
    hard: [
      { q: "What year did Andy Warhol create his Campbell's Soup Cans?", options: ["1962", "1965", "1970", "1958"], correct: 0 },
      { q: "Who painted 'The Birth of Venus'?", options: ["Botticelli", "Raphael", "Titian", "Caravaggio"], correct: 0 },
      { q: "What is the Japanese art of paper folding called?", options: ["Origami", "Ikebana", "Bonsai", "Ukiyo-e"], correct: 0 },
      { q: "Who founded the Bauhaus school?", options: ["Walter Gropius", "Le Corbusier", "Frank Lloyd Wright", "Mies van der Rohe"], correct: 0 }
    ]
  },
  Geography: {
    easy: [
      { q: "What is the capital of France?", options: ["Paris", "London", "Berlin", "Rome"], correct: 0 },
      { q: "What is the largest ocean?", options: ["Pacific", "Atlantic", "Indian", "Arctic"], correct: 0 },
      { q: "What continent is Egypt in?", options: ["Africa", "Asia", "Europe", "South America"], correct: 0 },
      { q: "What is the longest river in the world?", options: ["Nile", "Amazon", "Yangtze", "Mississippi"], correct: 0 },
      { q: "How many continents are there?", options: ["7", "6", "5", "8"], correct: 0 },
      { q: "What is the smallest country in the world?", options: ["Vatican City", "Monaco", "Liechtenstein", "San Marino"], correct: 0 }
    ],
    medium: [
      { q: "What is the capital of Australia?", options: ["Canberra", "Sydney", "Melbourne", "Brisbane"], correct: 0 },
      { q: "What mountain range separates Europe and Asia?", options: ["Ural Mountains", "Alps", "Himalayas", "Rockies"], correct: 0 },
      { q: "What is the largest desert in the world?", options: ["Antarctic Desert", "Sahara", "Arabian", "Gobi"], correct: 0 },
      { q: "How many countries are in Africa?", options: ["54", "48", "60", "45"], correct: 0 },
      { q: "What is the deepest point in the ocean?", options: ["Mariana Trench", "Tonga Trench", "Philippine Trench", "Java Trench"], correct: 0 }
    ],
    hard: [
      { q: "What is the capital of Kazakhstan?", options: ["Astana", "Almaty", "Bishkek", "Tashkent"], correct: 0 },
      { q: "What country has the most islands?", options: ["Sweden", "Finland", "Indonesia", "Philippines"], correct: 0 },
      { q: "What is the smallest ocean?", options: ["Arctic", "Southern", "Indian", "Atlantic"], correct: 0 },
      { q: "What country is home to the ancient city of Petra?", options: ["Jordan", "Egypt", "Syria", "Lebanon"], correct: 0 }
    ]
  },
  Entertainment: {
    easy: [
      { q: "What movie features a lion named Simba?", options: ["The Lion King", "Madagascar", "Jungle Book", "Tarzan"], correct: 0 },
      { q: "Who is the boy wizard with a lightning scar?", options: ["Harry Potter", "Percy Jackson", "Luke Skywalker", "Frodo Baggins"], correct: 0 },
      { q: "What instrument has 88 keys?", options: ["Piano", "Guitar", "Violin", "Drums"], correct: 0 },
      { q: "What color is Mickey Mouse's shorts?", options: ["Red", "Blue", "Yellow", "Green"], correct: 0 },
      { q: "What movie features a princess with long magical hair?", options: ["Tangled", "Frozen", "Moana", "Brave"], correct: 0 },
      { q: "What superhero is also known as the Dark Knight?", options: ["Batman", "Superman", "Spider-Man", "Iron Man"], correct: 0 }
    ],
    medium: [
      { q: "Who directed 'Jurassic Park'?", options: ["Steven Spielberg", "George Lucas", "James Cameron", "Peter Jackson"], correct: 0 },
      { q: "What band sang 'Bohemian Rhapsody'?", options: ["Queen", "The Beatles", "Led Zeppelin", "Pink Floyd"], correct: 0 },
      { q: "What is the highest-grossing film of all time?", options: ["Avatar", "Avengers: Endgame", "Titanic", "Star Wars"], correct: 0 },
      { q: "Who played Jack in Titanic?", options: ["Leonardo DiCaprio", "Brad Pitt", "Tom Cruise", "Johnny Depp"], correct: 0 },
      { q: "What streaming service created 'Stranger Things'?", options: ["Netflix", "Hulu", "Disney+", "HBO Max"], correct: 0 }
    ],
    hard: [
      { q: "What year did the first Star Wars movie release?", options: ["1977", "1980", "1975", "1983"], correct: 0 },
      { q: "Who composed the music for 'The Lord of the Rings'?", options: ["Howard Shore", "John Williams", "Hans Zimmer", "Danny Elfman"], correct: 0 },
      { q: "What was the first feature-length animated movie?", options: ["Snow White", "Fantasia", "Pinocchio", "Bambi"], correct: 0 },
      { q: "Who won the first season of American Idol?", options: ["Kelly Clarkson", "Carrie Underwood", "Clay Aiken", "Ruben Studdard"], correct: 0 }
    ]
  }
};

export function getRandomQuestion(category, difficulty) {
  const questions = QUESTION_BANK[category][difficulty];
  if (!questions || questions.length === 0) return null;
  
  const randomIndex = Math.floor(Math.random() * questions.length);
  const question = questions[randomIndex];
  
  return {
    text: question.q,
    options: question.options,
    correctIndex: question.correct,
    category: category,
    difficulty: difficulty
  };
}