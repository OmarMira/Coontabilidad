# 🌐 Guía de Implementación i18n - AccountExpress

## 📋 Resumen

Esta guía explica cómo implementar traducciones en los componentes de AccountExpress usando el sistema i18n.

---

## ✅ Estado Actual

### Configuración Completa

- ✅ **LanguageProvider** envolviendo la aplicación en `App.tsx`
- ✅ **Traducciones** definidas en `src/i18n/translations.ts` (ES/EN)
- ✅ **LanguageContext** con hooks `useLanguage` y `useTranslation`
- ✅ **LanguageSwitcher** funcionando correctamente
- ✅ **Persistencia** en localStorage como `app_language`

---

## 🔧 Cómo Usar Traducciones en Componentes

### 1. Importar el Hook

```typescript
import { useTranslation } from '@/i18n/LanguageContext';
// O también puedes usar:
// import { useLanguage } from '@/i18n/LanguageContext';
```

### 2. Usar el Hook en el Componente

```typescript
export const MiComponente: React.FC = () => {
    const { t, language } = useTranslation();
    
    return (
        <div>
            <h1>{t('dashboard')}</h1>
            <button>{t('save')}</button>
            <p>{t('loading')}</p>
        </div>
    );
};
```

### 3. Ejemplo Completo: Antes y Después

#### ❌ ANTES (Texto Estático)

```typescript
export const CustomerList: React.FC = () => {
    return (
        <div>
            <h1>Gestión de Clientes</h1>
            <button>Agregar</button>
            <button>Editar</button>
            <button>Eliminar</button>
            <p>No hay datos disponibles</p>
        </div>
    );
};
```

#### ✅ DESPUÉS (Con Traducciones)

```typescript
import { useTranslation } from '@/i18n/LanguageContext';

export const CustomerList: React.FC = () => {
    const { t } = useTranslation();
    
    return (
        <div>
            <h1>{t('customerManagement')}</h1>
            <button>{t('add')}</button>
            <button>{t('edit')}</button>
            <button>{t('delete')}</button>
            <p>{t('noDataAvailable')}</p>
        </div>
    );
};
```

---

## 📚 Claves de Traducción Disponibles

### Acciones Comunes
- `loading`, `processing`, `save`, `cancel`, `delete`, `edit`, `add`, `create`, `update`
- `search`, `filter`, `export`, `import`, `print`, `download`, `upload`
- `back`, `next`, `previous`, `close`, `open`, `view`, `details`
- `refresh`, `reload`, `clear`, `reset`, `remove`

### Formularios
- `select`, `selectAll`, `selectNone`, `selectCustomer`, `selectProduct`, `selectSupplier`
- `yes`, `no`, `ok`, `confirm`, `submit`

### Entidades
- `customer`, `customers`, `supplier`, `suppliers`, `product`, `products`
- `invoice`, `invoices`, `bill`, `bills`, `payment`, `payments`
- `quote`, `quotes`, `user`, `users`

### Campos de Formulario
- `name`, `description`, `quantity`, `qty`, `price`, `unitPrice`
- `amount`, `total`, `subtotal`, `tax`, `discount`, `grandTotal`
- `date`, `time`, `address`, `phone`, `email`, `password`, `username`
- `notes`, `comments`, `attachments`, `files`, `images`, `documents`

### Estados
- `status`, `active`, `inactive`, `pending`, `approved`, `rejected`
- `draft`, `completed`, `failed`, `cancelled`, `confirmed`

### Navegación
- `dashboard`, `home`, `reports`, `settings`, `profile`, `help`, `logout`, `login`

### Mensajes
- `warning`, `info`, `error`, `success`, `noDataAvailable`, `areYouSure`, `pleaseWait`

### Títulos de Páginas
- `customerManagement`, `supplierManagement`, `productManagement`
- `invoiceManagement`, `paymentManagement`

### Placeholders
- `searchPlaceholder`, `selectPlaceholder`, `enterDescription`
- `enterQuantity`, `enterPrice`, `enterNotes`

**Ver lista completa en:** `src/i18n/translations.ts`

---

## 🎯 Componentes Prioritarios para Actualizar

### Alta Prioridad (UI Principal)
1. ✅ `Header.tsx` - Ya usa LanguageSwitcher
2. ✅ `Sidebar.tsx` - Ya usa LanguageSwitcher
3. ⚠️ `Dashboard.tsx` - **PENDIENTE**
4. ⚠️ `CustomerList.tsx` - **PENDIENTE**
5. ⚠️ `InvoiceList.tsx` - **PENDIENTE**
6. ⚠️ `ProductList.tsx` - **PENDIENTE**

### Media Prioridad (Formularios)
7. ⚠️ `CustomerForm.tsx` - **PENDIENTE**
8. ⚠️ `InvoiceForm.tsx` - **PENDIENTE**
9. ⚠️ `ProductForm.tsx` - **PENDIENTE**

### Baja Prioridad (Reportes y Configuración)
10. ⚠️ `ReportsDashboard.tsx` - **PENDIENTE**
11. ⚠️ `Settings.tsx` - **PENDIENTE**

---

## 🔍 Cómo Encontrar Textos a Traducir

### Método 1: Búsqueda Manual
Buscar en el código patrones como:
- Strings entre comillas: `"Texto estático"`
- Títulos: `<h1>Título</h1>`
- Botones: `<button>Acción</button>`
- Placeholders: `placeholder="Buscar..."`

### Método 2: Usar Grep
```bash
# Buscar strings en español
grep -r "Gestión" src/components/
grep -r "Agregar" src/components/
grep -r "Cliente" src/components/

# Buscar strings en inglés
grep -r "Management" src/components/
grep -r "Add" src/components/
grep -r "Customer" src/components/
```

---

## ✨ Agregar Nuevas Traducciones

### 1. Editar `src/i18n/translations.ts`

```typescript
export const translations = {
    es: {
        // ... traducciones existentes
        myNewKey: 'Mi Nuevo Texto',
        anotherKey: 'Otro Texto',
    },
    en: {
        // ... traducciones existentes
        myNewKey: 'My New Text',
        anotherKey: 'Another Text',
    }
};
```

### 2. Usar en el Componente

```typescript
const { t } = useTranslation();

return <p>{t('myNewKey')}</p>;
```

---

## 🚀 Ejemplo Práctico: Dashboard.tsx

### Antes
```typescript
export const Dashboard: React.FC = () => {
    return (
        <div>
            <h1>Panel de Control</h1>
            <div>
                <h2>Clientes</h2>
                <p>Total: 150</p>
                <button>Ver Todos</button>
            </div>
            <div>
                <h2>Facturas</h2>
                <p>Pendientes: 25</p>
                <button>Gestionar</button>
            </div>
        </div>
    );
};
```

### Después
```typescript
import { useTranslation } from '@/i18n/LanguageContext';

export const Dashboard: React.FC = () => {
    const { t } = useTranslation();
    
    return (
        <div>
            <h1>{t('dashboard')}</h1>
            <div>
                <h2>{t('customers')}</h2>
                <p>{t('total')}: 150</p>
                <button>{t('view')} {t('customers')}</button>
            </div>
            <div>
                <h2>{t('invoices')}</h2>
                <p>{t('pending')}: 25</p>
                <button>{t('customerManagement')}</button>
            </div>
        </div>
    );
};
```

---

## 🎨 Mejores Prácticas

### ✅ DO (Hacer)
- ✅ Usar claves descriptivas: `t('customerManagement')`
- ✅ Combinar claves cuando sea necesario: `${t('add')} ${t('customer')}`
- ✅ Agregar traducciones faltantes a `translations.ts`
- ✅ Usar el mismo hook en todo el componente
- ✅ Mantener consistencia en los nombres de claves

### ❌ DON'T (No Hacer)
- ❌ No usar texto estático: `<h1>Clientes</h1>`
- ❌ No hardcodear idiomas: `language === 'es' ? 'Texto' : 'Text'`
- ❌ No crear claves duplicadas con diferentes nombres
- ❌ No olvidar agregar la traducción en ambos idiomas (ES y EN)

---

## 🧪 Verificar que Funciona

### 1. Cambiar Idioma
- Click en el botón de idioma (ES/EN) en el Sidebar o Header
- El texto debe cambiar inmediatamente

### 2. Persistencia
- Cambiar idioma
- Recargar la página
- El idioma debe mantenerse

### 3. Console Check
```javascript
// En DevTools Console
localStorage.getItem('app_language') // Debe retornar 'es' o 'en'
document.documentElement.lang // Debe retornar 'es' o 'en'
```

---

## 📊 Progreso de Implementación

| Componente | Estado | Prioridad |
|------------|--------|-----------|
| LanguageProvider | ✅ Completo | Alta |
| LanguageSwitcher | ✅ Completo | Alta |
| LanguageSelector | ✅ Completo | Alta |
| Header | ✅ Completo | Alta |
| Sidebar | ✅ Completo | Alta |
| Dashboard | ⚠️ Pendiente | Alta |
| CustomerList | ⚠️ Pendiente | Alta |
| InvoiceList | ⚠️ Pendiente | Alta |
| ProductList | ⚠️ Pendiente | Alta |
| CustomerForm | ⚠️ Pendiente | Media |
| InvoiceForm | ⚠️ Pendiente | Media |
| ProductForm | ⚠️ Pendiente | Media |

**Progreso Global:** 30% (6/20 componentes principales)

---

## 🔗 Referencias

- **LanguageContext:** `src/i18n/LanguageContext.tsx`
- **Traducciones:** `src/i18n/translations.ts`
- **Ejemplo Completo:** `src/components/LanguageSwitcher.tsx`
- **Locales JSON:** `src/locales/es.json`, `src/locales/en.json`

---

## 🆘 Troubleshooting

### Problema: "useLanguage must be used within a LanguageProvider"
**Solución:** Verificar que `<LanguageProvider>` envuelve el componente en `App.tsx`

### Problema: El texto no cambia al cambiar idioma
**Solución:** Asegurarse de usar `t('clave')` en lugar de texto estático

### Problema: Clave no encontrada
**Solución:** Agregar la clave a `translations.ts` en ambos idiomas (ES y EN)

### Problema: TypeScript error en `t('...')`
**Solución:** La clave debe existir en `TranslationKey` type. Agregar a `translations.ts`

---

**Última actualización:** 10 de febrero de 2026  
**Versión:** 1.0.1  
**Estado:** ✅ Sistema i18n Funcional - Implementación en Componentes Pendiente
