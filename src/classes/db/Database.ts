import { QueryCursor } from 'mongoose';
import { Filing, FilingDocument } from './models/Filing';
import { Ticker, TickerDocument } from './models/Ticker';
import { User, UserDocument } from './models/User';
import { VisitedLink, VisitedLinkDocument } from './models/VisitedLink';

//This will potentially be used in the future, when we find out how to properly
//manage the database using generics. There is a lot of code duplication now
//because we have to do the exact same thing with each collection.

/* 
interface DatabaseReader<T> {
  read(): Promise<T[]>;
  findById(id: string): Promise<T | null>;
  findOne(cond?: Partial<T>): Promise<T | null>;
  find(cond: Partial<T>): Promise<T[]>;
}

interface DatabaseWriter<T> {
  create(item: Partial<T>): Promise<T>;
  update(id: mongoose.Types.ObjectId, updates: Partial<T>): Promise<T>;
  delete(id: string): Promise<T>;
}

interface Database<T> extends DatabaseReader<T>, DatabaseWriter<T> {
  connect(uri?: string): Promise<Database<T>>;
  disconnect(): Promise<void>;
}
*/

interface Database {
  connect(uri?: string): Promise<Database>;
  disconnect(): Promise<void>;
  insertTicker(ticker: Ticker): Promise<TickerDocument>;
  insertFiling(filing: Filing): Promise<FilingDocument>;
  insertVisitedLink(visitedLink: VisitedLink): Promise<VisitedLinkDocument>;
  insertUser(user: User): Promise<UserDocument>;
  findTicker(match: Partial<TickerDocument>, select?: string): Promise<TickerDocument | null>;
  findFilings(match: Partial<FilingDocument>, select?: string): QueryCursor<FilingDocument>;
  findVisitedLinks(
    match: Partial<VisitedLinkDocument>,
    select?: string
  ): QueryCursor<VisitedLinkDocument>;
  findUser(match: Partial<UserDocument>, select?: string): Promise<UserDocument | null>;
  updateFiling(match: Partial<Filing>, update: Partial<Filing>): Promise<FilingDocument>;
  updateVisitedLink(
    match: Partial<VisitedLink>,
    update: Partial<VisitedLink>
  ): Promise<VisitedLink>;
  distinctFilingKey(key: string): Promise<string[]>;
}

export default Database;
