import React, { useEffect, type ReactNode } from 'react';
import { useKeycloak } from './KeycloakProvider';
import Lottie from 'lottie-react';

// Import your Lottie animation from the public folder
import loadingAnimation from './../../public/Material loading.json';

interface PrivateRouteProps {
    children: ReactNode;
}

const PrivateRoute: React.FC<PrivateRouteProps> = ({ children }) => {
    const { keycloak, authenticated, initialized } = useKeycloak();

    useEffect(() => {
        if (initialized && !authenticated) {
            keycloak.login();
        }
    }, [initialized, authenticated, keycloak]);

    if (!initialized || !authenticated) {
        return (
            <div style={loaderContainerStyle}>
                <Lottie animationData={loadingAnimation} loop style={lottieStyle} />
            </div>
        );
    }

    return <>{children}</>;
};

// Styles for the loader container and animation
const loaderContainerStyle: React.CSSProperties = {
    display: 'flex',
    justifyContent: 'center',
    alignItems: 'center',
    height: '100vh',
    backgroundColor: '#f9f9f9',
};

const lottieStyle: React.CSSProperties = {
    width: 200,
    height: 200,
};

export default PrivateRoute;
