import { Fragment, type ReactNode } from 'react'

// Met en valeur le texte d'une fiche, comme sur une vraie fiche dys :
// - **mot**          → affiché en gras (marqué par le modèle)
// - dates et années  → surlignées en jaune (détectées automatiquement)

const MOIS = 'janvier|février|mars|avril|mai|juin|juillet|août|septembre|octobre|novembre|décembre'
const DATE_RE = new RegExp(
  `(\\b\\d{1,2}(?:er)?\\s+(?:${MOIS})(?:\\s+\\d{4})?\\b|\\b1[5-9]\\d{2}\\b|\\b20\\d{2}\\b)`,
  'gi',
)

function surligner(texte: string, cle: string): ReactNode[] {
  const out: ReactNode[] = []
  let dernier = 0
  let i = 0
  let m: RegExpExecArray | null
  DATE_RE.lastIndex = 0
  while ((m = DATE_RE.exec(texte)) !== null) {
    if (m.index > dernier) out.push(<Fragment key={`${cle}-t${i}`}>{texte.slice(dernier, m.index)}</Fragment>)
    out.push(<span className="cle" key={`${cle}-d${i}`}>{m[0]}</span>)
    dernier = m.index + m[0].length
    i++
  }
  if (dernier < texte.length) out.push(<Fragment key={`${cle}-f`}>{texte.slice(dernier)}</Fragment>)
  return out
}

export function RicheTexte({ texte }: { texte: string }) {
  const parts = texte.split(/(\*\*[^*]+\*\*)/g)
  return (
    <>
      {parts.map((part, idx) =>
        part.startsWith('**') && part.endsWith('**') ? (
          <strong key={idx}>{surligner(part.slice(2, -2), `b${idx}`)}</strong>
        ) : (
          <Fragment key={idx}>{surligner(part, `n${idx}`)}</Fragment>
        ),
      )}
    </>
  )
}

// Version texte brut (sans les **), pour la lecture vocale.
export function sansMarques(texte: string): string {
  return texte.replace(/\*\*/g, '')
}
