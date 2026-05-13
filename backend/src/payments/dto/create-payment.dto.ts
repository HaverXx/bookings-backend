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

  @ApiProperty({ example: 1 })
  @IsInt()
  appointmentId: number;

  @ApiProperty({ example: 1 })
  @IsInt()
  customerId: number;

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
}
