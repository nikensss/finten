/* eslint-disable @typescript-eslint/no-empty-interface */
import mongoose, { Model, Schema } from 'mongoose';

/**
 * The interface to be used when creating objects to be inserted in the Tickers
 * collection
 */
export interface Ticker {
  TradingSymbol: string;
  EntityCentralIndexKey: number;
}

const TickerSchema = new Schema({
  TradingSymbol: {
    type: String,
    required: true,
    unique: true
  },
  EntityCentralIndexKey: {
    type: Number,
    required: true,
    unique: true,
    min: 0,
    max: Number.MAX_SAFE_INTEGER
  }
});

/**
 * The base document with the required fields from the Ticker interface (present
 * here by extension), the fields from a mongoose Document (also here by
 * extension), and the non-required and virutal fields, together with the
 * 'methods' of the Schema.
 * Add also again the fields from the base
 * interface that should have mongoose Types (like Types.Array<string> or
 * Types.Map<string>).
 *
 * TL;DR: add non-required fields, 'virtuals' and 'methods' of the Schema
 */
interface TickerBaseDocument extends Ticker, mongoose.Document {}

export interface TickerDocument extends TickerBaseDocument {}

TickerSchema.pre<TickerDocument>('save', function (next) {
  this.TradingSymbol = this.TradingSymbol.toUpperCase();
  next();
});

TickerSchema.statics.finByEntityCentralIndexKey = async function (EntityCentralIndexKey: number) {
  return await this.findOne({ EntityCentralIndexKey });
};

TickerSchema.statics.parse = function (s: string) {
  //the file from SecGov has the following structure: "aapl\t320193\n"
  const [TradingSymbol, EntityCentralIndexKey] = s.split(/\s/);

  if (TradingSymbol.length > 0 && EntityCentralIndexKey.length > 0) {
    return { TradingSymbol, EntityCentralIndexKey };
  }

  throw new Error(
    `Invalid arguments: TradingSymbol = '${TradingSymbol}; EntityCentralIndexKey: ${EntityCentralIndexKey}`
  );
};

/**
 * Add the 'statics' of the Schema to the <T>Model.
 */
export interface TickerModel extends Model<TickerDocument> {
  parse(s: string): Ticker;
  finByEntityCentralIndexKey(n: number): TickerDocument;
}

export default mongoose.model<TickerDocument, TickerModel>('Ticker', TickerSchema);
