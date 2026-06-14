export interface PointCle {
  titre: string
  contenu: string
}

export interface MotCle {
  terme: string
  definition: string
}

export type NiveauFiche = 'flemme' | 'daronne' | 'top'

// --- Blocs typés : le modèle choisit le format adapté à l'information ---
export type BlocFormat = 'liste' | 'frise' | 'comparaison' | 'etapes'

export interface BlocEvenement {
  date: string
  texte: string
}

export interface BlocColonne {
  titre: string
  lignes: string[]
}

export interface Bloc {
  format: BlocFormat
  titre: string
  lignes: string[] // pour 'liste' et 'etapes'
  evenements: BlocEvenement[] // pour 'frise'
  colonnes: BlocColonne[] // pour 'comparaison'
}

export interface Fiche {
  id: string
  creeLe: number
  niveau?: NiveauFiche
  titre: string
  matiere: string
  resume: string
  blocs?: Bloc[] // nouveau format (le modèle choisit le rendu)
  pointsCles?: PointCle[] // ancien format (rétrocompatibilité)
  motsCles: MotCle[]
  aRetenir: string[]
  astuces: string[]
}

export interface QuizQuestion {
  question: string
  choix: string[]
  bonneReponse: number
  explication: string
}

export interface Quiz {
  titre: string
  questions: QuizQuestion[]
}

export interface ExerciceQuestion {
  enonce: string
}

export interface Exercice {
  numero: number
  intitule: string
  points: number
  questions: ExerciceQuestion[]
  corrige: string
}

export interface Epreuve {
  titre: string
  matiere: string
  duree: string
  consignes: string
  exercices: Exercice[]
}
