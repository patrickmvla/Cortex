import { Pinecone } from "@pinecone-database/pinecone";
import { VoyageAIClient, VoyageAI } from "voyageai";
import { v4 as uuidv4 } from "uuid";
import { createSparseVector } from "../lib/sparse-vector";

// Define the structure for a multimodal query
interface MultimodalQuery {
  text: string;
  imageBase64?: string; // e.g., "data:image/jpeg;base64,..."
}

interface EnrichedChunk {
  text: string;
  metadata: {
    summary: string;
    keywords: string[];
    sourceUrl: string;
    chunkNumber: number;
  };
}

class RagService {
  private voyage: VoyageAIClient;
  private pinecone: Pinecone;
  private index: any; // Pinecone doesn't export a clean Index type for this context

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

  private async getQueryEmbedding({
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

  private async getDocumentEmbeddings(chunks: string[]): Promise<number[][]> {
    const result = await this.voyage.embed({
      input: chunks,
      model: "voyage-2",
      inputType: "document",
    });

    const embeddings =
      result?.data
        ?.map((item) => item.embedding)
        .filter((e): e is number[] => e !== undefined) ?? [];

    if (embeddings.length !== chunks.length) {
      throw new Error("Mismatch between number of chunks and embeddings returned");
    }
    return embeddings;
  }

  private async rerank(query: string, documents: any[]): Promise<any[]> {
    if (documents.length === 0) {
      return [];
    }
  
    const docsToRerank = documents.map(doc => doc.metadata.text);
  
    const rerankResult = await this.voyage.rerank({
      query: query,
      documents: docsToRerank,
      model: "rerank-lite-1",
      topK: 3,
    });
  
    if (!rerankResult.data) {
      return documents; // Return original documents if reranking fails
    }
  
    const rerankedDocs = rerankResult.data
      .filter(result => result.index !== undefined) // Ensure index is valid
      .map(result => {
        const originalDoc = documents[result.index!];
        originalDoc.score = result.relevanceScore;
        return originalDoc;
    });
  
    return rerankedDocs;
  }

  public async search(
    query: MultimodalQuery,
    userId: string,
    deepResearch: boolean = false
  ) {
    const queryEmbedding = await this.getQueryEmbedding(query);
    const sparseVector = createSparseVector(query.text);

    const queryResponse = await this.index.query({
      vector: queryEmbedding,
      sparseVector: sparseVector,
      topK: deepResearch ? 10 : 5,
      includeMetadata: true,
      filter: {
        userId: { "$eq": userId }
      }
    });

    if (deepResearch) {
      return this.rerank(query.text, queryResponse.matches);
    }

    return queryResponse.matches;
  }

  public async embedAndStore(enrichedChunks: EnrichedChunk[], userId: string) {
    const chunksText = enrichedChunks.map(chunk => chunk.text);
    const embeddings = await this.getDocumentEmbeddings(chunksText);

    const vectors = enrichedChunks.map((chunk, index) => {
      const sparseVector = createSparseVector(chunk.text);
      return {
        id: uuidv4(),
        values: embeddings[index],
        sparseValues: sparseVector,
        metadata: {
          ...chunk.metadata,
          text: chunk.text,
          userId: userId, // Add userId to metadata
        },
      };
    });

    for (let i = 0; i < vectors.length; i += 100) {
      const batch = vectors.slice(i, i + 100);
      await this.index.upsert(batch);
    }
  }
}

export const ragService = new RagService();
