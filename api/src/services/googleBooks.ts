import { books, type books_v1 } from '@googleapis/books';
import { config } from '../config/index.js';

export interface BookItem {
  id: string;
  title: string;
  authors: string[];
  thumbnail?: string;
  publishedDate?: string;
  description?: string;
  pageCount?: number;
  categories: string[];
  infoLink?: string;
}

export interface GoogleBooksResult {
  items: BookItem[];
  totalItems: number;
}

const client = books({ version: 'v1', auth: config.GOOGLE_BOOKS_API_KEY });

function toBookItem(volume: books_v1.Schema$Volume): BookItem {
  const vi = volume.volumeInfo ?? {};
  const thumbnail = vi.imageLinks?.thumbnail ?? vi.imageLinks?.smallThumbnail;

  return {
    id: volume.id ?? '',
    title: vi.title ?? '',
    authors: vi.authors ?? [],
    categories: vi.categories ?? [],
    ...(thumbnail && { thumbnail: thumbnail.replace('http://', 'https://') }),
    ...(vi.publishedDate && { publishedDate: vi.publishedDate }),
    ...(vi.description && { description: vi.description }),
    ...(vi.pageCount && { pageCount: vi.pageCount }),
    ...(vi.infoLink && { infoLink: vi.infoLink }),
  };
}

async function search(q: string, startIndex: number): Promise<GoogleBooksResult> {
  const { data } = await client.volumes.list({ q, maxResults: 10, startIndex });

  return {
    items: (data.items ?? []).map(toBookItem),
    totalItems: data.totalItems ?? 0,
  };
}

export async function searchByTitle(title: string, startIndex: number): Promise<GoogleBooksResult> {
  return search(`intitle:${title}`, startIndex);
}

export async function searchByAuthor(
  author: string,
  startIndex: number
): Promise<GoogleBooksResult> {
  return search(`inauthor:${author}`, startIndex);
}

export async function searchByIsbn(isbn: string, startIndex: number): Promise<GoogleBooksResult> {
  return search(`isbn:${isbn}`, startIndex);
}

export async function searchBySubject(
  subject: string,
  startIndex: number
): Promise<GoogleBooksResult> {
  return search(`subject:${subject}`, startIndex);
}

export async function searchByPublisher(
  publisher: string,
  startIndex: number
): Promise<GoogleBooksResult> {
  return search(`inpublisher:${publisher}`, startIndex);
}

export async function searchByLccn(lccn: string, startIndex: number): Promise<GoogleBooksResult> {
  return search(`lccn:${lccn}`, startIndex);
}
