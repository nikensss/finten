/* eslint-disable @typescript-eslint/no-empty-interface */
import moment from 'moment';
import mongoose, { Model, Schema } from 'mongoose';
import validator from 'validator';
import Encrypter from '../../auth/Encrypter';
import PaymentSchema, { Payment } from './Payment';

export interface User {
  username: string;
  password: string;
  email: string;
  isAdmin: boolean;
  registrationDate?: Date;
  isPremiumUntil?: Date;
  payments?: Payment[];
  changePasswordRequest?: Date;
  isPremium: boolean;
  lastPayment: Payment;
  checkPassword(password: string): Promise<boolean>;
}

const UserSchema = new Schema({
  username: {
    type: String,
    required: [true, 'Username must be provided'],
    unique: true,
    trim: true,
    index: { unique: true, sparse: true }
  },
  password: {
    type: String,
    required: [true, 'Password must be provided'],
    minlength: 8
  },
  email: {
    type: String,
    required: [true, 'Email must be provided'],
    unique: true,
    trim: true,
    index: { unique: true, sparse: true },
    validate: (value: string) => validator.isEmail(value)
  },
  isAdmin: {
    type: Boolean,
    default: false
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

interface UserBaseDocument extends User, mongoose.Document {
  isPremium: boolean;
  lastPayment: Payment;
  checkPassword(password: string): Promise<boolean>;
}

UserSchema.virtual('isPremium').get(function (this: UserBaseDocument) {
  return moment.utc().isBefore(this.isPremiumUntil);
});

UserSchema.virtual('lastPayment').get(function (this: UserBaseDocument) {
  if (!Array.isArray(this.payments)) {
    return;
  }

  return this.payments[this.payments.length - 1];
});

UserSchema.methods.checkPassword = function (
  password: string
): Promise<boolean> {
  return Encrypter.compare(password, this.password);
};

export interface UserDocument extends UserBaseDocument {}

UserSchema.pre<UserDocument>('save', function (next) {
  Encrypter.hash(this.password)
    .then((hash) => {
      this.password = hash;
      return next();
    })
    .catch((e) => next(e));
});

export interface UserModel extends Model<UserDocument> {}

export default mongoose.model<UserDocument, UserModel>('User', UserSchema);
