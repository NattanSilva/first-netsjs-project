import { HttpException, Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { plainToInstance } from 'class-transformer';
import { Repository } from 'typeorm';
import { UUIDv4 } from 'uuid-v4-validator';
import { CreateUserDto } from './dto/create-user.dto';
import { UpdateUserDto } from './dto/update-user.dto';
import { User } from './entities/user.entity';

@Injectable()
export class UsersService {
  constructor(
    @InjectRepository(User)
    private readonly userRepository: Repository<User>,
  ) {}

  async validateUniqueEmail(email: string) {
    const user = await this.findByEmail(email);

    if (user) {
      throw new HttpException('User already exists', 409);
    }
  }

  async findByEmail(email: string) {
    const currentUser = await this.userRepository.findOneBy({ email });

    if (!currentUser) {
      throw new HttpException('User not found', 404);
    }

    return currentUser;
  }

  async create(data: CreateUserDto): Promise<User> {
    await this.validateUniqueEmail(data.email);
    const createdUser = this.userRepository.create({
      ...data,
    });

    await this.userRepository.save(createdUser);

    return plainToInstance(User, createdUser);
  }

  async findAll() {
    const users = await this.userRepository.find();

    return plainToInstance(User, users);
  }

  async findOne(id: string) {
    if (!UUIDv4.validate(id)) {
      throw new HttpException('Invalid UUID', 400);
    }

    const currentUser = await this.userRepository.findOneBy({ id });

    if (!currentUser) {
      throw new HttpException('User not found', 404);
    }

    return plainToInstance(User, currentUser);
  }

  async update(id: string, updateUserDto: UpdateUserDto) {
    if (!UUIDv4.validate(id)) {
      throw new HttpException('Invalid UUID', 400);
    }

    const currentUser = await this.userRepository.findOneBy({ id });

    if (!currentUser) {
      throw new HttpException('User not found', 404);
    }

    const updatedUser = this.userRepository.create({
      ...currentUser,
      ...updateUserDto,
    });

    await this.userRepository.save(updatedUser);

    return plainToInstance(User, updatedUser);
  }

  async remove(id: string) {
    if (!UUIDv4.validate(id)) {
      throw new HttpException('Invalid UUID', 400);
    }

    const currentUser = await this.userRepository.findOneBy({ id });

    if (!currentUser) {
      throw new HttpException('User not found', 404);
    }

    await this.userRepository.delete({ id });
  }
}
