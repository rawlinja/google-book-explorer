export async function getShopifyAccessToken(shop: string, code: string) {
  const result = await fetch(`https://${shop}/admin/oauth/access_token`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: new URLSearchParams({
      client_id: process.env.SHOPIFY_CLIENT_ID as string,
      client_secret: process.env.SHOPIFY_CLIENT_SECRET as string,
      code,
    } as any),
  });
  return await result.json();
}

export async function getShopifyProducts(accessToken: string) {
  const result = await fetch(
    'https://senior-innovation-shop.myshopify.com/admin/api/2025-07/products.json',
    {
      method: 'GET',
      headers: { 'X-Shopify-Access-Token': accessToken },
    }
  );
  return await result.json();
}
