import { Injectable, NotFoundException, OnModuleInit } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Business } from './business.entity';
import { User } from '../users/user.entity';
import { CreateBusinessDto } from './dto/create-business.dto';
import { UpdateBusinessDto } from './dto/update-business.dto';

@Injectable()
export class BusinessesService implements OnModuleInit {
  constructor(
    @InjectRepository(Business)
    private readonly businessRepository: Repository<Business>,
    @InjectRepository(User)
    private readonly usersRepository: Repository<User>,
  ) {}

  async onModuleInit() {
    await this.ensureBusinessNameIsNotUnique();
  }

  private async ensureBusinessNameIsNotUnique() {
    const indexes = await this.businessRepository.query(`PRAGMA index_list('business')`);
    const hasUniqueIndex = indexes.some((index: { unique?: number }) => Number(index.unique) === 1);

    if (!hasUniqueIndex) {
      return;
    }

    await this.businessRepository.query('PRAGMA foreign_keys=OFF');

    try {
      await this.businessRepository.query('BEGIN TRANSACTION');
      await this.businessRepository.query(`
        CREATE TABLE "business_rebuild" (
          "businessID" integer PRIMARY KEY AUTOINCREMENT NOT NULL,
          "name" varchar NOT NULL,
          "email" varchar
        )
      `);
      await this.businessRepository.query(`
        INSERT INTO "business_rebuild" ("businessID", "name", "email")
        SELECT "businessID", "name", "email"
        FROM "business"
      `);
      await this.businessRepository.query('DROP TABLE "business"');
      await this.businessRepository.query('ALTER TABLE "business_rebuild" RENAME TO "business"');
      await this.businessRepository.query('COMMIT');
    } catch (error) {
      await this.businessRepository.query('ROLLBACK');
      throw error;
    } finally {
      await this.businessRepository.query('PRAGMA foreign_keys=ON');
    }
  }

  async findAll(): Promise<Business[]> {
    const businesses = await this.businessRepository.find();

    const users = await this.usersRepository.find({
      select: ['business', 'businessId', 'email'],
    });

    const emailByBusinessId = new Map<number, string>();
    const emailByBusinessName = new Map<string, string>();

    for (const user of users) {
      if (!user.email) {
        continue;
      }

      if (typeof user.businessId === 'number') {
        emailByBusinessId.set(user.businessId, user.email);
        continue;
      }

      if (user.business) {
        emailByBusinessName.set(user.business.toLowerCase(), user.email);
      }
    }

    for (const business of businesses) {
      if (!business.email) {
        const email =
          emailByBusinessId.get(business.businessID) ??
          emailByBusinessName.get(business.name.toLowerCase());
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
    const normalizedName = createBusinessDto.name.trim();
    const businesses = await this.businessRepository.find({ select: ['businessID'], order: { businessID: 'ASC' } });
    let newId = 1;
    for (const b of businesses) {
      if (b.businessID === newId) {
        newId++;
      } else {
        break;
      }
    }
    const business = this.businessRepository.create({ ...createBusinessDto, name: normalizedName, businessID: newId });
    await this.businessRepository.insert(business);
    return business;
  }

  async update(id: number, updateBusinessDto: UpdateBusinessDto): Promise<Business> {
    const business = await this.findOne(id);
    const normalizedName = updateBusinessDto.name?.trim();

    if (normalizedName) {
      updateBusinessDto.name = normalizedName;
    }

    const updatedBusiness = this.businessRepository.merge(business, updateBusinessDto);
    return this.businessRepository.save(updatedBusiness);
  }

  async remove(id: number): Promise<void> {
    const business = await this.findOne(id);
    await this.businessRepository.remove(business);
  }
}
