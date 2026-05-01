// ================================================================
// ⚙️  MAROUA JEWELRY — CONFIG DYNAMIQUE
// Les produits sont chargés depuis /data/products.json
// Ce fichier est généré par n8n W1 (Sync Produits)
// ================================================================

const CONFIG = {
  WHATSAPP_NUMBER: "212600000000",
  SHIPPING_FEE: 35,
  N8N_WEBHOOK_URL: "http://localhost:5678/webhook-test/commande",        // ← Renseigner après déploiement n8n
  PRODUCTS_JSON_URL: "/data/products.json",
};

// -------------------------------------------------------
// 🔄 Chargement dynamique des produits
// -------------------------------------------------------
let PRODUCTS = [];

async function loadProducts() {
  try {
    const res = await fetch(CONFIG.PRODUCTS_JSON_URL + "?t=" + Date.now());
    if (!res.ok) throw new Error("HTTP " + res.status);
    const data = await res.json();
    PRODUCTS = data.products.filter(p => p.actif !== false);
    console.log("✅ Produits chargés :", PRODUCTS.length);
    return PRODUCTS;
  } catch (err) {
    console.error("❌ Erreur chargement produits :", err);
    // Fallback : produits vides, le site affiche un message
    PRODUCTS = [];
    return [];
  }
}

// -------------------------------------------------------
// 🛡️ Helpers stock
// -------------------------------------------------------

/**
 * Retourne true si le produit est en stock
 */
function isInStock(product) {
  return product.stock > 0;
}

/**
 * Retourne le label de stock pour l'affichage
 */
function getStockLabel(product) {
  if (product.stock <= 0) return { text: "Rupture de stock", class: "stock-out" };
  if (product.stock <= 3) return { text: `Plus que ${product.stock}`, class: "stock-low" };
  return null; // Stock normal → rien à afficher
}
