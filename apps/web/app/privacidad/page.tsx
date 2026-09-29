import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Aviso de privacidad',
  description: 'Cómo trata AIUTO los datos personales que recaba.',
}

/**
 * BORRADOR. Pendiente 3 de la spec: falta que lo revise quien tenga la
 * responsabilidad legal. Los datos marcados como PENDIENTE hay que completarlos
 * antes de abrir el registro: la LFPDPPP exige identificar al responsable con
 * domicilio, y un aviso incompleto no protege a nadie.
 */
const PENDIENTE = '[PENDIENTE]'

const SECCIONES = [
  {
    titulo: 'Quién es responsable de tus datos',
    cuerpo: [
      `AIUTO, con domicilio en ${PENDIENTE}, es responsable del tratamiento de los datos personales que nos proporciones a través de este sitio.`,
      `Para cualquier asunto relacionado con tus datos personales puedes escribir a ${PENDIENTE}.`,
    ],
  },
  {
    titulo: 'Qué datos recabamos',
    cuerpo: [
      'Cuando te postulas a una vacante: tu nombre, correo electrónico, teléfono si lo proporcionas, y el mensaje que escribas.',
      'Cuando solicitas asesoría de empleabilidad: tu nombre, correo, teléfono si lo proporcionas, el nivel que seleccionas y el mensaje que escribas.',
      'Cuando nos escribes por el formulario de contacto: tu nombre, correo, teléfono y empresa si los proporcionas, y tu mensaje.',
      'No recabamos datos personales sensibles ni datos patrimoniales o financieros.',
    ],
  },
  {
    titulo: 'Para qué los usamos',
    cuerpo: [
      'Para dar seguimiento a tu postulación y mantenerte informado de su estado.',
      'Para contactarte respecto del servicio de asesoría que solicitaste.',
      'Para responder tu mensaje y darle seguimiento interno.',
      'Para compartir tu candidatura con la empresa que publicó la vacante a la que te postulaste.',
    ],
  },
  {
    titulo: 'Con quién los compartimos',
    cuerpo: [
      'Cuando te postulas a una vacante, compartimos tu candidatura con la empresa que la publicó. Esa transferencia es necesaria para que tu postulación tenga sentido, y al postularte la consientes.',
      'Fuera de eso, no transferimos tus datos personales a terceros sin tu consentimiento, salvo cuando la ley lo exija.',
      `Usamos proveedores de infraestructura y de correo que procesan datos por cuenta nuestra: ${PENDIENTE}.`,
    ],
  },
  {
    titulo: 'Cuánto tiempo los conservamos',
    cuerpo: [
      'Conservamos los datos de una postulación mientras el proceso esté abierto y hasta dos años después de cerrado, para poder considerarte en vacantes futuras.',
      'Puedes pedir que los borremos antes en cualquier momento.',
    ],
  },
  {
    titulo: 'Tus derechos ARCO',
    cuerpo: [
      'Tienes derecho a conocer qué datos tuyos tenemos y para qué los usamos (Acceso); a pedir que corrijamos los que estén equivocados o incompletos (Rectificación); a pedir que los eliminemos cuando consideres que no se están usando conforme a lo que aquí se dice (Cancelación); y a oponerte al uso de tus datos para fines específicos (Oposición).',
      `Para ejercer cualquiera de estos derechos escribe a ${PENDIENTE} indicando tu nombre, el derecho que quieres ejercer y un medio para responderte. Tenemos veinte días hábiles para contestar.`,
      'También puedes revocar en cualquier momento el consentimiento que nos diste para tratar tus datos.',
    ],
  },
  {
    titulo: 'Cambios a este aviso',
    cuerpo: [
      'Si cambiamos este aviso, publicaremos la versión actualizada en esta misma página, con su fecha.',
    ],
  },
] as const

export default function Privacidad() {
  return (
    <div className="wrap max-w-[72ch] py-7">
      <p className="label">Legal</p>
      <h1 className="mt-3 text-h1">Aviso de privacidad</h1>
      <p className="mt-4 text-lead text-ink-2">
        En cumplimiento de la Ley Federal de Protección de Datos Personales en Posesión de los
        Particulares.
      </p>

      <p className="mt-5 border-rule border-operaciones bg-operaciones-tint p-4 text-sm">
        <strong>Borrador pendiente de revisión legal.</strong> Los datos marcados como{' '}
        {PENDIENTE} deben completarse, y el texto debe validarse con quien tenga la
        responsabilidad legal, antes de abrir el registro al público.
      </p>

      {SECCIONES.map((s) => (
        <section key={s.titulo} className="mt-7">
          <h2 className="text-h3 border-b-rule border-ink pb-2">{s.titulo}</h2>
          {s.cuerpo.map((parrafo) => (
            <p key={parrafo} className="mt-4 text-ink-2">
              {parrafo}
            </p>
          ))}
        </section>
      ))}
    </div>
  )
}
