# 💡 Visión y Requerimientos de la Versión 2.0 (v2.0)

Este documento sintetiza, corrige y estructura las nuevas funcionalidades y mejoras identificadas para la **Versión 2.0** de la plataforma de Finanzas Personales, construida sobre las bases sólidas y probadas de la Versión 1.0.

---

## 1. Selector de Fecha Universal (Custom Responsive DatePicker)

### 1.1. Justificación y Problemática
En la versión 1 se utilizaba el selector nativo del navegador (`<input type="date" />`), el cual genera inconsistencias visuales, comportamientos dispares y problemas de usabilidad según el sistema operativo del usuario (Android, iOS, Windows, macOS) y su respectivo navegador (Chrome, Safari, Firefox, Edge).

### 1.2. Requerimientos
* **Componente Custom Unificado:** Reemplazar el input nativo por un componente DatePicker interactivo, accesible y 100% responsivo estilado con Tailwind CSS.
* **Desactivación de Selectores Nativos:** Anular intencionalmente el picker nativo en todos los sistemas operativos (Android, iOS, Windows, macOS) garantizando una experiencia visual y funcional idéntica en cualquier dispositivo.
* **Capacidades Funcionales:**
  * Navegación y cambio rápido de **Año** y **Mes** (dropdowns o botones de navegación).
  * Selección de **Día** en grilla calendario con indicador del día actual.
  * Botón de acción rápida **"Hoy"** para fijar la fecha actual en un clic.
  * Botón **"Limpiar"** para resetear la fecha cuando sea opcional.
  * Apertura en popover para pantallas de escritorio (Desktop) y drawer/modal inferior en dispositivos móviles (Mobile).
  * Cierre al presionar fuera (backdrop click), pulsar botón de cerrar o tecla `Escape`.

---

## 2. Soporte Multimoneda con Tipo de Cambio en Vivo (CLP / USD)

### 2.1. Justificación
Muchos usuarios mantienen cuentas corrientes o de ahorro en Pesos Chilenos (CLP) y a la vez cuentas en Dólares (USD) o deudas en divisas extranjeras. Se requiere visualizar el impacto consolidado de estos fondos en moneda local sin perder la trazabilidad de la divisa original.

### 2.2. Requerimientos
* **Persistencia en Divisa Original:** Toda transacción, cuenta, préstamo o deuda ingresada en USD se almacena con su divisa original en la base de datos sin alteraciones arbitrarias.
* **Integración con API de Tipo de Cambio:**
  * Consumo del tipo de cambio del día oficial a través de la API pública [mindicador.cl](https://mindicador.cl/api) (`dolar.valor`).
  * Implementación de caché en backend (TTL de 6 a 12 horas) para evitar sobrecarga y garantizar resiliencia ante caídas de la API externa.
* **Switch / Toggle de Visualización (USD ⇄ CLP):**
  * Control visual interactivo en tarjetas de cuentas, listados de transacciones y deudas en USD.
  * Permite alternar instantáneamente la vista entre el monto original en **USD** y su equivalente en **CLP** según la tasa del día.
* **Consolidación en Dashboard:** El cálculo de patrimonio y balances consolidados debe poder ponderar las cuentas en USD convirtiéndolas al tipo de cambio actual.

---

## 3. Catálogo de Instituciones Financieras Chilenas y Tipos de Cuenta

### 3.1. Catálogo de Bancos Locales
Enriquecer el registro de cuentas con un listado predeterminado de instituciones financieras que operan en Chile, con sus respectivos colores e iconografía representativa:
* **Bancos Tradicionales e Inversión:** BancoEstado, Banco de Chile, Banco Santander, BCI, Scotiabank, Banco Itaú, Banco BICE, Banco Security, Banco Consorcio, Coopeuch.
* **Banca Retail y Casas Comerciales:** Banco Falabella, Banco Ripley, Cencosud Scotiabank.
* **Fintechs y Billeteras Digitales:** Tenpo, Mach, Mercado Pago.

### 3.2. Nuevos Tipos de Cuenta
* **Cuenta Vista / CuentaRUT:** Esencial para el contexto chileno, diferenciándola de una cuenta corriente tradicional.
* **Cuenta Corriente:** Con soporte de línea de crédito.
* **Cuenta de Ahorro:** Para depósitos a plazo o ahorros con reajuste.
* **Tarjeta de Crédito:** Con cupo, corte y facturación.
* **Efectivo / Billetera Física.**
* **Cuenta de Pasivo / Préstamo.**

### 3.3. Metadatos Adicionales
* Campo de **Descripción / Notas de Cuenta** (ej. *"Cuenta para arriendo y gastos comunes"*, *"Tarjeta para compras internacionales"*).

---

## 4. Pagos Recurrentes, Servicios y Suscripciones (Bills & Subscriptions)

### 4.1. Concepto y Necesidad
Permitir a los usuarios tener un control exhaustivo de los compromisos periódicos de dinero mes a mes, dividiéndolos según su naturaleza operativa.

### 4.2. Tipos de Ejecución
1. **Automáticos (Débito Automático PAT / Tarjeta de Crédito):**
   * Suscripciones digitales (Netflix, Spotify, Cloud, gimnasio).
   * Al llegar la fecha de vencimiento/corte, el sistema registra o marca el movimiento automáticamente imputándolo a la tarjeta de crédito o cuenta asociada.
2. **Manuales con Check (Cuentas de Servicios Básicos / Impuestos):**
   * Servicios como Luz (Enel/CGE), Agua (Aguas Andinas/Esval), Gas (Metrogas), Internet/Telefonía, Gastos Comunes, Contribuciones.
   * Cuentan con un botón interactivo **"Marcar como pagado"** (check manual). Al confirmarlo, el usuario selecciona de qué cuenta debitó el pago y se crea la transacción en el historial.

### 4.3. Control e Historial Mensual
* Tablero o grilla mensual que muestra el estado de cada servicio en el ciclo en curso:
  * 🟢 *Pagado / Al día*
  * 🟡 *Próximo a vencer (en X días)*
  * 🔴 *Vencido / Pendiente de pago*
* Historial cronológico mensual para auditar qué cuentas se han cubierto y cuánto se ha desembolsado en costos fijos cada mes.
* Alertas preventivas en el Dashboard (próximos 7 y 15 días).

---

## 5. Optimizaciones de Experiencia de Usuario (UI / UX)

### 5.1. Corrección de Animación en el Sidebar Desktop
* **Problema reportado:** 
  1. Al colapsar el sidebar, el logo e icono junto al texto "Finanzas" sufre un corte visual brusco por overflow.
  2. Al expandir el sidebar, los textos de navegación aparecen antes de que la barra lateral termine su transición de ancho (`width`), generando un parpadeo visual.
* **Solución:**
  * Ajustar las clases de transición de Tailwind (`transition-all duration-300`).
  * Aplicar retardos de opacidad (`transition-opacity delay-100`) para que las etiquetas de texto solo se hagan visibles una vez completada la expansión del ancho.
  * Ocultar textos con `overflow-hidden` y anchos fijos de icono para eliminar el corte brusco.

---

## 6. Principios de Ingeniería para la v2
1. **Clean Architecture & Módulos Aislados:** Las nuevas funcionalidades (tipo de cambio, pagos recurrentes) no deben degradar ni acoplar de forma indebida los módulos existentes de Transacciones y Cuentas.
2. **Reversibilidad y Tolerancia a Fallos:** Si la API de tipo de cambio falla, el sistema debe operar en modo degradado con el último valor cacheado o un valor por defecto configurable.
3. **Calidad de Código Inalterable:** Cero uso de `any`, 100% TypeScript estricto, pruebas unitarias y E2E asociadas a cada nueva característica.
