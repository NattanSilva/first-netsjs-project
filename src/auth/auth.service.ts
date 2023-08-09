import { Injectable } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { compare } from 'bcryptjs';
import { UsersService } from '../users/users.service';

@Injectable()
export class AuthService {
  constructor(
    private usersService: UsersService,
    private jwtService: JwtService,
  ) {}

  async validateUser(userEmail: string, userPassword: string) {
    const user = await this.usersService.findByEmail(userEmail);

    if (user) {
      const passwordMatch = await compare(userPassword, user.password);
      if (passwordMatch) {
        return {
          email: user.email,
        };
      }
    }

    return null;
  }

  async login(email: string) {
    const user = await this.usersService.findByEmail(email);

    return {
      token: this.jwtService.sign({ email }, { subject: user.id }),
    };
  }
}
