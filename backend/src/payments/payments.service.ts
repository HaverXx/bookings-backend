import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Payment } from './payment.entity';
import { CreatePaymentDto } from './dto/create-payment.dto';
import { UpdatePaymentDto } from './dto/update-payment.dto';

@Injectable()
export class PaymentsService {
  constructor(
    @InjectRepository(Payment)
    private readonly paymentsRepository: Repository<Payment>,
  ) {}

  findAll() {
    return this.paymentsRepository.find({ order: { date: 'DESC' } });
  }

  findOne(id: number) {
    return this.paymentsRepository.findOneBy({ id });
  }

  findByAppointment(appointmentId: number) {
    return this.paymentsRepository.find({ where: { appointmentId } });
  }

  findByCustomer(customerId: number) {
    return this.paymentsRepository.find({ where: { customerId } });
  }

  create(dto: CreatePaymentDto) {
    const payment = this.paymentsRepository.create(dto);
    return this.paymentsRepository.save(payment);
  }

  async update(id: number, dto: UpdatePaymentDto) {
    const payment = await this.paymentsRepository.findOneBy({ id });
    if (!payment) throw new NotFoundException(`No existe el pago con id ${id}`);
    return this.paymentsRepository.save(this.paymentsRepository.merge(payment, dto));
  }

  async remove(id: number) {
    const payment = await this.paymentsRepository.findOneBy({ id });
    if (!payment) throw new NotFoundException(`No existe el pago con id ${id}`);
    await this.paymentsRepository.remove(payment);
    return { message: `Pago ${id} eliminado correctamente` };
  }
}
