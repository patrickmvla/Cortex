import { Pinecone } from "@pinecone-database/pinecone";
import { VoyageAIClient, VoyageAI } from "voyageai";

interface MultimodalQuery {
  text: string;
  imageBase64?: string;
}

class RagService {
  private voyage: VoyageAIClient;
  private pinecone: Pinecone;
  private index: any;

  constructor() {
    if (
      !process.env.VOYAGE_API_KEY ||
      !process.env.PINECONE_API_KEY ||
      !process.env.PINECONE_INDEX_NAME
    ) {
      throw new Error("Missing required environment variables for RAG service");
    }

    this.voyage = new VoyageAIClient({
      apiKey: process.env.VOYAGE_API_KEY,
    });

    this.pinecone = new Pinecone({
      apiKey: process.env.PINECONE_API_KEY,
    });

    this.index = this.pinecone.index(process.env.PINECONE_INDEX_NAME);
  }

  private async getEmbedding({
    text,
    imageBase64,
  }: MultimodalQuery): Promise<number[]> {
    let result;

    if (imageBase64) {
      const multimodalInputs: VoyageAI.MultimodalEmbedRequest["inputs"] = [
        {
          content: [
            { type: "text", text },

            { type: "image_base64", imageBase64: imageBase64 },
          ],
        },
      ];

      result = await this.voyage.embed({
        inputs: multimodalInputs,
        model: "voyage-multimodal-3",
        inputType: "query",
      } as any);
    } else {
      result = await this.voyage.embed({
        input: [text],
        model: "voyage-2",
        inputType: "query",
      });
    }

    const embedding = result?.data?.[0]?.embedding;
    if (!embedding) {
      throw new Error("Failed to get embedding from Voyage AI");
    }
    return embedding;
  }

  public async search({ text, imageBase64 }: MultimodalQuery) {
    const queryEmbedding = await this.getEmbedding({ text, imageBase64 });

    const queryResponse = await this.index.query({
      vector: queryEmbedding,
      topK: 5,
      includeMetadata: true,
    });

    return queryResponse.matches;
  }
}

export const ragService = new RagService();
