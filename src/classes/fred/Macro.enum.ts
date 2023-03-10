import {
  IndustrialProductionDurableConsumerGoods,
  ManufacturerConsumerDurableGoods,
  ManufacturerDurableGoods,
  NumberMacroModel,
  PersonalDurableGoodsMotorsVehiclesAndParts
} from '../db/models/NumberMacro';

enum Macro {
  MANUFACTURER_DURABLE_GOODS = 'DGORDER',
  MANUFACTURER_CONSUMER_DURABLE_GOODS = 'ACDGNO',
  PERSONAL_DURABLE_GOODS_MOTOR_VEHICLES_AND_PARTS = 'DMOTRC1Q027SBEA',
  INDUSTRIAL_PRODUCTION_DURABLE_CONSUMER_GOODS = 'IPDCONGD'
}

export default Macro;

export const getMacroCollection = (macro: Macro): NumberMacroModel => {
  switch (macro) {
    case Macro.MANUFACTURER_DURABLE_GOODS:
      return ManufacturerDurableGoods;
    case Macro.MANUFACTURER_CONSUMER_DURABLE_GOODS:
      return ManufacturerConsumerDurableGoods;
    case Macro.PERSONAL_DURABLE_GOODS_MOTOR_VEHICLES_AND_PARTS:
      return PersonalDurableGoodsMotorsVehiclesAndParts;
    case Macro.INDUSTRIAL_PRODUCTION_DURABLE_CONSUMER_GOODS:
      return IndustrialProductionDurableConsumerGoods;
  }
};

//TODO: is there a better way to go through all members of an enum?
export const byName = (macro: string): Macro => {
  type macroName = keyof typeof Macro;

  for (const m in Macro) {
    if (Macro[m as macroName] === macro) {
      return Macro[m as macroName];
    }
  }
  throw new Error(`Unknown macro name: '${macro}'`);
};
