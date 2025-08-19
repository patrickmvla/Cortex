interface ChunkerOptions {
  chunkSize: number;
  chunkOverlap: number;
}

const defaultOptions: ChunkerOptions = {
  chunkSize: 1024,
  chunkOverlap: 200,
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
