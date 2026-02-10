# 📚 MANUAL DE MANTENIMIENTO I18N

**AccountExpress Next-Gen v1.0.1**  
**Sistema de Internacionalización (ES/EN)**

---

## 📋 TABLA DE CONTENIDOS

1. [Arquitectura del Sistema](#arquitectura-del-sistema)
2. [Agregar Nuevos Términos](#agregar-nuevos-términos)
3. [Usar Traducciones en Componentes](#usar-traducciones-en-componentes)
4. [Usar Traducciones en Servicios](#usar-traducciones-en-servicios)
5. [Usar Traducciones en Web Workers](#usar-traducciones-en-web-workers)
6. [Interpolación de Parámetros](#interpolación-de-parámetros)
7. [Fallback y Manejo de Errores](#fallback-y-manejo-de-errores)
8. [Mejores Prácticas](#mejores-prácticas)

---

## 1. ARQUITECTURA DEL SISTEMA

### Archivos Principales

```
src/
├── locales/
│   ├── es.json          # Traducciones en español (idioma base)
│   └── en.json          # Traducciones en inglés
├── contexts/
│   └── I18nContext.tsx  # Contexto React de i18n
├── components/
│   └── LanguageSelector.tsx  # Selector de idioma UI
└── utils/
    └── I18nHelper.ts    # Helper para servicios/workers
```

### Flujo de Datos

```
Usuario cambia idioma
  ↓
LanguageSelector actualiza I18nContext
  ↓
localStorage guarda preferencia
  ↓
Componentes React se re-renderizan con nuevo idioma
  ↓
Servicios/Workers usan I18nHelper para obtener traducciones
```

---

## 2. AGREGAR NUEVOS TÉRMINOS

### Paso 1: Agregar en `es.json` (Idioma Base)

```json
{
  "accounting": {
    "chartOfAccounts": "Plan de Cuentas",
    "journalEntry": "Asiento Contable",
    // ✅ AGREGAR AQUÍ
    "newTerm": "Nuevo Término"
  }
}
```

### Paso 2: Agregar en `en.json`

```json
{
  "accounting": {
    "chartOfAccounts": "Chart of Accounts",
    "journalEntry": "Journal Entry",
    // ✅ AGREGAR AQUÍ
    "newTerm": "New Term"
  }
}
```

### Estructura de Categorías

Las traducciones están organizadas en categorías:

- `common` - Términos comunes (guardar, cancelar, etc.)
- `accounting` - Términos contables
- `tax` - Términos fiscales
- `invoice` - Términos de facturación
- `payment` - Términos de pagos
- `inventory` - Términos de inventario
- `reports` - Términos de reportes
- `payroll` - Términos de nómina
- `banking` - Términos bancarios
- `audit` - Términos de auditoría
- `ai` - Términos de IA
- `backup` - Términos de respaldo
- `settings` - Términos de configuración
- `navigation` - Términos de navegación
- `validation` - Mensajes de validación
- `messages` - Mensajes del sistema

---

## 3. USAR TRADUCCIONES EN COMPONENTES

### Opción 1: Hook `useTranslation`

```typescript
import { useTranslation } from '../contexts/I18nContext';

function MyComponent() {
  const { t, locale } = useTranslation();

  return (
    <div>
      <h1>{t('accounting.chartOfAccounts')}</h1>
      <p>{t('common.save')}</p>
      <span>Current language: {locale}</span>
    </div>
  );
}
```

### Opción 2: Hook `useI18n` (Completo)

```typescript
import { useI18n } from '../contexts/I18nContext';

function MyComponent() {
  const { t, locale, setLocale, translations } = useI18n();

  const switchLanguage = () => {
    setLocale(locale === 'es' ? 'en' : 'es');
  };

  return (
    <div>
      <h1>{t('accounting.journalEntry')}</h1>
      <button onClick={switchLanguage}>
        {t('settings.language')}
      </button>
    </div>
  );
}
```

---

## 4. USAR TRADUCCIONES EN SERVICIOS

Los servicios (clases TypeScript) no tienen acceso a React Context. Usar `I18nHelper`:

```typescript
import { I18nHelper } from '../../utils/I18nHelper';

export class MyService {
  private t: (key: string, params?: Record<string, string | number>) => string;

  constructor() {
    // Inicializar función de traducción
    this.t = I18nHelper.createTranslator();
  }

  async doSomething() {
    const message = this.t('messages.saveSuccess');
    console.log(message);
  }

  // Actualizar traducciones si el usuario cambia el idioma
  updateLocale() {
    this.t = I18nHelper.createTranslator();
  }
}
```

### Ejemplo: AIRepairService

```typescript
export class AIRepairService {
  private t: (key: string, params?: Record<string, string | number>) => string;

  constructor(db: SQLiteEngine, apiKey: string) {
    this.db = db;
    // ... otros servicios
    this.t = I18nHelper.createTranslator();
  }

  async generateProposal() {
    const proposal = {
      title: this.t('ai.detectIssues'),
      description: this.t('ai.analysis'),
      // ...
    };
    return proposal;
  }
}
```

---

## 5. USAR TRADUCCIONES EN WEB WORKERS

Los Web Workers no tienen acceso a `localStorage`. Pasar traducciones al crear el worker:

### En el Servicio Principal

```typescript
import { I18nHelper } from '../../utils/I18nHelper';

export class AsyncPDFService {
  async generatePDF(data: any) {
    // Obtener traducciones para el worker
    const i18nData = I18nHelper.getTranslationsForWorker();

    const worker = new Worker(
      new URL('../../workers/pdf.worker.ts', import.meta.url),
      { type: 'module' }
    );

    worker.postMessage({
      type: 'GENERATE_PDF',
      data,
      i18n: i18nData  // ✅ Pasar traducciones
    });
  }
}
```

### En el Worker

```typescript
// pdf.worker.ts
self.addEventListener('message', (event) => {
  const { type, data, i18n } = event.data;

  if (type === 'GENERATE_PDF') {
    const { locale, translations } = i18n;

    // Función helper para traducir
    const t = (key: string) => {
      const keys = key.split('.');
      let value: any = translations;
      for (const k of keys) {
        value = value?.[k];
      }
      return typeof value === 'string' ? value : key;
    };

    // Usar traducciones
    const title = t('reports.generateReport');
    const dateLabel = t('common.date');

    // Generar PDF con textos traducidos
    // ...
  }
});
```

---

## 6. INTERPOLACIÓN DE PARÁMETROS

### Definir en JSON

```json
{
  "validation": {
    "minLength": "Longitud mínima: {{min}} caracteres",
    "maxValue": "Valor máximo: {{max}}"
  }
}
```

### Usar en Código

```typescript
const { t } = useTranslation();

// Pasar parámetros
const message1 = t('validation.minLength', { min: 5 });
// Resultado: "Longitud mínima: 5 caracteres"

const message2 = t('validation.maxValue', { max: 100 });
// Resultado: "Valor máximo: 100"
```

---

## 7. FALLBACK Y MANEJO DE ERRORES

### Fallback Automático

Si una clave no existe en inglés, el sistema automáticamente usa la versión en español:

```typescript
// Si 'newFeature.title' no existe en en.json
const title = t('newFeature.title');
// Resultado: Usa el valor de es.json automáticamente
```

### Clave No Encontrada

Si una clave no existe en ningún idioma, se devuelve la clave misma:

```typescript
const text = t('nonexistent.key');
// Resultado: "nonexistent.key"
```

### Verificar Idioma Actual

```typescript
const { locale } = useTranslation();

if (locale === 'es') {
  // Lógica específica para español
} else {
  // Lógica específica para inglés
}
```

---

## 8. MEJORES PRÁCTICAS

### ✅ DO (Hacer)

1. **Usar claves descriptivas**
   ```typescript
   // ✅ BIEN
   t('accounting.journalEntry')
   
   // ❌ MAL
   t('je')
   ```

2. **Agrupar por categoría**
   ```json
   {
     "accounting": {
       "debit": "Débito",
       "credit": "Crédito"
     }
   }
   ```

3. **Usar interpolación para valores dinámicos**
   ```typescript
   // ✅ BIEN
   t('messages.itemsFound', { count: 5 })
   
   // ❌ MAL
   `${count} items found`
   ```

4. **Mantener sincronizados es.json y en.json**
   - Siempre agregar términos en ambos archivos
   - Usar la misma estructura de claves

5. **Usar terminología contable precisa**
   - Consultar el diccionario técnico en el prompt
   - Mantener consistencia en términos especializados

### ❌ DON'T (No Hacer)

1. **No hardcodear textos en español o inglés**
   ```typescript
   // ❌ MAL
   <button>Guardar</button>
   
   // ✅ BIEN
   <button>{t('common.save')}</button>
   ```

2. **No concatenar traducciones**
   ```typescript
   // ❌ MAL
   const message = t('common.total') + ': ' + amount;
   
   // ✅ BIEN
   const message = t('invoice.totalAmount', { amount });
   ```

3. **No usar traducciones para lógica de negocio**
   ```typescript
   // ❌ MAL
   if (status === t('invoice.paid')) { ... }
   
   // ✅ BIEN
   if (status === 'PAID') { ... }
   ```

4. **No olvidar actualizar traducciones en servicios**
   ```typescript
   // Si el usuario cambia el idioma, actualizar servicios
   const handleLanguageChange = (newLocale: Locale) => {
     setLocale(newLocale);
     // Actualizar servicios si es necesario
     myService.updateLocale();
   };
   ```

---

## 📝 CHECKLIST DE NUEVAS FUNCIONALIDADES

Cuando agregues una nueva funcionalidad:

- [ ] Identificar todos los textos visibles al usuario
- [ ] Agregar claves en `es.json` (idioma base)
- [ ] Agregar traducciones correspondientes en `en.json`
- [ ] Usar `t()` en componentes React
- [ ] Usar `I18nHelper` en servicios si es necesario
- [ ] Pasar traducciones a workers si es necesario
- [ ] Probar en ambos idiomas (ES y EN)
- [ ] Verificar que no haya textos hardcodeados

---

## 🔧 TROUBLESHOOTING

### Problema: Traducciones no se actualizan

**Solución**: Verificar que el componente esté dentro de `I18nProvider`:

```typescript
// App.tsx
import { I18nProvider } from './contexts/I18nContext';

function App() {
  return (
    <I18nProvider>
      {/* Todos los componentes aquí */}
    </I18nProvider>
  );
}
```

### Problema: Clave no encontrada

**Solución**: Verificar que la clave existe en ambos archivos JSON:

```bash
# Buscar clave en archivos
grep -r "myKey" src/locales/
```

### Problema: Worker no tiene traducciones

**Solución**: Asegurarse de pasar `i18n` al worker:

```typescript
worker.postMessage({
  type: 'ACTION',
  data: myData,
  i18n: I18nHelper.getTranslationsForWorker()  // ✅ No olvidar
});
```

---

## 📚 RECURSOS

- **Archivos de traducción**: `src/locales/`
- **Contexto**: `src/contexts/I18nContext.tsx`
- **Helper**: `src/utils/I18nHelper.ts`
- **Ejemplo de uso**: `src/components/LanguageSelector.tsx`

---

**Creado por**: Antigravity AI - Senior Frontend Architect  
**Fecha**: 9 de febrero de 2026  
**Versión**: 1.0.1
