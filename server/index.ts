import fastify from 'fastify';
import cors from '@fastify/cors';
import rateLimit from '@fastify/rate-limit';
import axios, { AxiosError } from 'axios';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';
import fastifyStatic from '@fastify/static';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

dotenv.config();
const server = fastify({
  logger: false
});

server.register(rateLimit, {
  max: 100,
  timeWindow: '1 minute'
});

server.register(cors, {
  origin: true
});

server.register(fastifyStatic, {
  root: path.join(__dirname, '../dist'),
  prefix: '/',
});

const API_URL = process.env.API_URL || 'https://studienberater.giftgruen.com';
const API_TOKEN = process.env.API_TOKEN;
const PORT = parseInt(new URL(process.env.VITE_SERVER_URL || 'http://localhost:3003').port) || 3003;

server.get('/', async (request, reply) => {
  return reply.sendFile('index.html');
});

server.get('/api/models', async (request, reply) => {
  try {
    const endpoints = [`${API_URL}/api/models`, `${API_URL}/api/v1/models`];
    let modelsData: any[] = [];

    for (const url of endpoints) {
      try {
        const response = await axios.get(url, {
          headers: {
            'Content-Type': 'application/json',
            ...(API_TOKEN ? { 'Authorization': `Bearer ${API_TOKEN}` } : {})
          },
          timeout: 5000
        });

        const data = response.data.data || response.data;
        if (Array.isArray(data) && data.length > 0) {
          modelsData = data;
          break;
        }
      } catch {
        // Continue to next endpoint
      }
    }

    return { data: modelsData };
  } catch (error) {
    const axiosError = error as AxiosError;
    reply.status(axiosError.response?.status || 500).send(axiosError.response?.data || { error: 'Failed to fetch models' });
  }
});

server.post('/api/chat/completions', async (request, reply) => {
  try {
    const body = request.body as any;
    if (body.messages && Array.isArray(body.messages)) {
      const lastMessage = body.messages[body.messages.length - 1];
      if (lastMessage && lastMessage.content && lastMessage.content.length > 1000) {
        return reply.status(400).send({ error: 'Message too long. Maximum 1000 characters.' });
      }
    }

    if (body.stream === true) {
      try {
        const response = await axios.post(`${API_URL}/api/chat/completions`, body, {
          headers: {
            'Content-Type': 'application/json',
            ...(API_TOKEN ? { 'Authorization': `Bearer ${API_TOKEN}` } : {})
          },
          responseType: 'stream'
        });

        reply
          .code(200)
          .header('Content-Type', 'text/event-stream')
          .header('Cache-Control', 'no-cache')
          .header('Connection', 'keep-alive')
          .header('X-Accel-Buffering', 'no');

        return reply.send(response.data);
      } catch (streamError: any) {
        console.error('Error initiating stream:', streamError.message);
        if (streamError.response) {
          console.error('Error response data:', streamError.response.data);
          console.error('Error response status:', streamError.response.status);
        }
        throw streamError;
      }
    } else {
      const response = await axios.post(`${API_URL}/api/chat/completions`, body, {
        headers: {
          'Content-Type': 'application/json',
          ...(API_TOKEN ? { 'Authorization': `Bearer ${API_TOKEN}` } : {})
        }
      });
      return response.data;
    }
  } catch (error) {
    const axiosError = error as AxiosError;
    reply.status(axiosError.response?.status || 500).send(axiosError.response?.data || { error: 'Chat completion failed' });
  }
});

const start = async () => {
  try {
    await server.listen({ port: PORT, host: '0.0.0.0' });
    console.log(`Server running at http://localhost:${PORT}`);
  } catch {
    process.exit(1);
  }
};

start();
