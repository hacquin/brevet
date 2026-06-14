import type { Fiche, Bloc } from '../lib/types'
import { LectureBouton } from './LectureBouton'
import { RicheTexte, sansMarques } from './RicheTexte'
import { BlocVue } from './BlocVue'

// Renvoie les blocs de la fiche, en convertissant l'ancien format si besoin.
function blocsDeLaFiche(f: Fiche): Bloc[] {
  if (f.blocs && f.blocs.length) return f.blocs
  // Rétrocompatibilité : anciennes fiches avec "pointsCles"
  return (f.pointsCles ?? []).map((p) => ({
    format: 'liste' as const,
    titre: p.titre,
    lignes: p.contenu.split('\n').map((l) => l.trim()).filter(Boolean),
    evenements: [],
    colonnes: [],
  }))
}

// Construit un texte lisible à voix haute pour toute la fiche (sans les **).
function ficheEnTexte(f: Fiche): string {
  const blocsTxt = blocsDeLaFiche(f).map((b) => {
    if (b.format === 'frise') return `${b.titre}. ${b.evenements.map((e) => `${e.date} : ${e.texte}`).join('. ')}`
    if (b.format === 'comparaison') return `${b.titre}. ${b.colonnes.map((c) => `${c.titre}. ${c.lignes.join('. ')}`).join('. ')}`
    return `${b.titre}. ${b.lignes.join('. ')}`
  })
  const parts = [
    f.titre, f.resume,
    ...blocsTxt,
    'Mots clés.', ...f.motsCles.map((m) => `${m.terme} : ${m.definition}`),
    'À retenir.', ...f.aRetenir,
    'Astuces.', ...f.astuces,
  ]
  return sansMarques(parts.join('. '))
}

export function FicheDetail({
  fiche, onRetour, onQuiz, onEpreuve,
}: {
  fiche: Fiche
  onRetour: () => void
  onQuiz: () => void
  onEpreuve: () => void
}) {
  // Export PDF via l'impression du navigateur (« Enregistrer au format PDF »).
  function telechargerPdf() {
    const titreInitial = document.title
    document.title = `Fiche - ${fiche.titre}`
    window.print()
    document.title = titreInitial
  }

  return (
    <div className="fiche">
      <button className="back-link no-print" onClick={onRetour}>← Mes fiches</button>

      {/* Bandeau de titre */}
      <div className="fiche-entete">
        <div className="row no-print" style={{ marginBottom: '0.6rem' }}>
          <span className="pill">{fiche.matiere || 'Fiche'}</span>
          <span className="spacer" />
          <LectureBouton texte={ficheEnTexte(fiche)} titre="Lire toute la fiche" />
        </div>
        <h1>{fiche.titre}</h1>
        <p className="sous-titre"><RicheTexte texte={fiche.resume} /></p>
      </div>

      <div className="fiche-actions no-print">
        <button className="btn" onClick={onQuiz}>🎯 Quiz</button>
        <button className="btn soft" onClick={onEpreuve}>📝 Épreuve</button>
        <button className="btn ghost" onClick={telechargerPdf}>⬇️ PDF</button>
      </div>

      {/* Blocs : le format graphique s'adapte au type d'information */}
      {blocsDeLaFiche(fiche).map((bloc, i) => (
        <BlocVue bloc={bloc} index={i} key={i} />
      ))}

      {/* Vocabulaire */}
      {fiche.motsCles.length > 0 && (
        <section className="section-cle c-vocab">
          <div className="section-tete">
            <span className="num">📖</span>
            <h3>Vocabulaire à connaître</h3>
          </div>
          {fiche.motsCles.map((m, i) => (
            <div className="mot" key={i}>
              <span className="terme">{m.terme}</span> : <RicheTexte texte={m.definition} />
            </div>
          ))}
        </section>
      )}

      {/* L'essentiel */}
      {fiche.aRetenir.length > 0 && (
        <section className="section-cle c-retenir">
          <div className="section-tete">
            <span className="num">⭐</span>
            <h3>L'essentiel à retenir</h3>
          </div>
          <ul className="faits forts">
            {fiche.aRetenir.map((x, i) => <li key={i}><RicheTexte texte={x} /></li>)}
          </ul>
        </section>
      )}

      {/* Astuces */}
      {fiche.astuces.length > 0 && (
        <section className="section-cle c-astuce">
          <div className="section-tete">
            <span className="num">💡</span>
            <h3>Astuces pour mémoriser</h3>
          </div>
          {fiche.astuces.map((a, i) => (
            <div className="astuce" key={i}><RicheTexte texte={a} /></div>
          ))}
        </section>
      )}
    </div>
  )
}
