import { Injectable, OnModuleInit } from '@nestjs/common';

@Injectable()
export class IntuitService implements OnModuleInit {
  // private model: Service;
  constructor() // @InjectModel('Setting') private readonly settingModel: Model<Setting> // private readonly moduleRef: ModuleRef
  {}

  queryCustomer(query: string): any {
    return query;
  }

  onModuleInit() {
    // this.model = this.moduleRef.get(Service);
  }
}
