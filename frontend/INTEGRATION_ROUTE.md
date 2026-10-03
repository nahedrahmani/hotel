# Configuration de la Route Test Intégration

## 📝 Ajout de la Route dans votre Application

Ajoutez cette route dans votre fichier de configuration des routes (généralement `App.tsx` ou un fichier de routes dédié):

```tsx
import { TestIntegration } from './pages/Stock';

// Dans votre configuration de routes:
{
  path: '/dashboard/stock',
  element: <StockLayout />,
  children: [
    { index: true, element: <StockDashboard /> },
    { path: 'produits', element: <GestionProduits /> },
    { path: 'mouvements', element: <MouvementsStock /> },
    { path: 'test-integration', element: <TestIntegration /> }, // ← Nouvelle route
  ]
}
```

## 🎯 Exemple Complet avec React Router v6

```tsx
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { 
  StockLayout, 
  StockDashboard, 
  GestionProduits, 
  MouvementsStock,
  TestIntegration 
} from './pages/Stock';

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/dashboard/stock" element={<StockLayout />}>
          <Route index element={<StockDashboard />} />
          <Route path="produits" element={<GestionProduits />} />
          <Route path="mouvements" element={<MouvementsStock />} />
          <Route path="test-integration" element={<TestIntegration />} />
        </Route>
      </Routes>
    </BrowserRouter>
  );
}
```

## 🔗 URLs Disponibles

Après configuration, vous pourrez accéder à:

- `/dashboard/stock` - Dashboard principal
- `/dashboard/stock/produits` - Gestion des produits
- `/dashboard/stock/mouvements` - Mouvements de stock
- `/dashboard/stock/test-integration` - **Page de test d'intégration** ✨

## 🚀 Utilisation Rapide

Si vous voulez tester rapidement sans configurer de route:

```tsx
// Dans n'importe quel composant
import TestSimple from './pages/Stock/TestSimple';

function MonComposant() {
  return <TestSimple />;
}
```

## 🔧 Test depuis la Console du Navigateur

Vous pouvez aussi tester directement depuis la console:

```javascript
// Test Stock-Service Direct
fetch('http://localhost:8081/api/stock/produits')
  .then(r => r.json())
  .then(d => console.log('Stock Direct:', d));

// Test Via Chambre-Service
fetch('http://localhost:8080/api/chambre/stock/produits')
  .then(r => r.json())
  .then(d => console.log('Via Chambre:', d));
```

## 📦 Composants Créés

1. **TestIntegration.tsx** - Page complète avec interface UI
2. **TestSimple.tsx** - Version minimaliste pour tests rapides
3. **StockLayout.tsx** - Mis à jour avec le lien de navigation

## ✅ Vérification

Pour vérifier que tout fonctionne:

1. Démarrez vos services backend
2. Lancez le frontend: `npm run dev`
3. Naviguez vers `/dashboard/stock/test-integration`
4. Cliquez sur "Test Complet"
5. Vérifiez que les deux colonnes affichent les mêmes données
