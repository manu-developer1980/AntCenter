🐜 Ants Hub - Especificación de Arquitectura e Hoja de Ruta

1. Visión General & Filosofía

Ants Hub es una plataforma personal desarrollada en React, TypeScript y Supabase, diseñada para la gestión integral y seguimiento de colonias de hormigas (Mirmecología).

El proyecto sigue una metodología anti-burnout, pragmática e incremental:

Cero sobreingeniería: Desarrollo enfocado en herramientas útiles y funcionales desde el primer día.

Módulos aislados: Cada herramienta se concibe como una mini-app independiente que resuelve una necesidad concreta.

Persistencia en la nube: Uso de Supabase (PostgreSQL) como Backend-as-a-Service para permitir lectura/escritura unificada.

Acceso multi-dispositivo: Despliegue en Netlify (con HTTPS) adaptado para uso en smartphones (Mobile-First).

2. Hoja de Ruta Incremental (Roadmap)

FASE 1: Core Base (Prioridad Actual)
└── 📱 Ants Colony Tracker (Mantenimiento y diarios desde el móvil)

FASE 2: Módulos de Cacharreo & Análisis (Iterativo)
├── 🧮 Formicarium Builder & Cost Calculator
├── 📖 Queen & Species ID Catalog
└── 📊 Smart Nest Monitor (Telemetría de Hormigueros)

FASE 3: Integración
└── 🎛️ Dashboard Central / Ants Hub Shell



🎯 Fase 1 (Prioridad Actual): Ants Colony Tracker

Desarrollo de la primera mini-app funcional orientada al seguimiento diario de colonias.

Ficha de Colonia: Registro de especie, fecha de captura/adquisición, estado (activa, hibernando, baja), tipo de hormiguero actual y estimado de obreras.

Diario de Alimentación (Log): Registro rápido con un clic de alimentos suministrados (jarabe proteico, agua-miel, semillas, drosophila).

Alertas Visuales: Indicador de días transcurridos desde el último aporte proteico o revisión de humedad.

🔮 Fase 2: Módulos Secundarios (Desarrollo Futuro)

Formicarium Builder: Calculadora de capacidad de obreras y presupuestos para nuevos hormigueros (impresión 3D / acrílico / Ytong).

Queen & Especies ID Catalog: Fichas técnicas de especies, requisitos de humedad/diapausa y fotos de identificación.

Smart Nest Monitor: Panel de visualización de métricas de temperatura/humedad por sensor IoT/simulado.

🏆 Fase 3: Integración Final (Ants Hub Shell)

Envoltorio y dashboard principal que conecta todas las mini-apps bajo una sola navegación cliente.

3. Esquema de Base de Datos (Supabase / PostgreSQL)

Ejecuta el siguiente script en el SQL Editor de Supabase para inicializar la base de datos para la Fase 1:

-- 1. Crear tabla de Colonias
create table ants_colonies (
  id uuid default gen_random_uuid() primary key,
  name text not null,                     -- Ej: "Messor barbarus - Reina 2026"
  species text not null,                  -- Ej: "Messor barbarus"
  foundation_date date default current_date,
  worker_count integer default 0,
  nest_type text,                         -- Ej: "Tubo de ensayo", "Acrílico 3D"
  status text default 'active',           -- 'active', 'hibernating', 'deceased'
  notes text,
  created_at timestamp with time zone default now()
);

-- 2. Crear tabla de Registros / Historial (Logs)
create table ants_colony_logs (
  id uuid default gen_random_uuid() primary key,
  colony_id uuid references ants_colonies(id) on delete cascade,
  log_type text not null,                 -- 'feeding', 'count_update', 'event', 'note'
  details text not null,                  -- Ej: "Agua-miel + jarabe proteico"
  created_at timestamp with time zone default now()
);

-- Habilitar RLS (Row Level Security) opcional o políticas de acceso abierto para uso personal
alter table ants_colonies enable row level security;
alter table ants_colony_logs enable row level security;

create policy "Acceso total para usuario anon/auth" on ants_colonies for all using (true);
create policy "Acceso total logs para usuario anon/auth" on ants_colony_logs for all using (true);



4. Stack Técnico & Arquitectura

Frontend: React + TypeScript (Vite).

Backend & BBDD: Supabase (PostgreSQL + API REST autogenerada).

Cliente Supabase: @supabase/supabase-js.

Estilos: Tailwind CSS (diseño Mobile-First).

Hosting / CI-CD: Netlify (integración continua vía Git).

5. Guía Paso a Paso de Inicio

Supabase: Crear un proyecto gratuito en Supabase y ejecutar el script SQL de la Sección 3.

Proyecto local:

npm create vite@latest ants-colony-tracker -- --template react-ts
cd ants-colony-tracker
npm install @supabase/supabase-js lucide-react



Variables de Entorno (.env.local):

VITE_SUPABASE_URL=tu_supabase_project_url
VITE_SUPABASE_ANON_KEY=tu_supabase_anon_key



Despliegue en Netlify: Conectar el repositorio de GitHub con Netlify y configurar las dos variables de entorno en el panel de Netlify.