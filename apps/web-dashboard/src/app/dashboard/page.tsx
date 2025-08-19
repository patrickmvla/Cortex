"use client";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Form, FormControl, FormField, FormItem } from "@/components/ui/form";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Textarea } from "@/components/ui/textarea";
import { api } from "@/lib/api";
import { zodResolver } from "@hookform/resolvers/zod";
import { BookOpen, Paperclip, Send, Sparkles } from "lucide-react";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { useState } from "react";
import { InteractiveResponse } from "@/components/interactive-response";
import { cn } from "@/lib/utils";
import { DeepDiveContext } from "@/components/deep-dive-context";
import { useAuthStore } from "@/hooks/use-auth-store";

const formSchema = z.object({
  prompt: z.string().min(1, "Prompt cannot be empty"),
});

type FormData = z.infer<typeof formSchema>;

interface Source {
  type: 'internal' | 'web';
  sourceUrl?: string;
  title?: string;
  content: string;
}

interface StreamMessage {
  type: 'plan' | 'response' | 'tool-start' | 'tool-end' | 'context' | 'source';
  data: any;
}

export default function DashboardPage() {
  const [plan, setPlan] = useState<string[]>([]);
  const [response, setResponse] = useState("");
  const [sources, setSources] = useState<Source[]>([]);
  const [finalContext, setFinalContext] = useState("");
  const [validationResponse, setValidationResponse] = useState("");
  const [highlightedSourceIndex, setHighlightedSourceIndex] = useState<number | null>(null);
  const [isContextModalOpen, setIsContextModalOpen] = useState(false);
  const [isStreaming, setIsStreaming] = useState(false);
  const [isValidating, setIsValidating] = useState(false);
  const [deepResearch, setDeepResearch] = useState(false);
  const { token } = useAuthStore(); 

  const form = useForm<FormData>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      prompt: "",
    },
  });

  const { watch } = form;
  const currentPrompt = watch("prompt");

  async function handleValidate() {
    setIsValidating(true);
    setValidationResponse("");

    const res = await api.validate.$post({
      json: {
        prompt: currentPrompt,
        context: finalContext,
      },
      headers: { 
        Authorization: `Bearer ${token}`,
      }
    });

    if (!res.body) return;
    const reader = res.body.getReader();
    const decoder = new TextDecoder();
    let done = false;

    while (!done) {
      const { value, done: readerDone } = await reader.read();
      done = readerDone;
      const chunk = decoder.decode(value, { stream: true });
      setValidationResponse((prev) => prev + chunk);
    }
    setIsValidating(false);
  }

  async function onSubmit(values: FormData) {
    setIsStreaming(true);
    setResponse("");
    setPlan([]);
    setSources([]);
    setFinalContext("");
    setValidationResponse("");

    const res = await api.query.$post({
      json: {
        prompt: values.prompt,
        deepResearch: deepResearch,
      },
      headers: { // Add auth header to query request
        Authorization: `Bearer ${token}`,
      }
    });

    if (!res.body) return;

    const reader = res.body.getReader();
    const decoder = new TextDecoder();
    let done = false;
    let buffer = "";

    while (!done) {
      const { value, done: readerDone } = await reader.read();
      done = readerDone;
      buffer += decoder.decode(value, { stream: true });

      const lines = buffer.split("\n");
      buffer = lines.pop() || "";

      for (const line of lines) {
        if (line.trim() === "") continue;
        try {
          const message: StreamMessage = JSON.parse(line);
          if (message.type === "plan") {
            setPlan((prev) => [...prev, message.data]);
          } else if (message.type === "response") {
            setResponse((prev) => prev + message.data);
          } else if (message.type === "context") {
            setFinalContext(message.data);
          } else if (message.type === "source") {
            setSources((prev) => [...prev, message.data]);
          }
        } catch (error) {
          console.error("Failed to parse stream message:", line, error);
        }
      }
    }
    setIsStreaming(false);
  }

  return (
    <>
      <DeepDiveContext 
        isOpen={isContextModalOpen}
        onClose={() => setIsContextModalOpen(false)}
        context={finalContext}
      />
      <div className="grid h-full grid-rows-[auto_1fr_auto] gap-4">
        <header className="flex items-center justify-between">
          <h1 className="text-2xl font-bold">Command Center</h1>
          <div className="flex items-center space-x-2">
            <Switch
              id="deep-research-mode"
              checked={deepResearch}
              onCheckedChange={setDeepResearch}
              disabled={isStreaming || isValidating}
            />
            <Label htmlFor="deep-research-mode">Deep Research Mode</Label>
          </div>
        </header>

        <div className="grid md:grid-cols-3 gap-8">
          <div className="md:col-span-2 flex flex-col gap-4">
            <Card className="flex-grow">
              <CardHeader className="flex flex-row items-center justify-between">
                <CardTitle>AI Response</CardTitle>
                {!isStreaming && response && (
                  <Button variant="outline" size="sm" onClick={handleValidate} disabled={isValidating}>
                    <Sparkles className="mr-2 h-4 w-4" />
                    {isValidating ? "Validating..." : "Validate Answer"}
                  </Button>
                )}
              </CardHeader>
              <CardContent>
                {response ? (
                  <InteractiveResponse 
                    response={response} 
                    sources={sources} 
                    onHighlight={setHighlightedSourceIndex} 
                  />
                ) : (
                  <p className="text-muted-foreground">The AIs response will appear here.</p>
                )}
                {validationResponse && (
                  <div className="mt-4 border-t pt-4">
                      <h3 className="font-semibold mb-2 text-primary">Validation Response:</h3>
                      <p className="text-muted-foreground whitespace-pre-wrap">{validationResponse}</p>
                  </div>
                )}
              </CardContent>
            </Card>
            <Card>
              <CardHeader>
                <CardTitle>Execution Plan</CardTitle>
              </CardHeader>
              <CardContent>
                {plan.length > 0 ? (
                  <ul className="list-disc pl-5 text-muted-foreground space-y-2">
                    {plan.map((step, index) => (
                      <li key={index}>{step}</li>
                    ))}
                  </ul>
                ) : (
                  <p className="text-muted-foreground">
                    The AIs step-by-step plan will be shown here.
                  </p>
                )}
              </CardContent>
            </Card>
          </div>

          <div className="flex flex-col gap-4">
            <Card>
              <CardHeader>
                <CardTitle>Sources</CardTitle>
              </CardHeader>
              <CardContent>
                {sources.length > 0 ? (
                  <ul className="space-y-2">
                    {sources.map((source, index) => (
                      <li 
                        key={index} 
                        className={cn(
                          "text-sm p-2 rounded-md transition-colors",
                          highlightedSourceIndex === index ? "bg-blue-100" : ""
                        )}
                      >
                        <a 
                          href={source.sourceUrl} 
                          target="_blank" 
                          rel="noopener noreferrer" 
                          className="text-blue-500 hover:underline"
                          onMouseEnter={() => setHighlightedSourceIndex(index)}
                          onMouseLeave={() => setHighlightedSourceIndex(null)}
                        >
                          [Source {index + 1}] {source.title}
                        </a>
                      </li>
                    ))}
                  </ul>
                ) : (
                  <p className="text-muted-foreground">
                    Cited sources will be listed here.
                  </p>
                )}
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="flex flex-row items-center justify-between">
                <CardTitle>Context</CardTitle>
                {finalContext && (
                  <Button variant="ghost" size="sm" onClick={() => setIsContextModalOpen(true)}>
                    <BookOpen className="mr-2 h-4 w-4" />
                    Explore
                  </Button>
                )}
              </CardHeader>
              <CardContent>
                <p className="text-muted-foreground whitespace-pre-wrap text-xs line-clamp-4">
                  {finalContext || "Contextual information will be displayed here."}
                </p>
              </CardContent>
            </Card>
          </div>
        </div>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="relative">
            <FormField
              control={form.control}
              name="prompt"
              render={({ field }) => (
                <FormItem>
                  <FormControl>
                    <Textarea
                      placeholder="Ask Cortex anything..."
                      className="min-h-[48px] rounded-2xl resize-none p-4 border border-neutral-400 shadow-sm pr-24"
                      {...field}
                      disabled={isStreaming || isValidating}
                    />
                  </FormControl>
                </FormItem>
              )}
            />
            <div className="absolute top-3 right-3 flex gap-2">
              <Button type="submit" size="icon" disabled={isStreaming || isValidating}>
                <Send className="w-4 h-4" />
              </Button>
              <Button type="button" size="icon" variant="ghost" disabled={isStreaming || isValidating}>
                <Paperclip className="w-4 h-4" />
              </Button>
            </div>
          </form>
        </Form>
      </div>
    </>
  );
}
