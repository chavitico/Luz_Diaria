/** Biblical character names used for bot opponents in Duelo de Sabiduría. */
export const DUEL_BOT_NAMES = [
  "Bartimeo",
  "Timoteo",
  "Ester",
  "Débora",
  "Caleb",
  "Josué",
  "Daniel",
  "Samuel",
  "Priscila",
  "Elías",
  "Nehemías",
  "Abigail",
  "Zacarías",
  "Rut",
  "Esteban",
  "Marta",
];

/** Returns a random biblical bot name formatted as "Name Bot". */
export function getRandomBotName(): string {
  const name = DUEL_BOT_NAMES[Math.floor(Math.random() * DUEL_BOT_NAMES.length)]!;
  return `${name} Bot`;
}
