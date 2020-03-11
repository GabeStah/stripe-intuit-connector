import { Column, Entity } from 'typeorm';

@Entity()
export class Intuit {
  @Column()
  accessToken: string;

  @Column()
  accessTokenExpiration: number;

  @Column()
  refreshToken: string;

  @Column()
  refreshTokenExpiration: number;
}
