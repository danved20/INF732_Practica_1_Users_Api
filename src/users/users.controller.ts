import { Body, Controller, Delete, Get, Param, Post, Put } from '@nestjs/common';
import { UsersService } from './users.service';
import { CreateUserDto } from './dto/create-user.dto/create-user.dto';
import { User } from './user.entity';
import { UpdateUserDto } from './dto/create-user.dto/update-user.dto';

import { ApiTags, ApiOperation, ApiBody, ApiParam, ApiQuery} from '@nestjs/swagger';
@ApiTags('users')
@Controller('users')
export class UsersController {
    constructor(private readonly userService: UsersService) { }

    @Post()
    @ApiOperation({ summary: 'Crear un nuevo usuario'})
    @ApiBody({ type: CreateUserDto })
    async create(@Body() createUserDto: CreateUserDto) {
        const user = await this.userService.create(createUserDto);
        return { id: user.id, name: user.name, email: user.email };
    }

    @Get()
    @ApiOperation({ summary: 'Obtener todos los usuarios'}) 
    async findAll() {
        const user = await this.userService.findAll();
        return user.map(user => ({
            id: user.id,
            name: user.name,
            email: user.email
        }));
    }

    @Get(':id')
    @ApiOperation({ summary: 'Obtener un ususario por su ID'})
    @ApiParam({
        name: 'id',
        type: 'number',
        description: 'ID unico del Usuario',
        example: 1,
    })
    async fingOne(@Param('id') id: string) {
        const user = await this.userService.findOne(+id);
        return { id: user.id, name: user.name, email: user.email };
    }

    @Put(':id')
    @ApiOperation({ summary: 'Modificar a un usuario señalando su ID'})
    @ApiBody({ type: UpdateUserDto })
    @ApiParam({
        name: 'id',
        type: 'number',
        description: 'ID unico del usuario',
        example: 1,
    })
    async Update(@Param('id') id: string,
        @Body() updateUserDto: UpdateUserDto,) {
        const user = await this.userService.Update(+id, updateUserDto);
        return { id: user.id, name: user.name, email: user.email};
    }

    @Delete(':id')
    @ApiOperation({ summary: 'Elimina a un usuario por su ID'})
    @ApiParam({
        name: 'id',
        type: 'number',
        description: 'ID unico del usuario',
        example: 1,
    })
    delete(@Param('id') id: string): Promise<{ message: string }> {
        return this.userService.Delete(+id);
    }
}
