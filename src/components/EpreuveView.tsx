import { useEffect, useState } from 'react'
import { creerEpreuve } from '../lib/api'
import type { Fiche, Epreuve } from '../lib/types'
import { LectureBouton } from './LectureBouton'

export function EpreuveView({ fiches, matiere, onRetour }: { fiches: Fiche[]; matiere?: string; onRetour: () => void }) {
  const [epreuve, setEpreuve] = useState<Epreuve | null>(null)
  const [erreur, setErreur] = useState('')
  const [corriges, setCorriges] = useState<Record<number, boolean>>({})

  useEffect(() => {
    let actif = true
    creerEpreuve(fiches, matiere)
      .then((e) => { if (actif) setEpreuve(e) })
      .catch((e) => { if (actif) setErreur(e instanceof Error ? e.message : 'Erreur.') })
    return () => { actif = false }
  }, [fiches, matiere])

  if (erreur) {
    return (
      <div>
        <button className="back-link" onClick={onRetour}>← Retour</button>
        <div className="card"><div className="alert">{erreur}</div></div>
      </div>
    )
  }

  if (!epreuve) {
    return (
      <div className="card loading-box">
        <div className="spinner" />
        <h3>Préparation de l'épreuve blanche…</h3>
        <p className="muted">Claude rédige des exercices dans l'esprit du Brevet.</p>
      </div>
    )
  }

  const total = epreuve.exercices.reduce((s, e) => s + (e.points || 0), 0)

  return (
    <div>
      <button className="back-link" onClick={onRetour}>← Retour</button>

      <div className="card">
        <div className="titre-tts">
          <span className="badge">{epreuve.matiere}</span>
          <span className="badge">⏱ {epreuve.duree}</span>
          <span className="badge">/ {total} pts</span>
        </div>
        <h2 style={{ marginBottom: '0.4rem' }}>{epreuve.titre}</h2>
        <div className="bloc">
          <div className="titre-tts">
            <strong style={{ flex: 1 }}>Consignes</strong>
            <LectureBouton texte={epreuve.consignes} />
          </div>
          <p style={{ margin: 0 }}>{epreuve.consignes}</p>
        </div>
        <p className="muted">💡 Fais l'épreuve sur une feuille, puis vérifie avec le corrigé de chaque exercice.</p>
      </div>

      {epreuve.exercices.map((exo) => (
        <div className="card" key={exo.numero}>
          <div className="exo-tete">
            <h3 style={{ margin: 0 }}>Exercice {exo.numero} — {exo.intitule}</h3>
            <span className="badge">{exo.points} pts</span>
          </div>

          {exo.questions.map((q, i) => (
            <div className="exo-q" key={i}>
              <div className="titre-tts">
                <span style={{ flex: 1 }}>{i + 1}. {q.enonce}</span>
                <LectureBouton texte={q.enonce} />
              </div>
            </div>
          ))}

          <div className="mt">
            <button
              className="btn ghost small"
              onClick={() => setCorriges((c) => ({ ...c, [exo.numero]: !c[exo.numero] }))}
            >
              {corriges[exo.numero] ? 'Masquer le corrigé' : '✅ Voir le corrigé'}
            </button>
          </div>

          {corriges[exo.numero] && (
            <div className="corrige mt">
              <div className="titre-tts">
                <strong style={{ flex: 1 }}>Corrigé</strong>
                <LectureBouton texte={exo.corrige} />
              </div>
              {exo.corrige}
            </div>
          )}
        </div>
      ))}
    </div>
  )
}
