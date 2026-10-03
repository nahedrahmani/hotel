# 📸 Guide Visuel - Test d'Intégration

## 🎨 Interface TestIntegration

```
┌─────────────────────────────────────────────────────────────────┐
│  Test d'Intégration: Chambre-Service ↔ Stock-Service           │
├─────────────────────────────────────────────────────────────────┤
│                                                                 │
│  ┌───────────────────────────────────────────────────────────┐ │
│  │  Tests de Connexion                                       │ │
│  │                                                           │ │
│  │  [Test Direct Stock-Service] [Test Via Chambre-Service]  │ │
│  │  [Test Complet]                                           │ │
│  │                                                           │ │
│  │  ✓ Les deux services communiquent correctement !         │ │
│  └───────────────────────────────────────────────────────────┘ │
│                                                                 │
│  ┌──────────────────────────┐  ┌──────────────────────────┐   │
│  │ Stock-Service Direct     │  │ Via Chambre-Service      │   │
│  │ (Port 8081)              │  │ (Gateway 8080)           │   │
│  ├──────────────────────────┤  ├──────────────────────────┤   │
│  │ ID | Nom      | Prix     │  │ ID | Nom      | Prix     │   │
│  ├──────────────────────────┤  ├──────────────────────────┤   │
│  │ 1  | Savon    | 5.00€    │  │ 1  | Savon    | 5.00€    │   │
│  │ 2  | Serviette| 15.00€   │  │ 2  | Serviette| 15.00€   │   │
│  │ 3  | Shampoing| 8.00€    │  │ 3  | Shampoing| 8.00€    │   │
│  └──────────────────────────┘  └──────────────────────────┘   │
│                                                                 │
│  ┌───────────────────────────────────────────────────────────┐ │
│  │ Résultat de la Comparaison                                │ │
│  │ Direct: 3 produits | Via Chambre: 3 produits ✓ Identique │ │
│  └───────────────────────────────────────────────────────────┘ │
└─────────────────────────────────────────────────────────────────┘
```

## 🎨 Interface DiagnosticServices

```
┌─────────────────────────────────────────────────────────────────┐
│  🔍 Diagnostic des Services                                     │
├─────────────────────────────────────────────────────────────────┤
│                                                                 │
│  [Tester Tous les Services]                                    │
│                                                                 │
│  ┌───────────────────────────────────────────────────────────┐ │
│  │ Service          │ URL                    │ Statut │ Msg  │ │
│  ├───────────────────────────────────────────────────────────┤ │
│  │ Stock-Service    │ localhost:8081/...     │   ✓    │ OK   │ │
│  │ Chambre Gateway  │ localhost:8080/...     │   ✓    │ OK   │ │
│  │ Stock Inventaire │ localhost:8081/...     │   ✓    │ OK   │ │
│  │ Stock Alertes    │ localhost:8081/...     │   ✓    │ OK   │ │
│  └───────────────────────────────────────────────────────────┘ │
│                                                                 │
│  💡 Conseils de Dépannage:                                     │
│  • CORS Error: Ajoutez @CrossOrigin dans les controllers      │
│  • 404 Not Found: Vérifiez les routes et le Gateway           │
│  • Connection Refused: Le service n'est pas démarré           │
└─────────────────────────────────────────────────────────────────┘
```

## 🎨 Menu de Navigation (StockLayout)

```
┌─────────────────────────────────────────────────────────────────┐
│  [Dashboard] [Produits] [Mouvements] [🔧 Test Intégration]     │
└─────────────────────────────────────────────────────────────────┘
```

## 🎨 Interface TestSimple

```
┌─────────────────────────────────────────────┐
│  Test Rapide                                │
├─────────────────────────────────────────────┤
│                                             │
│  [Test Stock-Service Direct (8081)]        │
│                                             │
│  [Test Via Chambre-Service (8080)]         │
│                                             │
│  ┌─────────────────────────────────────┐   │
│  │ ✓ Stock Direct OK - 5 produits     │   │
│  └─────────────────────────────────────┘   │
└─────────────────────────────────────────────┘
```

## 📊 Flux de Test Visuel

```
┌──────────────┐
│   Frontend   │
│  (React)     │
└──────┬───────┘
       │
       ├─────────────────────────────────┐
       │                                 │
       ▼                                 ▼
┌──────────────┐              ┌──────────────────┐
│ Test Direct  │              │  Test Gateway    │
│   :8081      │              │     :8080        │
└──────┬───────┘              └────────┬─────────┘
       │                               │
       ▼                               ▼
┌──────────────┐              ┌──────────────────┐
│Stock-Service │              │ Chambre-Service  │
│              │              └────────┬─────────┘
└──────────────┘                       │
       ▲                               │
       │                               ▼
       └───────────────────────┌──────────────┐
                               │Stock-Service │
                               └──────────────┘
```

## 🎯 États des Tests

### ✅ Test Réussi
```
┌─────────────────────────────────────────┐
│ ✓ Les deux services communiquent       │
│   correctement !                        │
│                                         │
│ Direct: 5 produits                      │
│ Via Chambre: 5 produits                 │
│ ✓ Identique                             │
└─────────────────────────────────────────┘
```

### ⏳ Test En Cours
```
┌─────────────────────────────────────────┐
│ ⏳ Chargement...                        │
│                                         │
│ Test en cours d'exécution...            │
└─────────────────────────────────────────┘
```

### ❌ Test Échoué
```
┌─────────────────────────────────────────┐
│ ✗ Erreur chambre-service:              │
│   Network Error                         │
│                                         │
│ Le service n'est pas accessible         │
└─────────────────────────────────────────┘
```

## 🖥️ Terminal - Script PowerShell

```powershell
PS C:\Users\DOUAA\Desktop\hotel> .\test-endpoints.ps1

=== Test des Microservices ===

1. Test Stock-Service (Port 8081)...
   ✓ Stock-Service OK - 5 produits

2. Test Via Chambre-Service (Gateway 8080)...
   ✓ Chambre-Service OK - 5 produits

3. Test Inventaire Stock...
   ✓ Inventaire OK - 5 items

=== Tests Terminés ===
```

## 🖥️ Terminal - Démarrage Services

```batch
C:\Users\DOUAA\Desktop\hotel> start-all-services.bat

========================================
Demarrage des Microservices Hotel
========================================

[1/6] Demarrage Config Server (port 8888)...
[2/6] Demarrage Discovery Service (port 8761)...
[3/6] Demarrage Stock Service (port 8081)...
[4/6] Demarrage Chambre Service...
[5/6] Demarrage Gateway (port 8080)...
[6/6] Demarrage Frontend (port 5173)...

========================================
Tous les services sont en cours de demarrage !
========================================

Services:
- Config Server:     http://localhost:8888
- Eureka Dashboard:  http://localhost:8761
- Stock Service:     http://localhost:8081
- Gateway:           http://localhost:8080
- Frontend:          http://localhost:5173

Page de test: http://localhost:5173/dashboard/stock/test-integration
```

## 🌐 Eureka Dashboard

```
┌─────────────────────────────────────────────────────────┐
│  Eureka Dashboard - http://localhost:8761               │
├─────────────────────────────────────────────────────────┤
│                                                         │
│  Instances currently registered with Eureka:           │
│                                                         │
│  ✓ STOCK-SERVICE      - localhost:8081    UP          │
│  ✓ CHAMBRE-SERVICE    - localhost:????    UP          │
│  ✓ GATEWAY            - localhost:8080    UP          │
│                                                         │
└─────────────────────────────────────────────────────────┘
```

## 📱 Responsive Design

### Desktop
```
┌────────────────────────────────────────────────────────┐
│  [Dashboard] [Produits] [Mouvements] [Test]           │
├────────────────────────────────────────────────────────┤
│  ┌──────────────────┐  ┌──────────────────┐          │
│  │  Stock Direct    │  │  Via Chambre     │          │
│  │  [Tableau]       │  │  [Tableau]       │          │
│  └──────────────────┘  └──────────────────┘          │
└────────────────────────────────────────────────────────┘
```

### Mobile
```
┌──────────────────┐
│  ☰ Menu          │
├──────────────────┤
│  [Test Complet]  │
│                  │
│  Stock Direct    │
│  [Tableau]       │
│                  │
│  Via Chambre     │
│  [Tableau]       │
└──────────────────┘
```

## 🎨 Couleurs Utilisées

- **Bleu** (#89CFF0) - Navigation active
- **Vert** (#28a745) - Succès
- **Rouge** (#dc3545) - Erreur
- **Orange** (#FF6B6B) - Test Intégration
- **Gris** (#6c757d) - Inactif

## 📊 Données de Test Exemple

```json
[
  {
    "id": 1,
    "nom": "Savon",
    "categorie": "HYGIENE",
    "prixUnitaire": 5.00
  },
  {
    "id": 2,
    "nom": "Serviette",
    "categorie": "LINGE",
    "prixUnitaire": 15.00
  },
  {
    "id": 3,
    "nom": "Shampoing",
    "categorie": "HYGIENE",
    "prixUnitaire": 8.00
  }
]
```

## 🎯 Points d'Attention Visuels

1. **Badge de statut** - Vert (✓) ou Rouge (✗)
2. **Temps de réponse** - Affiché en millisecondes
3. **Nombre d'items** - Comparaison côte à côte
4. **Messages d'erreur** - En rouge avec détails
5. **Messages de succès** - En vert avec icône

## 🚀 Navigation Rapide

```
Home → Dashboard → Stock → Test Intégration
  ↓        ↓         ↓            ↓
  /    /dashboard  /stock  /test-integration
```

Voilà ! Vous avez maintenant une vue complète de l'interface utilisateur ! 🎨
