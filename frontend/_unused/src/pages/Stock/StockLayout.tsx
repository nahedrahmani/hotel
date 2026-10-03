import { NavLink, Outlet } from 'react-router-dom';
import './Stock.css';

export default function StockLayout() {
  return (
    <div>
      <div className="bg-white shadow-sm mb-4">
        <div className="container-fluid px-4">
          <ul className="nav nav-pills py-3">
            <li className="nav-item">
              <NavLink
                to="/dashboard/stock"
                end
                className={({ isActive }) =>
                  `nav-link fw-semibold ${isActive ? 'active' : ''}`
                }
                style={({ isActive }) => ({
                  background: isActive ? 'linear-gradient(135deg, #89CFF0 0%, #6BB6D6 100%)' : 'transparent',
                  color: isActive ? 'white' : '#495057',
                  borderRadius: '8px',
                  marginRight: '0.5rem'
                })}
              >
                Dashboard
              </NavLink>
            </li>
            <li className="nav-item">
              <NavLink
                to="/dashboard/stock/produits"
                className={({ isActive }) =>
                  `nav-link fw-semibold ${isActive ? 'active' : ''}`
                }
                style={({ isActive }) => ({
                  background: isActive ? 'linear-gradient(135deg, #89CFF0 0%, #6BB6D6 100%)' : 'transparent',
                  color: isActive ? 'white' : '#495057',
                  borderRadius: '8px',
                  marginRight: '0.5rem'
                })}
              >
                Produits
              </NavLink>
            </li>
            <li className="nav-item">
              <NavLink
                to="/dashboard/stock/mouvements"
                className={({ isActive }) =>
                  `nav-link fw-semibold ${isActive ? 'active' : ''}`
                }
                style={({ isActive }) => ({
                  background: isActive ? 'linear-gradient(135deg, #89CFF0 0%, #6BB6D6 100%)' : 'transparent',
                  color: isActive ? 'white' : '#495057',
                  borderRadius: '8px',
                  marginRight: '0.5rem'
                })}
              >
                Mouvements
              </NavLink>
            </li>
            <li className="nav-item">
              <NavLink
                to="/dashboard/stock/test-integration"
                className={({ isActive }) =>
                  `nav-link fw-semibold ${isActive ? 'active' : ''}`
                }
                style={({ isActive }) => ({
                  background: isActive ? 'linear-gradient(135deg, #FF6B6B 0%, #EE5A6F 100%)' : 'transparent',
                  color: isActive ? 'white' : '#495057',
                  borderRadius: '8px'
                })}
              >
                🔧 Test Intégration
              </NavLink>
            </li>
          </ul>
        </div>
      </div>
      <Outlet />
    </div>
  );
}
