import { Router } from 'express';
import { isPremium, userAuthentication } from '../../../classes/auth/Passport';
import TokenFactory from '../../../classes/auth/TokenFactory';
import FinTenDB from '../../../classes/db/FinTenDB';
import { User } from '../../../classes/db/models/User';

const users = Router();

users.get('/', userAuthentication, (req, res) =>
  res.status(200).json({ message: 'authentication works', user: req.user })
);

users.get('/premium', isPremium, (req, res) => {
  res.status(200).json({ isPremium: true, user: req.user });
});

users.post('/login', (req, res) => {
  const { username, password } = req.body;
  if (!username || !password) {
    return res.status(400).send({ err: 'Missing data' });
  }

  FinTenDB.getInstance()
    .connect()
    .then((db) => db.findUser({ username }))
    .then((user) => {
      if (user === null) {
        return res.status(400).json({ error: 'Invalid credentials' });
      }

      user.checkPassword(password).then((correctPassword) => {
        if (!correctPassword) {
          return res.status(400).json({ error: 'Invalid credentials' });
        }
        const payload = { id: user._id };
        console.log(`User ${username} logged in successfully!`);
        return res
          .status(200)
          .json({ username, token: TokenFactory.sign(payload) });
      });
    })
    .catch((error) => res.status(500).json({ error }));
});

users.post('/register', async (req, res) => {
  const { username, password, email } = req.body;
  console.log({ username, password, email, body: req.body });
  FinTenDB.getInstance()
    .connect()
    .then((db) => db.insertUser({ username, password, email } as User))
    .then((user) => {
      const payload = { id: user._id };
      return res.status(200).json({ token: TokenFactory.sign(payload) });
    })
    .catch((e) => res.status(400).json({ error: e.toString() }));
});

export default users;
