import { Inject, Injectable } from '@nestjs/common';
import { Adapter } from 'src/adapters/adapter.service';
import { IntuitEntityType, IntuitService } from 'src/intuit/intuit.service';
import { ConfigService } from '@nestjs/config';
import { Logger } from 'winston';

interface CreateParams {
  data: any;
  type: IntuitEntityType;
}

interface DeleteParams {
  id: string | number;
  type: IntuitEntityType;
}

interface UpdateParams {
  data: any;
  id: string | number;
  type: IntuitEntityType;
}

/**
 * Provides methods and logic for adapting object types from one service to another.
 */
@Injectable()
export class StripeIntuitAdapterService extends Adapter {
  constructor(
    protected readonly config: ConfigService,
    @Inject('winston') protected readonly logger: Logger,
    protected readonly intuit: IntuitService
  ) {
    super(config, logger);
  }

  async create({ type, data }: CreateParams) {
    return this.intuit.create({
      type: type,
      data: data
    });
  }

  async delete({ type, id }: DeleteParams) {
    // Find existing
    const existing = await this.intuit.read({
      type: type,
      id: id
    });

    if (existing) {
      // existingCustomer.Active = false;
      return this.intuit.delete({
        type: type,
        data: existing
      });
    }
  }

  async update({ type, data, id }: UpdateParams) {
    // Find existing
    const existing = await this.intuit.read({
      type: type,
      id: id
    });

    // Merge new and existing then update.
    return this.intuit.update({
      type: type,
      data: Object.assign(existing, data)
    });
  }

  from(source: any): any {}
  to(target: any): any {}
}
