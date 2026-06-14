import { useMemo, useState } from 'react'
import type { Fiche } from './lib/types'
import { chargerFiches, supprimerFiche } from './lib/storage'
import { BarreAccessibilite } from './components/BarreAccessibilite'
import { CreerFiche } from './components/CreerFiche'
import { FicheDetail } from './components/FicheDetail'
import { QuizView } from './components/QuizView'
import { EpreuveView } from './components/EpreuveView'

type Vue = 'accueil' | 'creer' | 'fiche' | 'quiz' | 'epreuveConfig' | 'epreuve'

function dateCourte(ts: number) {
  return new Date(ts).toLocaleDateString('fr-FR', { day: 'numeric', month: 'short', year: 'numeric' })
}

export function App() {
  const [vue, setVue] = useState<Vue>('accueil')
  const [fiches, setFiches] = useState<Fiche[]>(() => chargerFiches())
  const [ficheActive, setFicheActive] = useState<Fiche | null>(null)
  const [selection, setSelection] = useState<string[]>([])
  const [noticeVu, setNoticeVu] = useState<boolean>(() => localStorage.getItem('brevet.noticeVu') === '1')

  function masquerNotice() {
    localStorage.setItem('brevet.noticeVu', '1')
    setNoticeVu(true)
  }

  const fichesSelectionnees = useMemo(
    () => fiches.filter((f) => selection.includes(f.id)),
    [fiches, selection],
  )

  function ouvrirFiche(f: Fiche) {
    setFicheActive(f)
    setVue('fiche')
  }

  function ficheCree(f: Fiche) {
    setFiches(chargerFiches())
    ouvrirFiche(f)
  }

  function supprimer(id: string, e: React.MouseEvent) {
    e.stopPropagation()
    if (!confirm('Supprimer cette fiche ?')) return
    setFiches(supprimerFiche(id))
  }

  function toggleSelection(id: string) {
    setSelection((s) => (s.includes(id) ? s.filter((x) => x !== id) : [...s, id]))
  }

  return (
    <div className="app">
      <header className="topbar">
        <button className="brand" onClick={() => setVue('accueil')}>
          <span className="logo">🎓</span> Révise ton Brevet
        </button>
        <BarreAccessibilite />
      </header>

      <main className="container">
        {vue === 'accueil' && (
          <>
            {!noticeVu && (
              <div className="notice">
                <span className="notice-emoji" aria-hidden="true">💾</span>
                <div className="notice-body">
                  <strong>Tes fiches sont gardées sur cet appareil uniquement</strong>
                  <p>
                    Elles restent dans ce navigateur, même après l'avoir fermé. Mais elles ne sont
                    pas synchronisées : tu ne les retrouveras pas sur un autre appareil ou un autre
                    navigateur. Si tu effaces les données de navigation, elles seront perdues.
                  </p>
                </div>
                <button className="notice-close" onClick={masquerNotice}>J'ai compris</button>
              </div>
            )}

            <div className="hero">
              <h1>Salut ! Prêt(e) à réviser ? 🚀</h1>
              <p>Crée des fiches claires, des quiz et des épreuves blanches à partir de tes leçons.</p>
            </div>

            <div className="actions-grid">
              <button className="tile" onClick={() => setVue('creer')}>
                <div className="emoji">📄</div>
                <h3>Créer une fiche</h3>
                <p>Dépose le PDF d'une leçon, j'en fais une fiche facile à lire.</p>
              </button>
              <button
                className="tile"
                onClick={() => { setSelection([]); setVue('epreuveConfig') }}
              >
                <div className="emoji">📝</div>
                <h3>Épreuve blanche</h3>
                <p>Entraîne-toi avec un sujet dans l'esprit du Brevet.</p>
              </button>
            </div>

            <h2>📚 Mes fiches</h2>
            {fiches.length === 0 ? (
              <div className="empty">
                <div className="emoji">📭</div>
                <p>Tu n'as pas encore de fiche.<br />Commence par en créer une !</p>
                <button className="btn" onClick={() => setVue('creer')}>📄 Créer ma première fiche</button>
              </div>
            ) : (
              fiches.map((f) => (
                <div className="fiche-row" key={f.id} onClick={() => ouvrirFiche(f)}>
                  <span className="badge">{f.matiere || 'Fiche'}</span>
                  <div className="meta">
                    <strong>{f.titre}</strong>
                    <small>{dateCourte(f.creeLe)}</small>
                  </div>
                  <button className="btn danger small" onClick={(e) => supprimer(f.id, e)}>Suppr.</button>
                </div>
              ))
            )}
          </>
        )}

        {vue === 'creer' && (
          <CreerFiche onCree={ficheCree} onRetour={() => setVue('accueil')} />
        )}

        {vue === 'fiche' && ficheActive && (
          <FicheDetail
            fiche={ficheActive}
            onRetour={() => setVue('accueil')}
            onQuiz={() => setVue('quiz')}
            onEpreuve={() => { setSelection([ficheActive.id]); setVue('epreuve') }}
          />
        )}

        {vue === 'quiz' && ficheActive && (
          <QuizView fiche={ficheActive} onRetour={() => setVue('fiche')} />
        )}

        {vue === 'epreuveConfig' && (
          <div>
            <button className="back-link" onClick={() => setVue('accueil')}>← Retour</button>
            <div className="card">
              <h2>📝 Préparer une épreuve blanche</h2>
              <p className="muted">Choisis une ou plusieurs fiches. L'épreuve portera sur ces leçons.</p>

              {fiches.length === 0 ? (
                <div className="empty">
                  <p>Crée d'abord une fiche pour pouvoir générer une épreuve.</p>
                  <button className="btn" onClick={() => setVue('creer')}>📄 Créer une fiche</button>
                </div>
              ) : (
                <>
                  {fiches.map((f) => (
                    <label className="fiche-row" key={f.id} style={{ cursor: 'pointer' }}>
                      <input
                        type="checkbox"
                        checked={selection.includes(f.id)}
                        onChange={() => toggleSelection(f.id)}
                        style={{ width: 22, height: 22 }}
                      />
                      <span className="badge">{f.matiere || 'Fiche'}</span>
                      <div className="meta"><strong>{f.titre}</strong></div>
                    </label>
                  ))}
                  <div className="mt">
                    <button
                      className="btn"
                      disabled={selection.length === 0}
                      onClick={() => setVue('epreuve')}
                    >
                      ✨ Générer l'épreuve ({selection.length})
                    </button>
                  </div>
                </>
              )}
            </div>
          </div>
        )}

        {vue === 'epreuve' && fichesSelectionnees.length > 0 && (
          <EpreuveView
            fiches={fichesSelectionnees}
            matiere={fichesSelectionnees[0]?.matiere}
            onRetour={() => setVue(ficheActive ? 'fiche' : 'accueil')}
          />
        )}
      </main>

      <footer className="container" style={{ paddingTop: 0, paddingBottom: '1.5rem' }}>
        <p className="muted center" style={{ fontSize: '0.85rem' }}>
          Tes fiches sont gardées uniquement sur cet appareil. Pense à réviser un peu chaque jour 🌟
        </p>
      </footer>
    </div>
  )
}
