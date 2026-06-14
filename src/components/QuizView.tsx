import { useEffect, useState } from 'react'
import { creerQuiz } from '../lib/api'
import type { Fiche, Quiz } from '../lib/types'
import { LectureBouton } from './LectureBouton'

export function QuizView({ fiche, onRetour }: { fiche: Fiche; onRetour: () => void }) {
  const [quiz, setQuiz] = useState<Quiz | null>(null)
  const [erreur, setErreur] = useState('')
  const [index, setIndex] = useState(0)
  const [choisi, setChoisi] = useState<number | null>(null)
  const [score, setScore] = useState(0)
  const [termine, setTermine] = useState(false)

  useEffect(() => {
    let actif = true
    creerQuiz(fiche)
      .then((q) => { if (actif) setQuiz(q) })
      .catch((e) => { if (actif) setErreur(e instanceof Error ? e.message : 'Erreur.') })
    return () => { actif = false }
  }, [fiche])

  function repondre(i: number) {
    if (choisi !== null || !quiz) return
    setChoisi(i)
    if (i === quiz.questions[index].bonneReponse) setScore((s) => s + 1)
  }

  function suivante() {
    if (!quiz) return
    if (index + 1 >= quiz.questions.length) {
      setTermine(true)
    } else {
      setIndex((x) => x + 1)
      setChoisi(null)
    }
  }

  function recommencer() {
    setIndex(0); setChoisi(null); setScore(0); setTermine(false)
  }

  if (erreur) {
    return (
      <div>
        <button className="back-link" onClick={onRetour}>← Retour</button>
        <div className="card"><div className="alert">{erreur}</div></div>
      </div>
    )
  }

  if (!quiz) {
    return (
      <div className="card loading-box">
        <div className="spinner" />
        <h3>Préparation de ton quiz…</h3>
        <p className="muted">Claude prépare des questions à partir de ta fiche.</p>
      </div>
    )
  }

  if (termine) {
    const total = quiz.questions.length
    const pct = Math.round((score / total) * 100)
    const message = pct >= 80 ? 'Bravo, tu maîtrises bien ! 🎉' : pct >= 50 ? 'Bien joué, continue à réviser. 💪' : 'Pas grave, recommence après avoir relu la fiche. 📖'
    return (
      <div>
        <button className="back-link" onClick={onRetour}>← Retour à la fiche</button>
        <div className="card score-final">
          <div className="gros">{score} / {total}</div>
          <p>{message}</p>
          <div className="row center mt" style={{ justifyContent: 'center' }}>
            <button className="btn" onClick={recommencer}>↻ Recommencer</button>
            <button className="btn ghost" onClick={onRetour}>Retour</button>
          </div>
        </div>
      </div>
    )
  }

  const q = quiz.questions[index]
  const bonne = q.bonneReponse

  return (
    <div>
      <button className="back-link" onClick={onRetour}>← Retour à la fiche</button>

      <div className="progress"><div style={{ width: `${(index / quiz.questions.length) * 100}%` }} /></div>

      <div className="card">
        <div className="row">
          <span className="badge">Question {index + 1} / {quiz.questions.length}</span>
          <span className="spacer" />
          <LectureBouton texte={`${q.question}. ${q.choix.join('. ')}`} titre="Lire la question" />
        </div>
        <h3 className="mt">{q.question}</h3>

        {q.choix.map((c, i) => {
          let cls = 'choix'
          if (choisi !== null) {
            if (i === bonne) cls += ' bon'
            else if (i === choisi) cls += ' mauvais'
          }
          return (
            <button key={i} className={cls} disabled={choisi !== null} onClick={() => repondre(i)}>
              {c}
            </button>
          )
        })}

        {choisi !== null && (
          <div className={`feedback ${choisi === bonne ? 'ok' : 'ko'}`}>
            <strong>{choisi === bonne ? '✅ Bonne réponse !' : '❌ Ce n\'est pas ça.'}</strong>
            <p style={{ marginBottom: 0 }}>{q.explication}</p>
          </div>
        )}

        {choisi !== null && (
          <div className="mt">
            <button className="btn" onClick={suivante}>
              {index + 1 >= quiz.questions.length ? 'Voir mon score' : 'Question suivante →'}
            </button>
          </div>
        )}
      </div>
    </div>
  )
}
