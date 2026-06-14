# Déploiement sur un VPS (Ubuntu/Debian)

Architecture cible : **Caddy** (HTTPS automatique) en façade → **app Node** (port 3001, en local) gérée par **systemd**.

```
Internet → Caddy (443, HTTPS) → 127.0.0.1:3001 (Node) → API Claude
```

> Domaine : **brevet.hacquin.net** · VPS : **151.80.235.190** (OVH). Remplacez `URL_DU_DEPOT.git` par l'URL de votre dépôt Git.

---

## 0. Pré-requis : le domaine (DNS chez OVH)

Dans l'espace OVH → Noms de domaine → **hacquin.net** → **Zone DNS** → **Ajouter une entrée** :

| Type | Sous-domaine | Cible |
|------|--------------|-------|
| A | `brevet` | `151.80.235.190` |

Attendez quelques minutes que ça se propage. Vérifiez : `dig +short A brevet.hacquin.net` doit renvoyer `151.80.235.190`.

---

## 1. Se connecter au VPS

```bash
ssh root@151.80.235.190        # ou votre utilisateur habituel
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

## 7. Ajouter un virtual host dans nginx (déjà installé)

> Ce VPS fait déjà tourner **nginx** avec d'autres sites. On ajoute simplement un
> nouveau site pour `brevet.hacquin.net` — sans toucher à l'existant.

Créez le fichier de configuration :

```bash
sudo nano /etc/nginx/sites-available/brevet.hacquin.net
```

Collez :

```nginx
server {
    listen 80;
    listen [::]:80;
    server_name brevet.hacquin.net;

    location / {
        proxy_pass http://127.0.0.1:3001;
        proxy_http_version 1.1;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }
}
```

Activez le site et rechargez nginx :

```bash
sudo ln -s /etc/nginx/sites-available/brevet.hacquin.net /etc/nginx/sites-enabled/
sudo nginx -t          # vérifie la config (doit dire "syntax is ok" / "test is successful")
sudo systemctl reload nginx
```

À ce stade, **http://brevet.hacquin.net** doit déjà afficher l'app (en HTTP).

## 8. Activer le HTTPS (Let's Encrypt via certbot)

```bash
sudo apt-get install -y certbot python3-certbot-nginx
sudo certbot --nginx -d brevet.hacquin.net
```

Certbot demande un email, fait accepter les conditions, obtient le certificat et
**modifie tout seul** le virtual host pour ajouter le HTTPS + la redirection
HTTP→HTTPS. Choisissez l'option de redirection quand il la propose.

Le renouvellement est automatique (timer systemd `certbot.timer`).

## ✅ C'est en ligne

Ouvrez **https://brevet.hacquin.net** — c'est le lien à partager. Ton site existant
sur le VPS continue de fonctionner normalement à côté.

## Pare-feu

Les ports 80/443 sont déjà ouverts (nginx tourne déjà), donc rien à changer.
Si UFW est actif, vérifiez juste que « Nginx Full » est autorisé :

```bash
sudo ufw status
sudo ufw allow 'Nginx Full'   # si besoin
```

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
