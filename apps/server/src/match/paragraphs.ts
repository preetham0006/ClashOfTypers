const randomWords = [
  "cat", "dog", "sun", "moon", "star", "tree", "book", "pen", "cup", "table",
  "chair", "door", "road", "car", "bus", "train", "house", "room", "wall", "floor",
  "water", "food", "milk", "bread", "rice", "apple", "mango", "grape", "banana", "orange",
  "boy", "girl", "man", "woman", "child", "friend", "family", "mother", "father", "brother",
  "sister", "school", "class", "teacher", "student", "paper", "pencil", "phone", "clock", "window",
  "day", "night", "morning", "evening", "happy", "small", "big", "fast", "slow", "good"
] as const;

function generateRandomWordParagraph(wordCount: number): string {
  const words: string[] = [];

  for (let index = 0; index < wordCount; index += 1) {
    const randomIndex = Math.floor(Math.random() * randomWords.length);
    words.push(randomWords[randomIndex]);
  }

  return words.join(" ");
}

export function pickRandomParagraph(): string {
  const wordCount = 45 + Math.floor(Math.random() * 16);
  return generateRandomWordParagraph(wordCount);
}
