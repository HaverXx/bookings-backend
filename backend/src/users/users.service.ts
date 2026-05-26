import {
  BadRequestException,
  ConflictException,
  Injectable,
  NotFoundException,
  UnauthorizedException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { User } from './user.entity';
import { CreateUserDto } from './dto/create-user.dto';
import { UpdateUserDto } from './dto/update-user.dto';

@Injectable()
export class UsersService {
  constructor(
    @InjectRepository(User)
    private readonly usersRepository: Repository<User>,
  ) {}

  findAll() {
    return this.usersRepository.find({
      select: ['id', 'name', 'lastName', 'birthDate', 'email', 'business', 'createdAt'],
      order: { createdAt: 'DESC' },
    });
  }

  async findOne(id: number) {
    const user = await this.usersRepository.findOne({
      where: { id },
      select: ['id', 'name', 'lastName', 'birthDate', 'email', 'business', 'createdAt'],
    });
    if (!user) throw new NotFoundException(`No existe el usuario con id ${id}`);
    return user;
  }

  async create(dto: CreateUserDto) {
    // Only @admin.com emails allowed
    if (!dto.email.toLowerCase().endsWith('@admin.com')) {
      throw new BadRequestException('Solo se permiten correos de dominio @admin.com');
    }

    const existing = await this.usersRepository.findOne({ where: { email: dto.email } });
    if (existing) throw new ConflictException('Ya existe un usuario con ese correo electrónico');

    const business = dto.business ??
      (dto.email.toLowerCase().startsWith('admin@') || dto.name.toLowerCase() === 'admin'
        ? 'admin'
        : undefined);

    const user = this.usersRepository.create({ ...dto, business });
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

    if (dto.business === undefined &&
      ((dto.email && dto.email.toLowerCase().startsWith('admin@')) ||
        (dto.name && dto.name.toLowerCase() === 'admin') ||
        user.email.toLowerCase().startsWith('admin@') ||
        user.name.toLowerCase() === 'admin')) {
      dto.business = 'admin';
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
