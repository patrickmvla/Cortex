const stopWords = new Set([
  "a",
  "an",
  "and",
  "are",
  "as",
  "at",
  "be",
  "by",
  "for",
  "from",
  "has",
  "he",
  "in",
  "is",
  "it",
  "its",
  "of",
  "on",
  "that",
  "the",
  "to",
  "was",
  "were",
  "will",
  "with",
]);

const wordIndex: { [key: string]: number } = {};
let nextIndex = 0;

function getIndexForWord(word: string): number {
  if (wordIndex[word] === undefined) {
    wordIndex[word] = nextIndex++;
  }
  return wordIndex[word];
}

interface SparseVector {
  indices: number[];
  values: number[];
}

export function createSparseVector(text: string): SparseVector {
  const wordCounts = new Map<number, number>();

  const tokens = text
    .toLowerCase()
    .split(/\s+/)
    .map((word) => word.replace(/[.,!?;:()]/g, ""))
    .filter((word) => word.length > 0 && !stopWords.has(word));

  for (const token of tokens) {
    const index = getIndexForWord(token);
    wordCounts.set(index, (wordCounts.get(index) || 0) + 1);
  }

  const indices: number[] = [];
  const values: number[] = [];

  const sortedCounts = Array.from(wordCounts.entries()).sort(
    (a, b) => a[0] - b[0]
  );

  for (const [index, count] of sortedCounts) {
    indices.push(index);
    values.push(count);
  }

  return { indices, values };
}
