import mongoose, { Schema } from 'mongoose';

const VisitedLinkSchema = new Schema({
  url: {
    type: String,
    require: [true, 'URL is required'],
    unique: true
  },
  status: {
    type: String,
    enum: ['ok', 'error']
  },
  error: {
    type: String
  },
  filingId: {
    type: Schema.Types.ObjectId
  }
});

export interface VisitedLink extends mongoose.Document {
  url: string;
  status: 'ok' | 'error';
  error: string | null;
  filingId: Schema.Types.ObjectId;
}

export default mongoose.model<VisitedLink>('VisitedLink', VisitedLinkSchema);
