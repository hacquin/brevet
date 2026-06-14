import type { Fiche } from './types'

// Stockage local des fiches (pas de compte, pas de serveur de base de données).
// Les fiches restent dans le navigateur de l'utilisateur.

const CLE = 'brevet.fiches'

export function chargerFiches(): Fiche[] {
  try {
    const brut = localStorage.getItem(CLE)
    if (!brut) return []
    const fiches = JSON.parse(brut) as Fiche[]
    return fiches.sort((a, b) => b.creeLe - a.creeLe)
  } catch {
    return []
  }
}

function sauverFiches(fiches: Fiche[]) {
  localStorage.setItem(CLE, JSON.stringify(fiches))
}

export function ajouterFiche(fiche: Fiche): Fiche[] {
  const fiches = [fiche, ...chargerFiches()]
  sauverFiches(fiches)
  return fiches
}

export function supprimerFiche(id: string): Fiche[] {
  const fiches = chargerFiches().filter((f) => f.id !== id)
  sauverFiches(fiches)
  return fiches
}

export function genererId(): string {
  return `f_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`
}
