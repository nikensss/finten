import { Router } from 'express';
import { isAdmin, isPremium } from '../../classes/auth/Passport';
import users from './admin/users';
import company from './company/company';
import secgov from './secgov/secgov';

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

api.use('/secgov', isAdmin, secgov);
api.use('/company', isPremium, company);
api.use('/users', users);

export default api;
