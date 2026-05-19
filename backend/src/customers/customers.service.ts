import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Customer } from './customer.entity';
import { Business } from '../businesses/business.entity';
import { CreateCustomerDto } from './dto/create-customer.dto';
import { UpdateCustomerDto } from './dto/update-customer.dto';

@Injectable()
export class CustomersService {
  constructor(
    @InjectRepository(Customer)
    private readonly customersRepository: Repository<Customer>,
    @InjectRepository(Business)
    private readonly businessRepository: Repository<Business>,
  ) {}

  findAll() {
    return this.customersRepository.find({ order: { name: 'ASC' } });
  }

  findOne(id: number) {
    return this.customersRepository.findOneBy({ id });
  }

  async create(dto: CreateCustomerDto) {
    const business = await this.businessRepository.findOne({
      where: { businessID: dto.businessId },
    });
    if (!business) {
      throw new NotFoundException(`El negocio con ID ${dto.businessId} no existe`);
    }

    const customers = await this.customersRepository.find({ select: ['id'], order: { id: 'ASC' } });
    let newId = 1;
    for (const c of customers) {
      if (c.id === newId) {
        newId++;
      } else {
        break;
      }
    }
    const customer = this.customersRepository.create({
      ...dto,
      id: newId,
      business: business.name,
    });
    await this.customersRepository.insert(customer);
    return customer;
  }

  async update(id: number, dto: UpdateCustomerDto) {
    const customer = await this.customersRepository.findOneBy({ id });
    if (!customer) throw new NotFoundException(`No existe el cliente con id ${id}`);

    let businessName: string | undefined = undefined;
    if (dto.businessId !== undefined) {
      const business = await this.businessRepository.findOne({
        where: { businessID: dto.businessId },
      });
      if (!business) {
        throw new NotFoundException(`El negocio con ID ${dto.businessId} no existe`);
      }
      businessName = business.name;
    }

    const merged = this.customersRepository.merge(customer, {
      ...dto,
      ...(businessName !== undefined ? { business: businessName } : {}),
    });
    return this.customersRepository.save(merged);
  }

  async remove(id: number) {
    const customer = await this.customersRepository.findOneBy({ id });
    if (!customer) throw new NotFoundException(`No existe el cliente con id ${id}`);

    if (customer.name.toLowerCase() === 'jose') {
      throw new BadRequestException('No está permitido eliminar al cliente Jose.');
    }

    await this.customersRepository.remove(customer);
    return { message: `Cliente ${id} eliminado correctamente` };
  }
}