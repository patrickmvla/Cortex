"use client";

import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { api } from "@/lib/api";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { Upload } from "lucide-react";
import { useState } from "react";

export function FileUploadCard() {
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const queryClient = useQueryClient();

  const mutation = useMutation({
    mutationFn: async (file: File) => {
      const formData = new FormData();
      formData.append("file", file);

      // The 'form' key is expected by the Hono RPC client for form data
      const res = await api.documents.upload.$post({ form: { file } });
      if (!res.ok) {
        throw new Error("File upload failed");
      }
      return res.json();
    },
    onSuccess: () => {
      // Invalidate and refetch the documents list after a successful upload
      queryClient.invalidateQueries({ queryKey: ["documents"] });
      setSelectedFile(null);
      // Clear the file input visually
      const fileInput = document.getElementById('document-upload') as HTMLInputElement;
      if (fileInput) {
        fileInput.value = "";
      }
    },
    onError: (error) => {
      console.error("Upload error:", error);
      // TODO: Add user-facing error handling (e.g., toast)
    },
  });

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    if (event.target.files) {
      setSelectedFile(event.target.files[0]);
    }
  };

  const handleSubmit = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (selectedFile) {
      mutation.mutate(selectedFile);
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Upload Document</CardTitle>
        <CardDescription>
          Upload a PDF or Markdown file to your knowledge base.
        </CardDescription>
      </CardHeader>
      <form onSubmit={handleSubmit}>
        <CardContent>
          <div className="grid w-full max-w-sm items-center gap-1.5">
            <Label htmlFor="document-upload">Document</Label>
            <Input id="document-upload" type="file" onChange={handleFileChange} />
          </div>
          {selectedFile && (
            <p className="text-sm text-muted-foreground mt-2">
              Selected: {selectedFile.name}
            </p>
          )}
        </CardContent>
        <CardFooter>
          <Button type="submit" disabled={!selectedFile || mutation.isPending}>
            <Upload className="mr-2 h-4 w-4" />
            {mutation.isPending ? "Uploading..." : "Upload"}
          </Button>
        </CardFooter>
      </form>
    </Card>
  );
}
