import { Injectable, NotFoundException } from '@nestjs/common';
import User from './user.entity';
import { CreateUserDto } from './dto/user.dto';
import * as fs from 'fs';
import * as path from 'path';
import { parse } from 'csv-parse/sync';

@Injectable()
export class UsersService {
  private readonly csvFilePath: string;

  constructor() {
    this.csvFilePath = path.join(__dirname, '..', 'database', 'users.csv');
    this.initializeCsvFile();
  }

  private initializeCsvFile() {
    const dir = path.join(__dirname, '..', 'database');
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
    }
    if (!fs.existsSync(this.csvFilePath)) {
      fs.writeFileSync(this.csvFilePath, 'id,name,email,password\n');
    }
  }

  private async readCsvFile(): Promise<User[]> {
    const content = await fs.promises.readFile(this.csvFilePath, 'utf-8');
    const records = parse(content, { columns: true, skip_empty_lines: true });
    return records.map((record) => ({
      ...record,
      id: parseInt(record.id),
    }));
  }

  private async writeCsvFile(users: User[]) {
    const content = users
      .map((user) => `${user.id},${user.name},${user.email},${user.password}`)
      .join('\n');
    await fs.promises.writeFile(this.csvFilePath, content);
  }

  async getAllUsers() {
    return this.readCsvFile();
  }

  async getUserById(id: number) {
    const users = await this.readCsvFile();
    const user = users.find((u) => u.id === id);
    if (user) {
      return user;
    }
    throw new NotFoundException('Could not find the user');
  }

  async createUser(createUserDto: CreateUserDto) {
    const users = await this.readCsvFile();
    const newUser = {
      id: users.length > 0 ? Math.max(...users.map((u) => u.id)) + 1 : 1,
      ...createUserDto,
    };
    users.push(newUser);
    await this.writeCsvFile(users);
    return newUser;
  }

  async deleteById(id: number) {
    const users = await this.readCsvFile();
    const userIndex = users.findIndex((u) => u.id === id);
    if (userIndex === -1) {
      return null;
    }
    const deletedUser = users[userIndex];
    users.splice(userIndex, 1);
    await this.writeCsvFile(users);
    return deletedUser;
  }
}
