import { Body, Controller, Delete, Get, Param, Post, Put } from '@nestjs/common';
import { UsersService } from './users.service';
import { CreateUserDto } from './dto/create-user.dto/create-user.dto';
import { User } from './user.entity';
import { UpdateUserDto } from './dto/create-user.dto/update-user.dto';

@Controller('users')
export class UsersController {
    constructor(private readonly userService: UsersService) { }

    @Post()
    async create(@Body() createUserDto: CreateUserDto) {
        const user = await this.userService.create(createUserDto);
        return { id: user.id, name: user.name, email: user.email };
    }

    @Get()
    async findAll() {
        const user = await this.userService.findAll();
        return user.map(user => ({
            id: user.id,
            name: user.name,
            email: user.email
        }));
    }

    @Get(':id')
    async fingOne(@Param('id') id: string) {
        const user = await this.userService.findOne(+id);
        return { id: user.id, name: user.name, email: user.email };
    }

    @Put(':id')
    async Update(@Param('id') id: string,
        @Body() updateUserDto: UpdateUserDto,) {
        const user = await this.userService.Update(+id, updateUserDto);
        return { id: user.id, name: user.name, email: user.email};
    }

    @Delete(':id')
    delete(@Param('id') id: string): Promise<{ message: string }> {
        return this.userService.Delete(+id);
    }
}
