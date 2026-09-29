-- CreateSchema
CREATE SCHEMA IF NOT EXISTS "public";

-- CreateEnum
CREATE TYPE "Rol" AS ENUM ('CANDIDATO', 'STAFF_ADMIN', 'STAFF_OPERADOR');

-- CreateEnum
CREATE TYPE "NivelCandidato" AS ENUM ('ESTUDIANTE', 'EXPERIMENTADO', 'GERENCIA');

-- CreateEnum
CREATE TYPE "Modalidad" AS ENUM ('PRESENCIAL', 'HIBRIDO', 'REMOTO');

-- CreateEnum
CREATE TYPE "SeguroSocial" AS ENUM ('COMPLETO', 'MIXTO');

-- CreateEnum
CREATE TYPE "Periodicidad" AS ENUM ('POR_HORA', 'SEMANAL', 'QUINCENAL', 'MENSUAL', 'ANUAL');

-- CreateEnum
CREATE TYPE "EstadoVacante" AS ENUM ('BORRADOR', 'ABIERTA', 'CUBIERTA', 'CERRADA', 'EXPIRADA');

-- CreateEnum
CREATE TYPE "EstadoPostulacion" AS ENUM ('RECIBIDA', 'EN_REVISION', 'ENTREVISTA', 'CONTRATADA', 'RECHAZADA', 'VACANTE_CUBIERTA');

-- CreateEnum
CREATE TYPE "TipoSolicitud" AS ENUM ('CONTACTO', 'CATEGORIA', 'EMPRESA');

-- CreateEnum
CREATE TYPE "EstadoSolicitud" AS ENUM ('NUEVA', 'EN_PROCESO', 'ATENDIDA', 'CERRADA');

-- CreateEnum
CREATE TYPE "EstadoAsesoria" AS ENUM ('NUEVA', 'CONTACTADA', 'VENDIDA', 'EN_CURSO', 'COLOCADO', 'DESCARTADA');

-- CreateTable
CREATE TABLE "User" (
    "id" TEXT NOT NULL,
    "nombre" TEXT,
    "email" TEXT NOT NULL,
    "emailVerified" TIMESTAMP(3),
    "imagen" TEXT,
    "rol" "Rol" NOT NULL DEFAULT 'CANDIDATO',
    "creadoEn" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "actualizadoEn" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "User_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Account" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "provider" TEXT NOT NULL,
    "providerAccountId" TEXT NOT NULL,
    "refresh_token" TEXT,
    "access_token" TEXT,
    "expires_at" INTEGER,
    "token_type" TEXT,
    "scope" TEXT,
    "id_token" TEXT,
    "session_state" TEXT,

    CONSTRAINT "Account_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Session" (
    "id" TEXT NOT NULL,
    "sessionToken" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "expires" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Session_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "VerificationToken" (
    "identifier" TEXT NOT NULL,
    "token" TEXT NOT NULL,
    "expires" TIMESTAMP(3) NOT NULL
);

-- CreateTable
CREATE TABLE "Category" (
    "id" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "nombre" TEXT NOT NULL,
    "corto" TEXT NOT NULL,
    "descripcion" TEXT NOT NULL,
    "color" TEXT NOT NULL,
    "colorDark" TEXT NOT NULL,
    "colorTint" TEXT NOT NULL,
    "orden" INTEGER NOT NULL,

    CONSTRAINT "Category_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "CandidateProfile" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "titular" TEXT,
    "resumen" TEXT,
    "nivel" "NivelCandidato" NOT NULL,
    "anosExperiencia" INTEGER NOT NULL DEFAULT 0,
    "telefono" TEXT,
    "codigoPostal" TEXT,
    "habilidades" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "ligaPortafolio" TEXT,
    "ligaVideo" TEXT,
    "cvUrl" TEXT,
    "disponibilidad" TEXT,
    "rosterPreferencial" BOOLEAN NOT NULL DEFAULT false,
    "validadoEn" TIMESTAMP(3),
    "creadoEn" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "actualizadoEn" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "CandidateProfile_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Company" (
    "id" TEXT NOT NULL,
    "nombre" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "sitio" TEXT,
    "ubicacion" TEXT,
    "logoUrl" TEXT,
    "verificada" BOOLEAN NOT NULL DEFAULT false,
    "creadoPorId" TEXT,
    "creadoEn" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Company_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Vacante" (
    "id" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "companyId" TEXT NOT NULL,
    "categoryId" TEXT NOT NULL,
    "puesto" TEXT NOT NULL,
    "descripcion" TEXT NOT NULL,
    "ubicacion" TEXT NOT NULL,
    "modalidad" "Modalidad" NOT NULL,
    "sueldoMin" INTEGER NOT NULL,
    "sueldoMax" INTEGER NOT NULL,
    "moneda" TEXT NOT NULL DEFAULT 'MXN',
    "periodicidad" "Periodicidad" NOT NULL,
    "seguroSocial" "SeguroSocial" NOT NULL,
    "seguroSocialPct" INTEGER NOT NULL,
    "prestaciones" TEXT NOT NULL,
    "horario" TEXT NOT NULL,
    "conocimientos" TEXT[],
    "numEntrevistas" INTEGER NOT NULL,
    "diasCierreEsperado" INTEGER NOT NULL,
    "estado" "EstadoVacante" NOT NULL DEFAULT 'BORRADOR',
    "publicadaEn" TIMESTAMP(3),
    "expiraEn" TIMESTAMP(3),
    "cerradaEn" TIMESTAMP(3),
    "creadoPorId" TEXT,
    "creadoEn" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "actualizadoEn" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Vacante_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Postulacion" (
    "id" TEXT NOT NULL,
    "vacanteId" TEXT NOT NULL,
    "candidateProfileId" TEXT,
    "nombre" TEXT NOT NULL,
    "correo" TEXT NOT NULL,
    "telefono" TEXT,
    "mensaje" TEXT,
    "cvUrl" TEXT,
    "estado" "EstadoPostulacion" NOT NULL DEFAULT 'RECIBIDA',
    "notaInterna" TEXT,
    "tokenConsulta" TEXT NOT NULL,
    "creadoEn" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "actualizadoEn" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Postulacion_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Solicitud" (
    "id" TEXT NOT NULL,
    "tipo" "TipoSolicitud" NOT NULL,
    "categoryId" TEXT,
    "nombre" TEXT NOT NULL,
    "correo" TEXT NOT NULL,
    "telefono" TEXT,
    "empresa" TEXT,
    "mensaje" TEXT NOT NULL,
    "origen" TEXT NOT NULL,
    "estado" "EstadoSolicitud" NOT NULL DEFAULT 'NUEVA',
    "responsableId" TEXT,
    "notaInterna" TEXT,
    "creadoEn" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "actualizadoEn" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Solicitud_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "SolicitudAsesoria" (
    "id" TEXT NOT NULL,
    "userId" TEXT,
    "nombre" TEXT NOT NULL,
    "correo" TEXT NOT NULL,
    "telefono" TEXT,
    "mensaje" TEXT,
    "nivel" "NivelCandidato" NOT NULL,
    "precioMostrado" INTEGER NOT NULL,
    "moneda" TEXT NOT NULL DEFAULT 'MXN',
    "estado" "EstadoAsesoria" NOT NULL DEFAULT 'NUEVA',
    "notaInterna" TEXT,
    "creadoEn" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "actualizadoEn" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "SolicitudAsesoria_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "AuditLog" (
    "id" TEXT NOT NULL,
    "actorId" TEXT,
    "entidad" TEXT NOT NULL,
    "entidadId" TEXT NOT NULL,
    "accion" TEXT NOT NULL,
    "datos" JSONB,
    "creadoEn" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "AuditLog_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "_CandidateProfileToCategory" (
    "A" TEXT NOT NULL,
    "B" TEXT NOT NULL,

    CONSTRAINT "_CandidateProfileToCategory_AB_pkey" PRIMARY KEY ("A","B")
);

-- CreateIndex
CREATE UNIQUE INDEX "User_email_key" ON "User"("email");

-- CreateIndex
CREATE INDEX "User_rol_idx" ON "User"("rol");

-- CreateIndex
CREATE INDEX "Account_userId_idx" ON "Account"("userId");

-- CreateIndex
CREATE UNIQUE INDEX "Account_provider_providerAccountId_key" ON "Account"("provider", "providerAccountId");

-- CreateIndex
CREATE UNIQUE INDEX "Session_sessionToken_key" ON "Session"("sessionToken");

-- CreateIndex
CREATE INDEX "Session_userId_idx" ON "Session"("userId");

-- CreateIndex
CREATE UNIQUE INDEX "VerificationToken_token_key" ON "VerificationToken"("token");

-- CreateIndex
CREATE UNIQUE INDEX "VerificationToken_identifier_token_key" ON "VerificationToken"("identifier", "token");

-- CreateIndex
CREATE UNIQUE INDEX "Category_slug_key" ON "Category"("slug");

-- CreateIndex
CREATE UNIQUE INDEX "CandidateProfile_userId_key" ON "CandidateProfile"("userId");

-- CreateIndex
CREATE INDEX "CandidateProfile_nivel_idx" ON "CandidateProfile"("nivel");

-- CreateIndex
CREATE INDEX "CandidateProfile_rosterPreferencial_idx" ON "CandidateProfile"("rosterPreferencial");

-- CreateIndex
CREATE UNIQUE INDEX "Company_slug_key" ON "Company"("slug");

-- CreateIndex
CREATE UNIQUE INDEX "Vacante_slug_key" ON "Vacante"("slug");

-- CreateIndex
CREATE INDEX "Vacante_estado_publicadaEn_idx" ON "Vacante"("estado", "publicadaEn");

-- CreateIndex
CREATE INDEX "Vacante_categoryId_idx" ON "Vacante"("categoryId");

-- CreateIndex
CREATE INDEX "Vacante_expiraEn_idx" ON "Vacante"("expiraEn");

-- CreateIndex
CREATE UNIQUE INDEX "Postulacion_tokenConsulta_key" ON "Postulacion"("tokenConsulta");

-- CreateIndex
CREATE INDEX "Postulacion_estado_idx" ON "Postulacion"("estado");

-- CreateIndex
CREATE INDEX "Postulacion_candidateProfileId_idx" ON "Postulacion"("candidateProfileId");

-- CreateIndex
CREATE UNIQUE INDEX "Postulacion_vacanteId_correo_key" ON "Postulacion"("vacanteId", "correo");

-- CreateIndex
CREATE INDEX "Solicitud_estado_creadoEn_idx" ON "Solicitud"("estado", "creadoEn");

-- CreateIndex
CREATE INDEX "Solicitud_tipo_idx" ON "Solicitud"("tipo");

-- CreateIndex
CREATE INDEX "SolicitudAsesoria_estado_creadoEn_idx" ON "SolicitudAsesoria"("estado", "creadoEn");

-- CreateIndex
CREATE INDEX "AuditLog_entidad_entidadId_idx" ON "AuditLog"("entidad", "entidadId");

-- CreateIndex
CREATE INDEX "AuditLog_creadoEn_idx" ON "AuditLog"("creadoEn");

-- CreateIndex
CREATE INDEX "_CandidateProfileToCategory_B_index" ON "_CandidateProfileToCategory"("B");

-- AddForeignKey
ALTER TABLE "Account" ADD CONSTRAINT "Account_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Session" ADD CONSTRAINT "Session_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CandidateProfile" ADD CONSTRAINT "CandidateProfile_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Company" ADD CONSTRAINT "Company_creadoPorId_fkey" FOREIGN KEY ("creadoPorId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Vacante" ADD CONSTRAINT "Vacante_companyId_fkey" FOREIGN KEY ("companyId") REFERENCES "Company"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Vacante" ADD CONSTRAINT "Vacante_categoryId_fkey" FOREIGN KEY ("categoryId") REFERENCES "Category"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Vacante" ADD CONSTRAINT "Vacante_creadoPorId_fkey" FOREIGN KEY ("creadoPorId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Postulacion" ADD CONSTRAINT "Postulacion_vacanteId_fkey" FOREIGN KEY ("vacanteId") REFERENCES "Vacante"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Postulacion" ADD CONSTRAINT "Postulacion_candidateProfileId_fkey" FOREIGN KEY ("candidateProfileId") REFERENCES "CandidateProfile"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Solicitud" ADD CONSTRAINT "Solicitud_categoryId_fkey" FOREIGN KEY ("categoryId") REFERENCES "Category"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Solicitud" ADD CONSTRAINT "Solicitud_responsableId_fkey" FOREIGN KEY ("responsableId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SolicitudAsesoria" ADD CONSTRAINT "SolicitudAsesoria_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AuditLog" ADD CONSTRAINT "AuditLog_actorId_fkey" FOREIGN KEY ("actorId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "_CandidateProfileToCategory" ADD CONSTRAINT "_CandidateProfileToCategory_A_fkey" FOREIGN KEY ("A") REFERENCES "CandidateProfile"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "_CandidateProfileToCategory" ADD CONSTRAINT "_CandidateProfileToCategory_B_fkey" FOREIGN KEY ("B") REFERENCES "Category"("id") ON DELETE CASCADE ON UPDATE CASCADE;

