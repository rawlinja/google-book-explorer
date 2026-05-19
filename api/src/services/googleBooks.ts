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

async function search(q: string, startIndex: number): Promise<GoogleBooksResult> {
  const url = new URL('https://www.googleapis.com/books/v1/volumes');
  url.searchParams.set('q', q);
  url.searchParams.set('maxResults', '10');
  url.searchParams.set('startIndex', String(startIndex));
  url.searchParams.set('key', config.GOOGLE_BOOKS_API_KEY);

  const res = await fetch(url.toString());
  if (!res.ok) throw new Error(`Google Books API error: ${res.status}`);

  const data = (await res.json()) as { totalItems?: number; items?: any[] };

  const items: BookItem[] = (data.items ?? []).map((item: any) => {
    const vi = item.volumeInfo ?? {};
    return {
      id: item.id,
      title: vi.title ?? '',
      authors: vi.authors ?? [],
      categories: vi.categories ?? [],
      ...(vi.imageLinks?.thumbnail && { thumbnail: vi.imageLinks.thumbnail }),
      ...(vi.publishedDate && { publishedDate: vi.publishedDate }),
      ...(vi.description && { description: vi.description }),
      ...(vi.pageCount && { pageCount: vi.pageCount }),
      ...(vi.infoLink && { infoLink: vi.infoLink }),
    };
  });

  return { items, totalItems: data.totalItems ?? 0 };
}

export async function searchByTitle(title: string, startIndex: number): Promise<GoogleBooksResult> {
  return search(`intitle:${title}`, startIndex);
}

export async function searchByAuthor(author: string, startIndex: number): Promise<GoogleBooksResult> {
  return search(`inauthor:${author}`, startIndex);
}

export async function searchByIsbn(isbn: string, startIndex: number): Promise<GoogleBooksResult> {
  return search(`isbn:${isbn}`, startIndex);
}
