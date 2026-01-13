import cors from 'cors';

const corsOrigin = process.env.CORS_ORIGIN || 'http://localhost:3000';

const corsOptions = {
  origin: corsOrigin,
  credentials: true,
};

export default cors(corsOptions);
