import { Router } from 'express';
import TokenFactory from '../../../classes/auth/TokenFactory';
import FinTenDB from '../../../classes/db/FinTenDB';
import { default as LOGGER } from '../../../classes/logger/DefaultLogger';

const LOGGER_NAME = 'user-routes';
const users = Router();

users.post('/login', async (req, res) => {
  const { username, password } = req.body;
  if (!username || !password) {
    return res.status(400).send({ err: 'Invalid credentials' });
  }

  try {
    const db = await FinTenDB.getInstance().connect();
    const user = await db.findUser({ username });

    if (user === null) {
      return res.status(400).json({ error: 'Invalid credentials' });
    }

    const isPasswordValid = await user.checkPassword(password);
    if (!isPasswordValid) {
      return res.status(400).json({ error: 'Invalid credentials' });
    }

    const payload = { id: user._id };
    LOGGER.get(LOGGER_NAME).info(`User ${username} logged in successfully!`);
    return res.status(200).json({
      username,
      email: user.email,
      isPremium: user.isPremium,
      token: TokenFactory.sign(payload)
    });
  } catch (e) {
    res.status(500).json({ e });
  }
});

users.post('/signup', async (req, res) => {
  const { username, password, email } = req.body;
  console.log(req.body);
  try {
    const db = await FinTenDB.getInstance().connect();
    const user = await db.createUser({ username, password, email });

    LOGGER.get(LOGGER_NAME).info(
      `New user signed up successfully: ${JSON.stringify(user, null, 2)}`
    );
    const payload = { id: user._id };

    return res.status(200).json({
      username: user.username,
      email: user.email,
      token: TokenFactory.sign(payload)
    });
  } catch (e) {
    if (/duplicate key/.test(e.toString())) {
      const duplicateKey = Object.keys(e.keyPattern)[0];
      return res.status(400).json({ error: `${duplicateKey} already registered` });
    }

    return res.status(400).json({ error: e.toString() });
  }
});

export default users;
