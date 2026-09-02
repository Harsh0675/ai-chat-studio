import 'dotenv/config';
import axios from 'axios';
import cors from 'cors';
import express, { type Request, type Response } from 'express';

const app = express();
const port = Number(process.env.PORT ?? '3001');
const providerUrl = process.env.PROVIDER_URL ?? 'https://api.openai.com/v1/chat/completions';
const providerApiKey = process.env.PROVIDER_API_KEY;
const frontendOrigin = process.env.FRONTEND_ORIGIN ?? 'http://localhost:5173';

app.use(
  cors({
    origin: frontendOrigin,
    credentials: true,
  }),
);
app.use(express.json({ limit: '2mb' }));

app.get('/health', (_req: Request, res: Response) => {
  res.json({ ok: true, provider: providerUrl });
});

app.post('/api/proxy', async (req: Request, res: Response) => {
  const { messages, model = 'gpt-4o-mini' } = req.body ?? {};

  if (!providerApiKey) {
    return res.status(500).json({
      error: 'Missing PROVIDER_API_KEY in server environment.',
    });
  }

  if (!Array.isArray(messages) || messages.length === 0) {
    return res.status(400).json({
      error: 'Request body must include a non-empty messages array.',
    });
  }

  try {
    const response = await axios.post(
      providerUrl,
      {
        model,
        messages,
        temperature: 0.7,
      },
      {
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${providerApiKey}`,
        },
      },
    );

    const choice = response.data?.choices?.[0];
    const content = choice?.message?.content;

    if (!content) {
      return res.status(502).json({
        error: 'Upstream provider returned no content.',
      });
    }

    return res.json({
      message: {
        role: 'assistant',
        content,
      },
    });
  } catch (error: any) {
    const message =
      error?.response?.data?.error?.message ??
      error?.message ??
      'Unknown provider error';

    return res.status(502).json({
      error: message,
    });
  }
});

app.listen(port, () => {
  console.log(`AI proxy server listening on http://localhost:${port}`);
});
