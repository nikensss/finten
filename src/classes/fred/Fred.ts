import axios, { AxiosInstance } from 'axios';
import FredResponse from './FredResponse.interface';
import Macro from './Macro.enum';

class Fred {
  public static readonly FILE_TYPE: 'json' | 'xml' = 'json';
  public static readonly SORT_ORDER: 'asc' | 'desc' = 'asc';
  public static readonly ORDER_BY: string = 'observation_date';
  public static readonly API_KEY = process.env.FRED_API_KEY;

  private http: AxiosInstance;

  constructor(http: AxiosInstance = axios) {
    this.http = http;
  }

  async getMacro(macro: Macro): Promise<FredResponse> {
    const response = await this.http.get<FredResponse>(this.buildUrl(macro));

    return response.data;
  }

  private buildUrl(macro: Macro): string {
    if (typeof Fred.API_KEY === 'undefined') {
      throw new Error('No API key for Fred is provided!');
    }
    const urlBuilder = new FredUrlBuilder()
      .setApiKey(Fred.API_KEY)
      .setSeriesId(macro)
      .setFileType(Fred.FILE_TYPE)
      .setSortOrder(Fred.SORT_ORDER);
    return urlBuilder.build();
  }
}

class FredUrlBuilder {
  public static readonly FRED_API = 'https://api.stlouisfed.org/fred/series/observations?';

  private apiKey: string | undefined;
  private seriesId: Macro | undefined;
  private fileType: 'json' | 'xml' = 'json';
  private sortOrder: 'asc' | 'desc' = 'asc';

  setApiKey(apiKey: string) {
    this.apiKey = apiKey;
    return this;
  }

  setSeriesId(seriesId: Macro) {
    this.seriesId = seriesId;
    return this;
  }

  setFileType(fileType: 'json' | 'xml') {
    this.fileType = fileType;
    return this;
  }

  setSortOrder(sortOrder: 'asc' | 'desc') {
    this.sortOrder = sortOrder;
    return this;
  }

  build(): string {
    return `${FredUrlBuilder.FRED_API}&api_key=${this.apiKey}&series_id=${this.seriesId}&file_type=${this.fileType}&sort_order=${this.sortOrder}`;
  }
}
export default Fred;
