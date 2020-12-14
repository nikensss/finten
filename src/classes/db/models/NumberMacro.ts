import mongoose, { Schema, Document, Model } from 'mongoose';

export interface NumberMacro {
  date: Date;
  value: number;
}

const NumberMacroSchema = new Schema({
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

// interface NumberMacroBaseDocument extends Macro, Document {}

export interface NumberMacroDocument extends NumberMacro, Document {}

// NumberMacroSchema.pre<NumberMacroDocument>('save', function (next) {
//   if (typeof this.value !== 'number') {
//     this.value = parseFloat(this.value);
//   }

//   next();
// });

// eslint-disable-next-line @typescript-eslint/no-empty-interface
export interface NumberMacroModel extends Model<NumberMacroDocument> {}

export const ManufacturerDurableGoods = mongoose.model<NumberMacroDocument, NumberMacroModel>(
  'ManufacturerDurableGoods',
  NumberMacroSchema
);

export const PersonalDurableGoodsMotorsVehiclesAndParts = mongoose.model<
  NumberMacroDocument,
  NumberMacroModel
>('PersonalDurableGoodsMotorsVehiclesAndParts', NumberMacroSchema);

export const ManufacturerConsumerDurableGoods = mongoose.model<
  NumberMacroDocument,
  NumberMacroModel
>('ManufacturerConsumerDurableGoods', NumberMacroSchema);

export const IndustrialProductionDurableConsumerGoods = mongoose.model<
  NumberMacroDocument,
  NumberMacroModel
>('IndustrialProductionDurableConsumerGoods', NumberMacroSchema);
