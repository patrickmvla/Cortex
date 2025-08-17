import { Hono } from 'hono';
import { zValidator } from '@hono/zod-validator';
import { z } from 'zod';
import { ingestService } from '../services/ingest';
import { r2Service } from '../services/r2';

const documents = new Hono();

const uploadSchema = z.object({
  file: z.instanceof(File),
});

documents.post('/upload', zValidator('form', uploadSchema), async (c) => {
  const { file } = c.req.valid('form');

  let publicUrl: string;
  try {
    publicUrl = await r2Service.uploadFile(file);
    console.log(`File uploaded successfully. Public URL: ${publicUrl}`);
  } catch (error) {
    console.error("R2 upload failed:", error);
    return c.json({ error: 'Failed to upload file' }, 500);
  }

  try {
    // Trigger the ingestion process asynchronously (fire-and-forget)
    // In a production app, this would be better handled by a message queue.
    ingestService.processUrl(publicUrl).catch(err => {
        console.error(`Background ingestion failed for ${publicUrl}:`, err);
    });
  } catch (error) {
    // This catch is for immediate errors, though most will be in the promise above
    console.error("Ingestion failed to start:", error);
    return c.json({ error: 'Failed to start document processing' }, 500);
  }

  return c.json({
    message: 'File upload successful. Ingestion process has started in the background.',
    fileUrl: publicUrl
  });
});

export default documents;
