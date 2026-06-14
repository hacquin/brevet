import { useCallback, useEffect, useState } from 'react'

// Synthèse vocale via l'API Web Speech (intégrée au navigateur, gratuite).
// Permet de lire à voix haute n'importe quel texte — utile pour les élèves
// dyslexiques qui retiennent mieux à l'oral.

export function useLectureVocale() {
  const [supporte] = useState(() => typeof window !== 'undefined' && 'speechSynthesis' in window)
  const [enLecture, setEnLecture] = useState(false)

  useEffect(() => {
    return () => {
      if (supporte) window.speechSynthesis.cancel()
    }
  }, [supporte])

  const lire = useCallback(
    (texte: string, vitesse = 0.9) => {
      if (!supporte || !texte.trim()) return
      window.speechSynthesis.cancel()
      const u = new SpeechSynthesisUtterance(texte)
      u.lang = 'fr-FR'
      u.rate = vitesse
      const voixFr = window.speechSynthesis.getVoices().find((v) => v.lang.startsWith('fr'))
      if (voixFr) u.voice = voixFr
      u.onend = () => setEnLecture(false)
      u.onerror = () => setEnLecture(false)
      setEnLecture(true)
      window.speechSynthesis.speak(u)
    },
    [supporte],
  )

  const stop = useCallback(() => {
    if (!supporte) return
    window.speechSynthesis.cancel()
    setEnLecture(false)
  }, [supporte])

  return { supporte, enLecture, lire, stop }
}
