import mongoose, { Model, Schema } from 'mongoose';
import { UserDocument } from './User';

export interface Payment {
  user: Schema.Types.ObjectId;
  date: Date;
  amount: number;
}

const PaymentSchema = new Schema({
  user: {
    ref: 'User',
    type: Schema.Types.ObjectId,
    required: true
  },
  date: { type: Date, required: true },
  amount: { type: Number, required: true }
});

interface PaymentBaseDocument extends Payment, mongoose.Document {}

export interface PaymentDocument extends PaymentBaseDocument {
  user: UserDocument['_id'];
}

export interface PaymentPopulatedDocument extends PaymentDocument {
  user: UserDocument;
}

PaymentSchema.statics.findWithUser = async function (id: string) {
  return this.findById(id).populate('user').exec();
};

export interface PaymentModel extends Model<PaymentDocument> {
  findWithUser(id: string): Promise<PaymentPopulatedDocument>;
}

export default mongoose.model<PaymentDocument, PaymentModel>('Payment', PaymentSchema);
