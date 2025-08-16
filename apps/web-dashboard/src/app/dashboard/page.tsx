"use client";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Form, FormControl, FormField, FormItem } from "@/components/ui/form";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Textarea } from "@/components/ui/textarea";
import { api } from "@/lib/api";
import { zodResolver } from "@hookform/resolvers/zod";
import { Paperclip, Send } from "lucide-react";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { useState } from "react";

const formSchema = z.object({
  prompt: z.string().min(1, "Prompt cannot be empty"),
});

type FormData = z.infer<typeof formSchema>;

interface StreamMessage {
  type: 'plan' | 'response' | 'tool-start' | 'tool-end';
  data: string;
}

export default function DashboardPage() {
  const [plan, setPlan] = useState<string[]>([]);
  const [response, setResponse] = useState("");
  const [toolMessages, setToolMessages] = useState<string[]>([]);
  const [isStreaming, setIsStreaming] = useState(false);
  const [deepResearch, setDeepResearch] = useState(false);

  const form = useForm<FormData>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      prompt: "",
    },
  });

  async function onSubmit(values: FormData) {
    setIsStreaming(true);
    setResponse("");
    setPlan([]);
    setToolMessages([]);

    const res = await api.query.$post({
      json: {
        prompt: values.prompt,
        deepResearch: deepResearch,
      },
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
      buffer = lines.pop() || ""; // Keep the last partial line in the buffer

      for (const line of lines) {
        if (line.trim() === "") continue;
        try {
          const message: StreamMessage = JSON.parse(line);
          if (message.type === "plan") {
            setPlan((prev) => [...prev, message.data]);
          } else if (message.type === "response") {
            setResponse((prev) => prev + message.data);
          } else if (message.type === "tool-start" || message.type === "tool-end") {
            setToolMessages((prev) => [...prev, message.data]);
          }
        } catch (error) {
          console.error("Failed to parse stream message:", line, error);
        }
      }
    }
    setIsStreaming(false);
    form.reset();
  }

  return (
    <div className="grid h-full grid-rows-[auto_1fr_auto] gap-4">
      <header className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">Command Center</h1>
        <div className="flex items-center space-x-2">
          <Switch
            id="deep-research-mode"
            checked={deepResearch}
            onCheckedChange={setDeepResearch}
            disabled={isStreaming}
          />
          <Label htmlFor="deep-research-mode">Deep Research Mode</Label>
        </div>
      </header>

      <div className="grid md:grid-cols-3 gap-8">
        <div className="md:col-span-2 flex flex-col gap-4">
          <Card className="flex-grow">
            <CardHeader>
              <CardTitle>AI Response</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-muted-foreground whitespace-pre-wrap">
                {response || "The AI's response will appear here."}
              </p>
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
               {toolMessages.length > 0 && (
                <div className="mt-4 border-t pt-4">
                  <h3 className="font-semibold mb-2">Tool Activity:</h3>
                  <div className="text-sm text-muted-foreground space-y-1">
                    {toolMessages.map((msg, i) => <p key={i}>{msg}</p>)}
                  </div>
                </div>
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
              <p className="text-muted-foreground">
                Cited sources will be listed here.
              </p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader>
              <CardTitle>Context</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-muted-foreground">
                Contextual information will be displayed here.
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
                    disabled={isStreaming}
                  />
                </FormControl>
              </FormItem>
            )}
          />
          <div className="absolute top-3 right-3 flex gap-2">
            <Button type="submit" size="icon" disabled={isStreaming}>
              <Send className="w-4 h-4" />
            </Button>
            <Button type="button" size="icon" variant="ghost" disabled={isStreaming}>
              <Paperclip className="w-4 h-4" />
            </Button>
          </div>
        </form>
      </Form>
    </div>
  );
}
