import { Column, Entity, PrimaryGeneratedColumn, ManyToOne, JoinColumn } from 'typeorm';
import { Customer } from '../customers/customer.entity';
import { Appointment } from '../appointments/appointment.entity';
import { Business } from '../businesses/business.entity';

export enum PaymentStatus {
  PENDING = 'pending',
  COMPLETED = 'completed',
  REFUNDED = 'refunded',
  CANCELLED = 'cancelled',
}

@Entity()
export class Payment {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ type: 'decimal', precision: 10, scale: 2 })
  amount: number;

  @Column({ type: 'date' })
  date: string;

  @Column()
  paymentMethod: string;

  @Column({ nullable: true })
  appointmentId: number;

  @ManyToOne(() => Appointment, (appointment) => appointment.payments, { onDelete: 'CASCADE', onUpdate: 'CASCADE' })
  @JoinColumn({ name: 'appointmentId' })
  appointmentRelation: Appointment;

  @Column({ nullable: true })
  customerId: number;

  @ManyToOne(() => Customer, (customer) => customer.payments, { onDelete: 'CASCADE', onUpdate: 'CASCADE' })
  @JoinColumn({ name: 'customerId' })
  customerRelation: Customer;

  @Column({ nullable: true })
  businessId: number;

  @ManyToOne(() => Business, (business) => business.payments, { onDelete: 'CASCADE', onUpdate: 'CASCADE' })
  @JoinColumn({ name: 'businessId' })
  businessRelation: Business;

  @Column({
    type: 'text',
    default: PaymentStatus.PENDING,
  })
  status: PaymentStatus;

  @Column({ nullable: true })
  notes: string;

  @Column({ nullable: true })
  customerName: string;
}
