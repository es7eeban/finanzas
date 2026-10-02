# ⚙️ Especificaciones Técnicas y Modelo de Datos v2.0

## 1. Extensiones al Esquema de Base de Datos (Prisma ORM)

### 1.1. Modificaciones a Enums Existentes

```prisma
enum AccountType {
  CHECKING       // Cuenta Corriente
  SIGHT_ACCOUNT  // 🌟 Nuevo: Cuenta Vista / CuentaRUT
  SAVINGS        // Cuenta de Ahorro / Bolsillo
  CREDIT_CARD    // Tarjeta de Crédito
  CASH           // Efectivo / Billetera
  INVESTMENT     // Inversiones
  LOAN_ACCOUNT   // 🌟 Nuevo: Cuenta de Préstamo / Pasivo
}
```

### 1.2. Nuevos Enums para Pagos Recurrentes

```prisma
enum BillFrequency {
  MONTHLY        // Mensual (más común)
  WEEKLY         // Semanal
  BIWEEKLY       // Quincenal
  ANNUAL         // Anual
}

enum BillExecutionType {
  AUTOMATIC      // Débito automático en TC o cuenta (PAT)
  MANUAL_CHECK   // Requiere confirmación manual con botón "Marcar como pagado"
}

enum BillCategory {
  SUBSCRIPTION   // Streaming, Software, Membresías
  UTILITIES      // Luz, Agua, Gas, Aseo
  TELECOM        // Internet, Telefonía, TV Cable
  HOUSING        // Arriendo, Gastos Comunes, Contribuciones
  EDUCATION      // Colegios, Universidad, Cursos
  INSURANCE      // Seguros de salud, auto, vida
  OTHER          // Otros pagos recurrentes
}

enum ExecutionStatus {
  PAID           // Pagado
  SKIPPED        // Omitido voluntariamente
}
```

### 1.3. Modificaciones en Modelos Existentes

```prisma
model Account {
  id              String      @id @default(uuid())
  userId          String
  name            String
  institution     String?
  institutionCode String?     // 🌟 Nuevo: Código de banco (ej. 'banco_estado', 'banco_chile', 'santander')
  description     String?     // 🌟 Nuevo: Notas o propósito de la cuenta (máx. 255 chars)
  accountNumber   String?
  type            AccountType
  currency        Currency    @default(CLP)
  balance         Decimal     @db.Decimal(14, 2)
  creditLimit     Decimal?    @db.Decimal(14, 2)
  billingCloseDay Int?
  paymentDueDay   Int?
  color           String      @default("#4F46E5")
  icon            String      @default("wallet")
  isActive        Boolean     @default(true)
  createdAt       DateTime    @default(now())
  updatedAt       DateTime    @updatedAt

  user            User           @relation(fields: [userId], references: [id], onDelete: Cascade)
  transactions    Transaction[]
  savingGoals     SavingGoal[]
  recurringBills  RecurringBill[] // 🌟 Relación con pagos recurrentes domiciliados

  @@index([userId, isActive])
  @@map("accounts")
}
```

### 1.4. Nuevos Modelos en Prisma

```prisma
// Pagos Recurrentes y Suscripciones
model RecurringBill {
  id            String            @id @default(uuid())
  userId        String
  accountId     String?           // Cuenta sugerida o cuenta donde está domiciliado el PAT
  categoryId    String?           // Categoría de transacción asociada
  name          String            // Ej. "Netflix", "Cuenta de Luz Enel"
  amount        Decimal           @db.Decimal(14, 2) // Monto fijo o estimado
  currency      Currency          @default(CLP)
  frequency     BillFrequency     @default(MONTHLY)
  executionType BillExecutionType @default(MANUAL_CHECK)
  category      BillCategory      @default(UTILITIES)
  dueDay        Int               // Día del mes en que vence (1 - 31)
  nextDueDate   DateTime
  isActive      Boolean           @default(true)
  notes         String?
  createdAt     DateTime          @default(now())
  updatedAt     DateTime          @updatedAt

  user          User                     @relation(fields: [userId], references: [id], onDelete: Cascade)
  account       Account?                 @relation(fields: [accountId], references: [id], onDelete: SetNull)
  categoryRel   Category?                @relation(fields: [categoryId], references: [id], onDelete: SetNull)
  executions    RecurringBillExecution[]

  @@index([userId, isActive])
  @@map("recurring_bills")
}

// Registro histórico de pagos ejecutados por ciclo
model RecurringBillExecution {
  id              String          @id @default(uuid())
  recurringBillId String
  transactionId   String?         // Transacción contable generada en la BD
  period          String          // Ciclo en formato "YYYY-MM" (ej. "2026-10")
  amountPaid      Decimal         @db.Decimal(14, 2)
  paidAt          DateTime        @default(now())
  status          ExecutionStatus @default(PAID)
  notes           String?
  createdAt       DateTime        @default(now())

  recurringBill   RecurringBill   @relation(fields: [recurringBillId], references: [id], onDelete: Cascade)
  transaction     Transaction?    @relation(fields: [transactionId], references: [id], onDelete: SetNull)

  @@unique([recurringBillId, period]) // Solo una ejecución por servicio en el mismo mes
  @@index([period])
  @@map("recurring_bill_executions")
}

// Caché de Tipo de Cambio en Base de Datos
model ExchangeRateCache {
  id           String   @id @default(uuid())
  fromCurrency String   // 'USD'
  toCurrency   String   // 'CLP'
  rate         Decimal  @db.Decimal(14, 4) // Ej. 955.4000
  source       String   @default("mindicador.cl")
  fetchedAt    DateTime @default(now())
  expiresAt    DateTime

  @@unique([fromCurrency, toCurrency])
  @@map("exchange_rate_cache")
}
```

---

## 2. Catálogo de Nuevos Endpoints REST v2.0

Prefijo global: `/api/v1`

### 2.1. Tipo de Cambio (`/exchange-rate`)
* **`GET /exchange-rate/current?from=USD&to=CLP`**
  * Retorna la tasa actual con tiempo de expiración y fuente.
  * **Respuesta (200 OK):**
    ```json
    {
      "from": "USD",
      "to": "CLP",
      "rate": 955.31,
      "source": "mindicador.cl",
      "fetchedAt": "2026-10-02T10:00:00.000Z",
      "expiresAt": "2026-10-02T22:00:00.000Z"
    }
    ```

### 2.2. Pagos Recurrentes y Suscripciones (`/recurring-bills`)
* **`GET /recurring-bills`**
  * Lista todos los servicios recurrentes del usuario con el estado del ciclo mensual en curso (`isPaidThisMonth`, `daysRemaining`, `status`).
* **`POST /recurring-bills`**
  * Crea un nuevo pago recurrente o suscripción.
* **`GET /recurring-bills/summary?period=YYYY-MM`**
  * Retorna total comprometido en gastos fijos, total ya pagado y saldo pendiente.
* **`POST /recurring-bills/:id/mark-paid`**
  * Registra la confirmación de pago (check manual).
  * **Payload:**
    ```json
    {
      "accountId": "uuid-cuenta-origen",
      "amountPaid": 24500,
      "paidAt": "2026-10-02T18:00:00.000Z",
      "notes": "Boleta de luz Enel pagada por portal BancoEstado"
    }
    ```
  * **Efecto colateral:** Genera automáticamente una `Transaction` de tipo `EXPENSE`, debita el balance de `accountId` atómicamente y crea la tupla en `recurring_bill_executions`.
* **`PATCH /recurring-bills/:id`** - Actualiza monto base, día de vencimiento o cuenta asociada.
* **`DELETE /recurring-bills/:id`** - Da de baja el servicio recurrente (mantiene el histórico previo).

---

## 3. Data Transfer Objects (DTOs) Principales

### 3.1. `CreateRecurringBillDto`
```typescript
export class CreateRecurringBillDto {
  @IsString()
  @IsNotEmpty()
  @MaxLength(100)
  name: string;

  @IsNumber()
  @Min(0.01)
  amount: number;

  @IsEnum(Currency)
  @IsOptional()
  currency?: Currency = Currency.CLP;

  @IsEnum(BillFrequency)
  @IsOptional()
  frequency?: BillFrequency = BillFrequency.MONTHLY;

  @IsEnum(BillExecutionType)
  @IsNotEmpty()
  executionType: BillExecutionType;

  @IsEnum(BillCategory)
  @IsNotEmpty()
  category: BillCategory;

  @IsInt()
  @Min(1)
  @Max(31)
  dueDay: number;

  @IsUUID('4')
  @IsOptional()
  accountId?: string;

  @IsUUID('4')
  @IsOptional()
  categoryId?: string;

  @IsString()
  @IsOptional()
  @MaxLength(255)
  notes?: string;
}
```

### 3.2. `MarkRecurringPaidDto`
```typescript
export class MarkRecurringPaidDto {
  @IsUUID('4')
  @IsNotEmpty()
  accountId: string;

  @IsNumber()
  @Min(0.01)
  amountPaid: number;

  @IsDateString()
  @IsOptional()
  paidAt?: string;

  @IsString()
  @IsOptional()
  @MaxLength(255)
  notes?: string;
}
```

---

## 4. Especificación del Componente Frontend `DatePicker`

```typescript
export interface DatePickerProps {
  value: string; // ISO date string "YYYY-MM-DD" o vació
  onChange: (date: string) => void;
  label?: string;
  placeholder?: string;
  disabled?: boolean;
  required?: boolean;
  minDate?: string;
  maxDate?: string;
  showClearButton?: boolean;
  className?: string;
}
```
* **Manejo de Eventos en Mobile:** Detección de `(max-width: 767px)` para montar el calendario dentro de un modal `fixed inset-x-0 bottom-0` con animación de deslizamiento inferior (*slide-up*).
* **Supresión Nativa:** El input subyacente es de tipo `text` con `readOnly`, desactivando el foco táctil que despierta el teclado del móvil o los pickers nativos de Safari/Chrome.
