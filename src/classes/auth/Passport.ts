import { ExtractJwt, Strategy } from 'passport-jwt';

const secret = process.env.SECRET;
const options = {
  jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
  secretOrKey: secret
};

// const authenticateUser = new Strategy();
