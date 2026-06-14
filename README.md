# 🎓 Révise ton Brevet

Application web pour aider les parents d'enfants **dys** (dyslexiques, dysorthographiques, dyscalculiques) à préparer le Brevet des collèges. À partir d'un **scan de leçon (PDF)**, l'app :

- 📄 crée une **fiche de révision** claire et adaptée,
- 🎯 génère un **quiz** interactif,
- 📝 prépare une **épreuve blanche** dans l'esprit du DNB.

Le contenu est généré par l'API **Claude** (Anthropic) et systématiquement adapté aux élèves dys : phrases courtes, vocabulaire simple, structure aérée, astuces de mémorisation.

## Confort de lecture (accessibilité dys)

Un panneau « Confort de lecture » permet de régler :
- la **police** (Lexend, OpenDyslexic, Atkinson Hyperlegible),
- la **taille du texte**, l'**interligne**, l'**espacement des lettres**,
- le **thème de couleur** (crème, clair, bleu, sombre — réduit la fatigue visuelle),
- une **règle de lecture** qui suit la souris,
- la **lecture à voix haute** (🔊) de n'importe quel texte.

Tous les réglages sont mémorisés sur l'appareil.

## Architecture

- **Frontend** : React + Vite + TypeScript, CSS maison piloté par variables (aucune base de données ; les fiches sont stockées dans le navigateur via `localStorage`).
- **Backend** : Express (Node) qui sert l'app et fait office de proxy vers l'API Claude. **La clé API reste côté serveur**, jamais exposée au navigateur.

```
server/        Serveur Express + appels Claude (prompts + schémas JSON)
src/           Application React
  components/  Vues (création de fiche, fiche, quiz, épreuve, accessibilité)
  lib/         Accès API, stockage local, synthèse vocale, préférences dys
```

## Installation

```bash
npm install
cp .env.example .env      # puis renseignez votre clé ANTHROPIC_API_KEY
```

## Développement

```bash
npm run dev
```

- Frontend : http://localhost:5173 (rechargement à chaud)
- API : http://localhost:3001 (le frontend y est automatiquement redirigé)

## Production (déploiement sur un VPS)

```bash
npm install
npm run build        # génère dist/
npm start            # sert l'app + l'API sur le PORT (3001 par défaut)
```

L'app est alors accessible sur `http://VOTRE_VPS:3001`. Placez un reverse proxy
(Nginx, Caddy) devant pour le HTTPS et un nom de domaine.

### Exemple : service systemd

```ini
[Unit]
Description=Revise ton Brevet
After=network.target

[Service]
WorkingDirectory=/chemin/vers/Brevet
ExecStart=/usr/bin/node server/index.js
EnvironmentFile=/chemin/vers/Brevet/.env
Restart=always

[Install]
WantedBy=multi-user.target
```

## Variables d'environnement

| Variable            | Rôle                                              | Défaut            |
|---------------------|---------------------------------------------------|-------------------|
| `ANTHROPIC_API_KEY` | Clé API Anthropic (**obligatoire**)               | —                 |
| `ANTHROPIC_MODEL`   | Modèle Claude (`claude-sonnet-4-6` pour réduire le coût) | `claude-opus-4-8` |
| `PORT`              | Port du serveur                                   | `3001`            |

## Coût

Chaque génération (fiche, quiz, épreuve) correspond à un appel à l'API Claude,
facturé par Anthropic selon le nombre de tokens. Le modèle `claude-sonnet-4-6`
est nettement moins cher que `claude-opus-4-8` si le budget est un critère.
