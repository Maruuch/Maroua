# Maroua Jewelry — Guide de déploiement complet

## Stack
- **Frontend** : HTML/CSS/JS + React CDN → Vercel
- **Repo** : GitHub
- **Back-office** : Notion (5 tables)
- **Orchestration** : n8n (5 workflows)
- **Images** : GitHub `/images/`

---

## Structure du repo

```
maroua-jewelry/
├── index.html
├── vercel.json
├── .gitignore
├── .env.example
├── data/
│   └── products.json          ← Généré automatiquement par n8n W1
├── images/
│   ├── 1.jpg                  ← Nommées par ID produit
│   ├── 2.jpg
│   └── ...
├── css/
│   └── styles.css
├── js/
│   ├── config.js              ← Chargement dynamique products.json
│   ├── store.js
│   ├── components.js
│   ├── pages.js
│   ├── cart.js
│   ├── checkout.js
│   ├── api.js
│   ├── animations.js
│   ├── toast.js
│   ├── drawer.js
│   └── app.js
├── n8n/
│   ├── W1-sync-produits.json
│   ├── W2-commande.json
│   ├── W3-statut.json
│   ├── W4-reconciliation.json
│   └── W5-erreurs.json
└── notion-setup/
    └── NOTION_SETUP.md
```

---

## Étape 1 — GitHub

```bash
# Créer le repo sur github.com (public ou private)
# Puis localement :
git init
git remote add origin https://github.com/VOTRE_USERNAME/maroua-jewelry.git
git add .
git commit -m "init: Maroua Jewelry"
git push -u origin main
```

**Créer un token GitHub :**
1. github.com → Settings → Developer settings → Personal access tokens → Tokens (classic)
2. Permissions : `repo` (tout cocher)
3. Copier le token → renseigner dans `.env` sous `GITHUB_TOKEN`

---

## Étape 2 — Notion

Suivre le guide complet : `notion-setup/NOTION_SETUP.md`

Ordre obligatoire :
1. Créer les 5 tables
2. Récupérer les 5 IDs de bases
3. Créer l'integration token
4. Inviter l'intégration sur chaque base

---

## Étape 3 — Vercel

1. Aller sur vercel.com → New Project
2. Importer le repo GitHub `maroua-jewelry`
3. **Framework Preset** : Other
4. **Build Command** : *(laisser vide)*
5. **Output Directory** : `.`
6. Deploy

**Domaine custom (optionnel) :**
- Vercel → Project Settings → Domains
- Ajouter `marouajewelry.ma`
- Configurer les DNS chez votre registrar

---

## Étape 4 — n8n

### Installation n8n cloud (recommandé)
1. app.n8n.cloud → Créer un compte
2. Créer un workflow → Import from JSON
3. Importer dans l'ordre : W1, W2, W3, W4, W5

### Variables d'environnement n8n
Dans n8n → Settings → Variables, ajouter toutes les variables de `.env.example`

### Credentials n8n
- **Notion** : Settings → Credentials → New → Notion API → coller `NOTION_TOKEN`
- **GitHub** : New → HTTP Header Auth → `Authorization: token GITHUB_TOKEN`
- **Email** : New → SMTP → renseigner host/port/user/pass

### Activer les workflows
- Activer W1, W2, W3, W4, W5 (toggle ON)
- Noter les URLs des webhooks pour chaque workflow

### Renseigner les webhooks dans config.js
```javascript
const CONFIG = {
  N8N_WEBHOOK_URL: "https://votre-n8n.app.n8n.cloud/webhook/commande",
  // ...
};
```

---

## Étape 5 — Premier produit

```
1. Ajouter /images/1.jpg sur GitHub (commit + push)
2. Dans Notion table PRODUITS : ajouter une ligne
   - id_num : 1
   - nom : Collier ÉLÉGANCE
   - prix_public : 149
   - stock_initial : 10
   - stock_publie : 10
   - visible_site : ✅
   - ordre_affichage : 1
3. Appeler le webhook W1 : POST https://...n8n.../webhook/sync-produits
4. Attendre ~10 secondes
5. Vérifier que /data/products.json est mis à jour sur GitHub
6. Vercel redéploie automatiquement (~30s)
7. Le produit est visible sur le site ✅
```

---

## Flux d'ajout produit (routine)

```
Ajouter photo → /images/{id}.jpg  (commit GitHub)
         +
Ajouter ligne Notion PRODUITS     (id_num, nom, prix, stock, visible=✅)
         +
Déclencher W1                     (webhook ou attendre 1h)
         ↓
products.json mis à jour → Vercel redéploie → Produit live ✅
```

---

## Calcul stock

```
stock_publie = stock_initial − Σ(qty des LIGNES_COMMANDE 
               dont la COMMANDE a statut Confirme ou Expedie)
```

- **W2** décrémente à chaque nouvelle commande
- **W4** recalcule tout toutes les 6h (filet de sécurité)
- **stock_publie = 0** → produit toujours visible mais bouton désactivé

---

## Webhooks n8n (à noter après déploiement)

| Workflow | URL |
|---|---|
| W1 Sync produits | `POST .../webhook/sync-produits` |
| W2 Commande | `POST .../webhook/commande` |
| W3 Statut | `POST .../webhook/statut-commande` |
| W4 Réconciliation | `POST .../webhook/reconciliation-stock` |
| W5 Erreurs | `POST .../webhook/erreur` |

---

## Payload W2 (référence)

```json
{
  "nom": "Fatima Zahra El Amrani",
  "telephone": "0612345678",
  "email": "fatima@email.com",
  "adresse": "12 Rue des Fleurs, Appt 3",
  "ville": "Casablanca",
  "code_postal": "20000",
  "note": "Gravure : Fatima",
  "articles": [
    { "id": 1, "qty": 1 },
    { "id": 3, "qty": 1 }
  ]
}
```

---

## Checklist avant mise en production

- [ ] Repo GitHub créé et code pushé
- [ ] Toutes les tables Notion créées avec les bons champs
- [ ] Integration Notion créée et invitée sur chaque table
- [ ] IDs des 5 bases Notion récupérés
- [ ] Token GitHub créé
- [ ] n8n déployé avec tous les credentials
- [ ] 5 workflows importés et activés
- [ ] URLs des webhooks renseignées dans config.js
- [ ] Vercel connecté au repo GitHub
- [ ] vercel.json présent dans le repo
- [ ] Test commande de bout en bout ✅
- [ ] Test W4 réconciliation ✅
