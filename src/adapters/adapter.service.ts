import { Injectable } from '@nestjs/common';
import get from 'lodash/get';
import round from 'lodash/round';
import { LogService } from 'src/log/log.service';

export enum ConversionType {
  None,
  CurrencyIntegerToDecimal,
  CurrencyDecimalToInteger
}

export interface AdapterInterface {
  from(source: any): any;
  get(path: string, conversionType: ConversionType): any;
  to(target: any): any;
}

/**
 * Provides methods and logic for adapting object types from one service to another.
 */
@Injectable()
export abstract class Adapter implements AdapterInterface {
  protected source: any;
  protected target: any;

  constructor(protected readonly log: LogService) {}

  abstract from(source: any): any;

  get(path: string, conversionType: ConversionType = ConversionType.None): any {
    if (conversionType) {
      const initialValue = get(this.source, path);
      switch (conversionType) {
        case ConversionType.CurrencyDecimalToInteger:
          return round(initialValue * 100);
        case ConversionType.CurrencyIntegerToDecimal:
          return initialValue / 100;
        default:
          return initialValue;
      }
    } else {
      return get(this.source, path);
    }
  }

  abstract to(target: any): any;
}
