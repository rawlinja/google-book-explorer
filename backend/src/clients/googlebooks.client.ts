export async function googleBooksSearch(q: string) {
  const url = new URL('https://www.googleapis.com/books/v1/volumes');
  url.searchParams.set('q', q);
  url.searchParams.set('maxResults', '10');

  const res = await fetch(url.toString());
  if (!res.ok) throw new Error(`Google Books API error: ${res.status}`);
  const json = await res.json();

  return (json.items ?? []).map((item: any) => {
    const v = item.volumeInfo ?? {};
    return {
      id: item.id,
      title: v.title,
      authors: v.authors ?? [],
      publishedDate: v.publishedDate,
      description: v.description,
      pageCount: v.pageCount,
      categories: v.categories ?? [],
      thumbnail: v.imageLinks?.thumbnail,
      infoLink: v.infoLink,
    };
  });
}

export async function runTool(name: string, args: any) {
  switch (name) {
    case 'get_books_by_title':
      return googleBooksSearch(`intitle:${args.title}`);
    case 'get_books_by_author':
      return googleBooksSearch(`inauthor:${args.author}`);
    case 'get_books_by_isbn':
      return googleBooksSearch(`isbn:${args.isbn}`);
    default:
      throw new Error(`Unknown tool: ${name}`);
  }
}
