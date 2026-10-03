import { BrowserRouter, Routes, Route } from 'react-router-dom';
import Dashboard from './pages/Dashboard';
import Login from './pages/Login';
import Home from './pages/Home/Home';
import PrivateRoute from './config/PrivateRoute';
import RentalListings from './pages/hebergement/RentalListings';
import MaisonDhoteDetails from './pages/hebergement/MaisonDhoteDetails';

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/login" element={<Login />} />
        <Route path="/hebergement" element={<RentalListings />} />
        <Route path="/hebergement/:id" element={<MaisonDhoteDetails />} />
        <Route path="/dashboard/*" element={<PrivateRoute><Dashboard /></PrivateRoute>} />
      </Routes>
    </BrowserRouter>
  );
}
