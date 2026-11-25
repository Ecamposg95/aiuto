-- CreateEnum
CREATE TYPE "EstadoEmpresa" AS ENUM ('PENDIENTE', 'APROBADA', 'SUSPENDIDA', 'RECHAZADA');

-- CreateEnum
CREATE TYPE "EstadoLicencia" AS ENUM ('ACTIVA', 'SUSPENDIDA');

-- CreateEnum
CREATE TYPE "TipoAlerta" AS ENUM ('EMPRESA_SIN_CONTACTO');

-- CreateEnum
CREATE TYPE "EstadoAlerta" AS ENUM ('ABIERTA', 'ATENDIDA', 'DESCARTADA');

-- AlterEnum
ALTER TYPE "Rol" ADD VALUE 'EMPRESA';

-- AlterTable
ALTER TABLE "CandidateProfile" ADD COLUMN     "consentimientoEmpresasEn" TIMESTAMP(3),
ADD COLUMN     "linkedin" TEXT;

-- AlterTable
ALTER TABLE "Company" ADD COLUMN     "contactoCorreo" TEXT,
ADD COLUMN     "contactoNombre" TEXT,
ADD COLUMN     "contactoTel" TEXT,
ADD COLUMN     "descripcion" TEXT,
ADD COLUMN     "estado" "EstadoEmpresa" NOT NULL DEFAULT 'APROBADA';

-- AlterTable
ALTER TABLE "Postulacion" ADD COLUMN     "contactadaEn" TIMESTAMP(3);

-- AlterTable
ALTER TABLE "Vacante" ADD COLUMN     "ampliadaEn" TIMESTAMP(3),
ADD COLUMN     "instrucciones" TEXT,
ADD COLUMN     "requisitos" TEXT[] DEFAULT ARRAY[]::TEXT[],
ADD COLUMN     "resultadosEsperados" TEXT,
ADD COLUMN     "sueldoNeto" BOOLEAN NOT NULL DEFAULT false;

-- CreateTable
CREATE TABLE "Experiencia" (
    "id" TEXT NOT NULL,
    "perfilId" TEXT NOT NULL,
    "puesto" TEXT NOT NULL,
    "empresa" TEXT NOT NULL,
    "desde" TEXT,
    "hasta" TEXT,
    "logros" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "orden" INTEGER NOT NULL DEFAULT 0,

    CONSTRAINT "Experiencia_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Formacion" (
    "id" TEXT NOT NULL,
    "perfilId" TEXT NOT NULL,
    "titulo" TEXT NOT NULL,
    "institucion" TEXT NOT NULL,
    "anio" INTEGER,
    "orden" INTEGER NOT NULL DEFAULT 0,

    CONSTRAINT "Formacion_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Evidencia" (
    "id" TEXT NOT NULL,
    "perfilId" TEXT NOT NULL,
    "titulo" TEXT NOT NULL,
    "url" TEXT NOT NULL,
    "orden" INTEGER NOT NULL DEFAULT 0,

    CONSTRAINT "Evidencia_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "VacanteGuardada" (
    "perfilId" TEXT NOT NULL,
    "vacanteId" TEXT NOT NULL,
    "creadoEn" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "VacanteGuardada_pkey" PRIMARY KEY ("perfilId","vacanteId")
);

-- CreateTable
CREATE TABLE "CompanyMember" (
    "id" TEXT NOT NULL,
    "companyId" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "puesto" TEXT,
    "creadoEn" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "CompanyMember_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Licencia" (
    "id" TEXT NOT NULL,
    "companyId" TEXT NOT NULL,
    "vacantesActivas" INTEGER NOT NULL,
    "iniciaEn" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "terminaEn" TIMESTAMP(3),
    "estado" "EstadoLicencia" NOT NULL DEFAULT 'ACTIVA',
    "notaInterna" TEXT,
    "creadoEn" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Licencia_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Mensaje" (
    "id" TEXT NOT NULL,
    "postulacionId" TEXT NOT NULL,
    "autorId" TEXT,
    "deEmpresa" BOOLEAN NOT NULL,
    "texto" TEXT NOT NULL,
    "leidoEn" TIMESTAMP(3),
    "creadoEn" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Mensaje_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Notificacion" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "titulo" TEXT NOT NULL,
    "cuerpo" TEXT,
    "liga" TEXT,
    "leidaEn" TIMESTAMP(3),
    "creadoEn" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Notificacion_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Alerta" (
    "id" TEXT NOT NULL,
    "tipo" "TipoAlerta" NOT NULL,
    "vacanteId" TEXT NOT NULL,
    "companyId" TEXT NOT NULL,
    "primeraPostulacionEn" TIMESTAMP(3) NOT NULL,
    "postulados" INTEGER NOT NULL,
    "estado" "EstadoAlerta" NOT NULL DEFAULT 'ABIERTA',
    "nota" TEXT,
    "atendidaEn" TIMESTAMP(3),
    "atendidaPorId" TEXT,
    "creadoEn" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "actualizadoEn" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Alerta_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "Experiencia_perfilId_idx" ON "Experiencia"("perfilId");

-- CreateIndex
CREATE INDEX "Formacion_perfilId_idx" ON "Formacion"("perfilId");

-- CreateIndex
CREATE INDEX "Evidencia_perfilId_idx" ON "Evidencia"("perfilId");

-- CreateIndex
CREATE UNIQUE INDEX "CompanyMember_userId_key" ON "CompanyMember"("userId");

-- CreateIndex
CREATE INDEX "CompanyMember_companyId_idx" ON "CompanyMember"("companyId");

-- CreateIndex
CREATE INDEX "Licencia_companyId_estado_idx" ON "Licencia"("companyId", "estado");

-- CreateIndex
CREATE INDEX "Mensaje_postulacionId_creadoEn_idx" ON "Mensaje"("postulacionId", "creadoEn");

-- CreateIndex
CREATE INDEX "Notificacion_userId_leidaEn_idx" ON "Notificacion"("userId", "leidaEn");

-- CreateIndex
CREATE INDEX "Alerta_estado_creadoEn_idx" ON "Alerta"("estado", "creadoEn");

-- CreateIndex
CREATE UNIQUE INDEX "Alerta_tipo_vacanteId_key" ON "Alerta"("tipo", "vacanteId");

-- CreateIndex
CREATE INDEX "Company_estado_idx" ON "Company"("estado");

-- AddForeignKey
ALTER TABLE "Experiencia" ADD CONSTRAINT "Experiencia_perfilId_fkey" FOREIGN KEY ("perfilId") REFERENCES "CandidateProfile"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Formacion" ADD CONSTRAINT "Formacion_perfilId_fkey" FOREIGN KEY ("perfilId") REFERENCES "CandidateProfile"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Evidencia" ADD CONSTRAINT "Evidencia_perfilId_fkey" FOREIGN KEY ("perfilId") REFERENCES "CandidateProfile"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "VacanteGuardada" ADD CONSTRAINT "VacanteGuardada_perfilId_fkey" FOREIGN KEY ("perfilId") REFERENCES "CandidateProfile"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "VacanteGuardada" ADD CONSTRAINT "VacanteGuardada_vacanteId_fkey" FOREIGN KEY ("vacanteId") REFERENCES "Vacante"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CompanyMember" ADD CONSTRAINT "CompanyMember_companyId_fkey" FOREIGN KEY ("companyId") REFERENCES "Company"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CompanyMember" ADD CONSTRAINT "CompanyMember_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Licencia" ADD CONSTRAINT "Licencia_companyId_fkey" FOREIGN KEY ("companyId") REFERENCES "Company"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Mensaje" ADD CONSTRAINT "Mensaje_postulacionId_fkey" FOREIGN KEY ("postulacionId") REFERENCES "Postulacion"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Mensaje" ADD CONSTRAINT "Mensaje_autorId_fkey" FOREIGN KEY ("autorId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Notificacion" ADD CONSTRAINT "Notificacion_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Alerta" ADD CONSTRAINT "Alerta_vacanteId_fkey" FOREIGN KEY ("vacanteId") REFERENCES "Vacante"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Alerta" ADD CONSTRAINT "Alerta_companyId_fkey" FOREIGN KEY ("companyId") REFERENCES "Company"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Alerta" ADD CONSTRAINT "Alerta_atendidaPorId_fkey" FOREIGN KEY ("atendidaPorId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- Los nombres de las siete categorías pasan a los del máster prompt (§5). Los
-- slugs no cambian. Va en la migración para que producción los tome al
-- desplegar, sin depender de que alguien corra la semilla.
UPDATE "Category" SET "nombre" = 'Estrategia y Dirección', "corto" = 'Estrategia', "descripcion" = 'Rumbo claro y decisiones que se cumplen' WHERE "slug" = 'estrategia';
UPDATE "Category" SET "nombre" = 'Ventas y Crecimiento', "corto" = 'Ventas', "descripcion" = 'Vender más, y venderle mejor a quien ya te compra' WHERE "slug" = 'comercial';
UPDATE "Category" SET "nombre" = 'Recursos Humanos', "corto" = 'Recursos Humanos', "descripcion" = 'La gente correcta, preparada y con ganas de quedarse' WHERE "slug" = 'capital-humano';
UPDATE "Category" SET "nombre" = 'Procesos y Operaciones', "corto" = 'Operaciones', "descripcion" = 'Hacer lo mismo con menos errores, tiempo y costo' WHERE "slug" = 'operaciones';
UPDATE "Category" SET "nombre" = 'Tecnología e Inteligencia Artificial', "corto" = 'Tecnología e IA', "descripcion" = 'Tecnología que ahorra trabajo, no que lo agrega' WHERE "slug" = 'tecnologia';
UPDATE "Category" SET "nombre" = 'Finanzas e Impuestos', "corto" = 'Finanzas', "descripcion" = 'Saber cuánto ganas, cuánto tienes y cuánto pagas' WHERE "slug" = 'finanzas';
UPDATE "Category" SET "nombre" = 'Comercio Exterior y Logística', "corto" = 'Comercio Exterior', "descripcion" = 'Mover, importar y exportar sin atorarse' WHERE "slug" = 'comex';

-- La asesoría de empleabilidad deja de publicar precios hasta que dirección los
-- autorice: las solicitudes nuevas no guardan precio.
ALTER TABLE "SolicitudAsesoria" ALTER COLUMN "precioMostrado" DROP NOT NULL;
