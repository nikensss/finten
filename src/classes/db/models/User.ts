import moment from 'moment';
import mongoose, { Schema } from 'mongoose';
import validtor from 'validator';
import Encrypter from '../../auth/Encrypter';
import PaymentSchema, { Payment } from './Payment';

export interface User {
  username: string;
  password: string;
  email: string;
  registrationDate: Date;
  isPremiumUntil: Date;
  isPremium(): boolean;
  payments: Payment[];
  lastPayment(): Payment;
  changePasswordRequest: Date;
}

const UserSchema = new Schema({
  username: {
    type: String,
    required: [true, 'Username must be provided'],
    unique: true
  },
  password: {
    type: String,
    required: [true, 'Password must be provided']
  },
  email: {
    type: String,
    required: [true, 'Email must be provided'],
    unique: true,
    validate: (value: string) => validtor.isEmail(value)
  },
  registrationDate: {
    type: Date,
    default: Date.now
  },
  isPremiumUntil: {
    type: Date,
    default: null
  },
  payments: {
    type: [PaymentSchema.schema],
    default: []
  },
  changePasswordRequest: {
    type: Date,
    default: null
  },
  nonce: {
    type: String,
    default: null
  }
});

UserSchema.virtual('isPremium').get(function (this: User) {
  return moment.utc().isBefore(this.isPremiumUntil);
});

UserSchema.virtual('lastPayment').get(function (this: User) {
  return this.payments[this.payments.length - 1];
});

UserSchema.methods.checkPassword = function (password: string) {
  return Encrypter.compare(password, this.password);
};

UserSchema.pre<UserModel>('save', function (next) {
  const user = this;
  Encrypter.hash(user.password)
    .then(hash => {
      user.password = hash;
      return next();
    })
    .catch(e => next(e));
});

export interface UserModel extends User, mongoose.Document {}

export default mongoose.model<UserModel>('User', UserSchema);
