import Link from 'next/link'
import { transicionesDesde, esEstadoFinal, formatearSueldo } from '@aiuto/core'
import { cambiarEstadoPostulacion } from '@/lib/acciones'
import { registrarContacto } from '@/lib/mensajes'
import type { PostulacionDetalle } from '@/lib/consultas'
import { ligaSegura } from '@/lib/ligas'
import { ETIQUETA_POSTULACION, tono } from './ListaPostulaciones'
import { Conversacion } from './Conversacion'

/**
 * Una postulación vista por quien recluta: la empresa dueña o el equipo AIUTO.
 *
 * El perfil completo (trayectoria, evidencias, pitch) sólo se muestra si la
 * persona autorizó que las empresas lo vean. Lo que mandó en la postulación sí
 * se ve siempre: lo mandó a esta vacante.
 */
export function DetallePostulacion({ p, raiz }: { p: PostulacionDetalle; raiz: '/panel' | '/reclutamiento' }) {
  const perfil = p.candidato
  const autorizo = Boolean(perfil?.consentimientoEmpresasEn)
  const final = esEstadoFinal(p.estado)
  const fecha = new Intl.DateTimeFormat('es-MX', { dateStyle: 'long' })
  const cv = ligaSegura(p.cvUrl) ?? (autorizo ? ligaSegura(perfil?.cvUrl) : null)
  const video = autorizo ? ligaSegura(perfil?.ligaVideo) : null
  const linkedin = autorizo ? ligaSegura(perfil?.linkedin) : null
  const portafolio = autorizo ? ligaSegura(perfil?.ligaPortafolio) : null

  return (
    <>
      <Link href={`${raiz}/postulaciones?vacante=${p.vacanteId}`} className="text-sm text-ink-2 hover:text-purple">
        ← Postulaciones de {p.vacante.puesto}
      </Link>

      <div className="mt-3 flex flex-wrap items-center gap-3">
        <span className={`estado ${tono(p.estado)}`}>{ETIQUETA_POSTULACION[p.estado]}</span>
        <span className="cifras text-sm text-neutral">Se postuló el {fecha.format(p.creadoEn)}</span>
        {p.contactadaEn ? (
          <span className="text-sm text-ink-2">Contactada el {fecha.format(p.contactadaEn)}</span>
        ) : (
          <span className="text-sm text-operaciones">Sin contactar</span>
        )}
      </div>

      <h1 className="mt-3 text-h2">{p.nombre}</h1>
      {autorizo && perfil?.titular && <p className="mt-1 text-lead text-ink-2">{perfil.titular}</p>}
      <p className="mt-2 text-ink-2">
        Para {p.vacante.puesto} · {p.vacante.company.nombre} · <span className="cifras">{formatearSueldo(p.vacante)}</span>
      </p>

      <dl className="mt-5 grid gap-3 sm:grid-cols-2">
        <Dato etiqueta="Correo">
          <a href={`mailto:${p.correo}`} className="text-purple underline">{p.correo}</a>
        </Dato>
        {p.telefono && <Dato etiqueta="Teléfono"><span className="cifras">{p.telefono}</span></Dato>}
        {cv && (
          <Dato etiqueta="Currículum">
            <a href={cv} target="_blank" rel="noopener noreferrer" className="text-purple underline">Abrir el CV</a>
          </Dato>
        )}
        {video && (
          <Dato etiqueta="Video pitch">
            <a href={video} target="_blank" rel="noopener noreferrer" className="text-purple underline">Ver el pitch</a>
          </Dato>
        )}
        {linkedin && (
          <Dato etiqueta="LinkedIn">
            <a href={linkedin} target="_blank" rel="noopener noreferrer" className="text-purple underline">Ver perfil</a>
          </Dato>
        )}
      </dl>

      {p.mensaje && (
        <section className="mt-6">
          <h2 className="label border-b-rule border-ink pb-2">Lo que escribió al postularse</h2>
          <p className="mt-3 max-w-[68ch] whitespace-pre-line">{p.mensaje}</p>
        </section>
      )}

      {perfil && !autorizo && (
        <p className="mt-6 border-px border-line bg-off p-3 text-sm text-ink-2">
          Esta persona no ha autorizado que las empresas vean su perfil completo. Ves lo que mandó con su postulación.
        </p>
      )}

      {autorizo && perfil && (
        <>
          {perfil.resumen && (
            <section className="mt-6">
              <h2 className="label border-b-rule border-ink pb-2">Resumen</h2>
              <p className="mt-3 max-w-[68ch] whitespace-pre-line">{perfil.resumen}</p>
            </section>
          )}
          {perfil.habilidades.length > 0 && (
            <section className="mt-6">
              <h2 className="label border-b-rule border-ink pb-2">Competencias</h2>
              <ul className="mt-3 flex flex-wrap gap-2">
                {perfil.habilidades.map((h) => (
                  <li key={h} className="border-px border-line px-2 py-1 text-sm">{h}</li>
                ))}
              </ul>
            </section>
          )}
          {perfil.experiencias.length > 0 && (
            <section className="mt-6">
              <h2 className="label border-b-rule border-ink pb-2">Trayectoria</h2>
              <ul className="mt-3 grid gap-4">
                {perfil.experiencias.map((e) => (
                  <li key={e.id}>
                    <p className="text-h4">{e.puesto}</p>
                    <p className="text-sm text-ink-2">
                      {e.empresa}
                      {(e.desde || e.hasta) && ` · ${e.desde ?? ''} – ${e.hasta ?? 'actual'}`}
                    </p>
                    {e.logros.length > 0 && (
                      <ul className="mt-2 list-disc pl-5 text-ink-2">
                        {e.logros.map((l) => <li key={l}>{l}</li>)}
                      </ul>
                    )}
                  </li>
                ))}
              </ul>
            </section>
          )}
          {perfil.formaciones.length > 0 && (
            <section className="mt-6">
              <h2 className="label border-b-rule border-ink pb-2">Formación</h2>
              <ul className="mt-3 grid gap-2">
                {perfil.formaciones.map((f) => (
                  <li key={f.id}>
                    {f.titulo} · <span className="text-ink-2">{f.institucion}{f.anio ? `, ${f.anio}` : ''}</span>
                  </li>
                ))}
              </ul>
            </section>
          )}
          {(perfil.evidencias.length > 0 || portafolio) && (
            <section className="mt-6">
              <h2 className="label border-b-rule border-ink pb-2">Evidencias</h2>
              <ul className="mt-3 grid gap-2">
                {portafolio && (
                  <li>
                    <a href={portafolio} target="_blank" rel="noopener noreferrer" className="text-purple underline">Portafolio</a>
                  </li>
                )}
                {perfil.evidencias.map((e) => (
                  <li key={e.id}>
                    <a href={ligaSegura(e.url) ?? '#'} target="_blank" rel="noopener noreferrer" className="text-purple underline">{e.titulo}</a>
                  </li>
                ))}
              </ul>
            </section>
          )}
        </>
      )}

      {!final && (
        <section className="mt-8">
          <h2 className="label border-b-rule border-ink pb-2">Seguimiento</h2>
          <p className="mt-3 text-sm text-ink-2">Cada cambio le llega a la persona.</p>
          <div className="mt-3 flex flex-wrap gap-2">
            {transicionesDesde(p.estado).map((destino) => (
              <form key={destino} action={cambiarEstadoPostulacion}>
                <input type="hidden" name="id" value={p.id} />
                <input type="hidden" name="estado" value={destino} />
                <button className="btn-secundario px-3 py-2 text-sm">{ETIQUETA_POSTULACION[destino]}</button>
              </form>
            ))}
            {!p.contactadaEn && (
              <form action={registrarContacto}>
                <input type="hidden" name="postulacionId" value={p.id} />
                <button className="border-px border-line px-3 py-2 text-sm text-ink-2 transition hover:border-ink">
                  Ya la contacté por otra vía
                </button>
              </form>
            )}
          </div>
        </section>
      )}

      <Conversacion
        postulacionId={p.id}
        mensajes={p.mensajes}
        yoSoyEmpresa
        nombreEmpresa={raiz === '/panel' ? `${p.vacante.company.nombre} (vía AIUTO)` : p.vacante.company.nombre}
        puedeEscribir={!final}
        sinCuenta={!perfil}
      />
    </>
  )
}

function Dato({ etiqueta, children }: { etiqueta: string; children: React.ReactNode }) {
  return (
    <div>
      <dt className="label">{etiqueta}</dt>
      <dd className="mt-1">{children}</dd>
    </div>
  )
}
