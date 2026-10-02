# 🎯 Funcionalidades y Alcance de la Versión 2.0 (v2.0)

## 1. Resumen Ejecutivo de la Versión 2.0

La **Versión 2.0** eleva la plataforma de finanzas personales a un nivel superior de adaptabilidad local, automatización operativa y sofisticación visual. Esta entrega aborda las principales solicitudes de los usuarios de la v1:
* Control de compromisos periódicos (suscripciones de streaming, servicios del hogar, arriendos).
* Manejo transparente de cuentas en dólares con conversión a pesos chilenos según el dólar observado del día.
* Catálogo oficial de bancos chilenos con sus tipos de cuenta característicos (CuentaRUT / Vista).
* Experiencia consistente de selección de fechas sin depender de los controles nativos heterogéneos de cada navegador o sistema operativo.
* Pulido de detalles visuales en la navegación de escritorio.

---

## 2. Detalle de Módulos y Funcionalidades v2.0

### 2.1. Selector de Fecha Universal (Custom Responsive DatePicker)

Reemplazo definitivo de los inputs nativos (`<input type="date">`):
* **Comportamiento idéntico en todos los entornos:** Desactiva y suprime deliberadamente los selectores nativos de Android, iOS, Windows y macOS.
* **Componente Responsive de Doble Modalidad:**
  * **Desktop (≥ 768px):** Despliegue en Popover anclado al campo de texto con sombra profunda y bordes redondeados.
  * **Mobile (< 768px):** Despliegue en Bottom Sheet Drawer accesible desde la parte inferior de la pantalla, optimizado para interacción táctil con el pulgar.
* **Controles Integrados:**
  * **Navegación de Año:** Selector rápido de año (rango ±10 años) mediante dropdown o botones de avance rápido.
  * **Navegación de Mes:** Selector de mes en español (*Enero* a *Diciembre*).
  * **Grilla de Días:** Días del mes con indicación de lunes a domingo, resaltando el día seleccionado y con un anillo sutil en el día de hoy.
  * **Botón "Hoy":** Establece inmediatamente la fecha actual y cierra el selector (opcional).
  * **Botón "Limpiar":** Borra la fecha seleccionada en formularios donde el campo sea opcional.
  * **Cierre Inmediato:** Mediante botón "Listo" / "Cerrar", click en backdrop o tecla `Esc`.

---

### 2.2. Soporte Multimoneda con Tipo de Cambio en Vivo (CLP / USD)

Permite operar con cuentas en dólares sin perder de vista el valor total en moneda nacional:
* **Tasa de Cambio en Tiempo Real:**
  * Conexión con la API pública chilena [https://mindicador.cl/api/dolar](https://mindicador.cl/api/dolar).
  * Obtención del valor oficial del Dólar Observado.
  * Sistema de caché en backend (refresco cada 12 horas o al inicio de jornada hábil) y fallback automático al último valor registrado si el servicio externo no responde.
* **Botón Switch / Toggle Bimoneda (USD ⇄ CLP):**
  * Presente en cada tarjeta de cuenta configurada con divisa USD, en las deudas/préstamos pactados en USD y en el listado de transacciones correspondientes.
  * Al alternar el botón, el usuario puede alternar la visualización entre:
    * **Modo Original:** Ej. `US$ 1,450.00`
    * **Modo Convertido:** Ej. `$1.385.200 CLP` *(al tipo de cambio de $955,31)* con una insignia indicando la tasa aplicada.
* **Consolidación en el Dashboard:**
  * El Patrimonio Líquido y Patrimonio Neto en el Dashboard ahora pueden incluir las cuentas en USD convirtiéndolas dinámicamente a CLP, ofreciendo un reflejo fiel de la riqueza total del usuario.

---

### 2.3. Catálogo de Instituciones Bancarias Chilenas y Tipos de Cuenta

Localización completa para el mercado financiero de Chile:
* **Catálogo Preconfigurado de Instituciones:**
  * **Bancos Tradicionales:** BancoEstado, Banco Santander, Banco de Chile, BCI, Scotiabank, Banco Itaú, Banco BICE, Banco Security, Banco Consorcio, Coopeuch.
  * **Banca Retail:** Banco Falabella, Banco Ripley, Cencosud Scotiabank.
  * **Cuentas Digitales / Fintech:** Tenpo, Mach, Mercado Pago.
  * **Otro / Efectivo.**
* **Identidad Visual por Banco:** Cada banco cuenta con su color institucional predeterminado y su isotipo / logotipo simplificado renderizado automáticamente.
* **Soporte para Nuevos Tipos de Cuenta:**
  * `CHECKING` (Cuenta Corriente)
  * `SIGHT_ACCOUNT` (Cuenta Vista / CuentaRUT de BancoEstado)
  * `SAVINGS` (Cuenta de Ahorro / Bolsillo)
  * `CREDIT_CARD` (Tarjeta de Crédito)
  * `CASH` (Billetera / Efectivo)
  * `LOAN_ACCOUNT` (Cuenta de Préstamo o Pasivo)
* **Campo de Descripción Personalizada:**
  * Texto opcional de hasta 255 caracteres para especificar el propósito de la cuenta (ej. *"Fondo para imprevistos médicos"*, *"Tarjeta para suscripciones streaming"*).

---

### 2.4. Módulo de Pagos Recurrentes, Servicios y Suscripciones (Bills & Subscriptions)

Diseñado para no olvidar vencimientos y distinguir entre cobros automáticos y pagos manuales:

#### 1. Tipos de Ejecución:
* **Cobro Automático (Suscripciones / PAT):**
  * Diseñado para cargos fijos domiciliados en tarjetas de crédito o cuentas (Netflix, Spotify, Google One, Gimnasio, autopistas Tag).
  * El sistema identifica que el cobro se realiza automáticamente en la fecha de corte y genera la transacción asociada sin requerir confirmación manual.
* **Pago Manual Asistido (Cuentas de Servicios / Bills):**
  * Diseñado para boletas de consumo variable o servicios que requieren pago por portal bancario (Luz, Agua, Gas, Internet/Telefonía, Gastos Comunes, Contribuciones).
  * Muestra una tarjeta con el monto estimado o exacto, fecha de vencimiento y un botón destacado **"Marcar como pagado"** (con check visual).
  * Al pulsar el botón, se abre un modal rápido donde el usuario confirma:
    1. Cuenta de donde salió el dinero.
    2. Monto final pagado (por si la boleta varió).
    3. Fecha efectiva de pago.
  * Se genera automáticamente la transacción en el historial de transacciones y el servicio pasa a estado `PAGADO` en el ciclo mensual correspondiente.

#### 2. Tablero de Control Mensual:
* Filtros por estado del ciclo en curso:
  * 🟢 **Pagados este mes:** Servicios ya cubiertos.
  * 🟡 **Por vencer pronto:** Vencen en los próximos 7 días.
  * 🔴 **Vencidos:** Pasaron de la fecha límite y no se ha marcado el pago.
* Resumen en cabecera: **Gasto Fijo Total Mensual**, **Monto ya Pagado** y **Monto Restante por Pagar**.

#### 3. Historial Cronológico de Pagos Recurrentes:
* Sección donde el usuario puede auditar mes a mes el cumplimiento de sus pagos fijos, comparar si las cuentas de luz/agua han subido respecto a meses anteriores y verificar la trazabilidad con los movimientos bancarios.

---

### 2.5. Pulido de Experiencia de Usuario (UI / UX): Animación del Sidebar

* **Corrección del problema de overflow:** El logo principal y el contenedor del encabezado del sidebar cuentan con dimensiones fijas (`shrink-0`) y `overflow-hidden` calibrado para que al colapsar a 80px (`w-20`) no se corte el ícono ni sufra deformaciones.
* **Transición de opacidad sincronizada:** Los textos descriptivos y nombres de menú se ocultan con `opacity-0 pointer-events-none` antes de iniciar el colapso, y reaparecen con un ligero delay (`transition-opacity duration-200 delay-150`) tras completarse la expansión de ancho (`w-64`), erradicando cualquier salto visual.
