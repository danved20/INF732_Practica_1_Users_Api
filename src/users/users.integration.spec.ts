import { Repository } from "typeorm";
import { UsersService } from "./users.service";
import { User } from "./user.entity";
import { Test, TestingModule } from "@nestjs/testing";
import { getRepositoryToken, TypeOrmModule } from "@nestjs/typeorm";
import * as bcrypt from 'bcrypt';
import { BadRequestException, NotFoundException } from "@nestjs/common";
import exp from "constants";

describe('Users Integration (UsersService)', () => {
    let service: UsersService;
    let repository: Repository<User>;

    beforeAll(async () => {
        const module: TestingModule = await Test.createTestingModule({
            imports: [
                TypeOrmModule.forRoot({
                    type: 'mysql',
                    host: 'localhost',
                    port: 3306,
                    username: 'root',
                    password: '',
                    database: 'test_notas_db',
                    entities: [User],
                    synchronize: true,
                }),
                TypeOrmModule.forFeature([User]),
            ],
            providers: [UsersService],
        }).compile();
        service = module.get<UsersService>(UsersService);
        repository = module.get<Repository<User>>(getRepositoryToken(User));
    });

    afterAll(async () => {
        const connection = repository.manager.connection;
        if (connection.isInitialized) {
            await connection.destroy();
        }
    });

    afterEach(async () => {
        await repository.query('DELETE FROM user');
    });

    describe('create', () => {
        it('Deberia crear un nuevo usuario en la base de datos', async () => {
            const nuevoUsuario = {
                name: 'Usuario de prueba',
                email: 'prueba@gmail.com',
                password: 'Password prueba',
            };
            //llamada al metodo create del servicio para crear un susario
            const usuarioCreado = await service.create(nuevoUsuario);

            //verifica que el usuario creado tenga un id
            expect(usuarioCreado).toHaveProperty('id');
            expect(usuarioCreado.name).toEqual(nuevoUsuario.name);
            expect(usuarioCreado.email).toEqual(nuevoUsuario.email);

            //comparar la contraseña para comfirmar que se haya cifrado correctamente
            const esPasswordCorrecta = await bcrypt.compare(
                nuevoUsuario.password,
                usuarioCreado.password
            );
            expect(esPasswordCorrecta).toBe(true);

            //confirmar que el usuario existe en la base de datos
            const usuatioEnBaseDatos = await repository.findOneBy({ id: usuarioCreado.id });

            expect(usuatioEnBaseDatos).toBeDefined();
            expect(usuatioEnBaseDatos.name).toEqual(nuevoUsuario.name);
            expect(usuatioEnBaseDatos.email).toEqual(nuevoUsuario.email);

        });

        it('Deberia lanzar BadRequestException si el email ya existe', async () => {
            const usuarioExistente = {
                name: 'Usuario Existente',
                email: 'usuario@prueba.com',
                password: 'passwordSeguro123',
            };
            //crear un usuario inicial para simular el email duplicado
            await service.create(usuarioExistente);

            try {
                //intenar crear un usuario con el mismo email
                await service.create(usuarioExistente);
            } catch (error) {
                //verificacion de lanzar una excepcion BadRequestsException
                expect(error).toBeInstanceOf(BadRequestException);
                expect(error.message).toBe('Email already exists');

            }
        })
    });

    describe('findAll', () => {
        it('Deberia optener todos los usuarios de la base de datos', async () => {
            await repository.query('DELETE FROM user');

            //datos de ejemplo
            const usuarios = [
                { email: 'usuario1@prueba.com', password: 'password1', name: 'Usuario 1' },
                { email: 'usuario2@prueba.com', password: 'password2', name: 'Usuario 2' },
            ];

            //guarda los usuarios de ejm en la DB
            await repository.save(usuarios);

            //llama al metodo finAll del servicio
            const resultado = await service.findAll();

            //verifica la cantidad de usuarios que debuerve
            expect(resultado.length).toBe(usuarios.length);

            //valida los usuarios con los datos de ejemplo
            expect(resultado[0].email).toBe(usuarios[0].email);
            expect(resultado[1].email).toBe(usuarios[1].email);
            expect(resultado[0].name).toBe(usuarios[0].name);
            expect(resultado[1].name).toBe(usuarios[1].name);
        });
    });

    describe('findOne', () => {
        it('Deberia obtener un usuario por ID', async () => {
            await repository.query('DELETE FROM user');
            // crea usuario de ejemplo
            const nuevoUsuario = await repository.save({
                name: 'Usuario Prueba',
                email: 'usuario@prueba.com',
                password: 'passwordSeguro123',
            });

            //llama al metodo findOne
            const usuarioEncontrado = await service.findOne(nuevoUsuario.id);

            //compara si coincide con el usuario creado
            expect(usuarioEncontrado).toBeDefined();
            expect(usuarioEncontrado.id).toEqual(nuevoUsuario.id);
            expect(usuarioEncontrado.name).toEqual(nuevoUsuario.name);
            expect(usuarioEncontrado.email).toEqual(nuevoUsuario.email);
        });

        it('Deberia lanzar NotFoundException si el usuario existe', async () => {
            await repository.query('DELETE FROM user');

            const idExistente = 999;

            //para obtener un usuario con id que no existe
            try {
                await service.findOne(idExistente);
            } catch (error) {
                // verifica que lanza una excepcion
                expect(error).toBeInstanceOf(NotFoundException);
                expect(error.message).toBe('User Not Found');
            }
        });

    });

    describe('update', () => {
        it('Deberia actualizar un usuario existente', async () => {
            await repository.query('DELETE FROM user');

            // Crear un usuario de ejemplo
            const usuarioExistente = await repository.save({
                email: 'usuario@prueba.com',
                password: await bcrypt.hash('passwordSeguro123', 10),
                name: 'Usuario Prueba',
            });

            // Datos de actualización con contraseña en texto plano
            const datosActualizados = {
                email: 'usuario@actualizado.com',
                password: await bcrypt.hash('passwordSeguro123', 10),
                name: 'Usuario Actualizado',
            };

            // Llamada al método update del servicio
            await service.Update(usuarioExistente.id, datosActualizados);

            // Obtener el usuario actualizado
            const usuarioActualizado = await repository.findOneBy({ id: usuarioExistente.id });

            // Verificar que los cambios se aplicaron correctamente
            expect(usuarioActualizado.name).toEqual(datosActualizados.name);
            expect(usuarioActualizado.email).toEqual(datosActualizados.email);

            
        });

        it('Debería lanzar BadRequestException si el email ya existe en otro usuario', async () => {
            await repository.query('DELETE FROM user');
            //crea usuarios
            const usuario1 = await repository.save({
                name: 'Usuario 1',
                email: 'usuario1@prueba.com',
                password: 'password1',
            });
            const usuario2 = await repository.save({
                name: 'Usuario 2',
                email: 'usuario2@prueba.com',
                password: 'password2',
            });

            try {
                await service.Update(usuario1.id, {
                    email: usuario2.email,
                    name: usuario2.name,
                    password: usuario2.password,
                });
            } catch (error) {
                //Verifica que se lanzó una excepción BadRequestException
                expect(error).toBeInstanceOf(BadRequestException);
                expect(error.message).toBe('Email already exists');
            }
        });
        it('Debería lanzar NotFoundException si el usuario no existe', async () => {
            const idInexistente = 999;

            try {
                await service.Update(idInexistente, {
                    email: 'usuario@actualizado.com',
                    name: " Usuarios prueba",
                    password: "password"
                });
            } catch (error) {
                // Verificar que se lanza una excepción NotFoundExceptio
                expect(error).toBeInstanceOf(NotFoundException);
                expect(error.message).toBe('User not found');
            }
        });
    });

    describe('delete', () => {
        it('Debería eliminar un usuario existente', async () => {
            await repository.query('DELETE FROM user');
            // Crear un usuario 
            const usuarioExistente = await repository.save({
                email: 'usuario@prueba.com',
                password: 'passwordSeguro123',
                name: 'Usuario Prueba',
            });

            //llama al método delte del servicio
            const respuesta = await service.Delete(usuarioExistente.id);

            // Verificar el mensaje
            expect(respuesta.message).toBe('User deleted successfully');

            //vereifica que el usuario ya no existe en la base de datos
            const usuarioEliminado = await repository.findOneBy({ id: usuarioExistente.id });
            expect(usuarioEliminado).toBeNull();
        });

        it('Debería lanzar NotFoundException al intentar eliminar un usuario que no existe', async () => {
            const idInexistente = 999;

            try {
                await service.Delete(idInexistente);
            } catch (error) {
                // Verificar que se lanza una excepción NotFoundExceptio
                expect(error).toBeInstanceOf(NotFoundException);
                expect(error.message).toBe('User not found');
            }
        });
    });
});