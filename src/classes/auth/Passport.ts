import passport from 'passport';
import { ExtractJwt, Strategy } from 'passport-jwt';
import User from '../db/models/User';
import { Secret } from 'jsonwebtoken';
import FinTenDB from '../db/FinTenDB';

if (typeof process.env.SECRET !== 'string') {
  throw new Error('No SECRET available');
}

const secret: Secret = process.env.SECRET;
const options = {
  jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
  secretOrKey: secret
};

passport.use(
  'userAuthentication',
  new Strategy(options, (payload, next) => {
    console.log(`Auth user. Payload is`, payload);
    FinTenDB.getInstance()
      .then(() => User.findOne({ _id: payload.id }))
      .then((user) => next(null, user))
      .catch((e) => next(e));
  })
);

passport.use(
  'isPremium',
  new Strategy(options, (payload, next) => {
    console.log(`isPremium. Payload is`, payload);
    FinTenDB.getInstance()
      .then(() => User.findOne({ _id: payload.id }))
      .then((user) => {
        if (user === null) {
          return next(null, false, { message: 'Invalid credentials' });
        }
        if (!user.isPremium) {
          return next(null, false, { message: 'Not premium' });
        }
      })
      .catch((e) => next(e));
  })
);

export default passport;
export { secret };
export const userAuthentication = passport.authenticate('userAuthentication', {
  session: false
});
export const isPremium = passport.authenticate('isPremium', { session: false });
