# 🎨 ELITE DESIGN SYSTEM

Sistema de componentes reutilizables para estandarizar el diseño de todas las páginas de AccountExpress.

---

## 📦 COMPONENTES DISPONIBLES

### 1. **ElitePageHeader**
Header estandarizado para todas las páginas con glow effect.

```tsx
import { ElitePageHeader } from '../components/elite';
import { Package } from 'lucide-react';

<ElitePageHeader
  icon={Package}
  iconColor="emerald"
  title="Gestión de Activos"
  subtitle="Administración y Depreciación"
  glowColor="emerald"
  actions={
    <>
      <button className="btn-elite-secondary">
        <Play className="w-4 h-4" />
        Ejecutar
      </button>
      <button className="btn-elite-primary">
        <Plus className="w-4 h-4" />
        Nuevo
      </button>
    </>
  }
/>
```

**Props**:
- `icon`: LucideIcon - Icono principal
- `iconColor`: 'emerald' | 'blue' | 'purple' | 'amber' | 'rose'
- `title`: string - Título principal
- `subtitle`: string - Subtítulo descriptivo
- `glowColor`: 'emerald' | 'blue' | 'purple' | 'amber' | 'rose'
- `actions`: ReactNode - Botones/acciones

---

### 2. **EliteStatsCard**
Tarjeta de estadísticas con icono, valor y descripción.

```tsx
import { EliteStatsCard } from '../components/elite';
import { DollarSign } from 'lucide-react';

<EliteStatsCard
  icon={DollarSign}
  iconColor="blue"
  label="Total"
  value="$1,234.56"
  valueColor="emerald"
  description="Costo de Adquisición"
/>
```

**Props**:
- `icon`: LucideIcon - Icono del stat
- `iconColor`: 'emerald' | 'blue' | 'purple' | 'amber' | 'rose'
- `label`: string - Label superior
- `value`: string | number - Valor principal
- `valueColor`: 'white' | 'emerald' | 'blue' | 'purple' | 'amber' | 'rose'
- `description`: string - Descripción inferior
- `children`: ReactNode - Contenido adicional opcional

---

### 3. **EliteTable**
Tabla estandarizada con headers elite y estados de loading/empty.

```tsx
import { EliteTable } from '../components/elite';

const columns = [
  { key: 'id', header: 'ID', width: '80px' },
  { key: 'name', header: 'Nombre', align: 'left' },
  { 
    key: 'amount', 
    header: 'Monto', 
    align: 'right',
    render: (value) => (
      <span className="text-sm font-mono text-emerald-400">
        ${value.toFixed(2)}
      </span>
    )
  },
  {
    key: 'status',
    header: 'Estado',
    align: 'center',
    render: (value) => (
      <EliteBadge variant={value === 'active' ? 'success' : 'error'}>
        {value}
      </EliteBadge>
    )
  }
];

<EliteTable
  columns={columns}
  data={items}
  onRowClick={(row) => console.log(row)}
  emptyMessage="No hay registros"
  loading={isLoading}
/>
```

**Props**:
- `columns`: EliteTableColumn[] - Definición de columnas
- `data`: any[] - Datos a mostrar
- `onRowClick`: (row: any) => void - Click en fila
- `emptyMessage`: string - Mensaje cuando no hay datos
- `emptyIcon`: ReactNode - Icono para estado vacío
- `loading`: boolean - Estado de carga
- `loadingMessage`: string - Mensaje de carga

**EliteTableColumn**:
- `key`: string - Clave única
- `header`: string - Texto del header
- `align`: 'left' | 'center' | 'right'
- `width`: string - Ancho fijo (opcional)
- `render`: (value, row) => ReactNode - Renderizador personalizado

---

### 4. **EliteSearchBar**
Barra de búsqueda estandarizada.

```tsx
import { EliteSearchBar } from '../components/elite';

<EliteSearchBar
  value={searchTerm}
  onChange={setSearchTerm}
  placeholder="Buscar por nombre o código..."
/>
```

**Props**:
- `value`: string - Valor actual
- `onChange`: (value: string) => void - Callback de cambio
- `placeholder`: string - Placeholder del input

---

### 5. **EliteBadge**
Badge estandarizado con múltiples variantes.

```tsx
import { EliteBadge } from '../components/elite';

<EliteBadge variant="success" showDot>
  ACTIVO
</EliteBadge>

<EliteBadge variant="error" size="lg">
  VENCIDO
</EliteBadge>

<EliteBadge variant="warning">
  PENDIENTE
</EliteBadge>
```

**Props**:
- `variant`: 'success' | 'error' | 'warning' | 'info' | 'neutral' | 'purple'
- `size`: 'sm' | 'md' | 'lg'
- `showDot`: boolean - Mostrar punto animado
- `children`: ReactNode - Contenido del badge

---

## 🎨 CLASES CSS GLOBALES

### Cards
```tsx
<div className="card-elite">
  Contenido con hover effect
</div>

<div className="card-elite-flat">
  Contenido sin hover effect
</div>
```

### Botones
```tsx
<button className="btn-elite-primary">
  Primario
</button>

<button className="btn-elite-secondary">
  Secundario
</button>

<button className="btn-elite-danger">
  Peligro
</button>

<button className="btn-elite-ghost">
  Ghost
</button>
```

### Tipografía
```tsx
<h1 className="elite-h1">Título H1</h1>
<h2 className="elite-h2">Título H2</h2>
<h3 className="elite-h3">Título H3</h3>
<p className="elite-subtitle">Subtítulo</p>
<p className="elite-label">Label</p>
<p className="elite-text">Texto normal</p>
<p className="elite-text-small">Texto pequeño</p>
<p className="elite-stat">1,234</p>
```

### Inputs
```tsx
<input className="input-elite" placeholder="Input..." />
<select className="select-elite">...</select>
<textarea className="textarea-elite" placeholder="Textarea..." />
```

### Layouts
```tsx
<div className="elite-page-container">
  <div className="elite-section">
    <div className="elite-grid-stats">
      <!-- 4 stats cards -->
    </div>
  </div>
</div>
```

### Animaciones
```tsx
<div className="animate-fade-in">
  Fade in animation
</div>

<div className="animate-slide-in">
  Slide in animation
</div>
```

### Glow Effects
```tsx
<div className="glow-emerald">Glow emerald</div>
<div className="glow-blue">Glow blue</div>
<div className="glow-purple">Glow purple</div>
```

### Scrollbar
```tsx
<div className="elite-scrollbar overflow-auto">
  Contenido con scrollbar personalizado
</div>
```

---

## 📋 EJEMPLO COMPLETO

```tsx
import React, { useState } from 'react';
import { Package, Plus, Play } from 'lucide-react';
import {
  ElitePageHeader,
  EliteStatsCard,
  EliteTable,
  EliteSearchBar,
  EliteBadge
} from '../components/elite';

export const ExamplePage: React.FC = () => {
  const [searchTerm, setSearchTerm] = useState('');
  const [loading, setLoading] = useState(false);

  const stats = [
    { icon: DollarSign, label: 'Total', value: '$1,234', description: 'Costo Total', color: 'blue' },
    { icon: TrendingDown, label: 'Depreciación', value: '$456', description: 'Acumulada', color: 'amber' },
    { icon: Package, label: 'Valor', value: '$778', description: 'Neto', color: 'emerald' },
    { icon: Calendar, label: 'Activos', value: '12', description: 'En Uso', color: 'purple' }
  ];

  const columns = [
    { key: 'code', header: 'Código', width: '100px' },
    { key: 'name', header: 'Nombre', align: 'left' },
    { 
      key: 'amount', 
      header: 'Monto', 
      align: 'right',
      render: (val) => <span className="text-sm font-mono text-emerald-400">${val}</span>
    },
    {
      key: 'status',
      header: 'Estado',
      align: 'center',
      render: (val) => (
        <EliteBadge variant={val === 'active' ? 'success' : 'error'}>
          {val}
        </EliteBadge>
      )
    }
  ];

  const data = [
    { code: 'A001', name: 'Item 1', amount: 100, status: 'active' },
    { code: 'A002', name: 'Item 2', amount: 200, status: 'inactive' }
  ];

  return (
    <div className="elite-page-container">
      {/* Header */}
      <ElitePageHeader
        icon={Package}
        iconColor="emerald"
        title="Página de Ejemplo"
        subtitle="Demostración del Sistema Elite"
        actions={
          <>
            <button className="btn-elite-secondary">
              <Play className="w-4 h-4" />
              Ejecutar
            </button>
            <button className="btn-elite-primary">
              <Plus className="w-4 h-4" />
              Nuevo
            </button>
          </>
        }
      />

      {/* Stats */}
      <div className="elite-grid-stats">
        {stats.map((stat, i) => (
          <EliteStatsCard
            key={i}
            icon={stat.icon}
            iconColor={stat.color}
            label={stat.label}
            value={stat.value}
            valueColor="white"
            description={stat.description}
          />
        ))}
      </div>

      {/* Search */}
      <EliteSearchBar
        value={searchTerm}
        onChange={setSearchTerm}
        placeholder="Buscar..."
      />

      {/* Table */}
      <EliteTable
        columns={columns}
        data={data}
        loading={loading}
        emptyMessage="No hay datos"
        onRowClick={(row) => console.log(row)}
      />
    </div>
  );
};
```

---

## 🎯 PALETA DE COLORES

### Colores Principales
- **Emerald**: Éxito, positivo, activo
- **Blue**: Información, acciones secundarias
- **Purple**: Especial, destacado
- **Amber**: Advertencia, pendiente
- **Rose**: Error, peligro, negativo

### Colores de Texto
- **White**: `text-white` - Texto principal
- **Slate-400**: `text-slate-400` - Texto secundario
- **Slate-500**: `text-slate-500` - Texto terciario
- **Slate-600**: `text-slate-600` - Texto deshabilitado

---

## 📏 TIPOGRAFÍA ESTÁNDAR

### Tamaños
- **H1**: `text-2xl font-black tracking-tight`
- **H2**: `text-xl font-black tracking-tight`
- **H3**: `text-lg font-black tracking-tight`
- **Subtitle**: `text-xs font-bold uppercase tracking-widest`
- **Label**: `text-xs font-black uppercase tracking-[0.2em]`
- **Text**: `text-sm`
- **Small**: `text-xs`
- **Stats**: `text-3xl font-black tabular-nums`

### Headers de Tabla
- **Estándar**: `text-[10px] font-black text-slate-500 uppercase tracking-[0.2em]`

---

## ✅ CHECKLIST DE MIGRACIÓN

Para migrar una página al sistema elite:

1. ✅ Importar CSS global en `App.tsx`:
   ```tsx
   import './styles/elite-styles.css';
   ```

2. ✅ Reemplazar header genérico con `<ElitePageHeader />`

3. ✅ Reemplazar stats cards con `<EliteStatsCard />`

4. ✅ Reemplazar barra de búsqueda con `<EliteSearchBar />`

5. ✅ Reemplazar tabla con `<EliteTable />`

6. ✅ Reemplazar badges con `<EliteBadge />`

7. ✅ Usar clases CSS globales:
   - `card-elite` para cards
   - `btn-elite-*` para botones
   - `input-elite` para inputs
   - `elite-page-container` para el contenedor principal

8. ✅ Verificar colores:
   - `gray-*` → `slate-*`
   - `font-bold` → `font-black` (en títulos)
   - Agregar `tracking-*` donde corresponda

---

## 🚀 PRÓXIMOS PASOS

1. Importar CSS global en `App.tsx`
2. Migrar las 10 páginas de prioridad 1
3. Documentar casos especiales
4. Crear más componentes según necesidad

---

**Creado por**: Antigravity AI Assistant  
**Fecha**: 9 de febrero de 2026  
**Versión**: 1.0.0
