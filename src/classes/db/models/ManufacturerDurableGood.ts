import mongoose, { Document, Model, Schema } from 'mongoose';
import Macro from './Macro.interface';

const ManufacturerDurableGoodsSchema = new Schema({
  date: {
    type: Date,
    required: true,
    index: true,
    unique: true
  },
  value: {
    type: Number,
    required: true
  }
});

// interface ManufacturerDurableGoodsBaseDocument extends Macro, Document {}

export interface ManufacturerDurableGoodsDocument extends Macro, Document {}

ManufacturerDurableGoodsSchema.pre<ManufacturerDurableGoodsDocument>('save', function (next) {
  if (typeof this.value !== 'number') {
    this.value = parseFloat(this.value);
  }

  next();
});

// eslint-disable-next-line @typescript-eslint/no-empty-interface
export interface ManufacturerDurableGoodsModel extends Model<ManufacturerDurableGoodsDocument> {}

export default mongoose.model<ManufacturerDurableGoodsDocument, ManufacturerDurableGoodsModel>(
  'ManufacturerDurableGoods',
  ManufacturerDurableGoodsSchema
);
