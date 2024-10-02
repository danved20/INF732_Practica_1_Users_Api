import { BadRequestException, HttpCode, HttpStatus, Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { User } from './user.entity';
import { Repository } from 'typeorm';
import { CreateUserDto } from './dto/create-user.dto/create-user.dto';
import { noop } from 'rxjs';
import { UpdateUserDto } from './dto/create-user.dto/update-user.dto';
import * as bcrypt from 'bcrypt'; 

@Injectable()
export class UsersService {
    constructor(
        @InjectRepository(User)
        private userRepository: Repository<User>,
    ){}

    @HttpCode(HttpStatus.OK)
    async create(createUserDto: CreateUserDto): Promise<User>{
        const existingUser = await this.userRepository.findOne({
            where: {email: createUserDto.email}
        });

        if(existingUser){
            throw new BadRequestException(`Email already exists`)
        }

        const hashedPassword = await bcrypt.hash(createUserDto.password, 10);
        
        const newUser = this.userRepository.create({
            ...createUserDto,
            password: hashedPassword,
        });
        return this.userRepository.save(newUser);
    }

    findAll(): Promise<User[]>{
        return this.userRepository.find();
    }

    findOne(id: number): Promise<User>{
        return this.userRepository.findOneBy({ id }).then((user)=>{
            if(!user){
                throw new NotFoundException(`User Not Found`);
            }
            return user;
        });
    }

    async Update(id: number, updateUserDto: UpdateUserDto): Promise<User>{

        if(updateUserDto.email){
            const existsUser = await this.userRepository.findOne({
                where: {email: updateUserDto.email},
            });

            if(existsUser && existsUser.id !== id){
                throw new BadRequestException(`Email already exists`)
            }
        }

        if(updateUserDto.password){
            updateUserDto.password = await bcrypt.hash(updateUserDto.password,10);
        }

        const updateResult = await this.userRepository.update(id,updateUserDto);
        if(updateResult.affected === 0){
            throw new NotFoundException(`User not found`);
        }
        return this.findOne(id);
    }

    async Delete(id: number) : Promise<{ message: string}>{
        const user = await this.userRepository.findOneBy({ id });
        if (!user) {
            throw new NotFoundException(`User not found`);
        }
        await this.userRepository.delete(id);
        return { message: "User deleted successfully" };
    }
}
