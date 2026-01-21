import { config } from 'dotenv';
import { resolve } from 'path';

// Load .env from project root (one level up from backend/)
config({ path: resolve(import.meta.dirname, '../../.env') });

// Dynamic import to ensure env vars are loaded first
const { app } = await import('./app.js');

const PORT = process.env.PORT || 3001;

app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
  console.log(`Environment: ${process.env.NODE_ENV || 'development'}`);
});
