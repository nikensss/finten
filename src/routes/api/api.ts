import { Router } from 'express';
import company from './company/company';
const api = Router();

api.get('/', (req, res) => {
  res.json({
    message: 'API root 😎'
  });
});

api.use('/company', company);

export default api;
