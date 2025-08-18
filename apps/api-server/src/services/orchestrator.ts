import Groq from "groq-sdk";
import {
  OrchestratorInput,
  StreamController,
} from "./orchestrator.types";
import { ragService } from "./rag";
import { webSearchService } from "./web-search";

const groq = new Groq({
  apiKey: process.env.GROQ_API_KEY,
});

const planningSystemPrompt = `
You are an expert AI planner. Your job is to create a clear, step-by-step plan to answer a user's prompt.
The user has access to two tools:
1.  **Internal Search**: Searches a private knowledge base of documents.
2.  **Web Search**: Searches the public internet.

Based on the user's prompt, create a numbered list of the steps required to provide a comprehensive answer.
The plan should be a simple numbered list. Do not add any extra commentary.
Prioritize "Internal Search" if the prompt seems related to private or specific knowledge.

Example:
Prompt: "How does our new product compare to competitors?"
Plan:
1. Search internal documents for the new product's specifications.
2. Search the web for the top 3 competitors.
3. Search the web for the features of each competitor.
4. Synthesize a comparative analysis of the features.
`;

const synthesisSystemPrompt = `
You are an expert AI assistant. Your job is to synthesize a comprehensive, grounded, and cited answer based on the user's prompt and the provided context from internal and web searches.

- Use the provided context to answer the user's prompt.
- Do not make up information. If the context does not provide an answer, state that.
- Cite your sources where appropriate using [Source X] notation, where X is the number of the source.
`;

interface Source {
    type: 'internal' | 'web';
    sourceUrl?: string;
    title?: string;
    content: string;
}

class OrchestrationService {
  constructor() {}

  private async generatePlan(prompt: string): Promise<string[]> {
    const chatCompletion = await groq.chat.completions.create({
      messages: [
        { role: "system", content: planningSystemPrompt },
        { role: "user", content: prompt },
      ],
      model: "llama3-8b-8192",
    });

    const planContent = chatCompletion.choices[0]?.message?.content || "";
    return planContent
      .split("\n")
      .map((line) => line.trim())
      .filter((line) => /^\d+\./.test(line));
  }

  private async executeStep(
    step: string,
    prompt: string,
    userId: string,
    deepResearch: boolean,
    stream: StreamController
  ): Promise<Source[]> {
    if (step.toLowerCase().includes("internal")) {
      await stream.writeln(
        JSON.stringify({
          type: "tool-start",
          data: "Performing internal search...",
        })
      );
      const searchResults = await ragService.search({ text: prompt }, userId, deepResearch);
      await stream.writeln(
        JSON.stringify({
          type: "tool-end",
          data: `Found ${searchResults.length} relevant documents.`,
        })
      );
      return searchResults.map(match => ({
          type: 'internal',
          sourceUrl: match.metadata.sourceUrl,
          title: `Internal Document: ${match.metadata.sourceUrl}`,
          content: match.metadata.text,
      }));
    }

    if (step.toLowerCase().includes("web")) {
        await stream.writeln(
          JSON.stringify({
            type: "tool-start",
            data: "Performing web search...",
          })
        );
        const searchResults = await webSearchService.normalSearch(prompt);
        await stream.writeln(
          JSON.stringify({
            type: "tool-end",
            data: `Found ${searchResults.length} web results.`,
          })
        );
        return searchResults.map(result => ({
            type: 'web',
            sourceUrl: result.url,
            title: result.title,
            content: result.content,
        }));
    }
    return [];
  }

  private async synthesizeAnswer(
    prompt: string,
    sources: Source[],
    stream: StreamController
  ) {
    const context = sources.map((source, index) => 
        `[Source ${index + 1}: ${source.title}]\n${source.content}`
    ).join("\n\n---\n\n");

    const streamResponse = await groq.chat.completions.create({
      messages: [
        { role: "system", content: synthesisSystemPrompt },
        {
          role: "user",
          content: `Prompt: ${prompt}\n\nContext:\n${context}`,
        },
      ],
      model: "llama3-8b-8192",
      stream: true,
    });

    for await (const chunk of streamResponse) {
      const content = chunk.choices[0]?.delta?.content || "";
      if (content) {
        await stream.writeln(
          JSON.stringify({ type: "response", data: content })
        );
      }
    }
  }

  async run({ prompt, deepResearch, stream, userId }: OrchestratorInput) {
    // Step 1: Decompose the query into a plan
    const plan = await this.generatePlan(prompt);
    for (const step of plan) {
      await stream.writeln(JSON.stringify({ type: "plan", data: step }));
      await stream.sleep(200);
    }

    // Step 2: Execute the plan and collect sources
    let allSources: Source[] = [];
    for (const step of plan) {
      const sources = await this.executeStep(step, prompt, userId, deepResearch, stream);
      allSources = [...allSources, ...sources];
      // Stream sources to the frontend as they are found
      for (const source of sources) {
          await stream.writeln(JSON.stringify({ type: "source", data: source }));
      }
    }

    // Stream the final context to the frontend for validation purposes
    const finalContextForValidation = allSources.map(s => s.content).join("\n\n");
    await stream.writeln(JSON.stringify({ type: "context", data: finalContextForValidation }));

    // Step 3: Synthesize the final answer
    await this.synthesizeAnswer(prompt, allSources, stream);
  }
}

export const orchestrator = new OrchestrationService();
