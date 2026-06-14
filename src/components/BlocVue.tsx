import type { Bloc } from '../lib/types'
import { RicheTexte, sansMarques } from './RicheTexte'
import { LectureBouton } from './LectureBouton'

const ICONES: Record<Bloc['format'], string> = {
  liste: '📌',
  frise: '🕒',
  comparaison: '⚖️',
  etapes: '🪜',
}

// Texte lisible à voix haute pour un bloc, selon son format.
function blocEnTexte(b: Bloc): string {
  let corps = ''
  if (b.format === 'frise') corps = b.evenements.map((e) => `${e.date} : ${e.texte}`).join('. ')
  else if (b.format === 'comparaison') corps = b.colonnes.map((c) => `${c.titre}. ${c.lignes.join('. ')}`).join('. ')
  else corps = b.lignes.join('. ')
  return sansMarques(`${b.titre}. ${corps}`)
}

export function BlocVue({ bloc, index }: { bloc: Bloc; index: number }) {
  const couleur = `c${index % 4}`

  return (
    <section className={`section-cle ${couleur}`}>
      <div className="section-tete">
        <span className="num">{ICONES[bloc.format] || index + 1}</span>
        <h3>{bloc.titre}</h3>
        <LectureBouton texte={blocEnTexte(bloc)} />
      </div>

      {/* LISTE : faits courts à ✔ */}
      {bloc.format === 'liste' && (
        <ul className="faits">
          {bloc.lignes.filter(Boolean).map((l, i) => (
            <li key={i}><RicheTexte texte={l} /></li>
          ))}
        </ul>
      )}

      {/* ETAPES : liste numérotée */}
      {bloc.format === 'etapes' && (
        <ol className="etapes">
          {bloc.lignes.filter(Boolean).map((l, i) => (
            <li key={i}>
              <span className="etape-num">{i + 1}</span>
              <span><RicheTexte texte={l} /></span>
            </li>
          ))}
        </ol>
      )}

      {/* FRISE : chronologie verticale */}
      {bloc.format === 'frise' && (
        <ul className="frise">
          {bloc.evenements.map((e, i) => (
            <li key={i}>
              <span className="frise-date">{e.date}</span>
              <span className="frise-texte"><RicheTexte texte={e.texte} /></span>
            </li>
          ))}
        </ul>
      )}

      {/* COMPARAISON : 2 colonnes côte à côte */}
      {bloc.format === 'comparaison' && (
        <div className="comparaison">
          {bloc.colonnes.map((c, i) => (
            <div className="colonne" key={i}>
              <h4>{c.titre}</h4>
              <ul className="faits">
                {c.lignes.filter(Boolean).map((l, j) => (
                  <li key={j}><RicheTexte texte={l} /></li>
                ))}
              </ul>
            </div>
          ))}
        </div>
      )}
    </section>
  )
}
