import { Router } from 'express';
import { isAdmin } from '../../classes/auth/Passport';
import users from './admin/users';
import secgov from './secgov/secgov';

const api = Router();

api.use('/secgov', isAdmin, secgov);
api.use('/users', users);

export default api;
