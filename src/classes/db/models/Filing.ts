import mongoose, { Schema } from 'mongoose';

export interface Filing {
  EntityRegistrantName: string;
  CurrentFiscalYearEndDate: string;
  EntityCentralIndexKey: string;
  EntityFilerCategory: string;
  TradingSymbol: string;
  DocumentPeriodEndDate: string;
  DocumentFiscalYearFocus: string;
  DocumentFiscalPeriodFocus: string;
  DocumentFiscalYearFocusContext: string;
  DocumentFiscalPeriodFocusContext: string;
  DocumentType: string;
  BalanceSheetDate: string;
  IncomeStatementPeriodYTD: string;
  ContextForInstants: string;
  ContextForDurations: string;
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
  ExtraordaryItemsGainLoss: number;
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
  SGR: number;
  ROA: number | null;
  ROE: number | null;
  ROS: number | null;
}

const FilingSchema = new Schema({
  EntityRegistrantName: String,
  CurrentFiscalYearEndDate: String,
  EntityCentralIndexKey: String,
  EntityFilerCategory: String,
  TradingSymbol: String,
  DocumentPeriodEndDate: String,
  DocumentFiscalYearFocus: String,
  DocumentFiscalPeriodFocus: String,
  DocumentFiscalYearFocusContext: String,
  DocumentFiscalPeriodFocusContext: String,
  DocumentType: String,
  BalanceSheetDate: String,
  IncomeStatementPeriodYTD: String,
  ContextForInstants: String,
  ContextForDurations: String,
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
  ExtraordaryItemsGainLoss: Number,
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
  NetCashFlowsContinuing: Number,
  SGR: Number,
  ROA: Number,
  ROE: Number,
  ROS: Number
});

export interface FilingModel extends Filing, mongoose.Document {}

FilingSchema.pre<FilingModel>('validate', function (next: Function) {
  if (this.ROA !== null && isNaN(this.ROA)) this.ROA = null;
  if (this.ROE !== null && isNaN(this.ROE)) this.ROE = null;
  if (this.ROS !== null && isNaN(this.ROS)) this.ROS = null;
  next();
});

export default mongoose.model<FilingModel>('Filing', FilingSchema);
