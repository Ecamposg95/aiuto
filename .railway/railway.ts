import { defineRailway, github, preserve, project, service } from "railway/iac";

// Configuracion del servicio web en Railway. Reemplaza al railway.json, que
// Railway deja de leer el 1 de diciembre de 2026.
//
// Railway no lee este archivo al desplegar: se aplica a los ajustes del
// servicio con `railway config plan` y `railway config apply`. Si se cambia,
// hay que aplicarlo; el push a main solo despliega el codigo.
//
// Solo administra aiuto-web. Postgres se queda fuera a proposito para que un
// apply no pueda tocar la base.
export const partial = "aiuto-web";

export default defineRailway(() => {
  const web = service("aiuto-web", {
    // Sin esto el apply desconecta el repo y el push a main deja de desplegar.
    source: github("Ecamposg95/aiuto"),
    build: {
      // El panel trae RAILPACK por defecto; la imagen se arma con el Dockerfile
      // del monorepo, que corre las migraciones al arrancar.
      builder: "DOCKERFILE",
      dockerfilePath: "Dockerfile",
    },
    deploy: {
      healthcheckPath: "/api/salud",
      healthcheckTimeout: 30,
      // Reinicia solo si falla (ON_FAILURE). Es el valor por defecto y Railway
      // lo guarda como null: declararlo deja el plan siempre con un cambio.
      restartPolicyMaxRetries: 3,
    },
    // Las variables se administran en el panel: aqui solo se declaran para que
    // el apply no las borre. preserve() conserva el valor que Railway ya tiene,
    // asi ningun secreto vive en el repo. Una variable nueva hay que agregarla
    // tambien aqui, o el siguiente apply la elimina.
    variables: {
      APP_URL: preserve(),
      AUTH_SECRET: preserve(),
      DATABASE_URL: preserve(),
      EMAIL_FROM: preserve(),
      EQUIPO_EMAIL: preserve(),
      MODO_QA: preserve(),
      NODE_ENV: preserve(),
      PORT: preserve(),
      TAREAS_SECRET: preserve(),
    },
  });
  return project("AIUTO", {
    resources: [web],
  });
});
