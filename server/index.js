import 'dotenv/config'
import express from 'express'
import multer from 'multer'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import Anthropic from '@anthropic-ai/sdk'
import {
  SYSTEM_DYS,
  FICHE_SCHEMA, fichePrompt,
  QUIZ_SCHEMA, quizPrompt,
  EPREUVE_SCHEMA, epreuvePrompt,
} from './prompts.js'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const ROOT = path.join(__dirname, '..')

const PORT = process.env.PORT || 3001

// Modèles par type de tâche, pour optimiser le coût SANS sacrifier le cœur de valeur :
// - VISION/FICHE : lecture du PDF + rédaction pédagogique adaptée dys → tâche la plus
//   exigeante en qualité → Opus par défaut.
// - TEXTE        : quiz et épreuves à partir d'une fiche déjà propre → tâche facile,
//   générée souvent → Haiku (bien moins cher).
// ANTHROPIC_MODEL (s'il est défini) force le même modèle partout (rétrocompat).
const MODEL_VISION = process.env.ANTHROPIC_MODEL || process.env.ANTHROPIC_MODEL_VISION || 'claude-opus-4-8'
const MODEL_TEXTE = process.env.ANTHROPIC_MODEL || process.env.ANTHROPIC_MODEL_TEXTE || 'claude-haiku-4-5'

// Le paramètre `effort` n'est pas supporté par Haiku ni les anciens Sonnet.
function supporteEffort(model) {
  return !/haiku|sonnet-4-5/.test(model)
}

if (!process.env.ANTHROPIC_API_KEY) {
  console.error('\n⚠️  ANTHROPIC_API_KEY manquante. Copiez .env.example vers .env et renseignez votre clé.\n')
}

const anthropic = new Anthropic() // lit ANTHROPIC_API_KEY dans l'environnement

const app = express()
app.use(express.json({ limit: '5mb' }))

// Upload PDF en mémoire (max 25 Mo, limite de l'API pour un document)
const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 25 * 1024 * 1024 },
})

// Appel générique à Claude avec sortie JSON structurée garantie.
// On utilise le streaming : il évite les timeouts HTTP et autorise de plus
// gros max_tokens (utile pour les fiches "complètes").
async function genererJSON({ model, system, content, schema, maxTokens = 16000 }) {
  const output_config = { format: { type: 'json_schema', schema } }
  if (supporteEffort(model)) output_config.effort = 'high'

  const stream = anthropic.messages.stream({
    model,
    max_tokens: maxTokens,
    system,
    output_config,
    messages: [{ role: 'user', content }],
  })
  const response = await stream.finalMessage()

  // Sortie tronquée : la leçon était trop longue pour le niveau demandé.
  if (response.stop_reason === 'max_tokens') {
    const e = new Error('max_tokens')
    e.userMessage =
      "La leçon est très longue pour ce niveau de détail. Essaie un niveau plus court (😴 ou 🙂), ou découpe la leçon en deux PDF."
    throw e
  }

  const bloc = response.content.find((b) => b.type === 'text')
  if (!bloc) throw new Error('Réponse vide du modèle.')
  return JSON.parse(bloc.text)
}

// Petit utilitaire pour transformer les erreurs en réponses lisibles.
function envoyerErreur(res, err) {
  console.error(err)
  const status = err?.status || 500
  let message = "Une erreur est survenue. Réessayez dans un instant."
  if (err?.userMessage) message = err.userMessage
  else if (status === 401) message = "Clé API invalide ou manquante. Vérifiez votre fichier .env."
  else if (status === 429) message = "Trop de demandes en même temps. Patientez quelques secondes."
  else if (status === 413) message = "Le fichier est trop volumineux."
  res.status(status).json({ error: message })
}

// --- ROUTES API ----------------------------------------------------------

// Génère une fiche de révision à partir d'un PDF scanné.
app.post('/api/fiche', upload.single('pdf'), async (req, res) => {
  try {
    if (!req.file) return res.status(400).json({ error: 'Aucun fichier PDF reçu.' })
    const matiere = (req.body.matiere || '').trim()
    const niveau = (req.body.niveau || 'daronne').trim()
    const base64 = req.file.buffer.toString('base64')

    const fiche = await genererJSON({
      model: MODEL_VISION,
      maxTokens: 32000,
      system: SYSTEM_DYS,
      schema: FICHE_SCHEMA,
      content: [
        { type: 'document', source: { type: 'base64', media_type: 'application/pdf', data: base64 } },
        { type: 'text', text: fichePrompt(matiere, niveau) },
      ],
    })
    if (matiere && !fiche.matiere) fiche.matiere = matiere
    res.json(fiche)
  } catch (err) {
    envoyerErreur(res, err)
  }
})

// Génère un quiz à partir d'une fiche.
app.post('/api/quiz', async (req, res) => {
  try {
    const { fiche, nbQuestions } = req.body || {}
    if (!fiche) return res.status(400).json({ error: 'Fiche manquante.' })
    const quiz = await genererJSON({
      model: MODEL_TEXTE,
      system: SYSTEM_DYS,
      schema: QUIZ_SCHEMA,
      content: quizPrompt(fiche, nbQuestions || 8),
    })
    res.json(quiz)
  } catch (err) {
    envoyerErreur(res, err)
  }
})

// Génère une épreuve blanche à partir d'une ou plusieurs fiches.
app.post('/api/epreuve', async (req, res) => {
  try {
    const { fiches, matiere } = req.body || {}
    if (!Array.isArray(fiches) || fiches.length === 0)
      return res.status(400).json({ error: 'Sélectionnez au moins une fiche.' })
    const epreuve = await genererJSON({
      model: MODEL_TEXTE,
      system: SYSTEM_DYS,
      schema: EPREUVE_SCHEMA,
      content: epreuvePrompt(fiches, matiere || ''),
    })
    res.json(epreuve)
  } catch (err) {
    envoyerErreur(res, err)
  }
})

app.get('/api/health', (_req, res) => res.json({ ok: true, modeles: { vision: MODEL_VISION, texte: MODEL_TEXTE } }))

// --- SERVIR L'APP WEB (production) --------------------------------------
// En production, après `npm run build`, on sert le dossier dist/.
const distDir = path.join(ROOT, 'dist')
app.use(express.static(distDir))
// Repli SPA : toute autre route renvoie index.html (sauf /api déjà traité au-dessus).
app.use((req, res, next) => {
  if (req.method !== 'GET' || req.path.startsWith('/api')) return next()
  res.sendFile(path.join(distDir, 'index.html'))
})

// On écoute uniquement en local : en production, c'est le reverse proxy (Caddy)
// qui expose l'app au public. HOST=0.0.0.0 possible si besoin d'un accès direct.
const HOST = process.env.HOST || '127.0.0.1'
app.listen(PORT, HOST, () => {
  console.log(`\n✅ Serveur démarré : http://${HOST}:${PORT}`)
  console.log(`   Modèles → fiche/vision : ${MODEL_VISION}  |  quiz/épreuve : ${MODEL_TEXTE}`)
  console.log('   En développement, ouvrez plutôt http://localhost:5173\n')
})
