import Fred from '../../../src/classes/fred/Fred';
import { expect } from 'chai';
import Macro from '../../../src/classes/fred/Macro.enum';

describe('Fred learning tests', function () {
  this.slow(12000);

  it('should get MANUFACTURER_DURABLE_GOODS', async () => {
    const fred = new Fred();
    const durableGoods = await fred.getMacro(Macro.MANUFACTURER_DURABLE_GOODS);
    expect(durableGoods.file_type).to.equal('json');
    expect(durableGoods.count).to.be.greaterThan(-1);
    expect(durableGoods.observations[0].value).to.be.equal('.');
  });

  it('should get one MANUFACTURER_CONSUMER_DURABLE_GOODS', async () => {
    const fred = new Fred();
    const durableGoods = await fred.getMacro(Macro.MANUFACTURER_CONSUMER_DURABLE_GOODS);
    expect(durableGoods.file_type).to.equal('json');
    expect(durableGoods.count).to.be.greaterThan(-1);
    expect(durableGoods.observations[0].value).to.be.equal('19863');
  });

  it('should get one PERSONAL_DURABLE_GOODS_MOTOR_VEHICLES_AND_PARTS', async () => {
    const fred = new Fred();
    const durableGoods = await fred.getMacro(Macro.PERSONAL_DURABLE_GOODS_MOTOR_VEHICLES_AND_PARTS);
    expect(durableGoods.file_type).to.equal('json');
    expect(durableGoods.count).to.be.greaterThan(-1);
    expect(durableGoods.observations[0].value).to.be.equal('6.319');
  });
});
