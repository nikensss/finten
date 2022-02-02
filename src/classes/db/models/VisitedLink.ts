/* eslint-disable @typescript-eslint/no-empty-interface */
import mongoose, { Model, Schema, Document } from 'mongoose';

export enum VisitedLinkStatus {
  OK = 'ok',
  ERROR = 'error'
}

export interface VisitedLink {
  url: string;
  info: string;
  status: VisitedLinkStatus;
  error: string | null;
  filingId: Schema.Types.ObjectId | null;
}

const VisitedLinkSchema = new Schema({
  url: {
    type: String,
    require: [true, 'URL is required'],
    unique: true,
    index: true
  },
  info: {
    type: String
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
    ref: 'Filing',
    type: Schema.Types.ObjectId
  }
});

VisitedLinkSchema.methods.hasBeenFixed = function (id: Schema.Types.ObjectId): void {
  const doc = this as unknown;
  (doc as VisitedLinkBaseDocument).filingId = id;
  (doc as VisitedLinkBaseDocument).error = null;
  (doc as VisitedLinkBaseDocument).status = VisitedLinkStatus.OK;
};

interface VisitedLinkBaseDocument extends VisitedLink, Document {
  hasBeenFixed(id: string): Promise<VisitedLinkDocument>;
}
export interface VisitedLinkDocument extends VisitedLinkBaseDocument {}
export interface VisitedLinkModel extends Model<VisitedLinkDocument> {}

export default mongoose.model<VisitedLinkDocument, VisitedLinkModel>(
  'VisitedLink',
  VisitedLinkSchema
);
