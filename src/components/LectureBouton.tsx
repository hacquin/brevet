import { useLectureVocale } from '../lib/tts'

// Petit bouton « 🔊 » qui lit un texte à voix haute.
export function LectureBouton({ texte, titre = 'Lire à voix haute' }: { texte: string; titre?: string }) {
  const { supporte, enLecture, lire, stop } = useLectureVocale()
  if (!supporte) return null

  return (
    <button
      type="button"
      className={`btn-tts ${enLecture ? 'actif' : ''}`}
      title={titre}
      aria-label={enLecture ? 'Arrêter la lecture' : titre}
      onClick={() => (enLecture ? stop() : lire(texte))}
    >
      {enLecture ? '⏹' : '🔊'}
    </button>
  )
}
