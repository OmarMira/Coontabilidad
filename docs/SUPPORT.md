# Account Express — Soporte Técnico & Guía de Ayuda
Documento de referencia para el usuario · Versión 1.0 · Marzo 2026

## 1. CANALES DE SOPORTE

Si experimentas problemas con la aplicación, puedes contactarnos a través de:

- **Email**: soporte@accountexpress.com
- **Web**: [https://accountexpress.com/support](https://accountexpress.com/support)
- **Horario**: Lunes a Viernes, 9:00 AM - 6:00 PM (EST)

## 2. PROBLEMAS COMUNES Y SOLUCIONES

### 2.1 Error de Base de Datos (SQLite)
Si ves un mensaje parecido a `engine.prepare is not a function` o `Database not initialized`:
- **Causa**: El motor de base de datos no se cargó correctamente debido a restricciones del navegador o falta de espacio.
- **Solución**: Refresca la página (`F5`). Si el problema persiste, limpia el caché del sitio y asegúrate de tener al menos 100MB libres en disco.

### 2.2 Error de Partida Doble
Si un asiento no cuadra:
- **Causa**: El total de Débitos no es igual al total de Créditos.
- **Solución**: Revisa los montos ingresados. El sistema bloquea registros descuadrados por diseño (US GAAP).

### 2.3 Recuperación de Datos
- **Causa**: Error crítico del sistema o corrupción de datos.
- **Solución**: Usa el **Panel de Reparación del Sistema** (disponible en Herramientas -> Logs -> Reparar) si tienes un backup previo `.aex`.

## 3. PROCEDIMIENTO DE REPORTE DE ERRORES

Cuando contactes a soporte, por favor incluye:
1. **Captura de pantalla** del error.
2. **Logs del sistema**: Ve a `Herramientas -> Logs` y descarga el archivo de incidencias.
3. **Pasos para reproducir**: ¿Qué estabas haciendo exactamente cuando ocurrió el error?

## 4. FILOSOFÍA DE DATOS LOCAL-FIRST

AccountExpress prioriza la seguridad. Tus datos **nunca** salen de tu dispositivo a menos que configures explícitamente el Backup en la nube. Ten en cuenta que si borras los datos del sitio en tu navegador sin tener un backup externo, la información podría perderse permanentemente.

---
© 2026 Account Express. Confidencial y Privado.
