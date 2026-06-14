import type { Fiche, Quiz, Epreuve } from './types'

async function lireErreur(res: Response): Promise<string> {
  try {
    const data = await res.json()
    return data.error || 'Erreur inconnue.'
  } catch {
    return `Erreur ${res.status}.`
  }
}

// Envoie le PDF au serveur, qui appelle Claude et renvoie une fiche.
export async function creerFicheDepuisPdf(
  pdf: File,
  matiere: string,
  niveau: string,
): Promise<Omit<Fiche, 'id' | 'creeLe'>> {
  const form = new FormData()
  form.append('pdf', pdf)
  form.append('matiere', matiere)
  form.append('niveau', niveau)

  const res = await fetch('/api/fiche', { method: 'POST', body: form })
  if (!res.ok) throw new Error(await lireErreur(res))
  return res.json()
}

export async function creerQuiz(fiche: Fiche, nbQuestions = 8): Promise<Quiz> {
  const res = await fetch('/api/quiz', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ fiche, nbQuestions }),
  })
  if (!res.ok) throw new Error(await lireErreur(res))
  return res.json()
}

export async function creerEpreuve(fiches: Fiche[], matiere = ''): Promise<Epreuve> {
  const res = await fetch('/api/epreuve', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ fiches, matiere }),
  })
  if (!res.ok) throw new Error(await lireErreur(res))
  return res.json()
}
