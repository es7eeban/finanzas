import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service.js';
import { CreateCategoryDto } from './dto/create-category.dto.js';

@Injectable()
export class CategoriesService {
  constructor(private readonly prisma: PrismaService) {}

  async findAll(userId?: string) {
    return this.prisma.category.findMany({
      where: {
        OR: [
          { userId: null }, // Categorías globales del sistema
          ...(userId ? [{ userId }] : []), // Categorías personalizadas del usuario
        ],
      },
      orderBy: [{ type: 'asc' }, { name: 'asc' }],
    });
  }

  async create(userId: string, dto: CreateCategoryDto) {
    return this.prisma.category.create({
      data: {
        userId,
        name: dto.name,
        type: dto.type,
        icon: dto.icon ?? 'tag',
        color: dto.color ?? '#6B7280',
      },
    });
  }
}
