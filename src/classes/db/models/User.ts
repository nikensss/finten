import moment from 'moment';
import mongoose, { Schema } from 'mongoose';
import validtor from 'validator';

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
  isPremiumUntil: {
    type: Date
  }
});

UserSchema.virtual('isPremium').get(function (this: { isPremiumUntil: Date }) {
  return moment.utc().isBefore(this.isPremiumUntil);
});

// export interface VisitedLink {
//   url: string;
//   status: VisitedLinkStatus;
//   error: string | null;
//   filingId: Schema.Types.ObjectId | null;
// }

// export interface VisitedLinkModel extends VisitedLink, mongoose.Document {}

// export default mongoose.model<VisitedLinkModel>(
//   'VisitedLink',
//   VisitedLinkSchema
// );
