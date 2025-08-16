import { StreamController } from "./orchestrator.types";

interface JinaSearchResult {
  title: string;
  url: string;
  content: string;
  description?: string;
}

interface JinaSearchResponse {
  data: JinaSearchResult[];
}

class WebSearchService {
  private apiKey: string;
  private searchUrl = "https://s.jina.ai/";
  private deepSearchUrl = "https://deepsearch.jina.ai/v1/chat/completions";

  constructor() {
    // Get your Jina AI API key for free: https://jina.ai/?sui=apikey
    if (!process.env.JINA_API_KEY) {
      throw new Error("Missing JINA_API_KEY environment variable");
    }
    this.apiKey = process.env.JINA_API_KEY;
  }

  public async normalSearch(query: string): Promise<JinaSearchResult[]> {
    try {
      const response = await fetch(this.searchUrl, {
        method: 'POST',
        headers: {
          "Authorization": `Bearer ${this.apiKey}`,
          "Accept": "application/json",
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ q: query }),
      });

      if (!response.ok) {
        throw new Error(`Jina Normal Search API request failed with status ${response.status}`);
      }

      const data = (await response.json()) as JinaSearchResponse;
      return data.data;
    } catch (error) {
      console.error("Error performing normal web search:", error);
      return [];
    }
  }

  public async deepSearch(query: string, stream: StreamController) {
    const payload = {
      model: 'jina-deepsearch-v1',
      messages: [{ role: 'user', content: query }],
      stream: true,
    };

    try {
      const response = await fetch(this.deepSearchUrl, {
        method: 'POST',
        headers: {
          "Authorization": `Bearer ${this.apiKey}`,
          "Accept": "application/json",
          "Content-Type": "application/json",
        },
        body: JSON.stringify(payload),
      });

      if (!response.ok) {
        throw new Error(`Jina DeepSearch API request failed with status ${response.status}`);
      }

      if (response.body) {
        // Pipe the streaming response directly to the client's stream
        await stream.pipe(response.body);
      }
    } catch (error) {
      console.error("Error performing deep search:", error);
      await stream.writeln(JSON.stringify({ type: "error", data: "Deep search failed." }));
    }
  }
}

export const webSearchService = new WebSearchService();
