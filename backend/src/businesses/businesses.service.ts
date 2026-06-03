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
    const businesses = await this.businessRepository.find();

    // Fetch all users with a business to map business name -> email
    const users = await this.usersRepository.find({
      select: ['business', 'email'],
    });

    const emailMap = new Map<string, string>();
    for (const user of users) {
      if (user.business && user.email) {
        emailMap.set(user.business.toLowerCase(), user.email);
      }
    }

    // Backfill missing contact emails in memory (avoiding DB writes on GET)
    for (const business of businesses) {
      if (!business.email) {
        const email = emailMap.get(business.name.toLowerCase());
        if (email) {
          business.email = email;
        }
      }
    }

    return businesses;
  }

  async findOne(id: number): Promise<Business> {
    const business = await this.businessRepository.findOne({
      where: { businessID: id },
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
