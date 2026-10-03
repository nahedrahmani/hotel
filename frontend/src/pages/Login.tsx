import React from 'react';
import { useKeycloak } from '../config/KeycloakProvider';

const Login: React.FC = () => {
    const { keycloak } = useKeycloak();
    return (
        <div>
            <h1>Login</h1>
            <button onClick={() => keycloak?.login()}>Login</button>
        </div>
    );
};

export default Login;
