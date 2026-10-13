const A = ["Stealth Ninja", "Grow a Garden", "Speed Run", "Anime Magic", "Pet Hatching", "Tycoon", "Tower Obby", "Fishing", "Zombie Survival", "Cooking", "Racing", "Dungeon Crawl", "Space Mining", "Haunted Mansion", "Sky Islands", "Underwater Kingdom"];
const B = ["Tower Defense", "Clicker Simulator", "Parkour", "Farming", "RPG Arena", "Mystery Hunt", "Rhythm", "Treasure Hunt", "Battle Royale", "Roleplay Town", "Puzzle Escape", "Boss Raid"];
const LANDMARK = ["a giant glowing crystal tree", "a floating sky castle", "a neon pagoda", "a sunken pirate ship", "a volcano forge", "a moonlit shrine", "a candy waterfall", "a rotating clock tower"];
const TWIST = ["day/night changes the rules", "every rebirth reshapes the map", "pets help you harvest", "weather boosts rewards", "players race to defend a shared core", "secret paths unlock with combos"];
const SOUND = ["calm lo-fi wind and chimes", "epic drums and choir", "cozy birds and crickets", "spooky drones and creaks", "synthwave hums", "ocean waves and gulls"];
const pick = <T,>(a: T[]) => a[Math.floor(Math.random() * a.length)];

export function rollIdea(): string {
  let a = pick(A), b = pick(B);
  while (b === a) b = pick(B);
  return `Build a "${a} + ${b}" game. Landmark: ${pick(LANDMARK)}. Twist: ${pick(TWIST)}. Sound: ${pick(SOUND)}. Give it a catchy name, the core loop, the map, and the full script.`;
}
