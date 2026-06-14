// Prompts et schémas JSON pour la génération de contenu pédagogique adapté aux enfants dys.
//
// Principe directeur commun à tout le contenu généré (voir SYSTEM_DYS) :
// phrases courtes, vocabulaire simple, une idée par ligne, structure très claire,
// pas de surcharge visuelle, et des repères mémoire concrets.

export const SYSTEM_DYS = `Tu es un professeur spécialisé dans l'accompagnement d'élèves de 3e qui préparent le Brevet des collèges (DNB) et qui sont dys (dyslexie, dysorthographie, dyscalculie).

Tu adaptes systématiquement tout ce que tu écris pour ces élèves :
- Des phrases COURTES (15 mots maximum) et une seule idée par phrase.
- Un vocabulaire SIMPLE. Si un mot difficile est indispensable, tu l'expliques juste après.
- Tu vas à l'essentiel : pas de remplissage, pas de longues introductions.
- Tu structures en petits blocs clairs avec des titres explicites.
- Tu donnes des moyens mnémotechniques et des astuces concrètes pour retenir.
- Pour les maths : tu décomposes chaque calcul étape par étape, sans en sauter.
- Tu restes fidèle au contenu de la leçon fournie. Tu n'inventes pas de notions absentes.
- Tu écris en français, sur un ton bienveillant et encourageant.

Tu réponds UNIQUEMENT au format JSON demandé, sans aucun texte avant ou après.`

// --- FICHE DE RÉVISION ---------------------------------------------------

export const FICHE_SCHEMA = {
  type: 'object',
  additionalProperties: false,
  properties: {
    titre: { type: 'string', description: 'Titre court et clair de la fiche' },
    matiere: { type: 'string', description: 'La matière (ex : Histoire, Mathématiques, Français, SVT...)' },
    resume: { type: 'string', description: "Résumé de la leçon en 2 ou 3 phrases courtes" },
    blocs: {
      type: 'array',
      description:
        "Les notions importantes, en blocs. Pour CHAQUE bloc, choisis le format le plus adapté au type d'information.",
      items: {
        type: 'object',
        additionalProperties: false,
        properties: {
          format: {
            type: 'string',
            enum: ['liste', 'frise', 'comparaison', 'etapes'],
            description:
              "'frise' = chronologie/ordre dans le temps · 'comparaison' = 2 notions à ne pas confondre · 'etapes' = méthode ordonnée · 'liste' = faits généraux.",
          },
          titre: { type: 'string' },
          lignes: {
            type: 'array',
            description:
              "Pour 'liste' (une idée par ligne) et 'etapes' (une étape par ligne). Phrases courtes, **mots-clés** en gras. Sinon tableau vide.",
            items: { type: 'string' },
          },
          evenements: {
            type: 'array',
            description: "Pour 'frise' : événements dans l'ordre. Sinon tableau vide.",
            items: {
              type: 'object',
              additionalProperties: false,
              properties: {
                date: { type: 'string', description: 'Date ou année (ex : "1958", "1962")' },
                texte: { type: 'string', description: 'Ce qui se passe, en quelques mots, **mots-clés** en gras' },
              },
              required: ['date', 'texte'],
            },
          },
          colonnes: {
            type: 'array',
            description:
              "Pour 'comparaison' : 2 colonnes (les 2 notions à distinguer). Sinon tableau vide.",
            items: {
              type: 'object',
              additionalProperties: false,
              properties: {
                titre: { type: 'string', description: 'Nom de la notion' },
                lignes: { type: 'array', description: 'Ses caractéristiques, une par ligne', items: { type: 'string' } },
              },
              required: ['titre', 'lignes'],
            },
          },
        },
        required: ['format', 'titre', 'lignes', 'evenements', 'colonnes'],
      },
    },
    motsCles: {
      type: 'array',
      description: 'Le vocabulaire à connaître, avec une définition simple',
      items: {
        type: 'object',
        additionalProperties: false,
        properties: {
          terme: { type: 'string' },
          definition: { type: 'string' },
        },
        required: ['terme', 'definition'],
      },
    },
    aRetenir: {
      type: 'array',
      description: "L'essentiel absolu à retenir, sous forme de phrases très courtes",
      items: { type: 'string' },
    },
    astuces: {
      type: 'array',
      description: 'Moyens mnémotechniques et astuces pour mémoriser',
      items: { type: 'string' },
    },
  },
  required: ['titre', 'matiere', 'resume', 'blocs', 'motsCles', 'aRetenir', 'astuces'],
}

// Trois niveaux de détail, avec des noms volontairement drôles côté élève.
export const NIVEAUX = {
  flemme: `NIVEAU "J'ai la flemme" — version ULTRA minimale.
L'élève veut le strict minimum vital. Donne SEULEMENT :
- un résumé très court (1 à 2 phrases),
- 2 à 3 points clés maximum (les plus importants uniquement),
- 3 à 4 mots clés indispensables,
- 3 à 5 phrases "à retenir" très courtes,
- 1 ou 2 astuces maximum.
Sois le plus synthétique possible. Pas de détails superflus.`,

  daronne: `NIVEAU "Pour faire plaisir à la daronne" — version équilibrée.
Une fiche de révision complète mais pas surchargée :
- un résumé clair,
- les points clés importants de la leçon,
- le vocabulaire utile,
- l'essentiel à retenir,
- quelques astuces de mémorisation.
C'est le niveau standard, idéal pour réviser sereinement.`,

  top: `NIVEAU "Pour être au top" — version approfondie.
Une fiche complète et exhaustive pour tout maîtriser :
- un résumé détaillé,
- TOUTES les notions de la leçon, découpées en points clés,
- des exemples concrets pour illustrer,
- un vocabulaire riche avec définitions simples,
- une liste complète de ce qu'il faut retenir,
- plusieurs astuces et moyens mnémotechniques.
Vise une révision exhaustive, sans rien oublier d'important.`,
}

export function fichePrompt(matiere, niveau = 'daronne') {
  const consigneNiveau = NIVEAUX[niveau] || NIVEAUX.daronne
  return `Voici le scan d'une leçon à apprendre pour le Brevet${matiere ? ` (matière : ${matiere})` : ''}.

Lis attentivement ce document (il peut s'agir d'un scan manuscrit ou imprimé) et transforme-le en une fiche de révision claire et adaptée aux élèves dys.

${consigneNiveau}

CHOIX DU FORMAT — adapte le rendu graphique au type d'information (très important) :
- Utilise une **frise** ("format":"frise") dès qu'il y a une CHRONOLOGIE ou un ORDRE dans le
  temps : succession de rois/présidents, étapes historiques, dates clés. Remplis "evenements".
- Utilise une **comparaison** ("format":"comparaison") pour DEUX notions à ne pas confondre ou
  à opposer (ex : alternance / cohabitation, nature / fonction). Remplis "colonnes" (exactement 2).
- Utilise des **etapes** ("format":"etapes") pour une MÉTHODE ou une suite d'étapes ordonnées
  (ex : résoudre une équation, faire une dissertation). Remplis "lignes" (une étape par ligne).
- Utilise une **liste** ("format":"liste") pour des faits ou idées générales. Remplis "lignes".
- Pour le format choisi, remplis SON champ ; laisse les autres champs en tableau vide [].
- VARIE les formats : ne mets pas tout en "liste". Une bonne fiche mélange les formats.

FORME — TRÈS IMPORTANT pour les élèves dys :
- Une seule idée par ligne / par événement / par étape, en phrase COURTE (10-12 mots max).
- Jamais de paragraphe compact : c'est un mur de texte illisible pour ces élèves.
- Entoure de doubles astérisques **les 1 à 3 mots les plus importants** (noms propres, concepts).
  Exemple : "La **Constitution** est écrite par **Michel Debré**."
- N'entoure PAS les dates ni les années : elles sont surlignées automatiquement.

ASTUCES — au moins un vrai moyen mnémotechnique MÉMORABLE :
- Invente une phrase, un acronyme ou une image pour retenir une liste ou un ordre
  (par exemple un acronyme à partir des initiales). Sois concret et amusant.

Construis la fiche en respectant le schéma JSON imposé. Sois fidèle au contenu de la leçon.`
}

// --- QUIZ ----------------------------------------------------------------

export const QUIZ_SCHEMA = {
  type: 'object',
  additionalProperties: false,
  properties: {
    titre: { type: 'string' },
    questions: {
      type: 'array',
      items: {
        type: 'object',
        additionalProperties: false,
        properties: {
          question: { type: 'string', description: 'Question courte et claire' },
          choix: {
            type: 'array',
            description: 'Entre 3 et 4 réponses possibles',
            items: { type: 'string' },
          },
          bonneReponse: {
            type: 'integer',
            description: "Index (à partir de 0) de la bonne réponse dans 'choix'",
          },
          explication: {
            type: 'string',
            description: "Explication courte de la bonne réponse, pour comprendre l'erreur",
          },
        },
        required: ['question', 'choix', 'bonneReponse', 'explication'],
      },
    },
  },
  required: ['titre', 'questions'],
}

export function quizPrompt(fiche, nbQuestions = 8) {
  return `À partir de cette fiche de révision, crée un quiz de ${nbQuestions} questions à choix multiples pour vérifier que l'élève a bien compris et mémorisé.

Règles :
- Questions courtes et sans pièges inutiles.
- 3 à 4 choix par question, une seule bonne réponse.
- Varie les notions abordées dans la fiche.
- Pour chaque question, donne une explication simple de la bonne réponse.

FICHE :
${JSON.stringify(fiche, null, 2)}`
}

// --- ÉPREUVE BLANCHE -----------------------------------------------------

export const EPREUVE_SCHEMA = {
  type: 'object',
  additionalProperties: false,
  properties: {
    titre: { type: 'string' },
    matiere: { type: 'string' },
    duree: { type: 'string', description: 'Durée conseillée (ex : "30 minutes")' },
    consignes: { type: 'string', description: 'Consignes générales, en phrases courtes' },
    exercices: {
      type: 'array',
      items: {
        type: 'object',
        additionalProperties: false,
        properties: {
          numero: { type: 'integer' },
          intitule: { type: 'string' },
          points: { type: 'integer', description: 'Nombre de points de l\'exercice' },
          questions: {
            type: 'array',
            items: {
              type: 'object',
              additionalProperties: false,
              properties: {
                enonce: { type: 'string' },
              },
              required: ['enonce'],
            },
          },
          corrige: { type: 'string', description: 'Correction détaillée, étape par étape' },
        },
        required: ['numero', 'intitule', 'points', 'questions', 'corrige'],
      },
    },
  },
  required: ['titre', 'matiere', 'duree', 'consignes', 'exercices'],
}

export function epreuvePrompt(fiches, matiere) {
  const contenu = fiches.map((f) => `--- ${f.titre} ---\n${JSON.stringify(f, null, 2)}`).join('\n\n')
  return `Crée une épreuve blanche du Brevet${matiere ? ` en ${matiere}` : ''}, dans l'esprit du Diplôme National du Brevet, à partir des fiches de révision ci-dessous.

Règles :
- 2 à 4 exercices progressifs (du plus simple au plus difficile).
- Énoncés courts et clairs, adaptés aux élèves dys.
- Ne donne AUCUN indice ni coup de pouce dans les énoncés : c'est une vraie évaluation.
- Note l'épreuve sur un total cohérent (indique les points par exercice).
- Termine chaque exercice par un corrigé détaillé, expliqué étape par étape.

FICHES :
${contenu}`
}
