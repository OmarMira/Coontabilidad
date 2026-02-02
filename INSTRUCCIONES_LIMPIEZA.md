# 🧹 Instrucciones de Limpieza - Sistema Funcionando

## ✅ Commit Realizado

```
4c55da7 - fix: Customers schema + disable aggressive data cleanup
```

Todos los fixes están en GitHub en la rama `restore-point-jan29`.

---

## 🔧 PASO 1: Limpiar Storage del Navegador

### Opción A: Desde DevTools (Recomendado)

1. **Abre DevTools**: Presiona `F12`
2. **Ve a Application**: Click en la pestaña "Application"
3. **Clear Storage**: 
   - En el menú izquierdo, busca "Storage"
   - Click en "Clear site data"
   - Asegúrate que estén marcados:
     - ✅ Local storage
     - ✅ Session storage
     - ✅ IndexedDB
     - ✅ Cache storage
   - Click en **"Clear site data"**
4. **Recarga**: Presiona `F5` o `Ctrl+R`

### Opción B: Desde Consola (Más Rápido)

1. **Abre DevTools**: Presiona `F12`
2. **Ve a Console**: Click en la pestaña "Console"
3. **Ejecuta este comando**:

```javascript
// Limpiar todo el storage
indexedDB.deleteDatabase('AccountExpressDB');
localStorage.clear();
sessionStorage.clear();
console.log('✅ Storage limpiado. Recarga la página (F5)');
```

4. **Recarga**: Presiona `F5`

---

## 🧪 PASO 2: Verificar Datos Iniciales

Después de recargar, abre la consola (F12 → Console) y ejecuta:

```javascript
const db = window.db;

// Verificar que la DB está inicializada
console.log('DB inicializada:', !!db);

// Verificar datos iniciales
const products = db.exec("SELECT COUNT(*) FROM products");
const categories = db.exec("SELECT COUNT(*) FROM product_categories");
const locations = db.exec("SELECT COUNT(*) FROM locations");

console.log('📦 Productos iniciales:', products[0].values[0][0]);
console.log('📁 Categorías iniciales:', categories[0].values[0][0]);
console.log('📍 Ubicaciones iniciales:', locations[0].values[0][0]);

// Deberías ver:
// Productos iniciales: 8
// Categorías iniciales: 10
// Ubicaciones iniciales: 3
```

**✅ Si ves números > 0, los datos iniciales están correctos!**

---

## 📊 PASO 3: Generar Datos de Prueba

1. **Ve al Generador**:
   - Click en el menú lateral: **HERRAMIENTAS**
   - Click en **Generador de Datos**

2. **Genera Datos**:
   - Deja los valores por defecto
   - Click en **"Generar Datos de Prueba"**
   - Espera el mensaje: `✅ Generación de datos completada!`

3. **Verifica en Consola**:

```javascript
const db = window.db;

// Contar registros generados
const suppliers = db.exec("SELECT COUNT(*) FROM suppliers");
const customers = db.exec("SELECT COUNT(*) FROM customers");
const allProducts = db.exec("SELECT COUNT(*) FROM products");
const invoices = db.exec("SELECT COUNT(*) FROM invoices");
const bills = db.exec("SELECT COUNT(*) FROM bills");

console.log('🏢 Proveedores:', suppliers[0].values[0][0]); // 20
console.log('👥 Clientes:', customers[0].values[0][0]); // 30
console.log('📦 Productos totales:', allProducts[0].values[0][0]); // ~108
console.log('📄 Facturas venta:', invoices[0].values[0][0]); // 50
console.log('📋 Facturas compra:', bills[0].values[0][0]); // 50
```

---

## 🎯 PASO 4: Verificar en la UI

### Proveedores
1. Ve a **COMPRAS → Proveedores**
2. Deberías ver **20 proveedores** con nombres como:
   - Global Solutions
   - United Services
   - Premier Corp
   - etc.

### Clientes
1. Ve a **VENTAS → Clientes**
2. Deberías ver **30 clientes** con nombres de personas y empresas

### Productos
1. Ve a **INVENTARIO → Productos**
2. Deberías ver **~108 productos** (8 iniciales + 100 generados)

---

## ✅ Resultado Esperado

Después de seguir estos pasos:

- ✅ Base de datos limpia y funcional
- ✅ Datos iniciales preservados (productos, categorías, ubicaciones)
- ✅ 20 proveedores generados
- ✅ 30 clientes generados
- ✅ 100 productos adicionales generados
- ✅ 50 facturas de venta
- ✅ 50 facturas de compra
- ✅ Sin errores en consola
- ✅ Sistema 100% funcional

---

## 🚨 Si Algo Sale Mal

### Error: "DB not initialized"
- Recarga la página (F5)
- Espera 5 segundos
- Intenta de nuevo

### Error: "assigned_salesperson"
- El fix no se aplicó correctamente
- Limpia storage de nuevo
- Recarga la página

### Tablas Vacías Después de Generar
- Revisa la consola para errores
- Verifica que los datos iniciales existan primero
- Intenta generar de nuevo

---

## 📞 Soporte

Si después de seguir estos pasos el sistema no funciona:
1. Copia todos los errores de la consola
2. Toma screenshot de la UI
3. Comparte los logs

---

**Fecha**: 2026-02-01  
**Commit**: 4c55da7  
**Estado**: ✅ Listo para Probar
