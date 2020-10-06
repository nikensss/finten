import { Router } from 'express';
import TokenFactory from '../../../classes/auth/TokenFactory';
import User from '../../../classes/db/models/User';

const users = Router();

users.get('/', (req, res) => res.status(404).json({ message: 'Not found!' }));

users.post('/login', (req, res, next) => {
  res.json({
    message: 'in progress'
  });
});

users.post('/register', (req, res, next) => {
  const { username, password, email } = req.body;
  //FIXME: if DB is not connected, it will never save!
  //Make sure DB is connected when executing this!
  const user = new User({ username, password, email });
  console.log({ username, password, email, body: req.body });
  user
    .validate()
    .then(() => user.save())
    .then(user => {
      const payload = { id: user._id };
      return res.status(200).json({ token: TokenFactory.sign(payload) });
    })
    .catch(e => res.status(400).json({ error: e.toString() }));
});

export default users;
