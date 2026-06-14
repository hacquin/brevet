import { useRef, useState } from 'react'
import { creerFicheDepuisPdf } from '../lib/api'
import { ajouterFiche, genererId } from '../lib/storage'
import type { Fiche, NiveauFiche } from '../lib/types'

const MATIERES = [
  'Français', 'Mathématiques', 'Histoire', 'Géographie', 'EMC',
  'SVT', 'Physique-Chimie', 'Technologie', 'Anglais', 'Espagnol', 'Autre',
]

const NIVEAUX: { id: NiveauFiche; titre: string; desc: string; emoji: string }[] = [
  { id: 'flemme', titre: "J'ai la flemme", desc: "Le strict minimum vital", emoji: '😴' },
  { id: 'daronne', titre: 'Pour faire plaisir à la daronne', desc: 'Une fiche complète et équilibrée', emoji: '🙂' },
  { id: 'top', titre: 'Pour être au top', desc: 'La totale, rien oublié', emoji: '🤓' },
]

export function CreerFiche({ onCree, onRetour }: { onCree: (f: Fiche) => void; onRetour: () => void }) {
  const [fichier, setFichier] = useState<File | null>(null)
  const [matiere, setMatiere] = useState('')
  const [niveau, setNiveau] = useState<NiveauFiche>('daronne')
  const [chargement, setChargement] = useState(false)
  const [erreur, setErreur] = useState('')
  const inputRef = useRef<HTMLInputElement>(null)

  async function lancer() {
    if (!fichier) return
    setErreur('')
    setChargement(true)
    try {
      const data = await creerFicheDepuisPdf(fichier, matiere, niveau)
      const fiche: Fiche = { ...data, id: genererId(), creeLe: Date.now(), niveau }
      ajouterFiche(fiche)
      onCree(fiche)
    } catch (e) {
      setErreur(e instanceof Error ? e.message : 'Erreur lors de la création.')
    } finally {
      setChargement(false)
    }
  }

  if (chargement) {
    return (
      <div className="card loading-box">
        <div className="spinner" />
        <h3>Création de la fiche en cours…</h3>
        <p className="muted">Claude lit la leçon et la transforme en fiche claire. Cela prend quelques secondes.</p>
      </div>
    )
  }

  return (
    <div>
      <button className="back-link" onClick={onRetour}>← Retour</button>
      <div className="card">
        <h2>📄 Nouvelle fiche de révision</h2>
        <p className="muted">Prends en photo ou scanne la leçon à apprendre (PDF), puis dépose-la ici.</p>

        {erreur && <div className="alert">{erreur}</div>}

        <label className="field">
          <span>Matière (facultatif)</span>
          <select value={matiere} onChange={(e) => setMatiere(e.target.value)}>
            <option value="">— Choisir —</option>
            {MATIERES.map((m) => <option key={m} value={m}>{m}</option>)}
          </select>
        </label>

        <label className="field">
          <span>Fichier PDF de la leçon</span>
          <input
            ref={inputRef}
            type="file"
            accept="application/pdf"
            onChange={(e) => setFichier(e.target.files?.[0] ?? null)}
          />
        </label>

        {fichier && <p className="badge">{fichier.name}</p>}

        <div className="field">
          <span>Niveau de détail de la fiche</span>
          <div className="niveaux">
            {NIVEAUX.map((n) => (
              <button
                key={n.id}
                type="button"
                className={`niveau-card ${niveau === n.id ? 'actif' : ''}`}
                onClick={() => setNiveau(n.id)}
                aria-pressed={niveau === n.id}
              >
                <span className="emoji">{n.emoji}</span>
                <strong>{n.titre}</strong>
                <small>{n.desc}</small>
              </button>
            ))}
          </div>
        </div>

        <div className="mt">
          <button className="btn" disabled={!fichier} onClick={lancer}>
            ✨ Créer la fiche
          </button>
        </div>
      </div>
    </div>
  )
}
