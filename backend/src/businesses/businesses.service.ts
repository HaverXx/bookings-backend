import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Business } from './business.entity';
import { User } from '../users/user.entity';
import { CreateBusinessDto } from './dto/create-business.dto';
import { UpdateBusinessDto } from './dto/update-business.dto';

@Injectable()
export class BusinessesService {
  constructor(
    @InjectRepository(Business)
    private readonly businessRepository: Repository<Business>,
    @InjectRepository(User)
    private readonly usersRepository: Repository<User>,
  ) {}

  async findAll(): Promise<Business[]> {
    const businesses = await this.businessRepository.find({
      relations: ['customers', 'appointments'],
    });

    // Backfill missing contact emails from the users table
    for (const business of businesses) {
      if (!business.email) {
        const user = await this.usersRepository.findOne({
          where: { business: business.name },
          select: ['email'],
        });
        if (user) {
          business.email = user.email;
          await this.businessRepository.save(business);
        }
      }
    }

    return businesses;
  }

  async findOne(id: number): Promise<Business> {
    const business = await this.businessRepository.findOne({
      where: { businessID: id },
      relations: ['customers', 'appointments'],
    });
    if (!business) {
      throw new NotFoundException(`Business with ID ${id} not found`);
    }
    return business;
  }

  async create(createBusinessDto: CreateBusinessDto): Promise<Business> {
    const businesses = await this.businessRepository.find({ select: ['businessID'], order: { businessID: 'ASC' } });
    let newId = 1;
    for (const b of businesses) {
      if (b.businessID === newId) {
        newId++;
      } else {
        break;
      }
    }
    const business = this.businessRepository.create({ ...createBusinessDto, businessID: newId });
    await this.businessRepository.insert(business);
    return business;
  }

  async update(id: number, updateBusinessDto: UpdateBusinessDto): Promise<Business> {
    const business = await this.findOne(id);
    const updatedBusiness = this.businessRepository.merge(business, updateBusinessDto);
    return this.businessRepository.save(updatedBusiness);
  }

  async remove(id: number): Promise<void> {
    const business = await this.findOne(id);
    await this.businessRepository.remove(business);
  }
}
