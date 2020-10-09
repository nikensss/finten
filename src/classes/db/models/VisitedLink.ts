/* eslint-disable @typescript-eslint/no-empty-interface */
import mongoose, { Model, Schema } from 'mongoose';

export enum VisitedLinkStatus {
  OK = 'ok',
  ERROR = 'error'
}

export interface VisitedLink {
  url: string;
  status: VisitedLinkStatus;
  error: string | null;
  filingId: Schema.Types.ObjectId | null;
}

const VisitedLinkSchema = new Schema({
  url: {
    type: String,
    require: [true, 'URL is required'],
    unique: true
  },
  status: {
    type: String,
    enum: Object.values(VisitedLinkStatus),
    require: [true, 'Status is required']
  },
  error: {
    type: String
  },
  filingId: {
    type: Schema.Types.ObjectId
  }
});

interface VisitedLinkBaseDocument extends VisitedLink, mongoose.Document {}
export interface VisitedLinkDocument extends VisitedLinkBaseDocument {}
export interface VisitedLinkModel extends Model<VisitedLinkDocument> {}

export default mongoose.model<VisitedLinkDocument, VisitedLinkModel>(
  'VisitedLink',
  VisitedLinkSchema
);
