import { Column, Entity } from 'typeorm';
import { Intuit } from 'src/settings/intuit/intuit.entity';

@Entity()
export class Services {
  @Column(type => Intuit)
  intuit: Intuit;
}
