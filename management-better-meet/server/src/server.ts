import 'dotenv/config';
import express from 'express';
import cors from 'cors';
import subsystemRoutes from './routes/subsystem.routes';

const JWT_SECRET = process.env.JWT_SECRET;
if (!JWT_SECRET) {
  throw new Error('JWT_SECRET não definido no .env');
}

const app = express();
app.use(cors());
app.use(express.json());

app.get('/health', (_req, res) => {
  res.json({ status: 'ok' });
});

app.use(subsystemRoutes);

const PORT = process.env.PORT || 3335;
app.listen(PORT, () => console.log(`Management API rodando na porta ${PORT}`));
