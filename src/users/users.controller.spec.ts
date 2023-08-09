import {
  BadRequestException,
  ConflictException,
  HttpException,
  NotFoundException,
} from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import { hashSync } from 'bcryptjs';
import { randomUUID } from 'node:crypto';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { CreateUserDto } from './dto/create-user.dto';
import { UpdateUserDto } from './dto/update-user.dto';
import { User } from './entities/user.entity';
import { UsersController } from './users.controller';
import { UsersService } from './users.service';

const usersList: User[] = [
  new User({
    id: `${randomUUID()}`,
    name: 'teste 1',
    email: 'teste1@mail.com',
    cellPhone: '(11)12345-5432',
    password: hashSync('12345678', 10),
  }),
  new User({
    id: `${randomUUID()}`,
    name: 'teste 2',
    email: 'teste2@mail.com',
    cellPhone: '(00)12345-5432',
    password: hashSync('12345678', 10),
  }),
  new User({
    id: `${randomUUID()}`,
    name: 'teste 3',
    email: 'teste3@mail.com',
    cellPhone: '(33)12345-5432',
    password: hashSync('12345678', 10),
  }),
];

const mockFindedUser = {
  id: 'a29ecabb-a075-4b32-b95e-da95da0a35cc',
  name: 'john doe',
  email: 'john@mail.com',
  cellPhone: '(11)12345-5432',
};

const newUserEntity = new User({
  id: randomUUID(),
  name: 'Maria',
  email: 'maria@mail.com',
  password: hashSync('12345678', 10),
  cellPhone: '(55)12446-5432',
});

describe('UsersController', () => {
  let usersController: UsersController;
  let usersService: UsersService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [UsersController],
      providers: [
        {
          provide: UsersService,
          useValue: {
            findAll: jest.fn().mockResolvedValue(usersList),
            findOne: jest.fn().mockResolvedValue(mockFindedUser),
            create: jest.fn().mockResolvedValue(newUserEntity),
            update: jest
              .fn()
              .mockResolvedValue({ ...newUserEntity, name: 'Mariazinha' }),
            remove: jest.fn(),
          },
        },
        {
          provide: JwtAuthGuard,
          useValue: jest.fn().mockImplementation(() => true),
        },
      ],
    }).compile();

    usersController = module.get<UsersController>(UsersController);
    usersService = module.get<UsersService>(UsersService);
  });

  it('should be defined', () => {
    expect(usersController).toBeDefined();
    expect(usersService).toBeDefined();
  });

  describe('findAll', () => {
    it('should be return a list of users successfully', async () => {
      // Act
      const result = await usersController.findAll();

      // Assert
      expect(result).toBeDefined();
      expect(result).toEqual(usersList);
      expect(typeof result).toBe('object');
      expect(usersService.findAll).toHaveBeenCalledTimes(1);
    });

    it('should throw an exception', () => {
      // Arrange
      jest.spyOn(usersController, 'findAll').mockRejectedValueOnce(new Error());

      // Assert
      expect(usersController.findAll()).rejects.toThrowError();
    });
  });

  describe('findOne', () => {
    it('should be return a user successfully', async () => {
      // Act
      const result = await usersController.findOne(
        'a29ecabb-a075-4b32-b95e-da95da0a35cc',
      );

      // Assert
      expect(result).toBeDefined();
      expect(result).toEqual(mockFindedUser);
      expect(result).not.toHaveProperty('password');
      expect(usersService.findOne).toHaveBeenCalledTimes(1);
    });

    it('should throw an 404 exception', () => {
      // Arrange
      jest
        .spyOn(usersController, 'findOne')
        .mockRejectedValueOnce(new HttpException('User not found', 404));
      // Act
      const result = usersController.findOne(randomUUID());

      // Assert
      expect(result).rejects.toThrow(new HttpException('User not found', 404));
    });
  });

  describe('create', () => {
    it('sould be create a user successfully', async () => {
      // Arrange
      const body: CreateUserDto = {
        name: 'Maria',
        email: 'maria@mail.com',
        password: '12345678',
        cellPhone: '(55)12446-5432',
      };

      // Act
      const result = await usersController.create(body);

      // Assert
      expect(result).toEqual(newUserEntity);
      expect(usersService.create).toHaveBeenCalledTimes(1);
      expect(usersService.create).toBeCalledWith(body);
    });

    it('should throw an conflict exception', () => {
      // Arrange
      const body: CreateUserDto = {
        name: 'Maria',
        email: 'maria@mail.com',
        password: '12345678',
        cellPhone: '(55)12446-5432',
      };
      jest
        .spyOn(usersController, 'create')
        .mockRejectedValueOnce(new ConflictException());

      // Assert
      expect(usersController.create(body)).rejects.toThrow(ConflictException);
    });

    it('should throw a bad request exception', () => {
      // Arrange
      const body: CreateUserDto = {
        name: 'Maria',
        email: 'maria@mail.com',
        password: '',
        cellPhone: '(55)12446-5432',
      };
      jest
        .spyOn(usersController, 'create')
        .mockRejectedValueOnce(new BadRequestException());

      // Assert
      expect(usersController.create(body)).rejects.toThrow(
        new BadRequestException(),
      );
    });
  });

  describe('update', () => {
    it('should be update a user successfully', async () => {
      // Arrange
      const updateBody: UpdateUserDto = {
        name: 'Mariazinha',
      };

      // Act
      const result = await usersController.update(newUserEntity.id, updateBody);

      // Assert
      expect(result).toEqual({ ...newUserEntity, name: 'Mariazinha' });
      expect(usersService.update).toHaveBeenCalledTimes(1);
      expect(usersService.update).toBeCalledWith(newUserEntity.id, updateBody);
    });

    it('should throw an exception', () => {
      // Arrange
      const updateBody: UpdateUserDto = {
        name: '',
      };
      jest.spyOn(usersController, 'update').mockRejectedValueOnce(new Error());

      // Assert
      expect(
        usersController.update(newUserEntity.id, updateBody),
      ).rejects.toThrowError();
    });

    it('should throw a bad request exception', () => {
      // Arrange
      const updateBody: UpdateUserDto = {
        name: '',
      };
      jest
        .spyOn(usersController, 'update')
        .mockRejectedValueOnce(new BadRequestException());

      // Assert
      expect(
        usersController.update(newUserEntity.id, updateBody),
      ).rejects.toThrow(new BadRequestException());
    });

    it('should throw a not found exception', () => {
      // Arrange
      const updateBody: UpdateUserDto = {
        name: 'Pedro do Pipa',
      };
      jest
        .spyOn(usersController, 'update')
        .mockRejectedValueOnce(new NotFoundException('User not found'));

      // Assert
      expect(usersController.update(randomUUID(), updateBody)).rejects.toThrow(
        new NotFoundException('User not found'),
      );
    });
  });

  describe('remove', () => {
    it('should be remove a user successfully', async () => {
      // Act
      const result = await usersController.remove(newUserEntity.id);

      // Assert
      expect(result).toEqual(undefined);
      expect(usersService.remove).toHaveBeenCalledTimes(1);
      expect(usersService.remove).toHaveBeenCalledWith(newUserEntity.id);
    });

    it('should throw an exception', () => {
      // Arrange
      jest.spyOn(usersController, 'remove').mockRejectedValueOnce(new Error());

      // Assert
      expect(usersController.remove(newUserEntity.id)).rejects.toThrowError();
    });

    it('should throw a not found exception', () => {
      // Arrange
      jest
        .spyOn(usersController, 'remove')
        .mockRejectedValueOnce(new NotFoundException('User not found'));

      // Assert
      expect(usersController.remove(newUserEntity.id)).rejects.toThrow(
        new NotFoundException('User not found'),
      );
    });
  });
});
