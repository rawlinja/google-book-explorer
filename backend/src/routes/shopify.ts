import { Router, Request, Response } from 'express';
import { generateProductTableHTML } from '../showdata.js';

const router = Router();

router.get('/shopify/auth', async (req: Request, res: Response) => {
  const { code, shop } = req.query;
  const url = new URL(`https://${shop}/admin/oauth/authorize`);
  url.searchParams.append('client_id', process.env.SHOPIFY_CLIENT_ID as string);
  url.searchParams.append('scopes', 'read_products,write_products');
  url.searchParams.append('redirect_uri', process.env.SHOPIFY_REDIRECT_URI as string);
  url.searchParams.append('state', 'adfaf');
  url.searchParams.append('grant_options[]', '');
  res.redirect(url.toString());
});

router.get('/shopify/auth/callback', async (req: Request, res: Response) => {
  const { code, state, hmac, timestamp, shop } = req.query;
  const result = await fetch(`https://${shop}/admin/oauth/access_token`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: new URLSearchParams({
      client_id: process.env.SHOPIFY_CLIENT_ID as string,
      client_secret: process.env.SHOPIFY_CLIENT_SECRET as string,
      code,
    } as any),
  });
  const data = await result.json();
  const result2 = await fetch(
    'https://senior-innovation-shop.myshopify.com/admin/api/2025-07/products.json',
    {
      method: 'GET',
      headers: { 'X-Shopify-Access-Token': data.access_token },
    }
  );
  const data2 = await result2.json();
  const html = generateProductTableHTML(data2);
  res.setHeader('Content-Type', 'text/html');
  res.send(html);
});

export default router;
