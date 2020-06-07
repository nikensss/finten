import { Router } from 'express';
import company from './company/company';
import secgov from './secgov/secgov';
const api = Router();

api.use((req, res, next) => {
  next();
});

api.get('/', (req, res) => {
  res.json({
    message: 'API root 😎'
  });
});

api.use('/secgov', secgov);
api.use('/company', company);

export default api;
