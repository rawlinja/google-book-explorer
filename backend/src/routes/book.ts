import { Router, Request, Response } from 'express';
import { MemcacheClient } from 'memcache-client';
import { nanoid } from 'nanoid';

import jwt from 'jsonwebtoken';

type CachedData = {
  accessToken: string;
  refreshToken: string;
  expiresIn: number;
};

import { sendChatCompletion } from '../openai.client.js';
import {
  authorize,
  generateCodeChallenge,
  generateCodeVerifier,
  generateRandomString,
  GeneratorSingleton,
} from '../utils.js';

const router = Router();
const client = new MemcacheClient({ server: 'localhost:11211' });
const MAX_PAGE_INDEX = 100;

const codeVerifier = GeneratorSingleton.getInstance().getCodeVerifier();
const codeChallenge = GeneratorSingleton.getInstance().getCodeChallenge();

async function searchGoogleBooks(query: string): Promise<any> {
  const apiUrl = `${process.env.GOOGLE_BOOKS_API_URL}?${query}`;
  if (!process.env.GOOGLE_BOOKS_API_KEY) throw new Error('GOOGLE_BOOKS_API_KEY is not set.');
  if (!process.env.GOOGLE_BOOKS_API_URL) throw new Error('GOOGLE_BOOKS_API_URL is not set.');
  if (!query) throw new Error('Query parameter is required.');
  const result = await fetch(apiUrl);
  if (!result.ok) throw new Error(`Error fetching data: ${result.statusText}`);
  return await result.json();
}

router.get('/api/books', async (req: Request, res: Response) => {
  const cookies = req.cookies;
  if (!cookies.access_id) return res.status(401).json({ error: 'Unauthorized. Please log in.' });
  const accessId = cookies.access_id;
  const cachedData = await client.get(accessId);
  if (!cachedData) return res.status(401).json({ error: 'Unauthorized. Please log in again.' });
  const query = req.query.q as string;
  if (!query) return res.status(400).json({ error: 'Query parameter "q" is required.' });
  const title = req.query.title as string;
  const author = req.query.author as string;
  const isbn = req.query.isbn as string;
  const page = req.query.page as string;
  try {
    if (isNaN(parseInt(page, 10)))
      return res.status(400).json({ error: 'Page parameter is not a number.' });
    const pageIndex = parseInt(page, 10) > MAX_PAGE_INDEX ? MAX_PAGE_INDEX : parseInt(page, 10);
    const safeQuery = encodeURIComponent(query);
    let queryUrl = `q=${safeQuery}`;
    if (title) queryUrl += `+intitle:${encodeURIComponent(title)}`;
    if (author) queryUrl += `+inauthor:${encodeURIComponent(author)}`;
    if (isbn) queryUrl += `+isbn:${encodeURIComponent(isbn)}`;
    queryUrl += `&startIndex=${pageIndex || 0}`;
    const response = await searchGoogleBooks(queryUrl);
    return res.status(200).json(response);
  } catch (error) {
    return res.status(500).json({ error: 'Internal Server Error' });
  }
});

router.get('/api/v2/books', async (req: Request, res: Response) => {
  const cookies = req.cookies;
  const accessId = cookies.access_id;
  const cachedData = await client.get(accessId);
  const query = req.query.q as string;
  if (!query) return res.status(400).json({ error: 'Query parameter "q" is required.' });
  const page = req.query.page as string;
  const chatCompletion = await sendChatCompletion([{ role: 'user', content: query }]);
  try {
    if (isNaN(parseInt(page, 10)))
      return res.status(400).json({ error: 'Page parameter is not a number.' });
    const {
      function: { name: functionName, arguments: funcArgs },
    } = chatCompletion![0];
    const pageIndex = parseInt(page, 10) > MAX_PAGE_INDEX ? MAX_PAGE_INDEX : parseInt(page, 10);
    const safeQuery = encodeURIComponent(JSON.parse(funcArgs).query ?? query);
    let queryUrl = `q=${safeQuery}`;
    if (functionName !== 'get_books_by_title')
      queryUrl += `+intitle:${encodeURIComponent(JSON.parse(funcArgs).title)}`;
    if (functionName === 'get_books_by_author')
      queryUrl += `+inauthor:${encodeURIComponent(JSON.parse(funcArgs).author)}`;
    if (functionName === 'get_books_by_isbn')
      queryUrl += `+isbn:${encodeURIComponent(JSON.parse(funcArgs).isbn)}`;
    queryUrl += `&startIndex=${pageIndex || 0}`;
    const response = await searchGoogleBooks(queryUrl);
    return res.status(200).json(response);
  } catch (error) {
    return res.status(500).json({ error: 'Internal Server Error' });
  }
});

router.get('/api/books/bookshelves', async (req: Request, res: Response) => {
  const cookies = req.cookies;
  if (!cookies.access_id) return res.status(401).json({ error: 'Unauthorized. Please log in.' });
  const accessId = cookies.access_id;
  const cachedData = await client.get(accessId);
  if (!cachedData) return res.status(401).json({ error: 'Unauthorized. Please log in again.' });
  const secret = 'secret';
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith('Bearer '))
    return res.status(401).json({ error: 'Unauthorized. No token provided.' });
  const token = authHeader.split(' ')[1];
  try {
    const decoded = jwt.verify(token, secret);
    const accessToken = (decoded as { accessToken: string }).accessToken;
    const data = await fetch('https://www.googleapis.com/books/v1/mylibrary/bookshelves', {
      headers: { Authorization: `Bearer ${accessToken}` },
      method: 'GET',
    });
    if (!data.ok) throw new Error(`Error fetching bookshelves: ${data.statusText}`);
    const bookshelves = await data.json();
    return res.status(200).json(bookshelves);
  } catch (error) {
    return res.status(401).json({ error: 'Unauthorized. Invalid token.' });
  }
});

router.get('/oauth2callback', async (req: Request, res: Response) => {
  const { code, state } = req.query;

  if (!code || !state) {
    return res.status(400).json({ error: 'Authorization code and state are required.' });
  }

  const grantType = 'authorization_code';

  const response = await fetch('https://oauth2.googleapis.com/token', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/x-www-form-urlencoded',
    },
    body: new URLSearchParams({
      code: code as string,
      client_id: process.env.GOOGLE_CLIENT_ID!,
      client_secret: process.env.GOOGLE_CLIENT_SECRET!,
      redirect_uri: process.env.GOOGLE_REDIRECT_URI!,
      grant_type: grantType,
      code_verifier: codeVerifier,
    }),
  });

  const tokenData: any = await response.json();

  console.log(`codeVerifier: ${codeVerifier}`, `codeChallenge: ${codeChallenge}`);

  if (response.ok) {
    const data: CachedData = {
      accessToken: tokenData.access_token,
      refreshToken: tokenData.refresh_token,
      expiresIn: tokenData.expires_in,
    };

    const id = nanoid();
    console.log(`Generated ID for Memcached: ${id}`);
    // Store the tokens in Memcached
    await client.set(id, data, { noreply: true });

    // Successfully retrieved tokens
    console.log('Token data:', tokenData);
    /*res.cookie('access_id', id, {
      httpOnly: true,
      maxAge: tokenData.expires_in * 1000, // Convert seconds to milliseconds
    });*/

    const payload = {
      accessId: id,
      accessToken: tokenData.access_token,
      refreshToken: tokenData.refresh_token,
      expiresIn: tokenData.expires_in,
    };

    const token = jwt.sign(payload, 'secret', {
      expiresIn: '1h',
    });

    res.cookie('jwt_token', token, {
      httpOnly: true,
      maxAge: 3600000, // 1 hour in milliseconds
    });

    res.redirect('http://localhost:5173/auth-signed-in');
  } else {
    // Handle errors
    console.error('Error fetching token:', tokenData);
    res.status(500).json({ error: 'Failed to retrieve access token.' });
  }
});

router.get('/api/books/bookshelves', async (req: Request, res: Response) => {
  const cookies = req.cookies;

  if (!cookies.access_id) {
    return res.status(401).json({ error: 'Unauthorized. Please log in.' });
  }

  const accessId = cookies.access_id;
  const cachedData = await client.get(accessId);

  if (!cachedData) {
    return res.status(401).json({ error: 'Unauthorized. Please log in again.' });
  }
  console.log('Cached data:', cachedData);

  const secret = 'secret'; // Replace with your actual secret key
  const authHeader = req.headers.authorization;

  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({ error: 'Unauthorized. No token provided.' });
  }
  const token = authHeader.split(' ')[1];

  try {
    const decoded = jwt.verify(token, secret);
    console.log('Decoded JWT:', decoded);
    const accessToken = (decoded as { accessToken: string }).accessToken;
    const data = await fetch('https://www.googleapis.com/books/v1/mylibrary/bookshelves', {
      headers: {
        Authorization: `Bearer ${accessToken}`,
      },
      method: 'GET',
    });

    if (!data.ok) {
      throw new Error(`Error fetching bookshelves: ${data.statusText}`);
    }

    const bookshelves = await data.json();
    return res.status(200).json(bookshelves);
  } catch (error) {
    console.error('JWT verification failed:', error);
    return res.status(401).json({ error: 'Unauthorized. Invalid token.' });
  }
});

export default router;
