import { Column, Entity, PrimaryGeneratedColumn, ManyToOne, JoinColumn, OneToMany } from 'typeorm';
import { Business } from '../businesses/business.entity';
import { Appointment } from '../appointments/appointment.entity';
import { Payment } from '../payments/payment.entity';

@Entity()
export class Customer {
  @PrimaryGeneratedColumn()
  id: number;

  @Column()
  name: string;

    @Column({ nullable: true })
  phone: string;

  @Column({ nullable: true })
  email: string;

  @Column({ nullable: true })
  business: string;

  @Column({ nullable: true })
  businessId: number;

  @ManyToOne(() => Business, (business) => business.customers, { onDelete: 'CASCADE', onUpdate: 'CASCADE' })
  @JoinColumn({ name: 'businessId' })
  businessRelation: Business;

  @OneToMany(() => Appointment, (appointment) => appointment.customerRelation)
  appointments: Appointment[];

  @OneToMany(() => Payment, (payment) => payment.customerRelation)
  payments: Payment[];
}