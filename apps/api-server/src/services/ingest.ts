import { chunkText } from "../lib/chunker";
import { ragService } from "./rag";
import Groq from "groq-sdk";

interface JinaReadResult {
  title: string;
  url: string;
  content: string;
}

interface JinaReadResponse {
  data: JinaReadResult;
}

const groq = new Groq({
  apiKey: process.env.GROQ_API_KEY,
});

const enrichmentSystemPrompt = `
You are an expert at extracting key information. For the given text chunk, provide a one-sentence summary and a list of 3-5 relevant keywords.
Respond ONLY with a valid JSON object in the following format:
{
  "summary": "A one-sentence summary of the text.",
  "keywords": ["keyword1", "keyword2", "keyword3"]
}
`;

interface EnrichedMetadata {
  summary: string;
  keywords: string[];
}

class IngestService {
  private apiKey: string;
  private readerUrl = "https://r.jina.ai/";

  constructor() {
    if (!process.env.JINA_API_KEY || !process.env.GROQ_API_KEY) {
      throw new Error(
        "Missing JINA_API_KEY or GROQ_API_KEY environment variable"
      );
    }
    this.apiKey = process.env.JINA_API_KEY;
  }

  private async enrichChunk(chunk: string): Promise<EnrichedMetadata> {
    try {
      const chatCompletion = await groq.chat.completions.create({
        messages: [
          { role: "system", content: enrichmentSystemPrompt },
          { role: "user", content: chunk },
        ],
        model: "llama3-8b-8192",
        response_format: { type: "json_object" },
      });
      const content = chatCompletion.choices[0]?.message?.content || "{}";
      return JSON.parse(content);
    } catch (error) {
      console.error("Error enriching chunk:", error);

      return { summary: "", keywords: [] };
    }
  }

  public async processUrl(url: string, userId: string): Promise<void> {
    try {
      const response = await fetch(this.readerUrl, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${this.apiKey}`,
          Accept: "application/json",
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ url }),
      });

      if (!response.ok) {
        throw new Error(
          `Jina Reader API request failed with status ${response.status}`
        );
      }

      const data = (await response.json()) as JinaReadResponse;
      const content = data.data.content;

      if (!content) {
        console.warn(`No content found for URL: ${url}`);
        return;
      }

      const chunks = chunkText(content);

      const enrichedChunks = await Promise.all(
        chunks.map(async (chunk, index) => {
          const metadata = await this.enrichChunk(chunk);
          return {
            text: chunk,
            metadata: {
              ...metadata,
              sourceUrl: url,
              chunkNumber: index,
            },
          };
        })
      );

      await ragService.embedAndStore(enrichedChunks, userId);
    } catch (error) {
      console.error(`Error ingesting document from ${url}:`, error);
      throw new Error("Failed to process document");
    }
  }
}

export const ingestService = new IngestService();
