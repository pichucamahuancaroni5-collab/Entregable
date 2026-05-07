FarmaFlow - Tienda de botica con Mercado Pago + Yape manual
===========================================================

REQUISITOS:
- XAMPP con MySQL activo
- Node.js instalado
- Credencial TEST_ACCESS_TOKEN de Mercado Pago Developers

1) IMPORTAR BASE DE DATOS
- Abre phpMyAdmin: http://localhost/phpmyadmin
- Crea una base de datos llamada: basedatos
- Importa: database/farmaflow.sql

2) CONFIGURAR BACKEND
- Entra a la carpeta backend
- Copia .env.example y crea un archivo llamado .env
- En MP_ACCESS_TOKEN pega tu Access Token de prueba de Mercado Pago

Ejemplo:
MP_ACCESS_TOKEN=TEST-xxxxxxxxxxxxxxxxxxxxxxxx
FRONTEND_URL=http://localhost:5173

3) INSTALAR DEPENDENCIAS
Desde la carpeta principal FarmaFlow ejecuta:

npm install
cd backend
npm install
cd ../frontend
npm install
cd ..

4) LEVANTAR SISTEMA
Desde la carpeta principal:

npm run dev

Frontend:
http://localhost:5173

Backend:
http://localhost:3001

FUNCIONAMIENTO DEL PAGO AUTOMATICO:
- El cliente agrega productos al carrito.
- Presiona "Pagar automático con Mercado Pago".
- Mercado Pago abre el checkout.
- Si el pago vuelve como approved, FarmaFlow registra la venta y descuenta stock.
- Si el pago no es aprobado, no registra venta.

IMPORTANTE:
- En local, este flujo funciona con retorno de Mercado Pago al navegador.
- Para producción real se recomienda agregar webhook con dominio HTTPS.
- Yape manual queda como respaldo: pide número de operación y registra venta con validación manual.
