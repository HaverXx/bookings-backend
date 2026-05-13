import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Customer } from './customer.entity';
import { CreateCustomerDto } from './dto/create-customer.dto';
import { UpdateCustomerDto } from './dto/update-customer.dto';

@Injectable()
export class CustomersService {
  constructor(
    @InjectRepository(Customer)
    private readonly customersRepository: Repository<Customer>,
  ) {}

  findAll() {
    return this.customersRepository.find({ order: { name: 'ASC' } });
  }

  findOne(id: number) {
    return this.customersRepository.findOneBy({ id });
  }

  create(dto: CreateCustomerDto) {
    const customer = this.customersRepository.create(dto);
    return this.customersRepository.save(customer);
  }

  async update(id: number, dto: UpdateCustomerDto) {
    const customer = await this.customersRepository.findOneBy({ id });
    if (!customer) throw new NotFoundException(`No existe el cliente con id ${id}`);
    return this.customersRepository.save(this.customersRepository.merge(customer, dto));
  }

  async remove(id: number) {
    const customer = await this.customersRepository.findOneBy({ id });
    if (!customer) throw new NotFoundException(`No existe el cliente con id ${id}`);
    await this.customersRepository.remove(customer);
    return { message: `Cliente ${id} eliminado correctamente` };
  }
}