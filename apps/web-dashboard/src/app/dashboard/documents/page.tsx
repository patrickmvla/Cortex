"use client";

import { FileUploadCard } from "@/components/file-upload-card";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { useAuthStore } from "@/hooks/use-auth-store";
import { api } from "@/lib/api";
import { useQuery } from "@tanstack/react-query";
import { InferResponseType } from "hono/client";

// Infer the type of a single document from the API response
type Document = InferResponseType<typeof api.documents.$get, 200>[number];

export default function DocumentsPage() {
  const { token } = useAuthStore();

  const {
    data: documents,
    isLoading,
    error,
  } = useQuery({
    queryKey: ["documents"],
    queryFn: async () => {
      const res = await api.documents.$get(
        {},
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );
      if (!res.ok) {
        throw new Error("Failed to fetch documents");
      }
      return res.json();
    },
    enabled: !!token,
  });

  return (
    <div className="grid gap-8">
      <FileUploadCard />

      <Card>
        <CardHeader>
          <CardTitle>My Documents</CardTitle>
          <CardDescription>Manage your uploaded documents.</CardDescription>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Name</TableHead>
                <TableHead>Type</TableHead>
                <TableHead>Date Added</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {isLoading && (
                <TableRow>
                  <TableCell colSpan={3} className="text-center">
                    Loading documents...
                  </TableCell>
                </TableRow>
              )}
              {error && (
                <TableRow>
                  <TableCell colSpan={3} className="text-center text-red-500">
                    Error fetching documents. Please try again.
                  </TableCell>
                </TableRow>
              )}
              {documents &&
                documents.map((doc: Document) => (
                  <TableRow key={doc.id}>
                    <TableCell className="font-medium">{doc.title}</TableCell>
                    <TableCell>{doc.sourceType}</TableCell>
                    <TableCell>
                      {new Date(doc.createdAt).toLocaleDateString()}
                    </TableCell>
                  </TableRow>
                ))}
              {documents && documents.length === 0 && !isLoading && (
                <TableRow>
                  <TableCell colSpan={3} className="text-center">
                    You havent uploaded any documents yet.
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}
