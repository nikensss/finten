/* eslint-disable @typescript-eslint/no-empty-interface */
import csv from 'csv-parser';
import fs from 'fs';
import mongoose, { Document, Model, Schema } from 'mongoose';

/**
 * Reflects all the fields from the Schema
 */
export interface CompanyInfo {
  EntityCentralIndexKey: number;
  StandardIndustrialClassification: number;
  EntityRegistrantName: string;
  StateCountry: string;
  Office: string;
  IndustryTitle: string;
  TradingSymbol: string | null;
}

const CompanyInfoSchema = new Schema({
  EntityCentralIndexKey: {
    type: Number,
    required: true,
    min: 0,
    max: Number.MAX_SAFE_INTEGER
  },
  StandardIndustrialClassification: {
    type: Number,
    required: true
  },
  EntityRegistrantName: {
    type: String,
    required: true
  },
  StateCountry: String,
  Office: String,
  IndustryTitle: String,
  TradingSymbol: {
    type: String,
    trim: true,
    index: true,
    sparse: true
  }
});

CompanyInfoSchema.index({ EntityCentralIndexKey: 1, TradingSymbol: 1 }, { unique: true });

interface CompanyInfoBaseDocument extends CompanyInfo, Document {}

export interface CompanyInfoDocument extends CompanyInfoBaseDocument {}

CompanyInfoSchema.pre<CompanyInfoDocument>('save', function (next) {
  if (this.TradingSymbol !== null) {
    this.TradingSymbol = this.TradingSymbol.toUpperCase();
  }
  next();
});

CompanyInfoSchema.statics.findByEntityCentralIndexKey = async function (
  EntityCentralIndexKey: CompanyInfo['EntityCentralIndexKey']
): Promise<CompanyInfoDocument> {
  return await this.findOne({ EntityCentralIndexKey });
};

CompanyInfoSchema.statics.findByTradingSymbol = async function (
  TradingSymbol: CompanyInfo['TradingSymbol']
): Promise<CompanyInfoDocument | null> {
  return await this.findOne({ TradingSymbol });
};

CompanyInfoSchema.statics.parseFile = function (file: string) {
  const companies: CompanyInfo[] = [];

  return new Promise((res, rej) => {
    fs.createReadStream(file)
      .pipe(csv())
      .on('data', (d: CompanyInfo) => {
        if (
          !d.hasOwnProperty('EntityCentralIndexKey') ||
          !d.hasOwnProperty('StandardIndustrialClassification') ||
          !d.hasOwnProperty('EntityRegistrantName') ||
          !d.hasOwnProperty('StateCountry') ||
          !d.hasOwnProperty('Office') ||
          !d.hasOwnProperty('IndustryTitle') ||
          !d.hasOwnProperty('TradingSymbol')
        ) {
          rej(new Error(`Cannot parse! Missing data! ${JSON.stringify(d, null, 2)}`));
        }
        if (d.TradingSymbol === '') {
          d.TradingSymbol = null;
        }
        companies.push(d);
      })
      .on('end', () => res(companies))
      .on('error', (err) => rej(err));
  });
};

/**
 * Add the 'statics' of the Schema to the <T>Model.
 */
export interface CompanyInfoModel extends Model<CompanyInfoDocument> {
  parseFile(file: string): Promise<CompanyInfo[]>;
  findByEntityCentralIndexKey(
    EntityCentralIndexKey: CompanyInfo['EntityCentralIndexKey']
  ): Promise<CompanyInfoDocument>;
  findByTradingSymbol(
    TradingSymbol: CompanyInfo['TradingSymbol']
  ): Promise<CompanyInfoDocument | null>;
}

/**
 * When importing this, call it CompanyInfoModel
 */
export default mongoose.model<CompanyInfoDocument, CompanyInfoModel>(
  'CompanyInfo',
  CompanyInfoSchema
);
