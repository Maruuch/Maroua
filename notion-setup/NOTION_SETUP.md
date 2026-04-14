# Notion — Guide de setup complet
## Maroua Jewelry — 5 tables à créer

---

## ⚠️ Ordre de création obligatoire

1. PRODUITS
2. CLIENTS
3. COMMANDES
4. LIGNES_COMMANDE
5. PRODUIT_IMAGES

Les relations entre tables imposent cet ordre.

---

## TABLE 1 — PRODUITS

**Nom de la base :** `Maroua/PRODUITS`

| Champ | Type Notion | Valeurs / Notes |
|---|---|---|
| `nom` | **Title** | Nom du produit |
| `id_num` | Number | Format : Nombre entier. ID unique = nom du fichier image |
| `sku` | Text | Ex: COL-ELE-001 |
| `slug` | Text | Ex: collier-elegance (URL-friendly) |
| `type` | Select | collier / bracelet / bague / pack / autre |
| `etat` | Select | Neuf / Occasion / Personnalisable |
| `description_courte` | Text | 1 phrase max |
| `description_longue` | Text | Description complète |
| `prix_public` | Number | Format : MAD (nombre) |
| `stock_initial` | Number | Quantité mise en vente à l'origine |
| `stock_publie` | Number | ⚠️ Mis à jour par n8n — ne pas modifier manuellement |
| `actif_backoffice` | Checkbox | Géré par l'admin |
| `visible_site` | Checkbox | ✅ = affiché sur le site (piloté par n8n si stock=0) |
| `variant_group_id` | Text | Même valeur pour variantes d'un même produit |
| `ordre_affichage` | Number | Ordre sur le site (1 = premier) |
| `tag` | Select | Bestseller / Personnalisable / Offre spéciale / Nouveau |
| `sym` | Text | Symbole décoratif : ◈ ⟡ ◇ ◆ |

**Après création :** noter l'ID de la base (URL Notion → partie après le dernier `/` avant le `?`)

---

## TABLE 2 — CLIENTS

**Nom de la base :** `Maroua/CLIENTS`

| Champ | Type Notion | Notes |
|---|---|---|
| `nom` | **Title** | Prénom + Nom |
| `telephone` | Phone | Format international : +212XXXXXXXXX |
| `telephone_normalise` | Text | Utilisé pour l'upsert (dédoublonnage) par n8n |
| `email` | Email | Optionnel |
| `ville` | Text | |
| `adresse` | Text | Adresse complète |
| `nb_commandes` | Rollup | → Relation : COMMANDES / Champ : ref_public / Calcul : Count |
| `total_achats` | Rollup | → Relation : COMMANDES / Champ : total_recalcule / Calcul : Sum |

**Note rollups :** À configurer après avoir créé la table COMMANDES et la relation client.

---

## TABLE 3 — COMMANDES

**Nom de la base :** `Maroua/COMMANDES`

| Champ | Type Notion | Notes |
|---|---|---|
| `ref_public` | **Title** | Ex: MAR-481923 — généré par n8n |
| `order_uid` | Text | UUID v4 généré par n8n — identifiant interne unique |
| `idempotency_key` | Text | Hash SHA-256 du payload — évite les doublons |
| `statut` | Select | Confirme / Expedie / Archive / Erreur |
| `total_recalcule` | Number | Total recalculé par n8n (pas celui du frontend) |
| `client` | **Relation → CLIENTS** | Sélectionner la table CLIENTS |
| `created_at` | Date | Include time : ✅ |
| `note_client` | Text | Note laissée par le client (gravure, etc.) |
| `ville_livraison` | Text | Copiée depuis le formulaire |
| `adresse_livraison` | Text | Copiée depuis le formulaire |

**Couleurs des statuts :**
- Confirme → 🟡 Jaune
- Expedie → 🟢 Vert
- Archive → ⚫ Gris
- Erreur → 🔴 Rouge

---

## TABLE 4 — LIGNES_COMMANDE

**Nom de la base :** `Maroua/LIGNES_COMMANDE`

| Champ | Type Notion | Notes |
|---|---|---|
| `line_uid` | **Title** | UUID généré par n8n — Ex: LINE-481923-1 |
| `commande` | **Relation → COMMANDES** | Sélectionner la table COMMANDES |
| `produit` | **Relation → PRODUITS** | Sélectionner la table PRODUITS |
| `qty` | Number | Quantité commandée |
| `prix_unitaire_snapshot` | Number | Prix au moment de la commande (figé) |
| `sous_total` | Formula | `prop("qty") * prop("prix_unitaire_snapshot")` |

---

## TABLE 5 — PRODUIT_IMAGES

**Nom de la base :** `Maroua/PRODUIT_IMAGES`

| Champ | Type Notion | Notes |
|---|---|---|
| `image_id` | **Title** | Ex: 1-a, 1-b, 2-a... |
| `produit` | **Relation → PRODUITS** | |
| `github_path` | Text | Ex: /images/1.jpg |
| `ordre` | Number | 1 = image principale |
| `alt_text` | Text | Description pour accessibilité |

---

## IDs des bases à récupérer

Après création, aller dans chaque base Notion et copier l'ID depuis l'URL :

```
https://notion.so/workspace/NOM-DATABASE-[ID_ICI]?v=...
```

Renseigner dans n8n (variables d'environnement ou credentials) :

```
NOTION_PRODUITS_DB_ID     = xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx
NOTION_CLIENTS_DB_ID      = xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx
NOTION_COMMANDES_DB_ID    = xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx
NOTION_LIGNES_DB_ID       = xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx
NOTION_IMAGES_DB_ID       = xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx
```

---

## Integration Token Notion

1. Aller sur https://www.notion.so/my-integrations
2. Créer une intégration "Maroua Jewelry n8n"
3. Copier le token (commence par `secret_...`)
4. Sur chaque base Notion → **Share** → inviter l'intégration

```
NOTION_TOKEN = secret_xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx
```

---

## Vues recommandées par table

### PRODUITS
- **Vue "Catalogue actif"** : Filtre `visible_site = true` + Tri `ordre_affichage` ASC
- **Vue "Stock bas"** : Filtre `stock_publie <= 3`
- **Vue "Toutes les variantes"** : Grouper par `variant_group_id`

### COMMANDES
- **Vue "À expédier"** : Filtre `statut = Confirme` + Tri `created_at` ASC
- **Vue "Aujourd'hui"** : Filtre `created_at = Today`
- **Vue "Kanban"** : Type Board + Grouper par `statut`

### CLIENTS
- **Vue "Top clients"** : Tri `total_achats` DESC

