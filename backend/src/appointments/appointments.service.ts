import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Appointment } from './appointment.entity';
import { CreateAppointmentDto } from './dto/create-appointment.dto';
import { UpdateAppointmentDto } from './dto/update-appointment.dto';

@Injectable()
export class AppointmentsService {
  constructor(
    @InjectRepository(Appointment)
    private readonly appointmentsRepository: Repository<Appointment>,
  ) {}

  findAll() {
    return this.appointmentsRepository.find({
      order: { date: 'ASC', time: 'ASC' },
    });
  }

  findOne(id: number) {
    return this.appointmentsRepository.findOneBy({ id });
  }

  async create(createAppointmentDto: CreateAppointmentDto) {
    const appointments = await this.appointmentsRepository.find({ select: ['id'], order: { id: 'ASC' } });
    let newId = 1;
    for (const a of appointments) {
      if (a.id === newId) {
        newId++;
      } else {
        break;
      }
    }
    const appointment = this.appointmentsRepository.create({ ...createAppointmentDto, id: newId });
    await this.appointmentsRepository.insert(appointment);
    return appointment;
  }

  async update(id: number, updateAppointmentDto: UpdateAppointmentDto) {
    const appointment = await this.appointmentsRepository.findOneBy({ id });

    if (!appointment) {
      throw new NotFoundException(`No existe la reserva con id ${id}`);
    }

    const updatedAppointment = this.appointmentsRepository.merge(
      appointment,
      updateAppointmentDto,
    );

    return this.appointmentsRepository.save(updatedAppointment);
  }

  async remove(id: number) {
    const appointment = await this.appointmentsRepository.findOneBy({ id });

    if (!appointment) {
      throw new NotFoundException(`No existe la reserva con id ${id}`);
    }

    await this.appointmentsRepository.remove(appointment);

    return { message: `Reserva ${id} eliminada correctamente` };
  }
}