/** El ícono de una vertical, con su color. */
export function IconoVertical({ trazo, color, tam = 40 }: { trazo: string; color: string; tam?: number }) {
  return (
    <span
      className="inline-flex items-center justify-center rounded-control"
      style={{ width: tam, height: tam, backgroundColor: `${color}1f`, color }}
      aria-hidden
    >
      <svg viewBox="0 0 24 24" width={tam * 0.6} height={tam * 0.6} fill="none" stroke="currentColor" strokeWidth={1.6} strokeLinecap="round" strokeLinejoin="round">
        <path d={trazo} />
      </svg>
    </span>
  )
}
