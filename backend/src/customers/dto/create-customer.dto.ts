import { ApiProperty } from '@nestjs/swagger';
import { IsEmail, IsNumber, IsOptional, IsString } from 'class-validator';

export class CreateCustomerDto {
  @ApiProperty({ example: 'María López' })
  @IsString()
  name: string;

  @ApiProperty({ example: '600 123 456', required: false })
  @IsString()
  @IsOptional()
  phone?: string;

  @ApiProperty({ example: 'maria@email.com', required: false })
  @IsEmail()
  @IsOptional()
  email?: string;

  @ApiProperty({ example: 1 })
  @IsNumber()
  businessId: number;
}