import { Column, Entity, PrimaryGeneratedColumn, OneToMany } from 'typeorm';
import { Customer } from '../customers/customer.entity';
import { Appointment } from '../appointments/appointment.entity';
import { Payment } from '../payments/payment.entity';

@Entity()
export class Business {
  @PrimaryGeneratedColumn({ name: 'businessID' })
  businessID: number;

  @Column()
  name: string;

  @Column({ nullable: true })
  email: string;

  @OneToMany(() => Customer, (customer) => customer.businessRelation)
  customers: Customer[];

  @OneToMany(() => Appointment, (appointment) => appointment.businessRelation)
  appointments: Appointment[];

  @OneToMany(() => Payment, (payment) => payment.businessRelation)
  payments: Payment[];
}
