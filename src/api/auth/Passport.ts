import { Secret } from 'jsonwebtoken';
import passport from 'passport';
import { ExtractJwt, Strategy } from 'passport-jwt';
import { FinTenDB } from '../../classes/db/FinTenDB';
import User from '../../classes/db/models/User';
import { default as LOGGER } from '../../classes/logger/DefaultLogger';

if (typeof process.env.SECRET !== 'string') {
  throw new Error('No SECRET available');
}

const secret: Secret = process.env.SECRET;
const options = {
  jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
  secretOrKey: secret
};

//to allow only registered users
passport.use(
  'isRegistered',
  new Strategy(options, (payload, next) => {
    FinTenDB.getInstance()
      .connect()
      .then(() => User.findOne({ _id: payload.id }))
      .then((user) => next(null, user))
      .catch((e) => next(e));
  })
);

//to allow only premium users
passport.use(
  'isPremium',
  new Strategy(options, (payload, next) => {
    FinTenDB.getInstance()
      .connect()
      .then(() => User.findOne({ _id: payload.id }))
      .then((user) => {
        if (user === null) {
          return next(null, false, { message: 'Invalid credentials' });
        }

        if (user.isPremium) {
          LOGGER.get('isPremium').info(
            `user ${user.username} is ${user.isAdmin ? 'admin' : 'premium'}`
          );
          return next(null, user);
        }

        LOGGER.get('isPremium').info(`user ${user.username} is neither admin nor premium`);
        return next(null, false, { message: 'Invalid credentials' });
      })
      .catch((e) => next(e));
  })
);

//to allow only admins
passport.use(
  'isAdmin',
  new Strategy(options, (payload, next) => {
    FinTenDB.getInstance()
      .connect()
      .then(() => User.findOne({ _id: payload.id }))
      .then((user) => {
        if (user === null) return next(null, false, { message: 'Invalid credentials' });

        if (user.isAdmin) {
          LOGGER.get('isAdmin').info(`user ${user.username} is admin`);
          return next(null, user);
        }

        LOGGER.get('isAdmin').info(`user ${user.username} not admin`);
        return next(null, false, { message: 'Invalid credentials' });
      })
      .catch((e) => next(e));
  })
);

export default passport;
export { secret };
export const isRegistered = passport.authenticate('isRegistered', { session: false });
export const isPremium = passport.authenticate('isPremium', { session: false });
export const isAdmin = passport.authenticate('isAdmin', { session: false });
