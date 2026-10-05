import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { PrismaModule } from './prisma/prisma.module.js';
import { AuthModule } from './modules/auth/auth.module.js';
import { CategoriesModule } from './modules/categories/categories.module.js';
import { AccountsModule } from './modules/accounts/accounts.module.js';
import { TransactionsModule } from './modules/transactions/transactions.module.js';
import { SavingsModule } from './modules/savings/savings.module.js';
import { DebtsModule } from './modules/debts/debts.module.js';
import { DashboardModule } from './modules/dashboard/dashboard.module.js';
import { ExchangeRateModule } from './modules/exchange-rate/exchange-rate.module.js';
import { RecurringBillsModule } from './modules/recurring-bills/recurring-bills.module.js';
import { AppController } from './app.controller.js';
import { AppService } from './app.service.js';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
    }),
    PrismaModule,
    AuthModule,
    CategoriesModule,
    AccountsModule,
    TransactionsModule,
    SavingsModule,
    DebtsModule,
    DashboardModule,
    ExchangeRateModule,
    RecurringBillsModule,
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
