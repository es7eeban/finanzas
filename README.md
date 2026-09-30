# 💰 Plataforma de Gestión de Finanzas Personales

Bienvenido a la documentación y especificación del sistema de gestión de finanzas personales. Este repositorio contiene el diseño arquitectónico, especificaciones de producto, modelo de datos, diseño de interfaz y plan de desarrollo estructurado para el desarrollo del MVP y fases posteriores.

---

## 📌 Índice de Documentación

Toda la documentación técnica y funcional se encuentra detallada en la carpeta [`docs/`](file:///C:/Users/estee/Documents/Proyectos/Antigravity/finanzas/docs/):

1. **[01. Arquitectura y Diseño del Sistema (SDD)](file:///C:/Users/estee/Documents/Proyectos/Antigravity/finanzas/docs/01_SDD_ARQUITECTURA.md)**
   * Arquitectura C4 (Contexto, Contenedores, Componentes).
   * Arquitectura en capas en NestJS y Feature-Sliced Design en React.
   * Estrategia de seguridad, autenticación y manejo de estado.
2. **[02. Funcionalidades y Alcance del MVP](file:///C:/Users/estee/Documents/Proyectos/Antigravity/finanzas/docs/02_FUNCIONALIDADES_Y_MVP.md)**
   * Módulo de Cuentas, Métodos de Pago y Tarjetas de Crédito.
   * Módulo de Transacciones rápidas (Ingresos, Gastos, Transferencias).
   * **Módulo de Metas de Ahorro** (asignación de fondos, cuentas vinculadas y proyección).
   * Módulo de Deudas y Préstamos P2P.
   * Dashboard analítico y KPIs.
3. **[03. Especificaciones Técnicas y Modelo de Datos](file:///C:/Users/estee/Documents/Proyectos/Antigravity/finanzas/docs/03_ESPECIFICACIONES_TECNICAS.md)**
   * Diagrama Entidad-Relación (ERD) en Mermaid.
   * Esquema de base de datos con **Prisma ORM** y **PostgreSQL**.
   * Precisión monetaria (`Decimal`).
   * Catálogo completo de endpoints de la API REST y DTOs de validación.
4. **[04. Guía de Diseño y UI/UX](file:///C:/Users/estee/Documents/Proyectos/Antigravity/finanzas/docs/04_DISENO_Y_UI_UX.md)**
   * Principios Mobile-First y navegación (Sidebar en Desktop + Bottom Nav con FAB en Móvil).
   * Sistema de diseño Tailwind CSS, paleta de colores y Modo Oscuro nativo.
   * Flujos de interacción paso a paso para registro rápido de movimientos.
5. **[05. Plan de Desarrollo y Roadmap de Implementación](file:///C:/Users/estee/Documents/Proyectos/Antigravity/finanzas/docs/05_PLAN_DE_DESARROLLO.md)**
   * Fases de ejecución paso a paso (Setup, Backend Core, Features, Frontend, Dashboard, CI/CD).
   * Definición de Terminado (Definition of Done - DoD).
   * Convenciones de GitFlow, Conventional Commits y Testing.

---

## 🛠️ Stack Tecnológico

| Capa | Tecnología | Propósito |
| :--- | :--- | :--- |
| **Frontend** | React 18+ con Vite & TypeScript | Interfaz reactiva, rápida y fuertemente tipada |
| **Estilos UI** | Tailwind CSS + Lucide Icons | Diseño responsive, modo oscuro y utilidades rápidas |
| **Gráficos** | Recharts | Gráficos interactivos de donuts, barras e históricos |
| **Estado Global** | Zustand | Gestión de estado ligero sin boilerplate excesivo |
| **Backend** | NestJS (Node.js + TypeScript) | Arquitectura modular escalable, inyección de dependencias |
| **ORM** | Prisma | Tipado seguro de modelos, migraciones y queries fluidas |
| **Base de Datos** | PostgreSQL | Motor relacional robusto con soporte de transacciones ACID |
| **Validación** | `class-validator` + `class-transformer` | Validación estricta de payloads DTO |
| **Testing** | Vitest + React Testing Library / Jest + Supertest | Cobertura unitaria y pruebas E2E de flujos críticos |

---

## 🚀 Próximos Pasos

1. Revisar los documentos en [`docs/`](file:///C:/Users/estee/Documents/Proyectos/Antigravity/finanzas/docs/).
2. Resolver decisiones de configuración y reglas de negocio clave (moneda, autenticación, lógica de saldo reservado en ahorros).
3. Iniciar la **Fase 0** (Estructura de proyecto monorepo/carpetas y Docker Compose para PostgreSQL).
