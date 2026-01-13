import { Router, Request, Response } from 'express';
import { answerWithTools } from '../services/openaiService.js';
import * as z from 'zod';

const BookQuerySchema = z.object({
  q: z.string().min(1, 'Query parameter "q" is required.'),
  title: z.string().optional().describe('Filter by book title'),
});

type CachedData = {
  accessToken: string;
  refreshToken: string;
  expiresIn: number;
};

const router = Router();

router.get('/', async (req: Request, res: Response) => {
  const resp = BookQuerySchema.safeParse(req.query);

  if (!resp.success) {
    return res.status(400).json({ error: resp.error.errors.map((e) => e.message).join(', ') });
  }

  const qry = resp.data.q;
  if (!qry) return res.status(400).json({ error: 'Query parameter "q" is required.' });
  console.log(`Received book query: ${qry}`);
  try {
    const result = await answerWithTools(qry);

    if (!Array.isArray(result)) {
      return res.status(200).json({
        totalItems: 0,
        items: [],
        kind: 'books#volumes',
      });
    }

    const items = result.map((book: any) => ({
      id: book.id,
      volumeInfo: {
        title: book.title,
        authors: book.authors,
        imageLinks: {
          thumbnail: book.thumbnail,
          smallThumbnail: book.thumbnail,
        },
      },
    }));

    return res.status(200).json({
      totalItems: items.length,
      items,
      kind: 'books#volumes',
    });
  } catch (error) {
    console.error('Books route error:', error);
    return res.status(500).json({ error: 'Internal Server Error' });
  }
});

export default router;
