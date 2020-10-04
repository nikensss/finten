import passport from 'passport';
import { ExtractJwt, Strategy } from 'passport-jwt';
import User from '../db/models/User';
import { Secret } from 'jsonwebtoken';

if (typeof process.env.SECRET !== 'string') {
  throw new Error('No SECRET available');
}

const secret: Secret = process.env.SECRET;
const options = {
  jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
  secretOrKey: secret
};

const authenticateUser = new Strategy(options, (payload, next) => {
  User.findOne({ _id: payload.id })
    .then(user => next(null, user))
    .catch(e => next(e));
});

const isPremium = new Strategy(options, (payload, next) => {
  User.findOne({ _id: payload.id })
    .then(user => {
      if (user === null) next(new Error('Unknown user!'));
      if (!user?.isPremium()) next(new Error('Not premium'));
      return next(user);
    })
    .catch(e => next(e));
});

passport.use('authenticateUser', authenticateUser);
passport.use('isPremium', isPremium);

export default passport;
export { secret };
export const auth = passport.authenticate('jwt', { session: false });
