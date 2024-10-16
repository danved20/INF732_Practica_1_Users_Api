import { Test, TestingModule } from '@nestjs/testing';
import { UsersService } from './users.service';
import { Repository } from 'typeorm';
import { User } from './user.entity';
import { getRepositoryToken } from '@nestjs/typeorm';
import * as bcrypt from 'bcrypt';
import { BadRequestException, NotFoundException } from '@nestjs/common';
import exp from 'constants';
import { find } from 'rxjs';

const mockUserRepository = () => ({
  create: jest.fn(),
  save: jest.fn(),
  findOne: jest.fn(),
  find: jest.fn(),
  findOneBy: jest.fn(),
  update: jest.fn(),
  delete: jest.fn(),
})

const mockUser = { id: 1, name: 'Test name', email: 'test@test.com', password: 'hashedPassword' };

type MockRepository<T = any> = Partial<Record<keyof Repository<T>, jest.Mock>>;

describe('UsersService', () => {
  let service: UsersService;
  let repository: MockRepository<User>;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        UsersService,
        {
          provide: getRepositoryToken(User),
          useValue: mockUserRepository(),
        }
      ],
    }).compile();

    service = module.get<UsersService>(UsersService);
    repository = module.get<MockRepository<User>>(getRepositoryToken(User));
  });

  describe('create', () => {

    it('should create a User', async () => {
      jest.spyOn(repository, 'findOne').mockResolvedValue(null);

      const hashedPassword: string = 'hashedPassword';
      jest.spyOn(bcrypt, 'hash').mockResolvedValue(hashedPassword as never);

      jest.spyOn(repository, 'create').mockReturnValue(mockUser as User);
      jest.spyOn(repository, 'save').mockResolvedValue(mockUser as User);

      //trabaja en el metodo del servicio
      const result = await service.create({
        name: 'Test name',
        email: 'test@test.com',
        password: 'Test password',
      });

      expect(result).toEqual(mockUser);
      expect(repository.findOne).toHaveBeenCalledWith({
        where: { email: 'test@test.com' }
      });
      expect(bcrypt.hash).toHaveBeenCalledWith('Test password', 10);
      expect(repository.create).toHaveBeenCalledWith({
        name: 'Test name',
        email: 'test@test.com',
        password: hashedPassword,
      })
      expect(repository.save).toHaveBeenCalledWith(mockUser);

    });

    it('shoudl throw an error if email already exists', async () => {
      //simula que el email ya esta registrado
      jest.spyOn(repository, 'findOne').mockResolvedValue(mockUser as User);

      //llama al metodo create que debe lanzar una excepcion
      await expect(
        service.create({
          name: 'Test name',
          email: 'test@test.com',
          password: 'Test password',
        }),
      ).rejects.toThrow(BadRequestException);

      expect(repository.findOne).toHaveBeenCalledWith({
        where: { email: 'test@test.com' },
      });

      //No debe crear usuario si ya existe el email
      expect(repository.create).not.toHaveBeenCalled();

      //No debe guardar si ya existe el email
      expect(repository.save).not.toHaveBeenCalled();
    });
  });

  describe('findAll', () => {
    it('should return an array of users', async () => {
      //simula el valor de retorno del metodo fnd
      const mockUsers = [
        { id: 1, name: 'User One', email: 'one@test.com', password: 'password' },
        { id: 2, name: 'User Two', email: 'two@test.com', password: 'password' },
      ];

      jest.spyOn(repository, 'find').mockResolvedValue(mockUsers);

      //llam al metodo findAll del servicio
      const result = await service.findAll();

      //verifica que el resultado es el esperado
      expect(result).toEqual(mockUsers);

      //verificamos que el metodo find deñ repositorio fue llamado
      expect(repository.find).toHaveBeenCalled();
    });
  });

  describe('findOne', () => {
    it('should return  a user if found', async () => {
      //simula un usuario encontrado por el ID
      jest.spyOn(repository, 'findOneBy').mockResolvedValue(mockUser as User);

      //llamamos al metodo del servicio  
      const result = await service.findOne(1);

      //verifica que el resultado sea el usuario simulado
      expect(result).toEqual(mockUser);

      //verirfica que se llamo a findOneBy con el id correcto
      expect(repository.findOneBy).toHaveBeenCalledWith({ id: 1 });
    });

    it('should throw a NotFoundExeption if the user does not exist', async () => {
      //simula que no se encuentra un usuario en la base de datos
      jest.spyOn(repository, 'findOneBy').mockResolvedValue(null);

      //llamamos al metodo y verificamos que se lanza una excepcion
      try {
        //id del usuario insexistente
        await service.findOne(1);
      } catch (error) {
        //verificamos que el error sea una instancia de NotFoundException
        expect(error).toBeInstanceOf(NotFoundException);

        //verificamos que el mensaje de error sea el correcto
        expect(error.message).toBe('User Not Found');

        //mandamos el codigo de estado del error
        expect(error.getStatus()).toBe(404);
      }
      //verificamos que findOneBy fue llamado con el ID correcto
      expect(repository.findOneBy).toHaveBeenCalledWith({ id: 1 });
    })
  });

  describe('update', () => {
    it('should update a user successfully', async () => {
      //simulamos el usuario actualizado
      const updateUser = { ...mockUser, name: 'Updated User' };

      // Simula que no hay conflicto con el email
      jest.spyOn(repository, 'findOne').mockResolvedValue(null);

      //simula que la actualizacion afecto a 1 registro
      jest.spyOn(repository, 'update').mockResolvedValue({ affected: 1 } as any);
      //simulamos que el metodo de findOneBy retorna el usuario actualizado
      jest.spyOn(repository, 'findOneBy').mockResolvedValue(updateUser as User);

      //llamamos al metodo update del servicio
      const result = await service.Update(1, {
        name: 'Updated User',
        email: 'Update@test.com',
        password: 'newPassword',
      });

      //verificamos que el resultadp sea el usuario actualizado
      expect(result).toEqual(updateUser);

      //veridicamos que el repositorio haya sido llamado con los valores coreectos
      expect(repository.update).toHaveBeenCalledWith(1, {
        name: 'Updated User',
        email: 'Update@test.com',
        password: expect.any(String),
      });

      //veridicamos que findOney haya sido llamado para obtener el usuario actualizado
      expect(repository.findOneBy).toHaveBeenCalledWith({ id: 1 });
    });

    it('should throw NotFoundException if the user to update does not exist', async () => {
      //simulamos que la actualizacion no afecto a ningun registro
      jest.spyOn(repository, 'update').mockResolvedValue({ affected: 0 } as any);

      //intentamos actiualizar un usuario que no existe y esperamos una excepcion
      try {
        await service.Update(1, {
          name: 'Non-existing User',
          email: 'nonexisting@test.com',
          password: 'newPassword',
        });
      } catch (error) {
        //verificamos que se lance una excepcion NotFounException
        expect(error).toBeInstanceOf(NotFoundException);
        expect(error.message).toBe('User not found');
        expect(error.getStatus()).toBe(404);
      }

      //verificamos que el repositorio haya sido llamado con los valores correctos
      expect(repository.update).toHaveBeenCalledWith(1, {
        name: 'Non-existing User',
        email: 'nonexisting@test.com',
        password: expect.any(String),
      });
    });

    it('should throw BadRequestException if the email already exists', async () => {
      // Simulamos un usuario que ya existe con el mismo email
      const existingUser = { ...mockUser, id: 2, email: 'existing@test.com' };
  
      // Simulamos que el repositorio encuentra un usuario con el mismo email
      jest.spyOn(repository, 'findOne').mockResolvedValue(existingUser);
  
      // Intentamos actualizar el usuario con un email que ya está en uso
      await expect(
        service.Update(1, {
          name: 'Updated User',
          email: 'existing@test.com',
          password: 'newPassword',
        }),
      ).rejects.toThrow(BadRequestException);
  
      // Verificamos que el repositorio haya sido llamado para verificar el email
      expect(repository.findOne).toHaveBeenCalledWith({ where: { email: 'existing@test.com' } });
    });
  });

  describe('delete',() => {
    it('should delete a user successfully', async () => {
      // simulamos que el usuario existe
      jest.spyOn(repository, 'findOneBy').mockResolvedValue(mockUser);
      jest.spyOn(repository, 'delete').mockResolvedValue({ affected: 1 } as any);

      //llamamos al metodo delete
      const result = await service.Delete(1);

      //verificamos que el repositorio haya sido llamado correctamente
      expect(repository.findOneBy).toHaveBeenCalledWith({ id: 1 });
      expect(repository.delete).toHaveBeenCalledWith(1);

      //verificamos que el resultado sea correcto
      expect(result).toEqual({ message: 'User deleted successfully'});
    });

    it('should throw NotFoundException if the user does not exist', async () => {
      //simulamos que el usuario no existe
      jest.spyOn(repository, 'findOneBy').mockResolvedValue(null);

      try {
        //intentamos eliminar un usuario que no existe
        await service.Delete(1);
      } catch (error) {
        // Verificamos que se lance una NotFoundException
        expect(error).toBeInstanceOf(NotFoundException);
        expect(error.message).toBe(`User not found`);
        expect(error.getStatus()).toBe(404);
      }

      //verificamos que el repositorio haya sido llamado correctamente
      expect(repository.findOneBy).toHaveBeenCalledWith({ id: 1 });
      expect(repository.delete).not.toHaveBeenCalled();
    });
  });
  
});
