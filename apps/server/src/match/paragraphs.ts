export const paragraphs: string[] = [
  "Typing is a skill built with rhythm, patience, and consistency. Keep your eyes on the text and let your fingers learn the pattern.",
  "Great competitors focus on accuracy first and speed second. The fastest results arrive when mistakes are reduced through calm repetition.",
  "In team games and typing races, confidence comes from preparation. Practice short bursts every day and track your progress over time.",
  "A clean keyboard, good posture, and steady breathing can improve your typing session. Small habits often create the biggest improvement.",
  "Competition is not only about winning rounds. It is about staying composed, adapting quickly, and finishing each challenge with precision."
];

export function pickRandomParagraph(): string {
  const index = Math.floor(Math.random() * paragraphs.length);
  return paragraphs[index];
}
