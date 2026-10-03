# Guide de Test d'Intégration Chambre-Service ↔ Stock-Service

## 📋 Prérequis

Assurez-vous que les services suivants sont démarrés:

1. **Stock-Service** - Port 8081
2. **Chambre-Service** - Port (vérifier application.yml)
3. **Gateway** - Port 8080
4. **Discovery Service** (Eureka)
5. **Config Server** - Port 8888

## 🚀 Accès à la Page de Test

1. Démarrez votre frontend: `npm run dev`
2. Naviguez vers: `/dashboard/stock/test-integration`
3. Ou cliquez sur "🔧 Test Intégration" dans le menu Stock

## 🧪 Tests Disponibles

### 1. Test Direct Stock-Service
- **Endpoint**: `http://localhost:8081/api/stock/produits`
- **Description**: Teste la connexion directe au stock-service
- **Bouton**: "Test Direct Stock-Service"

### 2. Test Via Chambre-Service
- **Endpoint**: `http://localhost:8080/api/chambre/stock/produits`
- **Description**: Teste la communication chambre-service → stock-service via Gateway
- **Bouton**: "Test Via Chambre-Service"

### 3. Test Complet
- **Description**: Exécute les deux tests simultanément et compare les résultats
- **Bouton**: "Test Complet"

## ✅ Résultats Attendus

Si tout fonctionne correctement:
- ✓ Les deux colonnes affichent les mêmes produits
- ✓ Le nombre de produits est identique
- ✓ Message de succès en vert

## ❌ Problèmes Courants

### Erreur CORS
```
Access to XMLHttpRequest has been blocked by CORS policy
```
**Solution**: Vérifiez que `@CrossOrigin(origins = "*")` est présent dans les controllers

### Erreur 404
```
Cannot GET /api/chambre/stock/produits
```
**Solution**: Vérifiez que le StockIntegrationController est bien configuré dans chambre-service

### Erreur de connexion
```
Network Error
```
**Solution**: Vérifiez que tous les services sont démarrés

## 🔧 Configuration

### Stock-Service (Port 8081)
```yaml
server:
  port: 8081
```

### Chambre-Service
Doit avoir un RestTemplate ou WebClient configuré pour appeler stock-service

### Gateway (Port 8080)
Doit router les requêtes vers les bons services

## 📊 Architecture Testée

```
Frontend (React)
    ↓
    ├─→ Direct: http://localhost:8081/api/stock/produits
    │
    └─→ Via Gateway: http://localhost:8080/api/chambre/stock/produits
            ↓
        Chambre-Service
            ↓
        Stock-Service
```

## 🎯 Endpoints Testés

### Stock-Service Direct
- GET `/api/stock/produits` - Liste tous les produits
- GET `/api/stock/produits/{id}` - Détails d'un produit
- GET `/api/stock/inventaire` - Inventaire complet

### Via Chambre-Service
- GET `/api/chambre/stock/produits` - Liste tous les produits (proxy)
- GET `/api/chambre/stock/produits/{id}` - Détails d'un produit (proxy)
- GET `/api/chambre/stock/produits/categorie/{categorie}` - Par catégorie (proxy)
