import mongoose, { Model, Schema } from 'mongoose';

/**
 * The interface to be used when creating objects to be inserted in the Tickers
 * collection
 */
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

/**
 * The base document with, at least, the required fields from the Ticker interface
 * and fields from a mongoose Document. Add also again the fields from the base
 * interface that should have mongoose Types (like Types.Array<string> or
 * Types.Map<string>).
 * Add the non-required and virutal fields, together with the methods of the
 * Schema here.
 */
export interface TickerBaseDocument extends Ticker, mongoose.Document {}

export interface TickerDocument extends TickerBaseDocument {}

TickerSchema.pre<TickerDocument>('save', function (next) {
  this.TradingSymbol = this.TradingSymbol.toUpperCase();
  next();
});

TickerSchema.statics.finByEntityCentralIndexKey = async function (
  EntityCentralKeyIndex: number
) {
  return await this.findOne({ EntityCentralKeyIndex });
};

TickerSchema.statics.parse = function (s: string) {
  //the file from SecGov has the following structure: "aapl\t320193\n"
  const [TradingSymbol, EntityCentralKeyIndex] = s.split(/\s/);

  if (TradingSymbol.length > 0 && EntityCentralKeyIndex.length > 0) {
    return { TradingSymbol, EntityCentralKeyIndex };
  }

  throw new Error(
    `Invalid arguments: TradingSymbol = '${TradingSymbol}; EntityCentralKeyIndex: ${EntityCentralKeyIndex}`
  );
};

export interface TickerModel extends Model<TickerDocument> {
  parse(s: string): TickerModel;
  finByEntityCentralIndexKey(n: number): TickerModel;
}

export default mongoose.model<TickerDocument, TickerModel>(
  'Ticker',
  TickerSchema
);
