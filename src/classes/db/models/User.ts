/* eslint-disable @typescript-eslint/no-empty-interface */
import moment from 'moment';
import mongoose, { Model, Schema } from 'mongoose';
import validator from 'validator';
import Encrypter from '../../auth/Encrypter';
import { Payment, PaymentDocument } from './Payment';

export interface User {
  username: string;
  password: string;
  email: string;
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
  payments: [
    {
      ref: 'Payment',
      type: mongoose.Schema.Types.ObjectId
    }
  ],
  changePasswordRequest: {
    type: Date,
    default: null
  },
  nonce: {
    type: String,
    default: null
  }
});

UserSchema.virtual('isPremium').get(function (this: UserBaseDocument) {
  return moment.utc().isBefore(this.isPremiumUntil);
});

UserSchema.virtual('lastPayment').get(function (this: UserBaseDocument) {
  if (!Array.isArray(this.payments)) {
    return;
  }

  return this.payments[this.payments.length - 1];
});

UserSchema.methods.checkPassword = function (password: string): Promise<boolean> {
  return Encrypter.compare(password, this.password);
};

/**
 * We extend Document (from mongoose) to attach virtuals, instance methods and
 * built-in methods like save.
 */
interface UserBaseDocument extends User, mongoose.Document {
  isAdmin: boolean;
  registrationDate: Date;
  isPremiumUntil: Date;
  payments: Schema.Types.ObjectId[] | Record<string, unknown>;
  changePasswordRequest: Date;
  isPremium: boolean;
  lastPayment: Payment;
  checkPassword(password: string): Promise<boolean>;
  nonce: string;
}

/**
 * The payments prop refers to documents in another collection, so its type is
 * non-deterministic. This conflicts with the idea of strong typing. So two more
 * interfaces are required: UserDocument and UserPopulatedDocument.
 *
 * There are 3 things that should be noticed:
 *
 *  -virtuals and instance methods are attached to the UserBaseDocument, so
 * UserDocument and UserPopulatedDocument have access to those. We could just
 * export UserDocument and UserPopulatedDocument.
 *
 *  -because this document is not populated yet, the payments array only has the
 * id's of the Payment documents it refers to. This is addressed in the
 * UserPopulatedDocument interface.
 *
 *  -certain types would be overwritten to have access to the provided mongoose
 * types (like Maps or Arrays). See https://medium.com/@agentwhs/complete-guide-for-typescript-for-mongoose-for-node-js-8cc0a7e470c1
 * for more.
 */
export interface UserDocument extends UserBaseDocument {
  payments: PaymentDocument['_id'];
}

/**
 * In the populated document, the payments array is an array filled with elements
 * of type PaymentModel.
 */
export interface UserPopulatedDocument extends UserDocument {
  payments: PaymentDocument[];
}

UserSchema.pre<UserBaseDocument>('save', function (next) {
  Encrypter.hash(this.password)
    .then((hash) => {
      this.password = hash;
      return next();
    })
    .catch((e) => next(e));
});

UserSchema.statics.findWithPayments = async function (id: string) {
  return this.findById(id).populate('payments').exec();
};

export interface UserModel extends Model<UserDocument> {
  findWithPayments(id: string): Promise<UserPopulatedDocument>;
}

export default mongoose.model<UserDocument, UserModel>('User', UserSchema);
