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
- Cite your sources where appropriate using [Source X] notation.
`;

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
    deepResearch: boolean,
    stream: StreamController
  ) {
    if (step.toLowerCase().includes("internal")) {
      await stream.writeln(
        JSON.stringify({
          type: "tool-start",
          data: "Performing internal search...",
        })
      );
      // Pass the deepResearch flag to the RAG service
      const searchResults = await ragService.search({ text: prompt }, deepResearch);
      await stream.writeln(
        JSON.stringify({
          type: "tool-end",
          data: `Found ${searchResults.length} relevant documents.`,
        })
      );
      return searchResults;
    }

    if (step.toLowerCase().includes("web")) {
      if (deepResearch) {
        await stream.writeln(
          JSON.stringify({
            type: "tool-start",
            data: "Performing deep research...",
          })
        );
        await webSearchService.deepSearch(prompt, stream);
        await stream.writeln(
          JSON.stringify({ type: "tool-end", data: "Deep research complete." })
        );
        return "Deep research results were streamed.";
      } else {
        await stream.writeln(
          JSON.stringify({
            type: "tool-start",
            data: "Performing normal web search...",
          })
        );
        const searchResults = await webSearchService.normalSearch(prompt);
        await stream.writeln(
          JSON.stringify({
            type: "tool-end",
            data: `Found ${searchResults.length} web results.`,
          })
        );
        return searchResults;
      }
    }
    return `Step executed (placeholder for: ${step})`;
  }

  private async synthesizeAnswer(
    prompt: string,
    context: string,
    stream: StreamController
  ) {
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

  async run({ prompt, deepResearch, stream }: OrchestratorInput) {
    // Step 1: Decompose the query into a plan
    const plan = await this.generatePlan(prompt);
    for (const step of plan) {
      await stream.writeln(JSON.stringify({ type: "plan", data: step }));
      await stream.sleep(200);
    }

    // Step 2: Execute the plan
    let finalContext = "";
    for (const step of plan) {
      const result = await this.executeStep(step, prompt, deepResearch, stream);
      finalContext += JSON.stringify(result, null, 2) + "\n";
    }

    // Step 3: Synthesize the final answer
    await this.synthesizeAnswer(prompt, finalContext, stream);
  }
}

export const orchestrator = new OrchestrationService();
