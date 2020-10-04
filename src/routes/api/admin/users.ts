import { Router } from 'express';
import FinTenDB from '../../../classes/db/FinTenDB';

const users = Router();

users.post('/login', (req, res, next) => {
  res.json({
    message: 'company route 😎'
  });
});

export default users;
