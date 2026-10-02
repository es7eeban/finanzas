# 🎨 Guía de Diseño y Experiencia de Usuario (UI / UX) v2.0

## 1. Principios de Interfaz para la Versión 2.0

La experiencia de la v2.0 se rige por:
1. **Consistencia Absoluta Multiplataforma:** La interfaz luce y responde de forma idéntica en Android, iOS, Windows y macOS.
2. **Localización Natural:** La identidad visual de los bancos chilenos y el formato bimoneda (CLP/USD) transmiten cercanía y claridad inmediata.
3. **Feedback Inmediato en Gastos Fijos:** Conocer en un solo vistazo qué servicios están cubiertos este mes y cuáles están a punto de cortar o vencer.

---

## 2. Anatomía de Componentes Nuevos

### 2.1. Selector de Fecha Universal (`DatePicker`)

```
+-------------------------------------------------------+
|  📅  Fecha: [ 02 / 10 / 2026                        ] |
+-------------------------------------------------------+
         |
         v (Al hacer clic o tap)
+-------------------------------------------------------+
|   <  [ Octubre v ]    [ 2026 v ]  >       [ X ]       |
+-------------------------------------------------------+
|   Lu    Ma    Mi    Ju    Vi    Sa    Do                  |
|               01   (02)   03    04    05                  |
|   06    07    08    09    10    11    12                  |
|   13    14    15    16    17    18    19                  |
|   20    21    22    23    24    25    26                  |
|   27    28    29    30    31                              |
+-------------------------------------------------------+
|   [ Limpiar ]                          [ Hoy ]        |
+-------------------------------------------------------+
```

* **Desktop:** Se renderiza como un Popover flotante con elevación `shadow-2xl`, borde `border-slate-200 dark:border-slate-800` y esquinas redondeadas `rounded-2xl`.
* **Mobile:** Se despliega como un Bottom Sheet táctil con `fixed inset-x-0 bottom-0 z-50 rounded-t-3xl bg-white dark:bg-slate-900 border-t` y animación de entrada ascendente.
* **Tokens de Color:**
  * Día actual: `border border-indigo-500 text-indigo-600 font-bold dark:text-indigo-400`.
  * Día seleccionado: `bg-indigo-600 text-white font-extrabold shadow-sm`.
  * Días deshabilitados/fuera de rango: `opacity-25 pointer-events-none`.

---

### 2.2. Switch / Toggle Bimoneda (`CurrencyToggle`)

Permite alternar entre la visualización en dólares y pesos chilenos sin alterar la base de datos:

```
[  US$ 1,450.00  | ⇄ Ver en CLP ]  ➔ Al pulsar ➔  [  $ 1.385.200 CLP | ⇄ Ver en USD ]
                                                   (TC: $955,31 mindicador.cl)
```

* Botón compacto tipo cápsula (`rounded-full`) con icono de cambio `ArrowLeftRight`.
* Etiqueta con badge sutil indicando la tasa de cambio en vivo aplicada y hora de actualización.

---

### 2.3. Catálogo e Insignias de Bancos Chilenos

Identidad visual con paleta corporativa para tarjetas de cuentas y selectores:

| Institución | Color Primario | Badge UI | Tipos Típicos |
| :--- | :---: | :---: | :--- |
| **BancoEstado** | `#F26822` (Naranja) | `bg-amber-50 text-orange-700` | CuentaRUT, Cuenta Corriente, Ahorro |
| **Banco Santander** | `#EC0000` (Rojo) | `bg-red-50 text-red-700` | Cuenta Corriente, Life, TC |
| **Banco de Chile / Edwards** | `#002B49` (Azul Noche) | `bg-blue-50 text-blue-900` | Cuenta Corriente, Fan, Dólares |
| **BCI** | `#007A87` (Teal) | `bg-teal-50 text-teal-800` | Cuenta Corriente, Ahorro |
| **Scotiabank** | `#ED0722` (Rojo Vivo) | `bg-rose-50 text-rose-700` | Cuenta Corriente, TC Visa/Mastercard |
| **Banco Itaú** | `#EC7000` (Naranja Itaú) | `bg-orange-50 text-orange-800` | Cuenta Corriente, TC Personal Bank |
| **Banco Falabella** | `#00843D` (Verde) | `bg-emerald-50 text-emerald-800` | CMR Visa, Cuenta Corriente |
| **Banco Ripley** | `#592C82` (Púrpura) | `bg-purple-50 text-purple-800` | Tarjeta Ripley, Cuenta Vista |
| **Tenpo / Mach** | `#00D2C4` (Cian Fintech) | `bg-cyan-50 text-cyan-800` | Billetera Digital, Tarjeta Prepago |

---

### 2.4. Módulo de Servicios y Suscripciones (Bills & Subscriptions)

#### 1. Tarjeta de Pago Recurrente (Manual con Check):
```
+-------------------------------------------------------+
| 💡 Enel Distribución - Luz Hogar         [ En 4 días ]|
| Cuenta de Servicios Básicos                           |
|                                                       |
| Monto Estimado: $ 28.500 CLP                          |
| Vencimiento: Día 12 de cada mes                       |
| Débito sugerido: Cuenta Corriente Bco Chile           |
+-------------------------------------------------------+
|  [✓ Marcar como Pagado]              [ Editar ]       |
+-------------------------------------------------------+
```

#### 2. Tarjeta de Suscripción (Automática en TC):
```
+-------------------------------------------------------+
| 🎬 Netflix Premium (4K)                 [ Pagado ✓ ]  |
| Suscripción Digital                                   |
|                                                       |
| Monto Fijo: $ 10.990 CLP                              |
| Cargado en: Tarjeta Visa Signature                    |
| Facturación: Día 05 de cada mes (PAT Automático)      |
+-------------------------------------------------------+
```

#### 3. Modal de Confirmación Rápida ("Marcar como Pagado"):
* Al presionar *"Marcar como Pagado"*, se despliega un modal pre-rellenado con:
  * Monto de la boleta (editable si la cuenta de agua/luz varió respecto a la estimada).
  * Cuenta bancaria origen donde se realizó el pago.
  * Selector DatePicker para la fecha en que se efectuó el pago.
  * Botón *"Confirmar Pago y Registrar Gasto"* que debita el saldo atómicamente.

---

## 3. Corrección de Animación del Sidebar Desktop

### 3.1. Diagnóstico del Bug v1.0
* Al pasar de `w-64` a `w-20`, el contenedor colapsaba antes de que los textos desaparecieran, provocando que las etiquetas se desbordaran durante 150ms.
* El logo de `Wallet` cambiaba su margen causando un salto de 4 píxeles.

### 3.2. Solución CSS Implementada
```html
<!-- Contenedor Sidebar -->
<aside class="transition-[width] duration-300 ease-in-out shrink-0 overflow-x-hidden ${isCollapsed ? 'w-20' : 'w-64'}">
  
  <!-- Header con Logo -->
  <div class="flex items-center gap-3 p-4">
    <div class="w-10 h-10 shrink-0 rounded-2xl flex items-center justify-center">
      <!-- Ícono inalterable sin saltos -->
    </div>
    <div class="truncate transition-opacity duration-200 ${isCollapsed ? 'opacity-0 pointer-events-none' : 'opacity-100 delay-100'}">
      <h1 class="text-sm font-bold">Finanzas</h1>
    </div>
  </div>

  <!-- Items de Navegación -->
  <NavLink class="flex items-center gap-3 px-3 py-2.5 rounded-xl">
    <Icon class="w-5 h-5 shrink-0" />
    <span class="truncate transition-opacity duration-200 ${isCollapsed ? 'opacity-0 hidden' : 'opacity-100 delay-100'}">
      {item.label}
    </span>
  </NavLink>
</aside>
```
* **Resultado:** Transición suave, continua y sin saltos visuales ni parpadeos de texto.
