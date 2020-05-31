import { Router } from 'express';

const api = Router();

api.get('/', (req, res) => {
  res.json({
    message: 'API root 😎'
  });
});

export default api;
