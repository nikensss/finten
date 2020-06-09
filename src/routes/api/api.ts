import { Router } from 'express';
import company from './company/company';
import secgov from './secgov/secgov';
import DefaultLogger from '../../logger/DefaultLogger';

const api = Router();

api.use((req, res, next) => {
  console.log(`requested ${req.url}`);
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
