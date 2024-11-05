import { HttpStatus, INestApplication } from "@nestjs/common";
import { Test, TestingModule } from "@nestjs/testing";
import { getRepositoryToken, TypeOrmModule } from "@nestjs/typeorm";

import { Repository } from "typeorm";
import * as request from 'supertest';
import * as bcrypt from 'bcrypt';



import { UsersModule } from "./users/users.module";
import { User } from "./users/user.entity";
import { CreateUserDto } from "./users/dto/create-user.dto/create-user.dto";
import exp from "constants";
import { response } from "express";
import { UpdateUserDto } from "./users/dto/create-user.dto/update-user.dto";
import { escape } from "querystring";


describe('Users Aceptance', () => {
    let app: INestApplication;
    let userRepository: Repository<User>;

    beforeAll(async () => {
        const moduleFixture: TestingModule = await Test.createTestingModule({
            imports: [
                UsersModule,
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
            ],
        }).compile();
        app = moduleFixture.createNestApplication();
        userRepository = moduleFixture.get<Repository<User>>(
            getRepositoryToken(User),
        );
        await app.init();
    });
    afterAll(async () => {
        await app.close();
    });
    afterEach(async () => {
        //await userRepository.query('DELETE FROM user');
    });

    describe('create', () => {
        it('deberia crear un nuevo usuario y retornar la respuesta', async () => {
            const nuevoUsuario: CreateUserDto = {
                name: 'name de prueba',
                email: 'prueba@gmail.com',
                password: 'password',
            };

            const respuestaCrear = await request(app.getHttpServer())
                .post('/users')
                .send(nuevoUsuario);

            expect(respuestaCrear.status).toBe(201);
            expect(respuestaCrear.body.name).toEqual(nuevoUsuario.name);
            expect(respuestaCrear.body.email).toEqual(nuevoUsuario.email);

        });
        it('Debería retornar BadRequestException al crear un usuario con email existente', async () => {
            const existingUser: CreateUserDto = {
                name: 'Daniel Vedia',
                email: 'danielPrueba@example.com',
                password: 'password789',
            };

            // Creamos el primer usuario
            await request(app.getHttpServer())
                .post('/users')
                .send(existingUser)

            const response = await request(app.getHttpServer())
                .post('/users')
                .send(existingUser)

            expect(response.body.message).toBe('Email already exists');
        });
    });

    describe('findAll', () => {
        it('Debería retornar todos los usuarios sin exponer la contraseña', async () => {
            await userRepository.query('DELETE FROM user');

            const users = [
                { name: 'Ana Gomez', email: 'ana@example.com', password: 'password1' },
                { name: 'Luis Martinez', email: 'luis@example.com', password: 'password2' }
            ];

            // Guardamos los usuarios con contraseñas hasheadas en la base de datos
            for (const user of users) {
                const hashedPassword = await bcrypt.hash(user.password, 10);
                await userRepository.save({ ...user, password: hashedPassword });
            }
            const respuestaObtener = await request(app.getHttpServer()).get('/users');

            // Verificamos que los datos de los usuarios no incluyan la propiedad 'password'
            respuestaObtener.body.forEach((user: any) => {
                expect(user).toHaveProperty('id');
                expect(user).toHaveProperty('name');
                expect(user).toHaveProperty('email');
                expect(user).not.toHaveProperty('password');
            });
        });
    });

    describe('findOne', () => {
        it('Debería retornar un usuario por ID sin exponer la contraseña', async () => {
            await userRepository.query('DELETE FROM user');

            const user: CreateUserDto = {
                name: 'Daniel Vedia',
                email: 'daniel@example.com',
                password: 'password123',
            };

            const hashedPassword = await bcrypt.hash(user.password, 10);
            const saveUSer = await userRepository.save({
                ...user,
                password: hashedPassword,
            });

            const respuestaBuscar = await request(app.getHttpServer())
                .get(`/users/${saveUSer.id}`)

            expect(respuestaBuscar.status).toBe(200);
            expect(respuestaBuscar.body.name).toEqual(saveUSer.name);
            expect(respuestaBuscar.body.email).toEqual(saveUSer.email);
            expect(respuestaBuscar.body).not.toHaveProperty('password');
        });

        it('Eberia retornar BadRequestException al no encontrae un usuario por ID', async () => {
            await userRepository.query('DELETE FROM user');

            const buscarUSuario = 999;

            const respuestaBuscar = await request(app.getHttpServer())
                .get(`/users/${buscarUSuario}`)

            expect(respuestaBuscar.status).toBe(404);
            expect(respuestaBuscar.body.message).toBe(`User Not Found`);
        });
    });

    describe('Update', () => {
        it('Debería actualizar un usuario', async () => {
            await userRepository.query('DELETE FROM user');

            const userUpdate: UpdateUserDto = {
                name: 'Daniel Vedia modificado',
                email: 'danielActualizado@example.com',
                password: 'password123',
            };

            const hashedPassword = await bcrypt.hash(userUpdate.password, 10);
            const saveUSer = await userRepository.save({
                ...userUpdate,
                password: hashedPassword,
            });

            const respuestaActualizar = await request(app.getHttpServer())
                .put(`/users/${saveUSer.id}`)
                .send(userUpdate)

            expect(respuestaActualizar.status).toBe(200);
            expect(respuestaActualizar.body.name).toEqual(saveUSer.name);
            expect(respuestaActualizar.body.email).toEqual(saveUSer.email);
            expect(respuestaActualizar.body).not.toHaveProperty('password');
        });

        it('Debería lanzar BadRequestException si el email ya existe en otro usuario', async () => {
            const userCreate: CreateUserDto = {
                name: 'daniel prueba',
                email: 'vedia@example.com',
                password: 'password456',
            };
            const hashedPassword = await bcrypt.hash(userCreate.password, 10);
            const savedUser2 = await userRepository.save({
                ...userCreate,
                password: hashedPassword,
            });

            const updateData: UpdateUserDto = {
                name: "",
                email: 'danielActualizado@example.com',
                password: "",

            };

            const respuestaActualizar = await request(app.getHttpServer())
                .put(`/users/${savedUser2.id}`)
                .send(updateData)

            expect(respuestaActualizar.status).toBe(400);
            expect(respuestaActualizar.body.message).toBe('Email already exists');
        });


        it('Eberia retornar BadRequestException al no encontrae un usuario por ID', async () => {
            const usuarioImaginario = 999;

            const userUpdate: UpdateUserDto = {
                name: 'Daniel Vedia imaginario',
                email: 'imaginario@example.com',
                password: '',
            };

            const respuestaBuscar = await request(app.getHttpServer())
                .put(`/users/${usuarioImaginario}`)
                .send(userUpdate)

            expect(respuestaBuscar.status).toBe(404);
            expect(respuestaBuscar.body.message).toBe(`User not found`);
        });
    });

    describe('delete', () => {
        it('Deberia eliminar un usuario por ID', async () => {
            const userCreate = await userRepository.save({
                name: 'daniel eliminar',
                email: 'vediaeEliminar@example.com',
                password: 'password456',
            });

            const respuestaEliminar = await request(app.getHttpServer())
                .delete(`/users/${userCreate.id}`)

            expect(respuestaEliminar.status).toBe(200);
            expect(respuestaEliminar.body.message).toBe("User deleted successfully");
            
        });

        it('Eberia retornar BadRequestException al no encontrar un usuario para eliminar por ID', async () => {
            const usuarioImaginario = 999;


            const respuestaBuscar = await request(app.getHttpServer())
                .delete(`/users/${usuarioImaginario}`)

            expect(respuestaBuscar.status).toBe(404);
            expect(respuestaBuscar.body.message).toBe(`User not found`);
        });
    });
});