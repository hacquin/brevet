import { createContext, useContext, useEffect, useState, type ReactNode } from 'react'

// Préférences d'accessibilité pour les élèves dys.
// Tout est piloté par des variables CSS appliquées sur <html>, ce qui permet
// d'agir instantanément sur toute l'interface.

export type Police = 'lexend' | 'opendyslexic' | 'hyperlegible'
export type Theme = 'creme' | 'clair' | 'bleu' | 'sombre'

export interface Prefs {
  police: Police
  taille: number // multiplicateur, 1 = normal
  interligne: number
  espacement: number // espacement des lettres en em
  theme: Theme
  regle: boolean // règle de lecture qui suit la souris
}

const DEFAUT: Prefs = {
  police: 'opendyslexic',
  taille: 1.1,
  interligne: 1.85,
  espacement: 0.03,
  theme: 'creme',
  regle: false,
}

const POLICES: Record<Police, string> = {
  lexend: "'Lexend', system-ui, sans-serif",
  opendyslexic: "'OpenDyslexic', 'Lexend', sans-serif",
  hyperlegible: "'Atkinson Hyperlegible', system-ui, sans-serif",
}

const CLE = 'brevet.prefs'

function appliquer(p: Prefs) {
  const root = document.documentElement
  root.style.setProperty('--font-family', POLICES[p.police])
  root.style.setProperty('--font-scale', String(p.taille))
  root.style.setProperty('--line-height', String(p.interligne))
  root.style.setProperty('--letter-spacing', `${p.espacement}em`)
  root.setAttribute('data-theme', p.theme)
}

interface Ctx {
  prefs: Prefs
  set: (patch: Partial<Prefs>) => void
  reset: () => void
}

const A11yContext = createContext<Ctx | null>(null)

export function A11yProvider({ children }: { children: ReactNode }) {
  const [prefs, setPrefs] = useState<Prefs>(() => {
    try {
      const brut = localStorage.getItem(CLE)
      return brut ? { ...DEFAUT, ...JSON.parse(brut) } : DEFAUT
    } catch {
      return DEFAUT
    }
  })

  useEffect(() => {
    appliquer(prefs)
    localStorage.setItem(CLE, JSON.stringify(prefs))
  }, [prefs])

  const set = (patch: Partial<Prefs>) => setPrefs((p) => ({ ...p, ...patch }))
  const reset = () => setPrefs(DEFAUT)

  return <A11yContext.Provider value={{ prefs, set, reset }}>{children}</A11yContext.Provider>
}

export function useA11y() {
  const ctx = useContext(A11yContext)
  if (!ctx) throw new Error('useA11y doit être utilisé dans A11yProvider')
  return ctx
}
