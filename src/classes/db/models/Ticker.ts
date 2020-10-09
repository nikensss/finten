import mongoose, { Model, Schema } from 'mongoose';

export interface Ticker {
  TradingSymbol: string;
  EntityCentralKeyIndex: number;
}

const TickerSchema = new Schema({
  TradingSymbol: {
    type: String,
    required: true,
    unique: true
  },
  EntityCentralKeyIndex: {
    type: Number,
    required: true,
    unique: true,
    min: 0,
    max: Number.MAX_SAFE_INTEGER
  }
});

export interface TickerBaseDocument extends Ticker, mongoose.Document {}

export interface TickerDocument extends TickerBaseDocument {}

export interface TickerModel extends Model<TickerDocument> {
  parse(s: string): TickerModel;
}

TickerSchema.pre<TickerDocument>('save', function (next) {
  this.TradingSymbol = this.TradingSymbol.toUpperCase();
  next();
});

TickerSchema.statics.parse = function (s: string) {
  const [TradingSymbol, EntityCentralKeyIndex] = s.split(/\s/);
  if (TradingSymbol.length > 0 && EntityCentralKeyIndex.length > 0) {
    return { TradingSymbol, EntityCentralKeyIndex };
  }
  throw new Error(
    `Invalid arguments: TradingSymbol = '${TradingSymbol}; EntityCentralKeyIndex: ${EntityCentralKeyIndex}`
  );
};

export default mongoose.model<TickerDocument, TickerModel>(
  'Ticker',
  TickerSchema
);
