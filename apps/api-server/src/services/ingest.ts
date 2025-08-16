interface JinaReadResult {
  title: string;
  url: string;
  content: string;
}

interface JinaReadResponse {
  data: JinaReadResult;
}

class IngestService {
  private apiKey: string;
  private readerUrl = "https://r.jina.ai/";

  constructor() {
    // Get your Jina AI API key for free: https://jina.ai/?sui=apikey
    if (!process.env.JINA_API_KEY) {
      throw new Error("Missing JINA_API_KEY environment variable");
    }
    this.apiKey = process.env.JINA_API_KEY;
  }

  public async loadAndParse(url: string): Promise<string | null> {
    try {
      const response = await fetch(this.readerUrl, {
        method: 'POST',
        headers: {
          "Authorization": `Bearer ${this.apiKey}`,
          "Accept": "application/json",
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ url }),
      });

      if (!response.ok) {
        throw new Error(`Jina Reader API request failed with status ${response.status}`);
      }

      const data = (await response.json()) as JinaReadResponse;
      return data.data.content; // Return the clean Markdown content
    } catch (error) {
      console.error(`Error ingesting document from ${url}:`, error);
      return null;
    }
  }
}

export const ingestService = new IngestService();
