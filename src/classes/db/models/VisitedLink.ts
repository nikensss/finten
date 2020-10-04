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

export interface VisitedLink {
  url: string;
  status: VisitedLinkStatus;
  error: string | null;
  filingId: Schema.Types.ObjectId | null;
}

export interface VisitedLinkModel extends VisitedLink, mongoose.Document {}

export default mongoose.model<VisitedLinkModel>(
  'VisitedLink',
  VisitedLinkSchema
);
