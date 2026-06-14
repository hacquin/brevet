# Déploiement sur un VPS (Ubuntu/Debian)

Architecture cible : **Caddy** (HTTPS automatique) en façade → **app Node** (port 3001, en local) gérée par **systemd**.

```
Internet → Caddy (443, HTTPS) → 127.0.0.1:3001 (Node) → API Claude
```

> Remplacez partout `revise.mondomaine.fr` par votre domaine, `VOTRE_IP` par l'IP du VPS, et `URL_DU_DEPOT.git` par l'URL de votre dépôt Git.

---

## 0. Pré-requis : le domaine (DNS)

Chez votre registrar (OVH, Gandi, Cloudflare…), créez un enregistrement **A** :

| Type | Nom | Valeur |
|------|-----|--------|
| A | `revise` (ou `@`) | `VOTRE_IP` |

Attendez quelques minutes que ça se propage. Vérifiez : `ping revise.mondomaine.fr` doit renvoyer l'IP du VPS.

---

## 1. Se connecter au VPS

```bash
ssh root@VOTRE_IP        # ou votre utilisateur habituel
```

## 2. Installer Node.js 22 (LTS)

```bash
curl -fsSL https://deb.nodesource.com/setup_22.x | sudo -E bash -
sudo apt-get install -y nodejs git
node --version    # doit afficher v22.x
```

## 3. Récupérer le code

```bash
sudo mkdir -p /var/www
cd /var/www
sudo git clone URL_DU_DEPOT.git brevet
sudo chown -R $USER:$USER /var/www/brevet
cd /var/www/brevet
```

## 4. Installer et construire

```bash
npm ci          # installe les dépendances (reproductible)
npm run build   # génère dist/
```

## 5. Configurer la clé API (.env)

```bash
nano .env
```

Collez (avec **votre** clé Anthropic) :

```
ANTHROPIC_API_KEY=sk-ant-VOTRE_CLE
PORT=3001
HOST=127.0.0.1
# Modèles par tâche (valeurs par défaut, décommentez pour changer) :
# ANTHROPIC_MODEL_VISION=claude-opus-4-8
# ANTHROPIC_MODEL_TEXTE=claude-haiku-4-5
```

`Ctrl+O` puis `Entrée` pour enregistrer, `Ctrl+X` pour quitter.

> ⚠️ Utilisez une **clé dédiée** dans un workspace Anthropic avec un **plafond de dépense** : l'app est accessible par lien, donc n'importe qui avec le lien peut déclencher des appels facturés.

## 6. Lancer l'app avec systemd (démarrage auto + redémarrage)

```bash
sudo nano /etc/systemd/system/brevet.service
```

Collez (adaptez `User=` si vous n'êtes pas en root) :

```ini
[Unit]
Description=Revise ton Brevet
After=network.target

[Service]
Type=simple
User=root
WorkingDirectory=/var/www/brevet
EnvironmentFile=/var/www/brevet/.env
ExecStart=/usr/bin/node server/index.js
Restart=always
RestartSec=3

[Install]
WantedBy=multi-user.target
```

Activez :

```bash
sudo systemctl daemon-reload
sudo systemctl enable --now brevet
sudo systemctl status brevet      # doit être "active (running)"
curl http://127.0.0.1:3001/api/health   # {"ok":true,...}
```

## 7. Installer Caddy (reverse proxy + HTTPS auto)

```bash
sudo apt-get install -y debian-keyring debian-archive-keyring apt-transport-https curl
curl -1sLf 'https://dl.cloudsmith.io/public/caddy/stable/gpg.key' | sudo gpg --dearmor -o /usr/share/keyrings/caddy-stable-archive-keyring.gpg
curl -1sLf 'https://dl.cloudsmith.io/public/caddy/stable/debian.deb.txt' | sudo tee /etc/apt/sources.list.d/caddy-stable.list
sudo apt-get update && sudo apt-get install -y caddy
```

Configurez :

```bash
sudo nano /etc/caddy/Caddyfile
```

Remplacez tout le contenu par (avec votre domaine) :

```
revise.mondomaine.fr {
    reverse_proxy 127.0.0.1:3001
    encode gzip
}
```

Rechargez :

```bash
sudo systemctl reload caddy
```

Caddy obtient automatiquement un certificat HTTPS (Let's Encrypt) pour votre domaine.

## 8. Ouvrir le pare-feu (si UFW est actif)

```bash
sudo ufw allow 80
sudo ufw allow 443
sudo ufw allow OpenSSH
sudo ufw enable
```

## ✅ C'est en ligne

Ouvrez **https://revise.mondomaine.fr** — c'est le lien à partager.

---

## Mettre à jour l'app plus tard

Depuis votre Mac : `git push`. Puis sur le VPS :

```bash
cd /var/www/brevet
git pull
npm ci
npm run build
sudo systemctl restart brevet
```

## Dépannage

| Problème | Commande utile |
|---|---|
| Voir les logs de l'app | `sudo journalctl -u brevet -f` |
| Voir les logs de Caddy | `sudo journalctl -u caddy -f` |
| L'app ne répond pas | `sudo systemctl status brevet` |
| Erreur 502 (Caddy) | l'app Node est arrêtée → `sudo systemctl restart brevet` |
| Certificat HTTPS KO | vérifier que le DNS pointe bien vers le VPS (`ping votre-domaine`) |
