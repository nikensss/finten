/* eslint-disable @typescript-eslint/no-empty-interface */
import mongoose, { Document, Model, Schema } from 'mongoose';

export interface Filing {
  EntityRegistrantName: string;
  CurrentFiscalYearEndDate: string;
  EntityCentralIndexKey: number;
  EntityFilerCategory: string;
  TradingSymbol: string;
  DocumentPeriodEndDate: string;
  DocumentFiscalYearFocus: string;
  DocumentFiscalPeriodFocus: string;
  DocumentType: string;
  Assets: number;
  CurrentAssets: number;
  NoncurrentAssets: number;
  LiabilitiesAndEquity: number;
  Liabilities: number;
  CurrentLiabilities: number;
  NoncurrentLiabilities: number;
  CommitmentsAndContingencies: number;
  TemporaryEquity: number;
  Equity: number;
  EquityAttributableToNoncontrollingInterest: number;
  EquityAttributableToParent: number;
  Revenues: number;
  CostOfRevenue: number;
  GrossProfit: number;
  OperatingExpenses: number;
  CostsAndExpenses: number;
  OtherOperatingIncome: number;
  OperatingIncomeLoss: number;
  NonoperatingIncomeLoss: number;
  InterestAndDebtExpense: number;
  IncomeBeforeEquityMethodInvestments: number;
  IncomeFromEquityMethodInvestments: number;
  IncomeFromContinuingOperationsBeforeTax: number;
  IncomeTaxExpenseBenefit: number;
  IncomeFromContinuingOperationsAfterTax: number;
  IncomeFromDiscontinuedOperations: number;
  ExtraordinaryItemsGainLoss: number;
  NetIncomeLoss: number;
  NetIncomeAvailableToCommonStockholdersBasic: number;
  PreferredStockDividendsAndOtherAdjustments: number;
  NetIncomeAttributableToNoncontrollingInterest: number;
  NetIncomeAttributableToParent: number;
  OtherComprehensiveIncome: number;
  ComprehensiveIncome: number;
  ComprehensiveIncomeAttributableToParent: number;
  ComprehensiveIncomeAttributableToNoncontrollingInterest: number;
  NonoperatingIncomeLossPlusInterestAndDebtExpense: number;
  NonoperatingIncomePlusInterestAndDebtExpensePlusIncomeFromEquityMethodInvestments: number;
  NetCashFlow: number;
  NetCashFlowsOperating: number;
  NetCashFlowsInvesting: number;
  NetCashFlowsFinancing: number;
  NetCashFlowsOperatingContinuing: number;
  NetCashFlowsInvestingContinuing: number;
  NetCashFlowsFinancingContinuing: number;
  NetCashFlowsOperatingDiscontinued: number;
  NetCashFlowsInvestingDiscontinued: number;
  NetCashFlowsFinancingDiscontinued: number;
  NetCashFlowsDiscontinued: number;
  ExchangeGainsLosses: number;
  NetCashFlowsContinuing: number;
}

const FilingSchema = new Schema({
  EntityRegistrantName: String,
  CurrentFiscalYearEndDate: String,
  EntityCentralIndexKey: {
    type: Number,
    index: true
  },
  EntityFilerCategory: String,
  TradingSymbol: String,
  DocumentPeriodEndDate: String,
  DocumentFiscalYearFocus: String,
  DocumentFiscalPeriodFocus: String,
  DocumentType: String,
  Assets: Number,
  CurrentAssets: Number,
  NoncurrentAssets: Number,
  LiabilitiesAndEquity: Number,
  Liabilities: Number,
  CurrentLiabilities: Number,
  NoncurrentLiabilities: Number,
  CommitmentsAndContingencies: Number,
  TemporaryEquity: Number,
  Equity: Number,
  EquityAttributableToNoncontrollingInterest: Number,
  EquityAttributableToParent: Number,
  Revenues: Number,
  CostOfRevenue: Number,
  GrossProfit: Number,
  OperatingExpenses: Number,
  CostsAndExpenses: Number,
  OtherOperatingIncome: Number,
  OperatingIncomeLoss: Number,
  NonoperatingIncomeLoss: Number,
  InterestAndDebtExpense: Number,
  IncomeBeforeEquityMethodInvestments: Number,
  IncomeFromEquityMethodInvestments: Number,
  IncomeFromContinuingOperationsBeforeTax: Number,
  IncomeTaxExpenseBenefit: Number,
  IncomeFromContinuingOperationsAfterTax: Number,
  IncomeFromDiscontinuedOperations: Number,
  ExtraordinaryItemsGainLoss: Number,
  NetIncomeLoss: Number,
  NetIncomeAvailableToCommonStockholdersBasic: Number,
  PreferredStockDividendsAndOtherAdjustments: Number,
  NetIncomeAttributableToNoncontrollingInterest: Number,
  NetIncomeAttributableToParent: Number,
  OtherComprehensiveIncome: Number,
  ComprehensiveIncome: Number,
  ComprehensiveIncomeAttributableToParent: Number,
  ComprehensiveIncomeAttributableToNoncontrollingInterest: Number,
  NonoperatingIncomeLossPlusInterestAndDebtExpense: Number,
  NonoperatingIncomePlusInterestAndDebtExpensePlusIncomeFromEquityMethodInvestments: Number,
  NetCashFlow: Number,
  NetCashFlowsOperating: Number,
  NetCashFlowsInvesting: Number,
  NetCashFlowsFinancing: Number,
  NetCashFlowsOperatingContinuing: Number,
  NetCashFlowsInvestingContinuing: Number,
  NetCashFlowsFinancingContinuing: Number,
  NetCashFlowsOperatingDiscontinued: Number,
  NetCashFlowsInvestingDiscontinued: Number,
  NetCashFlowsFinancingDiscontinued: Number,
  NetCashFlowsDiscontinued: Number,
  ExchangeGainsLosses: Number,
  NetCashFlowsContinuing: Number
});

interface FilingBaseDocument extends Filing, Document {}

export interface FilingDocument extends FilingBaseDocument {}

export interface FilingModel extends Model<FilingDocument> {}

export default mongoose.model<FilingDocument, FilingModel>('Filing', FilingSchema);
