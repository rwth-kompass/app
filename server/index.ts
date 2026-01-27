import fastify from 'fastify';
import cors from '@fastify/cors';
import rateLimit from '@fastify/rate-limit';
import axios, { AxiosError } from 'axios';
import dotenv from 'dotenv';

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

const API_URL = process.env.API_URL || 'https://studienberater.giftgruen.com';
const API_TOKEN = process.env.API_TOKEN;
const PORT = parseInt(new URL(process.env.VITE_SERVER_URL || 'http://localhost:3003').port) || 3003;

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
      } catch (e) {
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

    const response = await axios.post(`${API_URL}/api/chat/completions`, request.body, {
      headers: {
        'Content-Type': 'application/json',
        ...(API_TOKEN ? { 'Authorization': `Bearer ${API_TOKEN}` } : {})
      }
    });
    return response.data;
  } catch (error) {
    const axiosError = error as AxiosError;
    reply.status(axiosError.response?.status || 500).send(axiosError.response?.data || { error: 'Chat completion failed' });
  }
});

const start = async () => {
  try {
    await server.listen({ port: PORT, host: '0.0.0.0' });
  } catch (err) {
    process.exit(1);
  }
};

start();
