-- CreateEnum
CREATE TYPE "EstadoUsuario" AS ENUM ('Activo', 'Inactivo');

-- CreateEnum
CREATE TYPE "IngresoGasto" AS ENUM ('Ingreso', 'Gasto');

-- CreateEnum
CREATE TYPE "EstadoEnvio" AS ENUM ('Pendiente', 'Enviado', 'Fallido');

-- CreateEnum
CREATE TYPE "TipoDocumentoEnum" AS ENUM ('FACTURA', 'RECIBO', 'OTROS');

-- CreateTable
CREATE TABLE "usuarios" (
    "id_usuario" SERIAL NOT NULL,
    "nombre" VARCHAR(100) NOT NULL,
    "correo" VARCHAR(150) NOT NULL,
    "contrasena" VARCHAR(255) NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "estado" "EstadoUsuario" NOT NULL DEFAULT 'Activo',

    CONSTRAINT "usuarios_pkey" PRIMARY KEY ("id_usuario")
);

-- CreateTable
CREATE TABLE "categorias_gasto" (
    "id_categoria_gasto" SERIAL NOT NULL,
    "nombre" VARCHAR(100) NOT NULL,
    "descripcion" TEXT,

    CONSTRAINT "categorias_gasto_pkey" PRIMARY KEY ("id_categoria_gasto")
);

-- CreateTable
CREATE TABLE "tipos_documento" (
    "id_tipo_documento" SERIAL NOT NULL,
    "nombre" "TipoDocumentoEnum" NOT NULL,

    CONSTRAINT "tipos_documento_pkey" PRIMARY KEY ("id_tipo_documento")
);

-- CreateTable
CREATE TABLE "facturas" (
    "id_factura" SERIAL NOT NULL,
    "fecha" DATE NOT NULL,
    "proveedor" VARCHAR(150) NOT NULL,
    "monto" DECIMAL(10,2) NOT NULL,
    "imagen" VARCHAR(255),
    "factura_fisica" BOOLEAN NOT NULL DEFAULT false,
    "ingreso_gasto" "IngresoGasto" NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "id_usuario" INTEGER NOT NULL,
    "id_tipo_gasto" INTEGER NOT NULL,
    "id_tipo_documento" INTEGER NOT NULL,

    CONSTRAINT "facturas_pkey" PRIMARY KEY ("id_factura")
);

-- CreateTable
CREATE TABLE "detalles_envio" (
    "id_detalle_envio" SERIAL NOT NULL,
    "timestamp" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "destinatario" VARCHAR(150) NOT NULL,
    "medio_envio" VARCHAR(100) NOT NULL,
    "estado" "EstadoEnvio" NOT NULL DEFAULT 'Pendiente',
    "facturas_enviadas" INTEGER NOT NULL,

    CONSTRAINT "detalles_envio_pkey" PRIMARY KEY ("id_detalle_envio")
);

-- CreateTable
CREATE TABLE "detalle_envio_facturas" (
    "id_detalle_envio" INTEGER NOT NULL,
    "id_factura" INTEGER NOT NULL,

    CONSTRAINT "detalle_envio_facturas_pkey" PRIMARY KEY ("id_detalle_envio","id_factura")
);

-- CreateIndex
CREATE UNIQUE INDEX "usuarios_correo_key" ON "usuarios"("correo");

-- AddForeignKey
ALTER TABLE "facturas" ADD CONSTRAINT "facturas_id_usuario_fkey" FOREIGN KEY ("id_usuario") REFERENCES "usuarios"("id_usuario") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "facturas" ADD CONSTRAINT "facturas_id_tipo_gasto_fkey" FOREIGN KEY ("id_tipo_gasto") REFERENCES "categorias_gasto"("id_categoria_gasto") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "facturas" ADD CONSTRAINT "facturas_id_tipo_documento_fkey" FOREIGN KEY ("id_tipo_documento") REFERENCES "tipos_documento"("id_tipo_documento") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "detalle_envio_facturas" ADD CONSTRAINT "detalle_envio_facturas_id_detalle_envio_fkey" FOREIGN KEY ("id_detalle_envio") REFERENCES "detalles_envio"("id_detalle_envio") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "detalle_envio_facturas" ADD CONSTRAINT "detalle_envio_facturas_id_factura_fkey" FOREIGN KEY ("id_factura") REFERENCES "facturas"("id_factura") ON DELETE RESTRICT ON UPDATE CASCADE;
