import mongoose, { Schema } from 'mongoose';

export enum VisitedLinkStatus {
  OK = 'ok',
  ERROR = 'error'
}

const VisitedLinkSchema = new Schema({
  url: {
    type: String,
    require: [true, 'URL is required'],
    unique: true
  },
  status: {
    type: String,
    enum: Object.values(VisitedLinkStatus)
  },
  error: {
    type: String
  },
  filingId: {
    type: Schema.Types.ObjectId
  }
});

export interface VisitedLinkBase {
  url: string;
  status: VisitedLinkStatus;
  error: string | null;
  filingId: Schema.Types.ObjectId | null;
}

export interface VisitedLink extends VisitedLinkBase, mongoose.Document {}

export default mongoose.model<VisitedLink>('VisitedLink', VisitedLinkSchema);
