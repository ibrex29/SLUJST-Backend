import { Injectable, OnModuleDestroy, OnModuleInit } from '@nestjs/common';
import { Prisma, PrismaClient } from '@prisma/client';
import { PrismaPg } from '@prisma/adapter-pg';
import { Pool } from 'pg';
import { FetchDTO, PaginationResultDTO } from 'src/common/dto';

@Injectable()
export class PrismaService
  extends PrismaClient
  implements OnModuleInit, OnModuleDestroy
{
  constructor() {
    const pool = new Pool({
      connectionString: process.env.DATABASE_URL,
    });

    const adapter = new PrismaPg(pool);

    super({ adapter });
  }

  async onModuleInit() {
    await this.$connect();
  }

  async onModuleDestroy() {
    await this.$disconnect();
  }

  async paginate<T>(
    modelName: Prisma.ModelName,
    {
      query,
      where,
      include = {},
      orderBy = undefined,
    }: {
      query: FetchDTO & { sortField?: string };
      where: object;
      include?: object;
      orderBy?: object;
    },
  ): Promise<PaginationResultDTO<T>> {
    const { skip, limit } = query;

    const findOption: {
      skip: number;
      take: number;
      where: object;
      include: object;
      orderBy?: object;
    } = {
      skip,
      take: limit,
      where,
      include,
    };

    if (orderBy) findOption.orderBy = orderBy;

    const model = this[modelName] as any;

    const [count, rows] = await Promise.all([
      model.count({ where }),
      model.findMany(findOption),
    ]);

    return new PaginationResultDTO(rows, count, query);
  }
}