import { Column, Entity, PrimaryGeneratedColumn, ManyToOne, JoinColumn, OneToMany } from 'typeorm';
import { Customer } from '../customers/customer.entity';
import { Business } from '../businesses/business.entity';
import { Payment } from '../payments/payment.entity';

export enum AppointmentStatus {
  PENDING = 'pending',
  CONFIRMED = 'confirmed',
  PAID = 'paid',
}

@Entity()
export class Appointment {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ type: 'date' })
  date: string;

  @Column()
  time: string;

  @Column({
    type: 'text',
    default: AppointmentStatus.PENDING,
  })
  status: AppointmentStatus;

  @Column()
  customerId: number;

  @ManyToOne(() => Customer, (customer) => customer.appointments)
  @JoinColumn({ name: 'customerId' })
  customerRelation: Customer;

  @Column()
  businessId: number;

  @ManyToOne(() => Business, (business) => business.appointments)
  @JoinColumn({ name: 'businessId' })
  businessRelation: Business;

  @Column()
  serviceName: string;

  @Column({ nullable: true })
  customerName: string;

  @Column({ nullable: true })
  businessName: string;

  @OneToMany(() => Payment, (payment) => payment.appointmentRelation)
  payments: Payment[];
}