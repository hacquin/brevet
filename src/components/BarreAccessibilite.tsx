import { useEffect, useState } from 'react'
import { useA11y, type Police, type Theme } from '../lib/a11y'

const POLICES: { id: Police; label: string }[] = [
  { id: 'lexend', label: 'Lexend' },
  { id: 'opendyslexic', label: 'OpenDyslexic' },
  { id: 'hyperlegible', label: 'Hyperlexible' },
]

const THEMES: { id: Theme; label: string }[] = [
  { id: 'creme', label: 'Crème' },
  { id: 'clair', label: 'Clair' },
  { id: 'bleu', label: 'Bleu' },
  { id: 'sombre', label: 'Sombre' },
]

// Règle de lecture : une bande horizontale qui suit la souris pour aider à
// ne pas perdre sa ligne (utile en cas de dyslexie).
function RegleLecture() {
  const [y, setY] = useState(0)
  useEffect(() => {
    const h = (e: MouseEvent) => setY(e.clientY)
    window.addEventListener('mousemove', h)
    return () => window.removeEventListener('mousemove', h)
  }, [])
  return <div className="regle-lecture" style={{ top: y - 20 }} aria-hidden="true" />
}

export function BarreAccessibilite() {
  const { prefs, set, reset } = useA11y()
  const [ouvert, setOuvert] = useState(false)

  return (
    <>
      <button className="a11y-toggle" onClick={() => setOuvert(true)} aria-label="Ouvrir les réglages de lecture">
        🔠 Confort de lecture
      </button>

      {prefs.regle && <RegleLecture />}

      {ouvert && (
        <div className="a11y-panel" onClick={() => setOuvert(false)}>
          <div className="a11y-drawer" onClick={(e) => e.stopPropagation()}>
            <div className="row">
              <h2>Confort de lecture</h2>
              <span className="spacer" />
              <button className="btn ghost small" onClick={() => setOuvert(false)}>Fermer</button>
            </div>
            <p className="muted">Règle l'affichage pour mieux lire. Tes choix sont gardés sur cet appareil.</p>

            <div className="opt-group">
              <span className="titre">Police</span>
              <div className="opt-row">
                {POLICES.map((p) => (
                  <button
                    key={p.id}
                    className={`opt-btn ${prefs.police === p.id ? 'actif' : ''}`}
                    onClick={() => set({ police: p.id })}
                  >
                    {p.label}
                  </button>
                ))}
              </div>
            </div>

            <div className="opt-group">
              <span className="titre">Thème de couleur</span>
              <div className="opt-row">
                {THEMES.map((t) => (
                  <button
                    key={t.id}
                    className={`opt-btn ${prefs.theme === t.id ? 'actif' : ''}`}
                    onClick={() => set({ theme: t.id })}
                  >
                    {t.label}
                  </button>
                ))}
              </div>
            </div>

            <div className="opt-group">
              <span className="titre">Taille du texte — {Math.round(prefs.taille * 100)}%</span>
              <input
                type="range" min={0.9} max={1.7} step={0.05}
                value={prefs.taille}
                onChange={(e) => set({ taille: Number(e.target.value) })}
              />
            </div>

            <div className="opt-group">
              <span className="titre">Interligne — {prefs.interligne.toFixed(1)}</span>
              <input
                type="range" min={1.4} max={2.6} step={0.1}
                value={prefs.interligne}
                onChange={(e) => set({ interligne: Number(e.target.value) })}
              />
            </div>

            <div className="opt-group">
              <span className="titre">Espacement des lettres</span>
              <input
                type="range" min={0} max={0.12} step={0.01}
                value={prefs.espacement}
                onChange={(e) => set({ espacement: Number(e.target.value) })}
              />
            </div>

            <div className="opt-group">
              <label className="row" style={{ cursor: 'pointer' }}>
                <input
                  type="checkbox"
                  checked={prefs.regle}
                  onChange={(e) => set({ regle: e.target.checked })}
                  style={{ width: 22, height: 22 }}
                />
                <span>Règle de lecture (suit la souris)</span>
              </label>
            </div>

            <button className="btn ghost" onClick={reset}>↺ Réinitialiser</button>
          </div>
        </div>
      )}
    </>
  )
}
