import { ApiProperty } from '@nestjs/swagger';
import { IsEnum, IsInt, IsNumber, IsOptional, IsString } from 'class-validator';
import { PaymentStatus } from '../payment.entity';

export class CreatePaymentDto {
  @ApiProperty({ example: 50.0 })
  @IsNumber()
  amount: number;

  @ApiProperty({ example: '2026-04-20' })
  @IsString()
  date: string;

  @ApiProperty({ example: 'Efectivo' })
  @IsString()
  paymentMethod: string;

  @ApiProperty({ example: 1, required: false })
  @IsInt()
  @IsOptional()
  appointmentId?: number;

  @ApiProperty({ example: 1, required: false })
  @IsInt()
  @IsOptional()
  customerId?: number;

  @ApiProperty({ example: 1, required: false })
  @IsInt()
  @IsOptional()
  businessId?: number;

  @ApiProperty({
    enum: PaymentStatus,
    example: PaymentStatus.COMPLETED,
  })
  @IsEnum(PaymentStatus)
  status: PaymentStatus;

  @ApiProperty({ example: 'Pago parcial', required: false })
  @IsString()
  @IsOptional()
  notes?: string;

  @ApiProperty({ example: 'Juan Pérez', required: false })
  @IsString()
  @IsOptional()
  customerName?: string;
}
