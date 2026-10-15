# 🐜 AntsCenter - Cuaderno de Bitácora y Tutorial de Arquitectura
*De Backend Tradicional (PHP / Sistemas) a React 19, TypeScript y Supabase*

Este documento es una guía viva que recoge paso a paso la evolución técnica de **AntCenter**, explicando no solo el código, sino **el porqué de cada decisión de ingeniería**, las diferencias conceptuales con el desarrollo backend tradicional y los patrones de arquitectura aplicados.

---

## 📑 Índice de Capítulos
1. [Capítulo 1: El Choque de Modelos Mentales (PHP vs React)](#capítulo-1-el-choque-de-modelos-mentales-php-vs-react)
2. [Capítulo 2: El Estado Local y el "Latido" Reactivo (`useState`)](#capítulo-2-el-estado-local-y-el-latido-reactivo-usestate)
3. [Capítulo 3: Comunicación con el Mundo Exterior (I/O y Supabase con `useEffect`)](#capítulo-3-comunicación-con-el-mundo-exterior-io-y-supabase-con-useeffect)
4. [Capítulo 4: Arquitectura de Componentes (Container vs. Presentational)](#capítulo-4-arquitectura-de-componentes-container-vs-presentational)
5. [Capítulo 5: Los Tres Pilares de UX en Aplicaciones Asíncronas](#capítulo-5-los-tres-pilares-de-ux-en-aplicaciones-asíncronas)
6. [Capítulo 6: Gotchas y Lecciones de Ingeniería Aprendidas](#capítulo-6-gotchas-y-lecciones-de-ingeniería-aprendidas)

---

## Capítulo 1: El Choque de Modelos Mentales (PHP vs React)

En la arquitectura de backend tradicional (como PHP clásico o scripts de servidor bajo Apache/Nginx):
* **Petición HTTP entrante:** El script se ejecuta de arriba a abajo.
* **Procesamiento:** Se leen variables, se consulta la base de datos (PDO/SQL) y se interpola un string HTML (o JSON).
* **Ciclo de vida:** El payload viaja al navegador y **el proceso en memoria muere por completo**. Las variables locales desaparecen.

```
[Cliente] ──── GET /colonias ────► [PHP Engine] ──► SELECT * FROM colonies
                                                        │
[Cliente] ◄── Recibe HTML ─────── [Script muere] ◄──────┘
```

En una **Single Page Application (SPA) con React**:
* La página se carga una vez en el navegador y **no se vuelve a recargar**.
* El componente (como `Colonies()`) es una función que el motor de React **vuelve a ejecutar decenas o cientos de veces** a lo largo de la sesión del usuario.
* Si declaras una variable local normal (`let total = 0;`), cada vez que la pantalla se redibuje la variable se reseteará. Para tener memoria entre ejecuciones necesitas **Hooks**.

---

## Capítulo 2: El Estado Local y el "Latido" Reactivo (`useState`)

Para que una variable persista entre re-renders y, además, **provoque que la pantalla se actualice al cambiar**, usamos `useState`.

```typescript
const [workerCount, setWorkerCount] = useState<number>(15);
```

### La Inversión de Control: ¿Qué es `prev`?
Al actualizar el estado con un botón, aprendimos la diferencia entre pasar un valor fijo y pasar una **función actualizadora (callback)**:

```typescript
// ❌ Potencialmente desfasado si hay actualizaciones rápidas concurrentes:
setWorkerCount(workerCount + 1);

// ✅ Atómico y funcional:
setWorkerCount((prev) => prev + 1);
```

* **¿De dónde sale `prev`?:** No lo declaras tú; **lo inyecta React**.
* **Paralelismo con PHP:** Es idéntico a las funciones de callback en PHP como `array_map` o `fn($prev) => $prev + 1`. Tú solo defines el contrato de la función: *"React, toma el valor que tengas en memoria en este milisegundo exacto (`prev`) y súmale 1"*.

---

## Capítulo 3: Comunicación con el Mundo Exterior (I/O y Supabase con `useEffect`)

Una función de render en React debe ser pura (datos de entrada ➔ interfaz visual). **Nunca debe hacer I/O directamente en su cuerpo principal**.

### El Peligro del Bucle Infinito
Si hicieras `supabase.from('ants_colonies').select()` directamente en el cuerpo del componente:
1. `Colonies()` se ejecuta.
2. Lanza petición HTTP a Supabase.
3. Llegan los datos y llamas a `setColonies(data)`.
4. El estado cambia ➔ React vuelve a ejecutar `Colonies()`.
5. Se vuelve a disparar la petición HTTP... **Bucle infinito que colapsa la red y la base de datos.**

### La Solución: `useEffect` y el Array de Dependencias `[]`
`useEffect` le dice a React: *"Pinta primero la pantalla para que el usuario no espere, y después ejecuta este bloque de I/O en segundo plano"*.

```typescript
useEffect(() => {
    async function fetchColonies() {
        const { data, error } = await supabase.from('ants_colonies').select('*');
        if (!error && data) {
            setColonies(data);
        }
    }
    fetchColonies();
}, []); // 👈 Array vacío: Solo se ejecuta UNA VEZ al montar el componente (onMount)
```

> **Regla de oro de TypeScript/React:** La función que pasas a `useEffect` no puede ser `async` directamente porque debe devolver `void` o una función de limpieza, nunca una Promesa. Por eso se declara una función asíncrona interna (`fetchColonies`) y se invoca inmediatamente.

---

## Capítulo 4: Arquitectura de Componentes (Container vs. Presentational)

Separamos responsabilidades aplicando el patrón clásico **Smart (Container) vs. Dumb (Presentational)**, análogo al patrón **Controlador vs. Vista Parcial**:

```
src/
├── App.tsx                     # Shell / Layout raíz limpio
└── components/
    └── Colonies/
        ├── Colonies.tsx        # SMART CONTAINER: Maneja I/O, estados y bucle .map()
        └── ColonyCard.tsx      # DUMB / VISTA: Función pura que solo pinta una tarjeta
```

### 1. El Shell (`App.tsx`)
Queda reducido a su mínima expresión (11 líneas), actuando como layout general:
```tsx
import Colonies from './components/Colonies/Colonies';

function App() {
  return (
    <main className="p-10">
      <Colonies />
    </main>
  );
}
```

### 2. El Contenedor (`Colonies.tsx`)
Sabe qué es Supabase, tiene el `useState` y el `useEffect`, y transforma la lista de modelos con `.map()`:
```tsx
<div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
    {colonies.map((colony) => (
        <ColonyCard colony={colony} key={colony.id} />
    ))}
</div>
```

* **El requisito de `key={colony.id}`:** React necesita una clave única inmutable (el UUID de PostgreSQL) para identificar qué tarjeta mover o eliminar en el DOM virtual sin reconstruir la lista entera.

### 3. La Tarjeta Presentacional (`ColonyCard.tsx`)
Recibe una **prop singular** (`colony: Colony`), tipada estrictamente con interfaces de TypeScript. No sabe de dónde vienen los datos, solo cómo estilizarlos con Tailwind CSS.

---

## Capítulo 5: Los Tres Pilares de UX en Aplicaciones Asíncronas

En una SPA, la pantalla jamás debe quedarse en silencio o en blanco. Hay tres estados obligatorios que implementamos en `Colonies.tsx` mediante el patrón de **Early Return**:

```
                       ┌──► 1. Loading: boolean (Cargando datos con animate-pulse)
                       │
Petición Supabase ─────┼──► 2. Error: string | null (Alerta roja visual)
                       │
                       └──► 3. Éxito:
                               ├── Empty State: colonies.length === 0 (Recuadro dashed amigable)
                               └── Grid con Tarjetas: colonies.map(...)
```

### Manejo Robusto de Excepciones: `try / catch / finally`
* **Errores esperados de PostgreSQL (Supabase):** Supabase adopta el estilo Go/Rust y devuelve tuplas `{ data, error }`. Si falla una query, no lanza una excepción; se captura con `if (error) setErrorMsg(error.message)`.
* **Catástrofes de Red (Internet offline, DNS caído):** El `fetch` nativo del navegador sí lanza excepciones. Las capturamos con `catch (error)`.
* **El apagado garantizado:** En el bloque `finally`, llamamos siempre a `setLoading(false)` pase lo que pase.

---

## Capítulo 6: Gotchas y Lecciones de Ingeniería Aprendidas

### ⚠️ Gotcha 1: ASI (Automatic Semicolon Insertion) en JavaScript
En JavaScript, si pones un salto de línea inmediatamente después de un `return`:
```javascript
// ❌ ERROR: JS inserta un punto y coma invisible tras el return:
return
(
    <div>...</div> // Código inalcanzable (Unreachable code detected)
);

// ✅ CORRECTO: El paréntesis debe estar en la misma línea:
return (
    <div>...</div>
);
```

### ⚠️ Gotcha 2: Prop Singular vs Prop Array
* `ColonyCard` representa **una** colonia: debe tiparse como `colony: Colony`.
* Si pusieras `colony: Colony[]`, TypeScript protestaría porque en cada vuelta del `.map()` solo se extrae un único elemento, y además un array no tiene propiedades como `.name` o `.species`.

### ⚠️ Gotcha 3: Objetos en JSX
En React no puedes renderizar directamente un objeto JavaScript (como una instancia de `Error`):
```javascript
// ❌ Causa error de React "Objects are not valid as a React child":
setErrorMsg(error); // donde 'error' es un new Error()

// ✅ Siempre almacenar cadenas legibles para la interfaz:
setErrorMsg(error.message || "Error de conexión");
```


---

## Capítulo 7: Comunicación Hijo ➔ Padre (Callbacks como Props)

En arquitecturas reactivas como React, los datos siempre fluyen **hacia abajo** (de padre a hijo a través de `props`). Sin embargo, los eventos ocurren habitualmente **abajo** (el usuario hace clic en un botón dentro de una tarjeta hija).

¿Cómo le comunica el componente hijo al padre que algo ha ocurrido con sus datos locales? **Pasando funciones como props (Callbacks).**

### 1. El Contrato de la Interfaz (TypeScript)
El componente hijo declara en su interfaz de props qué tipo de función está dispuesto a recibir:

```typescript
interface ColonyCardProps {
    colony: Colony;
    onFeed?: (colonyId: string, details: string) => void;
}
```
* `onFeed?`: El signo `?` indica que la prop es opcional.
* `(colonyId: string, details: string) => void`: Define la firma de la función (acepta dos strings y no devuelve nada).

### 2. Disparo desde el Hijo (Llamada Segura con Optional Chaining)
Dentro del botón en `ColonyCard`, al hacer clic se invoca la función con los argumentos concretos que conoce la tarjeta (`colony.id` y `food`):

```typescript
<button
    type="button"
    onClick={() => onFeed?.(colony.id, food)}
>
    {food}
</button>
```
> **Nota de ingeniería:** Usar `onFeed?.(...)` evita que la aplicación explote si el componente padre decide renderizar la tarjeta sin pasarle la prop `onFeed`.

### 3. Conexión en el Padre (`Colonies.tsx`)
El padre define la lógica de negocio (`handleFeed`) y se la pasa por referencia limpia a cada tarjeta hija:

```typescript
// La función que contiene la lógica:
async function handleFeed(colonyId: string, details: string) {
    // Aquí ejecutaremos la mutación
}

// En el render del .map():
<ColonyCard key={colony.id} colony={colony} onFeed={handleFeed} />
```

### 4. Template Literals en JS vs PHP
* En PHP las comillas dobles `"Colonia: $id"` interpolan variables.
* En JavaScript las comillas dobles y simples son literales estáticos. La interpolación requiere **backticks** (`` ` ``) y la sintaxis `${variable}`:
  ```typescript
  alert(`Colonia: ${colonyId} - Comida: ${details}`);
  ```

---

## Capítulo 8: Mutaciones hacia la Base de Datos (`INSERT` en Supabase)

Una vez que el evento y sus parámetros viajan del hijo al padre, el siguiente paso de arquitectura es persistir el cambio en PostgreSQL mediante el cliente de Supabase.

### 1. La Inserción (`.insert()`)
A diferencia de SQL plano (`INSERT INTO ... VALUES (...)`), el SDK de Supabase utiliza objetos JavaScript:

```typescript
const { error } = await supabase
    .from('ants_colony_logs')
    .insert([
        {
            colony_id: colonyId,
            log_type: 'feeding',
            details: details,
        }
    ]);
```

* **Campos omitidos:** PostgreSQL genera automáticamente el `id` (UUID) y el `created_at` (timestamp actual) según los valores `default` definidos en la tabla.
* **Array de objetos:** `.insert()` acepta un array, lo que permite insertar tanto un único registro como múltiples filas en lote (*batch insert*).

### 2. Gotchas de Ingeniería Aprendidos en este Hito

#### ⚠️ Gotcha: Schema Cache de PostgREST / Supabase
```
Could not find the table 'public.ant_colony_logs' in the schema cache
```
* **Causa:** Un error tipográfico en el nombre de la tabla (`ant_colony_logs` en singular frente a `ants_colony_logs` en plural).
* **Lección:** PostgREST expone una API REST directamente sobre las tablas de PostgreSQL e indexa el esquema en caché. Si el nombre no coincide exactamente con el catálogo del esquema público, devuelve un error 404 indicando que la tabla no existe en la caché.

#### ⚠️ Gotcha: Ámbito del Estado de Error (Error de Carga vs Error de Acción)
* **El síntoma:** Al fallar la inserción de alimentación, desapareció la cuadrícula de colonias y la pantalla completa se convirtió en una caja roja de error.
* **La causa:** El estado `errorMsg` fue creado originalmente como un estado "guardián" de la página (`if (errorMsg) return <ErrorBox />`). Al reutilizarlo en una acción secundaria (alimentar), desmontamos toda la UI.
* **Buena práctica:** 
  - Errores críticos de carga inicial ➔ Bloquean la vista (pantalla de error).
  - Errores de mutaciones de usuario (clicks, formularios) ➔ Notificaciones no bloqueantes (*toasts*, alertas o mensajes locales junto al botón).

---

## Capítulo 9: Catálogo Maestro (`ants_foods`) y Modales con Estado Controlado

Cuando una acción simple (como alimentar) requiere información adicional (como la cantidad y la unidad de medida), la arquitectura de la interfaz y de la base de datos debe evolucionar para soportar entradas estructuradas.

### 1. El Catálogo Maestro de Alimentos (`ants_foods`)
En lugar de codificar alimentos en duro en TypeScript o componentes, creamos una tabla maestra en PostgreSQL:
```sql
create table ants_foods (
  id uuid default gen_random_uuid() primary key,
  name text not null,               -- 'Semillas', 'Tenebrio', 'Agua-miel'
  unit text not null,               -- 'gr', 'ud', 'gotas'
  icon text,                        -- '🌾', '🪱', '🍯'
  created_at timestamp with time zone default now()
);
```
* **Evitar el problema N+1:** El componente padre (`Colonies`) ejecuta un único `fetchFoods()` al montar la página y distribuye el array `foods` hacia abajo a cada tarjeta hija (`ColonyCard`).

### 2. Patrón de Diseño: El Dato como Interruptor del Modal
En lugar de mantener dos estados separados (`isOpen: boolean` y `selectedFood: Food`), usamos el propio objeto como interruptor reactivo:
```typescript
const [selectedFood, setSelectedFood] = useState<Food | null>(null);
```
* `selectedFood === null` ➔ Modal cerrado.
* `selectedFood !== null` ➔ Modal abierto, con acceso directo a `selectedFood.name`, `selectedFood.unit` y `selectedFood.icon`.

### 3. Stepper Reactivo e Input Controlado
Para permitir tanto ajuste rápido por clics (`+` / `-`) como escritura libre manual (`20`):
```typescript
const [amount, setAmount] = useState<number>(1);

// Decremento seguro con límite inferior:
onClick={() => setAmount(prev => Math.max(1, prev - 1))}

// Input numérico sincronizado:
<input
    type="number"
    min="1"
    value={amount}
    onChange={(e) => setAmount(Math.max(1, Number(e.target.value)))}
/>
```

---

## Capítulo 10: Integridad Relacional y Claves Foráneas (`food_id`)

Cuando los eventos de una entidad secundaria (`ants_colony_logs`) se asocian a una tabla maestra (`ants_foods`), depender únicamente de strings descriptivos (`details: "Semillas (20 gr)"`) genera problemas de mantenimiento:
* No se puede filtrar ni agrupar con índices B-Tree eficientes.
* Cualquier cambio de nombre o errata rompe las búsquedas (`LIKE '%Semillas%'`).
* No hay integridad referencial garantizada por el motor de base de datos.

### 1. La Clave Foránea en PostgreSQL
Añadimos la relación formalmente mediante DDL:
```sql
alter table ants_colony_logs 
  add column food_id uuid references ants_foods(id) on delete set null;
```

* `references ants_foods(id)`: Garantiza que cualquier UUID asignado exista realmente en el catálogo maestro.
* `on delete set null`: Si en el futuro se elimina un tipo de alimento del catálogo, los registros históricos de alimentación se conservan sin romper la integridad.
* Al ser opcional (`nullable`), la misma tabla `ants_colony_logs` puede almacenar eventos sin comida (ej: recuentos de obreras o mudanzas).

### 2. Navegación Visual en Supabase
El Table Editor de Supabase detecta automáticamente la Foreign Key (marcada con el icono de llave verde) y permite explorar el registro referenciado en `ants_foods` directamente desde la celda de la fila.

---

## Capítulo 11: Vistas SQL (`LATERAL JOIN`) y Helpers Utilitarios (`src/utils`)

Para transformar eventos históricos de una base de datos en información visual intuitiva (un semáforo de cuidado), desacoplamos la arquitectura en dos capas:
1. **La base de datos (PostgreSQL / Supabase):** Calcula eficientemente el último evento por entidad mediante una vista virtual.
2. **El frontend (React / TypeScript):** Convierte el timestamp resultante en lenguaje humano y clases de diseño mediante una función utilitaria pura (*Helper*).

### 1. La Vista SQL con `LEFT JOIN LATERAL`
En lugar de duplicar columnas en `ants_colonies` o hacer consultas complejas en el cliente:
```sql
create or replace view ants_colonies_view as
select 
  c.*,
  l.created_at as last_fed_at,
  f.icon as last_food_icon,
  f.name as last_food_name
from ants_colonies c
left join lateral (
  select created_at, food_id
  from ants_colony_logs
  where colony_id = c.id and log_type = 'feeding'
  order by created_at desc
  limit 1
) l on true
left join ants_foods f on f.id = l.food_id;
```
* **Cero desincronización:** Cada vez que se consulta la vista, PostgreSQL ejecuta la subconsulta al vuelo. Si se inserta o elimina un log, la vista refleja el cambio inmediatamente.

### 2. Helpers Puros vs Custom Hooks
Organizamos la lógica en `src/utils/utilityFunctions.ts`:
* **Helper:** Función ordinaria de JavaScript/TypeScript sin dependencias de React (sin JSX, sin `useState`, sin `useEffect`). Entrada ➔ Cálculo ➔ Salida.
* **Custom Hook:** Función que encapsula lógica reactiva con estado interno de React (`useColonies()`, `useAuth()`).

```typescript
export default function getFeedingBadge(lastFedAt?: string | null, icon?: string | null) {
    if (!lastFedAt) {
        return { badge: 'Sin alimentar', classes: '...' };
    }

    const diffHours = (Date.now() - new Date(lastFedAt).getTime()) / (1000 * 60 * 60);
    const diffDays = Math.floor(diffHours / 24);

    // Semáforo visual según días transcurridos (< 3d verde, 3-6d ámbar, > 6d rojo)
}
```

### 3. Recarga Reactiva Inmediata
Al confirmar una comida en `handleFeed`, invocamos `fetchColonies()` para re-consultar la vista virtual, actualizando el pill en pantalla de forma instantánea sin recargar el navegador.

---

## 🚀 Próximo Hito: Formulario de Alta de Nuevas Colonias
Con el ciclo completo de lectura, alimentación, modal, histórico relacional y semáforo visual funcionando, el siguiente paso es permitir dar de alta nuevas colonias desde la interfaz con su reina, especie y recuento inicial de obreras.

