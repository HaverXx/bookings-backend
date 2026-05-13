import { Column, Entity, PrimaryGeneratedColumn, ManyToOne, JoinColumn } from 'typeorm';
import { Customer } from '../customers/customer.entity';
import { Appointment } from '../appointments/appointment.entity';

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

  @Column()
  appointmentId: number;

  @ManyToOne(() => Appointment, (appointment) => appointment.payments)
  @JoinColumn({ name: 'appointmentId' })
  appointmentRelation: Appointment;

  @Column()
  customerId: number;

  @ManyToOne(() => Customer, (customer) => customer.payments)
  @JoinColumn({ name: 'customerId' })
  customerRelation: Customer;

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
