import { Hono } from 'hono';
import { zValidator } from '@hono/zod-validator';
import { z } from 'zod';
import { ingestService } from '../services/ingest';
import { r2Service } from '../services/r2';
import { authMiddleware } from '../middleware/auth';
import { db } from '../db';
import { documents as documentsSchema } from 'drizzle-schema';
import { v4 as uuidv4 } from 'uuid';
import { eq } from 'drizzle-orm';

const documents = new Hono();

const uploadSchema = z.object({
  file: z.instanceof(File),
});

// GET endpoint to fetch all documents for the authenticated user
documents.get('/', authMiddleware, async (c) => {
  const userId = c.var.userId;

  try {
    const userDocuments = await db
      .select()
      .from(documentsSchema)
      .where(eq(documentsSchema.userId, userId));
    return c.json(userDocuments);
  } catch (error) {
    console.error("Failed to fetch documents:", error);
    return c.json({ error: 'Failed to fetch documents' }, 500);
  }
});

// POST endpoint to upload a new document
documents.post(
  '/upload',
  authMiddleware,
  zValidator('form', uploadSchema),
  async (c) => {
    const { file } = c.req.valid('form');
    const userId = c.var.userId;

    let publicUrl: string;
    try {
      publicUrl = await r2Service.uploadFile(file);
      console.log(`File uploaded successfully. Public URL: ${publicUrl}`);
    } catch (error) {
      console.error("R2 upload failed:", error);
      return c.json({ error: 'Failed to upload file' }, 500);
    }

    try {
      // Save document metadata to the database
      await db.insert(documentsSchema).values({
        id: uuidv4(),
        userId: userId,
        title: file.name,
        sourceType: 'upload',
        sourceUrl: publicUrl,
        content: `Processing started for ${file.name}`, // Placeholder content
      });

      // Trigger the ingestion process asynchronously
      ingestService.processUrl(publicUrl, userId).catch(err => {
          console.error(`Background ingestion failed for ${publicUrl}:`, err);
      });
    } catch (error) {
      console.error("Database or ingestion error:", error);
      return c.json({ error: 'Failed to process document' }, 500);
    }

    return c.json({
      message: 'File upload successful. Ingestion process has started in the background.',
      fileUrl: publicUrl
    });
  }
);

export default documents;
