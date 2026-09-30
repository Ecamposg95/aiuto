-- Las reglas de la vacante, ahora también en la base.
--
-- Ya se validan en packages/core y en el formulario, pero la base es la última
-- línea: un script, una migración de datos o una consulta a mano no pasan por
-- ninguna de las dos. Si el sueldo es el argumento del producto, la base tiene
-- que defenderlo sola.

ALTER TABLE "Vacante"
  ADD CONSTRAINT "vacante_sueldo_positivo"
  CHECK ("sueldoMin" > 0 AND "sueldoMax" > 0);

ALTER TABLE "Vacante"
  ADD CONSTRAINT "vacante_sueldo_coherente"
  CHECK ("sueldoMax" >= "sueldoMin");

-- COMPLETO significa exactamente 100 %; cualquier otra cosa es MIXTO.
ALTER TABLE "Vacante"
  ADD CONSTRAINT "vacante_seguro_social_coherente"
  CHECK (
    ("seguroSocial" = 'COMPLETO' AND "seguroSocialPct" = 100)
    OR ("seguroSocial" = 'MIXTO' AND "seguroSocialPct" BETWEEN 1 AND 99)
  );

ALTER TABLE "Vacante"
  ADD CONSTRAINT "vacante_entrevistas_razonables"
  CHECK ("numEntrevistas" BETWEEN 1 AND 10);

-- Ninguna vacante vive más de 60 días, así que no tiene sentido prometer un
-- cierre más allá de eso.
ALTER TABLE "Vacante"
  ADD CONSTRAINT "vacante_cierre_dentro_de_vigencia"
  CHECK ("diasCierreEsperado" BETWEEN 1 AND 60);
