import { Router } from 'express';
import { isAdmin } from '../../classes/auth/Passport';
import users from './admin/users';
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
api.use('/users', users);

export default api;
