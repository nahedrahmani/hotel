// EXEMPLE DE CONFIGURATION DES ROUTES
// Copiez ce code dans votre fichier App.tsx ou routes.tsx

import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { 
  StockLayout, 
  StockDashboard, 
  GestionProduits, 
  MouvementsStock,
  TestIntegration,
  DiagnosticServices 
} from './pages/Stock';

// Exemple 1: Configuration Simple
function AppSimple() {
  return (
    <BrowserRouter>
      <Routes>
        {/* Routes Stock */}
        <Route path="/dashboard/stock" element={<StockLayout />}>
          <Route index element={<StockDashboard />} />
          <Route path="produits" element={<GestionProduits />} />
          <Route path="mouvements" element={<MouvementsStock />} />
          <Route path="test-integration" element={<TestIntegration />} />
          <Route path="diagnostic" element={<DiagnosticServices />} />
        </Route>
      </Routes>
    </BrowserRouter>
  );
}

// Exemple 2: Avec Routes Protégées
import PrivateRoute from './config/PrivateRoute';

function AppAvecAuth() {
  return (
    <BrowserRouter>
      <Routes>
        {/* Routes Stock Protégées */}
        <Route path="/dashboard/stock" element={<PrivateRoute><StockLayout /></PrivateRoute>}>
          <Route index element={<StockDashboard />} />
          <Route path="produits" element={<GestionProduits />} />
          <Route path="mouvements" element={<MouvementsStock />} />
          <Route path="test-integration" element={<TestIntegration />} />
          <Route path="diagnostic" element={<DiagnosticServices />} />
        </Route>
      </Routes>
    </BrowserRouter>
  );
}

// Exemple 3: Configuration Complète avec Lazy Loading
import { lazy, Suspense } from 'react';

const StockLayout = lazy(() => import('./pages/Stock/StockLayout'));
const StockDashboard = lazy(() => import('./pages/Stock/StockDashboard'));
const GestionProduits = lazy(() => import('./pages/Stock/GestionProduits'));
const MouvementsStock = lazy(() => import('./pages/Stock/MouvementsStock'));
const TestIntegration = lazy(() => import('./pages/Stock/TestIntegration'));
const DiagnosticServices = lazy(() => import('./pages/Stock/DiagnosticServices'));

function AppOptimise() {
  return (
    <BrowserRouter>
      <Suspense fallback={<div>Chargement...</div>}>
        <Routes>
          <Route path="/dashboard/stock" element={<StockLayout />}>
            <Route index element={<StockDashboard />} />
            <Route path="produits" element={<GestionProduits />} />
            <Route path="mouvements" element={<MouvementsStock />} />
            <Route path="test-integration" element={<TestIntegration />} />
            <Route path="diagnostic" element={<DiagnosticServices />} />
          </Route>
        </Routes>
      </Suspense>
    </BrowserRouter>
  );
}

// Exemple 4: Avec Layout Principal
import Layout from './layouts/layout';

function AppAvecLayout() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Layout />}>
          <Route path="dashboard/stock" element={<StockLayout />}>
            <Route index element={<StockDashboard />} />
            <Route path="produits" element={<GestionProduits />} />
            <Route path="mouvements" element={<MouvementsStock />} />
            <Route path="test-integration" element={<TestIntegration />} />
            <Route path="diagnostic" element={<DiagnosticServices />} />
          </Route>
        </Route>
      </Routes>
    </BrowserRouter>
  );
}

// Exemple 5: Configuration avec createBrowserRouter (React Router v6.4+)
import { createBrowserRouter, RouterProvider } from 'react-router-dom';

const router = createBrowserRouter([
  {
    path: '/dashboard/stock',
    element: <StockLayout />,
    children: [
      {
        index: true,
        element: <StockDashboard />,
      },
      {
        path: 'produits',
        element: <GestionProduits />,
      },
      {
        path: 'mouvements',
        element: <MouvementsStock />,
      },
      {
        path: 'test-integration',
        element: <TestIntegration />,
      },
      {
        path: 'diagnostic',
        element: <DiagnosticServices />,
      },
    ],
  },
]);

function AppModerne() {
  return <RouterProvider router={router} />;
}

// Export par défaut
export default AppSimple; // Choisissez la version qui vous convient

/* 
URLS DISPONIBLES APRÈS CONFIGURATION:

✓ http://localhost:5173/dashboard/stock
✓ http://localhost:5173/dashboard/stock/produits
✓ http://localhost:5173/dashboard/stock/mouvements
✓ http://localhost:5173/dashboard/stock/test-integration  ← TEST INTEGRATION
✓ http://localhost:5173/dashboard/stock/diagnostic        ← DIAGNOSTIC
*/
