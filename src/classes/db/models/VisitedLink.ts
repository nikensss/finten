/* eslint-disable @typescript-eslint/no-empty-interface */
import mongoose, { Model, Schema, Document } from 'mongoose';

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
    unique: true,
    index: true
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

VisitedLinkSchema.methods.hasBeenFixed = function (id: string): Promise<VisitedLinkDocument> {
  this.filingId = id;
  this.error = null;
  this.status = VisitedLinkStatus.OK;

  return this.save();
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
