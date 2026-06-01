-- CreateTable
CREATE TABLE "Clientes" (
    "id" BIGSERIAL NOT NULL,
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "nombre" VARCHAR,

    CONSTRAINT "Clientes_pkey" PRIMARY KEY ("id")
);
