import DownloadManager from '../../../src/classes/download/DownloadManager';
import Fred from '../../../src/classes/fred/Fred';
import { expect } from 'chai';
// import Macro from '../../../src/classes/fred/Macro.enum';

describe('Fred tests', function () {
  it('should create a Fred', () => {
    const fred = new Fred(new DownloadManager());
    expect(fred).to.not.be.undefined;
  });

  // it('should get one macro', () => {
  //   const fred = new Fred(new DownloadManager());
  //   const durableGoods = fred.getMacro(Macro.MANUFACTURER_DURABLE_GOODS);
  //   expect(durableGoods.file_type).to.equal('json');
  //   expect(durableGoods.count).to.be.greaterThan(-1);
  // });
});
