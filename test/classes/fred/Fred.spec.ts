import Fred from '../../../src/classes/fred/Fred';
import { expect } from 'chai';
import Macro from '../../../src/classes/fred/Macro.enum';
import { anyString, instance, mock, when } from 'ts-mockito';
import { AxiosInstance, AxiosResponse } from 'axios';
import FredResponse from '../../../src/classes/fred/FredResponse.interface';

const fredResponse = ({} as unknown) as FredResponse;
const mockResponse = {
  data: fredResponse,
  status: -1,
  statusText: 'MOCK',
  headers: 'headers',
  config: {}
} as AxiosResponse<FredResponse>;

describe('Fred tests', function () {
  this.slow(1200);

  it('should get MANUFACTURER_DURABLE_GOODS', async () => {
    const mockHttp = mock<AxiosInstance>();

    when(mockHttp.get(anyString())).thenCall((url: string) => {
      expect(url).to.include('series_id=DGORDER');

      return Promise.resolve(mockResponse);
    });

    const http = instance(mockHttp);
    const fred = new Fred(http);
    await fred.getMacro(Macro.MANUFACTURER_DURABLE_GOODS);
  });

  it('should get one MANUFACTURER_CONSUMER_DURABLE_GOODS', async () => {
    const mockHttp = mock<AxiosInstance>();
    when(mockHttp.get(anyString())).thenCall((url: string) => {
      expect(url).to.include('series_id=ACDGNO');

      return Promise.resolve(mockResponse);
    });

    const http: AxiosInstance = instance(mockHttp);

    const fred = new Fred(http);
    await fred.getMacro(Macro.MANUFACTURER_CONSUMER_DURABLE_GOODS);
  });

  it('should get one PERSONAL_DURABLE_GOODS_MOTOR_VEHICLES_AND_PARTS', async () => {
    const mockHttp = mock<AxiosInstance>();
    when(mockHttp.get(anyString())).thenCall((url: string) => {
      expect(url).to.include('series_id=DMOTRC1Q027SBEA');

      return Promise.resolve(mockResponse);
    });

    const http: AxiosInstance = instance(mockHttp);

    const fred = new Fred(http);
    await fred.getMacro(Macro.PERSONAL_DURABLE_GOODS_MOTOR_VEHICLES_AND_PARTS);
  });
});
