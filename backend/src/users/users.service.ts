import {
  BadRequestException,
  ConflictException,
  Injectable,
  NotFoundException,
  OnModuleInit,
  UnauthorizedException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { User } from './user.entity';
import { CreateUserDto } from './dto/create-user.dto';
import { UpdateUserDto } from './dto/update-user.dto';
import { Business } from '../businesses/business.entity';

const EMAIL_RESTRICTED_TOKEN = '@admin';
const BUSINESS_RESTRICTED_TOKEN = 'admin';
const EMAIL_RESTRICTED_MESSAGE = "No se permite usar '@admin' en el correo electrónico";
const BUSINESS_RESTRICTED_MESSAGE = "No se permite usar 'admin' en el nombre del negocio";

@Injectable()
export class UsersService implements OnModuleInit {
  constructor(
    @InjectRepository(User)
    private readonly usersRepository: Repository<User>,
    @InjectRepository(Business)
    private readonly businessRepository: Repository<Business>,
  ) {}

  async onModuleInit() {
    await this.backfillBusinessIds();
  }

  private async backfillBusinessIds() {
    const users = await this.usersRepository.find({
      select: ['id', 'business', 'businessId'],
    });

    const usersMissingBusinessId = users.filter(
      (user) => typeof user.businessId !== 'number' && !!user.business?.trim(),
    );

    if (usersMissingBusinessId.length === 0) {
      return;
    }

    const businesses = await this.businessRepository.find({
      select: ['businessID', 'name'],
    });
    const businessIdByName = new Map(
      businesses.map((business) => [business.name.trim().toLowerCase(), business.businessID]),
    );

    for (const user of usersMissingBusinessId) {
      const businessId = businessIdByName.get(user.business.trim().toLowerCase());
      if (typeof businessId !== 'number') {
        continue;
      }

      await this.usersRepository.update(user.id, { businessId });
    }
  }

  private validateRestrictedValues(email?: string, business?: string) {
    if (email && email.toLowerCase().includes(EMAIL_RESTRICTED_TOKEN)) {
      throw new BadRequestException(EMAIL_RESTRICTED_MESSAGE);
    }

    if (business && business.toLowerCase().includes(BUSINESS_RESTRICTED_TOKEN)) {
      throw new BadRequestException(BUSINESS_RESTRICTED_MESSAGE);
    }
  }

  findAll() {
    return this.usersRepository.find({
      select: ['id', 'name', 'lastName', 'birthDate', 'email', 'business', 'businessId', 'createdAt'],
      order: { createdAt: 'DESC' },
    });
  }

  async findOne(id: number) {
    const user = await this.usersRepository.findOne({
      where: { id },
      select: ['id', 'name', 'lastName', 'birthDate', 'email', 'business', 'businessId', 'createdAt'],
    });
    if (!user) throw new NotFoundException(`No existe el usuario con id ${id}`);
    return user;
  }

  async create(dto: CreateUserDto) {
    this.validateRestrictedValues(dto.email, dto.business);

    const existing = await this.usersRepository.findOne({ where: { email: dto.email } });
    if (existing) throw new ConflictException('Ya existe un usuario con ese correo electrónico');

    const normalizedBusinessName = dto.business?.trim();
    let businessId: number | undefined;

    if (normalizedBusinessName) {
      const business = this.businessRepository.create({ name: normalizedBusinessName, email: dto.email });
      const savedBusiness = await this.businessRepository.save(business);

      dto.business = normalizedBusinessName;
      businessId = savedBusiness.businessID;
    }

    const user = this.usersRepository.create({
      ...dto,
      businessId,
    });
    const saved = await this.usersRepository.save(user);
    // Return without password
    const { password: _, ...result } = saved;
    return result;
  }

  async login(email: string, password: string) {
    const user = await this.usersRepository.findOne({ where: { email } });
    if (!user || user.password !== password) {
      throw new UnauthorizedException('Credenciales inválidas');
    }
    const { password: _, ...result } = user;
    return result;
  }

  async update(id: number, dto: UpdateUserDto) {
    const user = await this.usersRepository.findOneBy({ id });
    if (!user) throw new NotFoundException(`No existe el usuario con id ${id}`);

    this.validateRestrictedValues(dto.email, dto.business);

    const normalizedBusinessName = dto.business?.trim();
    if (normalizedBusinessName && normalizedBusinessName !== user.business) {
      const business = this.businessRepository.create({
        name: normalizedBusinessName,
        email: dto.email ?? user.email,
      });
      const savedBusiness = await this.businessRepository.save(business);
      dto.business = normalizedBusinessName;
      Object.assign(user, { businessId: savedBusiness.businessID });
    }

    Object.assign(user, dto);
    const saved = await this.usersRepository.save(user);
    const { password: _, ...result } = saved;
    return result;
  }

  async remove(id: number) {
    const user = await this.usersRepository.findOneBy({ id });
    if (!user) throw new NotFoundException(`No existe el usuario con id ${id}`);
    await this.usersRepository.remove(user);
    return { message: `Usuario ${id} eliminado correctamente` };
  }
}
