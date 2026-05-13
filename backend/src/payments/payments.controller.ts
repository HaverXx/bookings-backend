import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  ParseIntPipe,
  Patch,
  Post,
} from '@nestjs/common';
import {
  ApiCreatedResponse,
  ApiOkResponse,
  ApiTags,
} from '@nestjs/swagger';
import { PaymentsService } from './payments.service';
import { CreatePaymentDto } from './dto/create-payment.dto';
import { UpdatePaymentDto } from './dto/update-payment.dto';

@ApiTags('payments')
@Controller('payments')
export class PaymentsController {
  constructor(private readonly paymentsService: PaymentsService) {}

  @Get()
  @ApiOkResponse({ description: 'Listado de pagos' })
  findAll() {
    return this.paymentsService.findAll();
  }

  @Get(':id')
  @ApiOkResponse({ description: 'Detalle de un pago' })
  findOne(@Param('id', ParseIntPipe) id: number) {
    return this.paymentsService.findOne(id);
  }

  @Get('appointment/:appointmentId')
  @ApiOkResponse({ description: 'Pagos por cita' })
  findByAppointment(@Param('appointmentId', ParseIntPipe) appointmentId: number) {
    return this.paymentsService.findByAppointment(appointmentId);
  }

  @Get('customer/:customerId')
  @ApiOkResponse({ description: 'Pagos por cliente' })
  findByCustomer(@Param('customerId', ParseIntPipe) customerId: number) {
    return this.paymentsService.findByCustomer(customerId);
  }

  @Post()
  @ApiCreatedResponse({ description: 'Pago registrado' })
  create(@Body() createPaymentDto: CreatePaymentDto) {
    return this.paymentsService.create(createPaymentDto);
  }

  @Patch(':id')
  @ApiOkResponse({ description: 'Pago actualizado' })
  update(
    @Param('id', ParseIntPipe) id: number,
    @Body() updatePaymentDto: UpdatePaymentDto,
  ) {
    return this.paymentsService.update(id, updatePaymentDto);
  }

  @Delete(':id')
  @ApiOkResponse({ description: 'Pago eliminado' })
  remove(@Param('id', ParseIntPipe) id: number) {
    return this.paymentsService.remove(id);
  }
}
