interface ProductVariant {
  id: number;
  title: string;
  price: string;
  compare_at_price: string | null;
  option1: string;
  option2?: string;
  option3?: string;
  sku: string;
  inventory_quantity: number;
}

interface ProductOption {
  name: string;
  values: string[];
}

interface Product {
  id: number;
  title: string;
  body_html: string;
  vendor: string;
  product_type: string;
  created_at: string;
  tags: string;
  status: string;
  variants: ProductVariant[];
  options: ProductOption[];
}

interface ProductData {
  products: Product[];
}

function generateProductTableHTML(data2: ProductData): string {
  function formatDate(dateString: string): string {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    });
  }

  function getPriceRange(variants: ProductVariant[]): { priceRange: string; compareRange: string } {
    const prices = variants.map((v) => parseFloat(v.price));
    const comparePrices = variants
      .map((v) => (v.compare_at_price ? parseFloat(v.compare_at_price) : null))
      .filter((p) => p !== null);

    const minPrice = Math.min(...prices);
    const maxPrice = Math.max(...prices);

    const priceRange =
      minPrice === maxPrice
        ? `$${minPrice.toFixed(2)}`
        : `$${minPrice.toFixed(2)} - $${maxPrice.toFixed(2)}`;

    let compareRange = '';
    if (comparePrices.length > 0) {
      const minCompare = Math.min(...comparePrices);
      const maxCompare = Math.max(...comparePrices);
      compareRange =
        minCompare === maxCompare
          ? `$${minCompare.toFixed(2)}`
          : `$${minCompare.toFixed(2)} - $${maxCompare.toFixed(2)}`;
    }

    return { priceRange, compareRange };
  }

  function getVariantSummary(variants: ProductVariant[], options: ProductOption[]): string {
    const count = variants.length;
    const countText = `${count} variant${count !== 1 ? 's' : ''}`;

    if (variants.length === 1 && variants[0].title === 'Default Title') {
      return `<span class="variants-count">${countText}</span><br><small>Default Title</small>`;
    }

    // Group options for display
    const optionSummary = options.map((option) => option.values.join('/')).join(' × ');

    return `<span class="variants-count">${countText}</span><br><small>${optionSummary}</small>`;
  }

  function stripHtml(html: string): string {
    return html.replace(/<[^>]*>/g, '').trim();
  }

  const tableRows = data2.products
    .map((product) => {
      const { priceRange, compareRange } = getPriceRange(product.variants);
      const variantSummary = getVariantSummary(product.variants, product.options);
      const description = stripHtml(product.body_html) || 'No description available';
      const tags = product.tags || '-';
      const productType = product.product_type || '-';

      return `
                <tr>
                    <td><strong>${product.title}</strong><br><small>${description}</small></td>
                    <td class="vendor">${product.vendor}</td>
                    <td><span class="product-type">${productType}</span></td>
                    <td><span class="price">${priceRange}</span>${compareRange ? ` <span class="compare-price">${compareRange}</span>` : ''}</td>
                    <td>${variantSummary}</td>
                    <td class="tags">${tags}</td>
                    <td>${formatDate(product.created_at)}</td>
                    <td>${product.status}</td>
                </tr>`;
    })
    .join('');

  return `<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Product Data Table</title>
    <style>
        body {
            font-family: Arial, sans-serif;
            margin: 20px;
            background-color: #f5f5f5;
        }
        
        .container {
            max-width: 1200px;
            margin: 0 auto;
            background-color: white;
            padding: 20px;
            border-radius: 8px;
            box-shadow: 0 2px 10px rgba(0,0,0,0.1);
        }
        
        h1 {
            color: #333;
            text-align: center;
            margin-bottom: 30px;
        }
        
        table {
            width: 100%;
            border-collapse: collapse;
            margin-top: 20px;
        }
        
        th, td {
            padding: 12px;
            text-align: left;
            border-bottom: 1px solid #ddd;
        }
        
        th {
            background-color: #4CAF50;
            color: white;
            font-weight: bold;
            position: sticky;
            top: 0;
        }
        
        tr:hover {
            background-color: #f5f5f5;
        }
        
        tr:nth-child(even) {
            background-color: #f9f9f9;
        }
        
        .price {
            font-weight: bold;
            color: #2e7d32;
        }
        
        .compare-price {
            text-decoration: line-through;
            color: #757575;
            font-size: 0.9em;
        }
        
        .product-type {
            background-color: #e3f2fd;
            padding: 4px 8px;
            border-radius: 4px;
            font-size: 0.85em;
        }
        
        .vendor {
            font-weight: bold;
            color: #1976d2;
        }
        
        .tags {
            font-size: 0.85em;
            color: #666;
        }
        
        .variants-count {
            background-color: #fff3e0;
            padding: 4px 8px;
            border-radius: 4px;
            font-size: 0.85em;
            text-align: center;
        }
    </style>
</head>
<body>
    <div class="container">
        <h1>Product Catalog</h1>
        <table>
            <thead>
                <tr>
                    <th>Product Name</th>
                    <th>Vendor</th>
                    <th>Type</th>
                    <th>Price Range</th>
                    <th>Variants</th>
                    <th>Tags</th>
                    <th>Created</th>
                    <th>Status</th>
                </tr>
            </thead>
            <tbody>${tableRows}
            </tbody>
        </table>
    </div>
</body>
</html>`;
}

// Usage example:
// const productTableHTML = generateProductTableHTML(data2);

// Express.js usage:
// app.get('/products', (req, res) => {
//     const html = generateProductTableHTML(data2);
//     res.setHeader('Content-Type', 'text/html');
//     res.send(html);
// });

export { generateProductTableHTML };
