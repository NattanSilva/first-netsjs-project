import { ConflictException, NotFoundException } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { randomUUID } from 'node:crypto';
import { Repository } from 'typeorm';
import { CreateUserDto } from './dto/create-user.dto';
import { User } from './entities/user.entity';
import { UsersService } from './users.service';

const usersList = [
  new User({
    id: randomUUID(),
    name: 'teste 1',
    email: 'teste1@mail.com',
    cellPhone: '(11)12345-5432',
  }),
  new User({
    id: randomUUID(),
    name: 'teste 2',
    email: 'teste2@mail.com',
    cellPhone: '(00)12345-5432',
  }),
  new User({
    id: randomUUID(),
    name: 'teste 3',
    email: 'teste3@mail.com',
    cellPhone: '(11)12345-5432',
  }),
];

const updatedUserBody = new User({
  id: usersList[0].id,
  name: 'teste 1 updated',
  email: 'teste1@mail.com',
  cellPhone: '(11)12345-5432',
});

describe('UsersService', () => {
  let usersService: UsersService;
  let UsersRepository: Repository<User>;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        UsersService,
        {
          provide: getRepositoryToken(User),
          useValue: {
            create: jest.fn().mockReturnValue(usersList[2]),
            save: jest.fn().mockResolvedValue(usersList[2]),
            find: jest.fn().mockResolvedValue(usersList),
            findOneBy: jest.fn().mockResolvedValue(usersList[0]),
            delete: jest.fn().mockReturnValue(undefined),
          },
        },
      ],
    }).compile();

    usersService = module.get<UsersService>(UsersService);
    UsersRepository = module.get<Repository<User>>(getRepositoryToken(User));
  });

  it('should be defined', () => {
    expect(usersService).toBeDefined();
    expect(UsersRepository).toBeDefined();
  });

  describe('findAll', () => {
    it('should be able to list all users successfully', async () => {
      // Act
      const result = await usersService.findAll();

      // Assert
      expect(result).toBeDefined();
      expect(result).toEqual(usersList);
      expect(UsersRepository.find).toHaveBeenCalledTimes(1);
    });

    it('should be return a exception', () => {
      // Arrange
      jest.spyOn(UsersRepository, 'find').mockRejectedValueOnce(new Error());

      // Act
      const result = usersService.findAll();

      // Assert
      expect(result).rejects.toThrowError();
    });
  });

  describe('findOne', () => {
    it('should be return a user successfully', async () => {
      // Act
      const result = await usersService.findOne(usersList[0].id);

      // Assert
      expect(result).toEqual(usersList[0]);
      expect(UsersRepository.findOneBy).toHaveBeenCalledTimes(1);
    });

    it('should throw an exception', () => {
      // Arrange
      jest
        .spyOn(UsersRepository, 'findOneBy')
        .mockRejectedValueOnce(new Error());

      // Assert
      expect(usersService.findOne(usersList[1].id)).rejects.toThrowError();
    });

    it('should throw a not found exception', () => {
      // Arrange
      jest
        .spyOn(UsersRepository, 'findOneBy')
        .mockRejectedValueOnce(new NotFoundException());

      // Assert
      expect(usersService.findOne(usersList[1].id)).rejects.toThrow(
        new NotFoundException(),
      );
    });
  });

  describe('create', () => {
    it('should be create a user successfully', async () => {
      // Arrange
      const body: CreateUserDto = { ...usersList[2] };
      jest.spyOn(usersService, 'findByEmail').mockResolvedValueOnce(null);

      // Act
      const result = await usersService.create(body);

      // Assert
      expect(result).toEqual(usersList[2]);
      expect(UsersRepository.create).toHaveBeenCalledTimes(1);
      expect(UsersRepository.save).toHaveBeenCalledTimes(1);
    });

    it('should throw an exception', () => {
      // Arrange
      const body: CreateUserDto = { ...usersList[2] };
      jest.spyOn(UsersRepository, 'save').mockRejectedValueOnce(new Error());

      // Assert
      expect(usersService.create(body)).rejects.toThrowError();
    });

    it('should throw a conflict exception', () => {
      // Arrange
      const body: CreateUserDto = { ...usersList[2] };
      jest
        .spyOn(usersService, 'findByEmail')
        .mockResolvedValueOnce(usersList[2]);

      // Assert
      expect(usersService.create(body)).rejects.toThrow(
        new ConflictException('User already exists'),
      );
    });
  });

  describe('update', () => {
    it('should be update a user successfully', async () => {
      // Arrange
      jest
        .spyOn(UsersRepository, 'create')
        .mockReturnValueOnce(updatedUserBody);
      jest
        .spyOn(UsersRepository, 'save')
        .mockResolvedValueOnce(updatedUserBody);

      // Act
      const result = await usersService.update(
        updatedUserBody.id,
        updatedUserBody,
      );

      // Assert
      expect(result).toEqual(updatedUserBody);
    });

    it('should throw a not found exception', () => {
      // Arrange
      jest
        .spyOn(UsersRepository, 'findOneBy')
        .mockRejectedValueOnce(new NotFoundException());

      // assert
      expect(
        usersService.update(randomUUID(), updatedUserBody),
      ).rejects.toThrow(new NotFoundException());
    });

    it('should throw a not found exception', () => {
      // Arrange
      jest.spyOn(UsersRepository, 'save').mockRejectedValueOnce(new Error());

      // assert
      expect(
        usersService.update(randomUUID(), updatedUserBody),
      ).rejects.toThrowError();
    });
  });

  describe('remove', () => {
    it('should be remove a user successfully', async () => {
      // Act
      const result = await usersService.remove(usersList[0].id);

      // Assert
      expect(result).toBeUndefined();
      expect(UsersRepository.findOneBy).toHaveBeenCalledTimes(1);
      expect(UsersRepository.delete).toHaveBeenCalledTimes(1);
    });

    it('sould be throw a not found exception', () => {
      // Arrange
      jest
        .spyOn(UsersRepository, 'findOneBy')
        .mockRejectedValueOnce(new NotFoundException());

      // Assert
      expect(usersService.remove(usersList[1].id)).rejects.toThrow(
        new NotFoundException(),
      );
    });

    it('sould be throw a not found exception', () => {
      // Arrange
      jest.spyOn(UsersRepository, 'delete').mockRejectedValueOnce(new Error());

      // Assert
      expect(usersService.remove(usersList[1].id)).rejects.toThrowError();
    });
  });
});
