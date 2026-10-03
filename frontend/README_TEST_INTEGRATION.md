# 🧪 Test d'Intégration Chambre-Service ↔ Stock-Service

## 🎯 Objectif

Tester la communication entre les microservices `chambre-service` et `stock-service` depuis le frontend React.

## 📦 Composants Créés

### 1. TestIntegration.tsx
**Page complète de test avec interface utilisateur**
- ✅ Test direct vers stock-service (port 8081)
- ✅ Test via chambre-service/gateway (port 8080)
- ✅ Comparaison des résultats
- ✅ Affichage en tableaux côte à côte

### 2. TestSimple.tsx
**Version minimaliste pour tests rapides**
- 2 boutons de test
- Affichage simple du résultat

### 3. DiagnosticServices.tsx
**Diagnostic complet de tous les services**
- Test de multiples endpoints
- Mesure du temps de réponse
- Conseils de dépannage intégrés

## 🚀 Installation

### Étape 1: Les fichiers sont déjà créés ✅

```
src/pages/Stock/
├── TestIntegration.tsx      ✅
├── TestSimple.tsx            ✅
├── DiagnosticServices.tsx    ✅
├── StockLayout.tsx           ✅ (mis à jour)
└── index.ts                  ✅ (mis à jour)
```

### Étape 2: Ajouter la route

Ouvrez votre fichier de routes et ajoutez:

```tsx
import { TestIntegration } from './pages/Stock';

// Dans vos routes:
<Route path="/dashboard/stock/test-integration" element={<TestIntegration />} />
```

Voir `EXEMPLE_ROUTES.tsx` pour des exemples complets.

### Étape 3: Démarrer les services

```bash
# 1. Config Server (port 8888)
cd service/config-server && mvn spring-boot:run

# 2. Discovery Service (port 8761)
cd service/discovery-service && mvn spring-boot:run

# 3. Stock Service (port 8081)
cd service/stock-service && mvn spring-boot:run

# 4. Chambre Service
cd service/chambre-service && mvn spring-boot:run

# 5. Gateway (port 8080)
cd service/Gateway && mvn spring-boot:run

# 6. Frontend
cd front/tourism && npm run dev
```

## 🎮 Utilisation

### Option 1: Interface Web (Recommandé)

1. Ouvrez: `http://localhost:5173/dashboard/stock/test-integration`
2. Cliquez sur "Test Complet"
3. Vérifiez que les deux colonnes affichent les mêmes données

### Option 2: Menu de Navigation

1. Allez sur `/dashboard/stock`
2. Cliquez sur "🔧 Test Intégration" dans le menu
3. Lancez les tests

### Option 3: Script PowerShell

```powershell
cd C:\Users\DOUAA\Desktop\hotel
.\test-endpoints.ps1
```

### Option 4: Console du Navigateur

```javascript
// Test rapide
fetch('http://localhost:8081/api/stock/produits')
  .then(r => r.json())
  .then(d => console.log('Produits:', d));
```

## ✅ Résultat Attendu

```
✓ Connexion directe stock-service OK
✓ Connexion chambre-service → stock-service OK
✓ Les deux services communiquent correctement !

Direct: 5 produits | Via Chambre: 5 produits ✓ Identique
```

## ❌ Dépannage

### Erreur CORS
```
Access to XMLHttpRequest has been blocked by CORS policy
```
**Solution:** Ajoutez dans vos controllers:
```java
@CrossOrigin(origins = "*")
```

### Service Non Accessible
```
Network Error / ERR_CONNECTION_REFUSED
```
**Solution:** Vérifiez que le service est démarré sur le bon port

### 404 Not Found
```
Cannot GET /api/chambre/stock/produits
```
**Solution:** Vérifiez que `StockIntegrationController` existe dans chambre-service

### Gateway Non Configuré
```
No instances available for stock-service
```
**Solution:** Vérifiez Eureka Dashboard (`http://localhost:8761`)

## 📊 Architecture Testée

```
Frontend (React)
    ↓
    ├─→ http://localhost:8081/api/stock/produits (Direct)
    │
    └─→ http://localhost:8080/api/chambre/stock/produits (Via Gateway)
            ↓
        Chambre-Service
            ↓
        Stock-Service
```

## 🔗 Endpoints Testés

| Endpoint | Port | Service | Description |
|----------|------|---------|-------------|
| `/api/stock/produits` | 8081 | Stock | Liste des produits |
| `/api/chambre/stock/produits` | 8080 | Gateway → Chambre → Stock | Proxy |
| `/api/stock/inventaire` | 8081 | Stock | État du stock |
| `/api/stock/alertes` | 8081 | Stock | Alertes rupture |

## 📚 Documentation Complète

- `TEST_INTEGRATION.md` - Guide d'utilisation détaillé
- `INTEGRATION_ROUTE.md` - Configuration des routes
- `GUIDE_TEST_COMPLET.md` - Guide complet avec architecture
- `EXEMPLE_ROUTES.tsx` - Exemples de configuration

## 🎯 Checklist

- [ ] Tous les services backend sont démarrés
- [ ] Services enregistrés dans Eureka (http://localhost:8761)
- [ ] Frontend démarré (http://localhost:5173)
- [ ] Route `/dashboard/stock/test-integration` configurée
- [ ] Test direct stock-service fonctionne
- [ ] Test via chambre-service fonctionne
- [ ] Les données sont identiques

## 💡 Conseils

1. **Testez d'abord avec Postman/curl** pour isoler les problèmes backend
2. **Vérifiez Eureka Dashboard** pour voir si les services sont enregistrés
3. **Consultez les logs** des services en cas d'erreur
4. **Utilisez DiagnosticServices** pour un diagnostic complet
5. **Testez les endpoints un par un** avant le test complet

## 🎉 Succès !

Si tous les tests passent, félicitations ! Votre architecture microservices fonctionne correctement.

Les deux services communiquent via le Gateway et les données sont cohérentes entre:
- L'accès direct au stock-service
- L'accès via chambre-service qui appelle stock-service

Vous pouvez maintenant développer d'autres fonctionnalités en toute confiance ! 🚀
