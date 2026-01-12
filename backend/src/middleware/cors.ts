import cors from 'cors';

const allowedOrigins = [
  'http://localhost:5173',
  // Add other allowed origins here
];

const corsOptions = {
  origin: allowedOrigins,
  credentials: true,
};

export default cors(corsOptions);
