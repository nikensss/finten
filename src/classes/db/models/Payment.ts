import mongoose, { Schema } from 'mongoose';

export interface Payment {
  date: Date;
  amount: number;
}

const PaymentSchema = new Schema({
  date: { type: Date, required: true },
  amount: { type: Number, required: true }
});

export interface PaymentModel extends Payment, mongoose.Document {}

export default mongoose.model<PaymentModel>('Payment', PaymentSchema);
