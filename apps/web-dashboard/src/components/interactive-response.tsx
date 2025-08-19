"use client";

import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import React from "react";

interface Source {
  type: "internal" | "web";
  sourceUrl?: string;
  title?: string;
  content: string;
}

interface InteractiveResponseProps {
  response: string;
  sources: Source[];
  onHighlight: (index: number | null) => void;
}

export function InteractiveResponse({
  response,
  sources,
  onHighlight,
}: InteractiveResponseProps) {
  const parts = response.split(/(\[Source \d+\])/g);

  return (
    <TooltipProvider>
      <p className="text-muted-foreground whitespace-pre-wrap">
        {parts.map((part, index) => {
          const match = /\[Source (\d+)\]/.exec(part);
          if (match) {
            const sourceIndex = parseInt(match[1], 10) - 1;
            const source = sources[sourceIndex];
            if (source) {
              return (
                <Tooltip key={index}>
                  <TooltipTrigger asChild>
                    <span
                      className="text-blue-500 font-semibold cursor-pointer"
                      onMouseEnter={() => onHighlight(sourceIndex)}
                      onMouseLeave={() => onHighlight(null)}
                    >
                      {part}
                    </span>
                  </TooltipTrigger>
                  <TooltipContent>
                    <p className="max-w-xs">
                      <strong>{source.title}</strong>
                      <br />
                      {source.content.substring(0, 150)}...
                    </p>
                  </TooltipContent>
                </Tooltip>
              );
            }
          }
          return <React.Fragment key={index}>{part}</React.Fragment>;
        })}
      </p>
    </TooltipProvider>
  );
}
