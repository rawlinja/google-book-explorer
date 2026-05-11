import cors from 'cors';
import helmet from 'helmet';
import rateLimit from 'express-rate-limit';

const allowedOrigins = [
  'http://localhost:5173',
  // Add other allowed origins here
];

const corsOptions = {
  origin: allowedOrigins,
  credentials: true,
};

const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // limit each IP to 100 requests per windowMs
});

export default [helmet(), cors(corsOptions), limiter];
