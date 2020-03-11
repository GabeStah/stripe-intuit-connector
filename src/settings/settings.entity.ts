import { Column, Entity, ObjectID, ObjectIdColumn } from 'typeorm';
import { Services } from 'src/settings/services/services.entity';

@Entity()
export class Settings {
  @ObjectIdColumn()
  id: ObjectID;

  @Column(type => Services)
  services: Services;
}
