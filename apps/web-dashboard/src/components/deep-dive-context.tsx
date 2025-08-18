"use client";

import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

interface DeepDiveContextProps {
  isOpen: boolean;
  onClose: () => void;
  context: string;
}

export function DeepDiveContext({
  isOpen,
  onClose,
  context,
}: DeepDiveContextProps) {
  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[600px]">
        <DialogHeader>
          <DialogTitle>Deep Dive: AI Context</DialogTitle>
          <DialogDescription>
            This is the raw context the AI used to generate its response.
          </DialogDescription>
        </DialogHeader>
        <div className="max-h-[60vh] overflow-y-auto rounded-md bg-muted p-4">
          <pre className="whitespace-pre-wrap text-xs text-muted-foreground">
            {context || "No context was used for this response."}
          </pre>
        </div>
      </DialogContent>
    </Dialog>
  );
}
