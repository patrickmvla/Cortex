interface ChunkerOptions {
  chunkSize: number;
  chunkOverlap: number;
}

const defaultOptions: ChunkerOptions = {
  chunkSize: 1024, // Target size of each chunk in characters
  chunkOverlap: 200, // Number of characters to overlap between chunks
};

export function chunkText(
  text: string,
  options: Partial<ChunkerOptions> = {}
): string[] {
  const { chunkSize, chunkOverlap } = { ...defaultOptions, ...options };
  const chunks: string[] = [];

  if (text.length <= chunkSize) {
    return [text];
  }

  let i = 0;
  while (i < text.length) {
    const end = i + chunkSize;
    const chunk = text.slice(i, end);
    chunks.push(chunk);
    i += chunkSize - chunkOverlap;
  }

  return chunks;
}
