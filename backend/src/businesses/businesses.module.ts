import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Business } from './business.entity';
import { User } from '../users/user.entity';
import { BusinessesService } from './businesses.service';
import { BusinessesController } from './businesses.controller';

@Module({
  imports: [TypeOrmModule.forFeature([Business, User])],
  controllers: [BusinessesController],
  providers: [BusinessesService],
  exports: [TypeOrmModule, BusinessesService],
})
export class BusinessesModule {}
