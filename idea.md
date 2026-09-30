# Proyecto: Plataforma de Gestión de Finanzas Personales

Este documento está diseñado para ser procesado por el cliente de Gemini y generar la estructura, el código y la arquitectura del proyecto.

## 1. Requisitos Funcionales

La aplicación debe priorizar la simplicidad en la entrada de datos, reduciendo la fricción al registrar movimientos diarios.

* **Gestión de Cuentas y Tarjetas:**
* Crear, editar y eliminar métodos de pago (Tarjetas de Crédito, Tarjetas de Débito, Efectivo, Cuentas Bancarias).
* Definir saldo inicial, límite de crédito y fecha de facturación (para tarjetas de crédito).


* **Gestión de Transacciones (Ingresos y Egresos):**
* Flujo rápido para registrar un movimiento: Seleccionar tarjeta/cuenta -> Monto -> Categoría -> Fecha.
* Soporte para transacciones recurrentes (suscripciones, sueldos).


* **Gestión de Deudas y Préstamos (P2P):**
* **Préstamos otorgados:** Registrar dinero prestado a terceros (Nombre del deudor, Monto, Fecha límite de pago, Estado: Pendiente/Pagado).
* **Deudas adquiridas:** Registrar dinero adeudado a terceros (Acreedor, Monto, Fecha de vencimiento, Estado).
* Notificaciones o indicadores visuales para deudas próximas a vencer.


* **Dashboard Principal (Resumen):**
* Balance total consolidado y desglosado por cuenta.
* Indicadores clave: Ingresos del mes vs. Egresos del mes.
* Próximas deudas por cobrar o pagar en los próximos 7-14 días.



## 2. Especificaciones Técnicas

El stack elegido está orientado a la escalabilidad y al tipado estricto.

* **Frontend:**
* **Framework:** React (con Vite para un entorno de desarrollo rápido).
* **Lenguaje:** TypeScript.
* **Estilos:** Tailwind CSS para el diseño responsivo y utilidades rápidas.
* **Gráficos:** Recharts o Chart.js (optimizado para React) para la visualización de datos.
* **Gestión del Estado:** Zustand o React Context (mantenerlo ligero y simple).


* **Backend:**
* **Framework:** NestJS (estructura modular y basada en decoradores).
* **Lenguaje:** TypeScript.
* **ORM:** Prisma o TypeORM (Prisma recomendado por su excelente tipado y migraciones sencillas).
* **Validación:** `class-validator` y `class-transformer` para los DTOs.


* **Base de Datos:**
* **Motor:** PostgreSQL.
* **Modelos Principales:** `User` (si aplica autenticación), `AccountCard`, `Transaction`, `DebtLoan`.



## 3. Diseño y UI/UX

El enfoque debe ser "Mobile-First" pero con una vista de escritorio potente, utilizando componentes modernos.

* **Layout y Menú Personalizado:**
* **Escritorio:** Un *Sidebar* colapsable en el lateral izquierdo, con iconos minimalistas y un perfil de usuario en la parte inferior.
* **Móvil:** Un *Bottom Navigation Bar* (menú inferior) similar a las apps bancarias modernas, con un botón central flotante (FAB) de "Nuevo Movimiento" para registrar datos rápidamente.


* **Estética Visual:**
* Uso intensivo de utilidades de Tailwind: bordes redondeados (`rounded-xl` o `rounded-2xl`), sombras suaves (`shadow-sm`, `shadow-md`), y transiciones fluidas.
* Soporte para Modo Oscuro nativo (`dark:bg-gray-900`, etc.).
* Tipografía limpia (ej. Inter o Roboto).


* **Dashboard y Gráficos:**
* **Tarjetas de Resumen (Cards):** Estilo *Glassmorphism* ligero o tarjetas planas con iconos de colores tenues para mostrar los saldos.
* **Gráfico de Anillo (Donut Chart):** Para el desglose de gastos por categoría.
* **Gráfico de Barras (Bar Chart):** Para comparar ingresos vs. egresos de los últimos 6 meses.


* **Interacciones:**
* Modales (Diálogos) para la creación de transacciones rápidas sin cambiar de página.
* Selectores de cuentas visuales (que muestren los últimos 4 dígitos de la tarjeta o un color asignado).



## 4. Plan de Ejecución (Fases de Generación)

Instrucciones para el agente al generar el código:

1. **Fase 1: Setup y Modelado de Datos (Backend y BD)**
* Inicializar el proyecto NestJS y configurar la conexión a PostgreSQL.
* Crear los esquemas/entidades (Cuentas, Transacciones, Deudas).
* Generar migraciones iniciales.


2. **Fase 2: Desarrollo de la API REST (Backend)**
* Generar los módulos, controladores y servicios CRUD para cada entidad.
* Implementar endpoints de agregación para el Dashboard (ej. `/api/dashboard/summary`).


3. **Fase 3: Inicialización del Frontend y Layout (React + Tailwind)**
* Configurar Vite, React, Tailwind CSS y React Router.
* Crear la estructura base de componentes: Sidebar, Bottom Nav, Header.
* Implementar el enrutamiento base (Dashboard, Cuentas, Deudas).


4. **Fase 4: Desarrollo de Vistas y Formularios (Frontend)**
* Crear los modales/formularios para "Agregar Tarjeta", "Nuevo Ingreso/Egreso" y "Nueva Deuda".
* Conectar los formularios con los endpoints de NestJS.


5. **Fase 5: Integración del Dashboard y Gráficos**
* Instalar librería de gráficos.
* Consumir los datos agregados de la API y renderizar las tarjetas de resumen y gráficos.


## 5. Guías de Desarrollo y Arquitectura (Reglas para el Agente)

El código generado **DEBE** adherirse estrictamente a las siguientes directrices para garantizar la mantenibilidad, escalabilidad y limpieza del proyecto.

### 5.1. Convenciones de Código

* **Tipado Estricto:** Se debe usar TypeScript en modo estricto (`"strict": true`).
* **Nomenclatura:**
* `camelCase` para variables, funciones y métodos.
* `PascalCase` para Clases, Interfaces, Tipos y Componentes de React.
* `UPPER_SNAKE_CASE` para constantes globales y variables de entorno.


* **Importaciones:** Usar absolute imports (ej. `@/components/...` o `src/modules/...`) agrupadas en el siguiente orden: librerías externas, componentes internos, utilidades, estilos/tipos.
* **Documentación:** Comentar únicamente la lógica de negocio compleja (usar JSDoc para funciones clave). El código debe ser autodescriptivo.

### 5.2. Patrones de Diseño y Arquitectura

* **Backend (NestJS):**
* Aplicar **Arquitectura en Capas**: `Controller` (solo maneja HTTP) -> `Service` (lógica de negocio) -> `Repository / ORM` (acceso a datos).
* Uso estricto de **Inyección de Dependencias**.


* **Frontend (React):**
* Aplicar el patrón **Custom Hooks** para separar la lógica de negocio y el consumo de APIs de la interfaz de usuario. Los componentes deben ser lo más "tontos" (presentacionales) posible.
* Estructura basada en **Features** (Feature-Sliced Design simplificado), agrupando componentes, hooks y servicios por dominio (ej. `/features/transactions`).



### 5.3. Prohibiciones (Anti-patrones)

* 🚫 **PROHIBIDO** el uso de `any` en TypeScript. Usar `unknown` o genéricos si el tipo es dinámico.
* 🚫 **PROHIBIDO** escribir CSS en línea (`style={{...}}`). Todo el estilado debe hacerse exclusivamente mediante clases de Tailwind CSS.
* 🚫 **PROHIBIDO** mezclar lógica de base de datos dentro de los Controladores de NestJS.
* 🚫 **PROHIBIDO** hacer mutaciones directas de estado en React (usar métodos inmutables).
* 🚫 **PROHIBIDO** quemar (hardcode) URLs de APIs, credenciales o tokens. Todo debe ir en variables de entorno (`.env`).

### 5.4. Estructura del Proyecto

El agente deberá organizar los repositorios (o el monorepo) con la siguiente estructura base:

**Frontend (React/Vite):**

```text
src/
 ├── assets/        # Imágenes, iconos, fuentes
 ├── components/    # Componentes UI compartidos (Botones, Modales, Inputs)
 ├── features/      # Módulos por dominio (auth, accounts, transactions, debts)
 │    └── [featureName]/
 │         ├── components/
 │         ├── hooks/
 │         └── services.ts
 ├── layouts/       # Estructuras de página (Sidebar, Header, BottomNav)
 ├── store/         # Estado global (Zustand)
 ├── types/         # Interfaces y tipos globales
 └── utils/         # Funciones de ayuda (formateo de moneda, fechas)

```

**Backend (NestJS):**

```text
src/
 ├── common/        # Decoradores, filtros de excepciones, guards, interceptores compartidos
 ├── config/        # Configuración de variables de entorno (Joi/class-validator)
 ├── modules/       # Módulos por dominio (users, accounts, transactions)
 │    └── [moduleName]/
 │         ├── dto/
 │         ├── entities/
 │         ├── [name].controller.ts
 │         ├── [name].service.ts
 │         └── [name].module.ts
 └── prisma/        # (Si se usa Prisma) Esquema y migraciones

```

### 5.5. Testing y CI/CD

* **Testing Frontend:**
* Usar `Vitest` y `React Testing Library`.
* Pruebas unitarias obligatorias para utilidades (cálculos financieros, formateo de fechas) y custom hooks complejos.


* **Testing Backend:**
* Usar `Jest` (por defecto en NestJS).
* Escribir tests unitarios para los `Services` (mockeando la base de datos).
* Escribir tests E2E con `Supertest` para los flujos críticos (crear transacción, crear deuda).


* **CI/CD (GitHub Actions):**
* El agente debe generar un archivo `.github/workflows/main.yml` que incluya:
1. Linting (`eslint`) y formato (`prettier`).
2. Ejecución de tests.
3. Build de validación tanto para NestJS como para React.





### 5.6. Flujo de Trabajo (GitFlow), Commits y PRs

* **Estrategia de Ramas:** Se utilizará un modelo basado en *Trunk-Based Development* o un *GitFlow simplificado* (`main` para producción, ramas `feature/nombre-funcionalidad` o `fix/nombre-error` para desarrollo).
* **Estilo de Commits:** El proyecto exige **Conventional Commits**. El agente debe generar mensajes con este formato:
* `feat: agrega modal para registrar ingresos`
* `fix: corrige cálculo del balance en el dashboard`
* `chore: actualiza dependencias de Tailwind`
* `refactor: mueve lógica de fechas a un hook custom`


* **Pull Requests (PRs):** Las PRs deben incluir una plantilla (`.github/PULL_REQUEST_TEMPLATE.md`) que exija:
1. Descripción del cambio.
2. Checklist de tareas completadas (tests pasados, no warnings de linter).
3. Evidencia visual (si es un cambio en frontend).

