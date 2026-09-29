-- Contraseña de las cuentas del equipo AIUTO.
-- Nullable a propósito: los candidatos no van a tener una, entran con Google
-- o con liga por correo.
ALTER TABLE "User" ADD COLUMN "passwordHash" TEXT;
