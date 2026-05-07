CREATE DATABASE IF NOT EXISTS `basedatos` CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
USE `basedatos`;

SET FOREIGN_KEY_CHECKS=0;
DROP TABLE IF EXISTS `detalle_venta`;
DROP TABLE IF EXISTS `ventas`;
DROP TABLE IF EXISTS `producto`;
DROP TABLE IF EXISTS `clientes`;
DROP TABLE IF EXISTS `proveedor`;
DROP TABLE IF EXISTS `categoria`;
SET FOREIGN_KEY_CHECKS=1;

CREATE TABLE `categoria` (
  `id_categoria` INT NOT NULL AUTO_INCREMENT,
  `descripcion` VARCHAR(100) NOT NULL,
  PRIMARY KEY (`id_categoria`)
) ENGINE=InnoDB;

CREATE TABLE `clientes` (
  `id_cliente` INT NOT NULL AUTO_INCREMENT,
  `nombres` VARCHAR(50) NOT NULL,
  `apellidos` VARCHAR(50) NOT NULL,
  `direccion` VARCHAR(80) NOT NULL,
  `telefono` VARCHAR(50) NOT NULL,
  PRIMARY KEY (`id_cliente`)
) ENGINE=InnoDB;

CREATE TABLE `proveedor` (
  `id_proveedor` INT NOT NULL AUTO_INCREMENT,
  `razonsocial` VARCHAR(80) NOT NULL,
  `direccion` VARCHAR(80) NOT NULL,
  `telefono` VARCHAR(50) NOT NULL,
  PRIMARY KEY (`id_proveedor`)
) ENGINE=InnoDB;

CREATE TABLE `producto` (
  `id_producto` INT NOT NULL AUTO_INCREMENT,
  `descripcion` VARCHAR(100) NOT NULL,
  `detalle` VARCHAR(220) DEFAULT NULL,
  `img` VARCHAR(255) DEFAULT NULL,
  `precio` DECIMAL(10,2) NOT NULL,
  `stock` INT NOT NULL,
  `id_categoria` INT,
  `id_proveedor` INT,
  PRIMARY KEY (`id_producto`),
  CONSTRAINT `fk_producto_categoria` FOREIGN KEY (`id_categoria`) REFERENCES `categoria`(`id_categoria`) ON DELETE SET NULL ON UPDATE CASCADE,
  CONSTRAINT `fk_producto_proveedor` FOREIGN KEY (`id_proveedor`) REFERENCES `proveedor`(`id_proveedor`) ON DELETE SET NULL ON UPDATE CASCADE
) ENGINE=InnoDB;

CREATE TABLE `ventas` (
  `id_venta` INT NOT NULL AUTO_INCREMENT,
  `fecha` DATETIME DEFAULT CURRENT_TIMESTAMP,
  `id_cliente` INT DEFAULT NULL,
  `cliente_nombre` VARCHAR(120) DEFAULT 'Cliente general',
  `metodo_pago` VARCHAR(30) DEFAULT 'Yape',
  `total` DECIMAL(10,2) DEFAULT 0,
  `mp_payment_id` VARCHAR(80) DEFAULT NULL,
  `estado_pago` VARCHAR(40) DEFAULT 'manual',
  PRIMARY KEY (`id_venta`),
  UNIQUE KEY `uk_ventas_mp_payment_id` (`mp_payment_id`),
  CONSTRAINT `fk_ventas_cliente` FOREIGN KEY (`id_cliente`) REFERENCES `clientes`(`id_cliente`) ON DELETE SET NULL ON UPDATE CASCADE
) ENGINE=InnoDB;

CREATE TABLE `detalle_venta` (
  `id_detventa` INT NOT NULL AUTO_INCREMENT,
  `cantidad` INT NOT NULL,
  `precio_unitario` DECIMAL(10,2) NOT NULL,
  `subtotal` DECIMAL(10,2) NOT NULL,
  `id_producto` INT,
  `id_venta` INT,
  PRIMARY KEY (`id_detventa`),
  CONSTRAINT `fk_detalle_producto` FOREIGN KEY (`id_producto`) REFERENCES `producto`(`id_producto`) ON DELETE SET NULL ON UPDATE CASCADE,
  CONSTRAINT `fk_detalle_venta` FOREIGN KEY (`id_venta`) REFERENCES `ventas`(`id_venta`) ON DELETE CASCADE ON UPDATE CASCADE
) ENGINE=InnoDB;

INSERT INTO `categoria` (`descripcion`) VALUES
('Medicamentos'),
('Dermocosmética'),
('Bebé y Mamá'),
('Bienestar y Nutrición'),
('Cuidado Personal'),
('Protección Solar'),
('Primeros Auxilios'),
('Ofertas');

INSERT INTO `proveedor` (`razonsocial`,`direccion`,`telefono`) VALUES
('Distribuidora Farma Perú','Av. Salud 123','987654321'),
('Laboratorios FarmaFlow','Jr. Medicina 456','912345678'),
('Botica Mayorista SAC','Calle Vida 789','956123789'),
('Belleza y Cuidado SAC','Av. Bienestar 222','955111222');

INSERT INTO `clientes` (`nombres`,`apellidos`,`direccion`,`telefono`) VALUES
('Cliente','General','Sin dirección','000000000');

INSERT INTO `producto` (`descripcion`,`detalle`,`img`,`precio`,`stock`,`id_categoria`,`id_proveedor`) VALUES
('Paracetamol 500mg','Alivia fiebre y dolores leves. Presentación en tabletas.','paracetamol.svg',5.00,30,1,1),
('Ibuprofeno 400mg','Antiinflamatorio para dolor muscular, dental o de cabeza.','ibuprofeno.svg',8.50,18,1,2),
('Jarabe para la tos','Ayuda a calmar la tos y la irritación de garganta.','jarabe.svg',16.00,10,1,3),
('Crema hidratante facial','Hidratación diaria para piel suave y luminosa.','crema-facial.svg',24.90,20,2,4),
('Protector solar FPS 50','Protección alta para rostro y cuerpo, ideal para uso diario.','protector-solar.svg',39.90,22,6,4),
('Shampoo anticaspa','Limpieza profunda y control de caspa para uso frecuente.','shampoo.svg',18.90,25,5,4),
('Pañales bebé M','Pañales suaves y absorbentes para el cuidado del bebé.','panales.svg',32.50,35,3,3),
('Toallitas húmedas bebé','Limpieza delicada para bebé y mamá.','toallitas.svg',9.90,40,3,3),
('Vitamina C 1000mg','Ayuda al sistema inmune y defensa del organismo.','vitamina-c.svg',12.00,15,4,2),
('Colágeno hidrolizado','Suplemento para bienestar, piel, cabello y articulaciones.','colageno.svg',45.00,12,4,2),
('Alcohol medicinal 70%','Ideal para limpieza y desinfección externa.','alcohol.svg',6.00,25,7,3),
('Vendas elásticas','Para soporte y protección en lesiones leves.','vendas.svg',7.00,8,7,1),
('Gel antibacterial','Limpieza rápida de manos sin necesidad de agua.','gel.svg',5.90,50,5,1),
('Pack mascarillas KN95','Protección respiratoria cómoda para uso diario.','mascarilla.svg',10.00,28,8,1),
('Crema corporal oferta','Promoción especial para cuidado e hidratación de la piel.','crema-corporal.svg',14.90,9,8,4);
