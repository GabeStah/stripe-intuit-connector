import { Injectable } from '@nestjs/common';
import { Adapter } from 'src/adapters/adapter.service';
import { IntuitEntityType, IntuitService } from 'src/intuit/intuit.service';
import { LogService } from 'src/log/log.service';

interface CreateParams {
  data: any;
  type: IntuitEntityType;
}

interface DeleteParams {
  id: string | number;
  type: IntuitEntityType;
}

interface UpdateParams {
  column?: string;
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
    protected readonly log: LogService,
    protected readonly intuit: IntuitService
  ) {
    super(log);
  }

  async create({ type, data }: CreateParams) {
    this.log.event('stripe_intuit_adapter.create', {
      type,
      data
    });

    return this.intuit.create({
      type: type,
      data: data
    });
  }

  async delete({ type, id }: DeleteParams) {
    this.log.event('stripe_intuit_adapter.delete', {
      type,
      id
    });

    // Find existing
    const existing = await this.intuit.read({
      type: type,
      id: id
    });

    this.log.event('stripe_intuit_adapter.delete.existing', {
      existing
    });

    if (!existing) {
      return Promise.reject(
        new Error(
          `Could not find an existing Intuit record type: ${type}, id: ${id}.`
        )
      );
    }
    return this.intuit.delete({
      type: type,
      data: existing
    });
  }

  async update({ type, data, id, column }: UpdateParams) {
    this.log.event('stripe_intuit_adapter.update', {
      type,
      id,
      data,
      column
    });

    // Find existing
    const existing = await this.intuit.read({
      column,
      type: type,
      id: id
    });

    this.log.event('stripe_intuit_adapter.update.existing', {
      existing
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
