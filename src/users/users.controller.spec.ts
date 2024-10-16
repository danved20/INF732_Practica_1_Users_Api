import { Test, TestingModule } from '@nestjs/testing';
import { UsersController } from './users.controller';
import { UsersService } from './users.service';
import { CreateUserDto } from './dto/create-user.dto/create-user.dto';
import { BadRequestException, NotFoundException } from '@nestjs/common';

const mockUser = { id: 1, name: 'Test name', email: 'test@test.com' };

describe('UsersController', () => {
  let controller: UsersController;
  let service: UsersService;
  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [UsersController],
      providers: [
        {
          provide: UsersService,
          useValue: {
            create: jest.fn().mockResolvedValue(mockUser),
            findAll: jest.fn().mockResolvedValue([mockUser]),
            findOne: jest.fn().mockResolvedValue(mockUser),
            Update: jest.fn().mockResolvedValue(mockUser),
            Delete: jest.fn().mockResolvedValue(mockUser),
          },
        },
      ],
    }).compile();

    controller = module.get<UsersController>(UsersController);
    service = module.get<UsersService>(UsersService);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });

  describe('create', () => {
    it('should create a user successfully', async () => {
      // Dto que se usa como input en el controlador
      const createUserDto: CreateUserDto = {
        name: 'Test name',
        email: 'test@test.com',
        password: 'Test password',
      };

      const mockCreatedUser = {
        id: 1,
        name: 'Test name',
        email: 'test@test.com',
        password: 'hashedPassword'
      };
      // Simula el resultado del servicio
      jest.spyOn(service, 'create').mockResolvedValue(mockCreatedUser);

      // Llamada al método create del controlador
      const result = await controller.create(createUserDto);

      // Verifica que el servicio haya sido llamado con el DTO correcto
      expect(service.create).toHaveBeenCalledWith(createUserDto);

      // Verifica que el controlador devuelva solo el id, name y email
      expect(result).toEqual({ id: mockCreatedUser.id, name: mockCreatedUser.name, email: mockCreatedUser.email });
    });
  });


  describe('findAll', () => {
    it('should return an array of users', async () => {
      const mockUsers = [
        { id: 1, name: 'Test User 1', email: 'user1@test.com', password: 'hashedPassword' },
        { id: 2, name: 'Test User 2', email: 'user2@test.com', password: 'hashedPassword' }
      ];

      // Simula el resultado del servicio
      jest.spyOn(service, 'findAll').mockResolvedValue(mockUsers);

      const result = await controller.findAll();

      //verifica que el servicio a sido llamado 
      expect(service.findAll).toHaveBeenCalled();

      // Verifica que el controlador devuelva el array de usuarios con los campos correctos
      expect(result).toEqual([
        { id: 1, name: 'Test User 1', email: 'user1@test.com' },
        { id: 2, name: 'Test User 2', email: 'user2@test.com' },
      ]);
    });

    it('should throw an error if service falis', async () => {
      jest.spyOn(service, 'findAll').mockRejectedValue(new Error('Error fetching users'));

      await expect(controller.findAll()).rejects.toThrow('Error fetching users');
    });
  });

  describe('findOne', () => {
    it('should return a user by ID', async () => {
      const mockUser = { id: 1, name: 'Test User', email: 'user@test.com', password: 'hashedPassword' };

      // Simula el resultado del servicio
      jest.spyOn(service, 'findOne').mockResolvedValue(mockUser);

      // Llama al método findOne del controlador
      const result = await controller.fingOne('1');

      // Verifica que el servicio haya sido llamado con el ID correcto
      expect(service.findOne).toHaveBeenCalledWith(1);

      // Verifica que el controlador devuelva el usuario con los campos correctos
      expect(result).toEqual({ id: mockUser.id, name: mockUser.name, email: mockUser.email });
    });

    it('should throw NotFoundException if user is not found', async () => {
      // Simula que el servicio lanza una NotFoundException
      jest.spyOn(service, 'findOne').mockRejectedValue(new NotFoundException('User Not Found'));

      // Verifica que el controlador lance la excepción NotFoundException
      await expect(controller.fingOne('999')).rejects.toThrow(NotFoundException);
    });
  });

  describe('update', () => {
    it('should update a user successfully', async () => {
      // Simulamos el usuario actualizado
      const updatedUser = { id: 1, name: 'Updated User', email: 'updated@test.com' };

      // Simulamos el servicio llamando al método update
      jest.spyOn(service, 'Update').mockResolvedValue(updatedUser as any);

      // DTO que se pasa como input al controlador
      const updateUserDto = {
        name: 'Updated User',
        email: 'updated@test.com',
        password: 'hashedPassword',
      };

      // Llamamos al método update del controlador
      const result = await controller.Update('1', updateUserDto);

      // Verificamos que el servicio haya sido llamado con los valores correctos
      expect(service.Update).toHaveBeenCalledWith(1, updateUserDto);

      // Verificamos que el controlador devuelve el usuario actualizado correctamente
      expect(result).toEqual({
        id: updatedUser.id,
        name: updatedUser.name,
        email: updatedUser.email,
      });
    });

    it('should throw NotFoundException if the user to update does not exist', async () => {
      // Simulamos que el servicio lanza una NotFoundException
      jest.spyOn(service, 'Update').mockRejectedValue(new NotFoundException('User not found'));

      const updateUserDto = {
        name: 'Non-existing User',
        email: 'nonexistent@test.com',
        password: 'hashedPassword',
      };

      // Intentamos actualizar un usuario que no existe y verificamos que se lance la excepción
      await expect(controller.Update('1', updateUserDto)).rejects.toThrow(NotFoundException);

      // Verificamos que el servicio haya sido llamado con los valores correctos
      expect(service.Update).toHaveBeenCalledWith(1, updateUserDto);
    });

    it('should throw BadRequestException if the email already exists', async () => {
      // Simulamos que el servicio lanza una BadRequestException
      jest.spyOn(service, 'Update').mockRejectedValue(new BadRequestException('Email already exists'));

      const updateUserDto = {
        name: 'Updated User',
        email: 'existing@test.com',
        password: 'hashedPassword',
      };

      // Intentamos actualizar con un email que ya existe y verificamos que se lance la excepción
      await expect(controller.Update('1', updateUserDto)).rejects.toThrow(BadRequestException);

      // Verificamos que el servicio haya sido llamado con los valores correctos
      expect(service.Update).toHaveBeenCalledWith(1, updateUserDto);
    });
  });

  describe('delete', () => {
    it('should delete a user successfully', async () => {
      // Simulamos el mensaje de éxito
      jest.spyOn(service, 'Delete').mockResolvedValue({ message: 'User deleted successfully' });

      // Llamamos al método delete del controlador
      const result = await controller.delete('1');

      // Verificamos que el servicio haya sido llamado correctamente
      expect(service.Delete).toHaveBeenCalledWith(1);

      // Verificamos que el resultado sea correcto
      expect(result).toEqual({ message: 'User deleted successfully' });
    });

    it('should throw NotFoundException if the user does not exist', async () => {
      // Simulamos que el servicio lanza una NotFoundException
      jest.spyOn(service, 'Delete').mockRejectedValue(new NotFoundException('User not found'));

      // Verificamos que el controlador lance la excepción
      await expect(controller.delete('1')).rejects.toThrow(NotFoundException);

      // Verificamos que el servicio haya sido llamado con el valor correcto
      expect(service.Delete).toHaveBeenCalledWith(1);
    });
  });
});
