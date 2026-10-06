// src/pages/Dashboard/index.tsx
import React from "react";
import { Routes, Route, Navigate, Link, useLocation } from "react-router-dom";
import { canOpen, isStaff } from "../config/access";
import Layout from "./../layouts/layout.tsx";
import { CalendarPage } from '../calendar';
import { MessagesPage } from '../MessagesPage';
import StockDashboard from "./Stock/StockDashboard.tsx";
import GestionProduits from "./Stock/GestionProduits.tsx";
import MouvementsStock from "./Stock/MouvementsStock.tsx";
import ChambreStockManager from "./Stock/ChambreStockManager.tsx";
import ReservationsPage from "./reservations/ReservationsPage.tsx";
import OccupancyPage from "./reservations/OccupancyPage.tsx";
import MyReservationsPage from "./reservations/MyReservationsPage.tsx";
import SimulatedPaymentPage from "./payment/SimulatedPaymentPage.tsx";
import HousekeepingPage from "./reservations/HousekeepingPage.tsx";
import ChambresPage from "./reservations/ChambresPage.tsx";
import AnalyticsPage from "./analytics/AnalyticsPage.tsx";
import BookingPage from "./booking/BookingPage.tsx";
import ClientsPage from "./clients/ClientsPage.tsx";
import DemandesPage from "./clients/DemandesPage.tsx";
import CheckInOutPage from "./clients/CheckInOutPage.tsx";
import PersonnelPage from "./rh/PersonnelPage.tsx";
import PlanningPage from "./rh/PlanningPage.tsx";
import PointagePage from "./rh/PointagePage.tsx";
import TachesPage from "./rh/TachesPage.tsx";
import CongesPage from "./rh/CongesPage.tsx";
import FacturesPage from "./payment/FacturesPage.tsx";
import RapportsPage from "./payment/RapportsPage.tsx";
import ProfilePage from "./profil/ProfilePage.tsx";

const AccesRefuse: React.FC = () => (
    <div className="container-fluid p-4">
        <div className="alert alert-warning mb-3">
            Cette page est réservée au personnel de l'hôtel. Votre compte n'a pas les droits nécessaires.
        </div>
        <Link to="/dashboard" className="btn btn-dark">Retour à mon espace</Link>
    </div>
);

const Dashboard: React.FC = () => {
    const { pathname } = useLocation();
    const home = isStaff() ? "reservations" : "mes-reservations";

    // Same rules as the menu: a page the user's roles can't load is never rendered
    if (!canOpen(pathname)) {
        return <Layout><AccesRefuse /></Layout>;
    }

    return (
        <Layout>
            <Routes>
                {/* /dashboard itself: staff land on reservations, clients on their own bookings */}
                <Route index element={<Navigate to={home} replace />} />
                <Route path="calendar" element={<CalendarPage />} />
                <Route path="messages" element={<MessagesPage />} />
                <Route path="reservations" element={<ReservationsPage />} />
                <Route path="occupation" element={<OccupancyPage />} />
                <Route path="mes-reservations" element={<MyReservationsPage />} />
                <Route path="paiement-simulation" element={<SimulatedPaymentPage />} />
                <Route path="menage" element={<HousekeepingPage />} />
                <Route path="chambres" element={<ChambresPage />} />
                <Route path="analytique" element={<AnalyticsPage />} />
                <Route path="reserver" element={<BookingPage />} />
                {/* Clients */}
                <Route path="clients" element={<ClientsPage />} />
                <Route path="demandes" element={<DemandesPage />} />
                <Route path="checkinout" element={<CheckInOutPage />} />
                {/* Stock */}
                <Route path="stock" element={<StockDashboard />} />
                <Route path="stock/produits" element={<GestionProduits />} />
                <Route path="stock/mouvements" element={<MouvementsStock />} />
                <Route path="stock/chambre-manager" element={<ChambreStockManager />} />
                {/* RH */}
                <Route path="rh/personnel" element={<PersonnelPage />} />
                <Route path="rh/planning" element={<PlanningPage />} />
                <Route path="rh/pointage" element={<PointagePage />} />
                <Route path="tasks" element={<TachesPage />} />
                <Route path="rh/conges" element={<CongesPage />} />
                {/* Paiement */}
                <Route path="payment/factures" element={<FacturesPage />} />
                <Route path="payment/rapports" element={<RapportsPage />} />
                <Route path="profil" element={<ProfilePage />} />
            </Routes>
        </Layout>
    );
};

export default Dashboard;
