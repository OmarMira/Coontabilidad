# AccountExpress - Guía de Administración de Almacenamiento S3

## Introducción

AccountExpress utiliza Amazon S3 (o cualquier servicio compatible con S3 API como Cloudflare R2 o DigitalOcean Spaces) para el almacenamiento persistente de copias de seguridad en la nube. Esta guía detalla la configuración y mantenimiento del proveedor S3.

## Configuración de Credenciales

El sistema busca las siguientes variables de entorno o configuración en `S3Provider.ts`:

- **ACCESS_KEY_ID**: ID de acceso de la cuenta S3.
- **SECRET_ACCESS_KEY**: Clave secreta.
- **REGION**: Región del bucket (ej. `us-east-1`).
- **BUCKET_NAME**: Nombre del bucket destinado a AccountExpress.
- **ENDPOINT**: (Opcional) URL personalizada para proveedores distintos a AWS.

## Estructura de Archivos en S3

Las copias de seguridad se almacenan con el siguiente patrón:
`backups/{company_id}/{timestamp}_manual_backup.aex`
`backups/{company_id}/auto_{date}.aex`

## Seguridad (Iron Core)

1. **Cifrado en Tránsito**: Todas las comunicaciones utilizan HTTPS.
2. **Cifrado en Reposo**: Los archivos `.aex` ya están cifrados localmente con AES-256-GCM antes de ser subidos.
3. **Firmado V4**: Se utiliza el protocolo de firma AWS V4 para asegurar la autenticidad de las peticiones.

## Resolución de Problemas

- **Error 403 (Forbidden)**: Verifique que las políticas del bucket permitan `s3:PutObject` y `s3:GetObject`.
- **Error de Firma**: Asegúrese de que el reloj del servidor/navegador esté sincronizado (margen de < 5 minutos).
- **Timeout**: El proveedor implementa reintentos automáticos (3 intentos), pero verifique la conectividad de red si el problema persiste.

---
© 2026 AccountExpress Elite Engineering
