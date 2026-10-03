import React from "react";
import Navbar from "../components/Navbar";

interface UserLayoutProps {
    children: React.ReactNode;
}

const UserLayout: React.FC<UserLayoutProps> = ({ children }) => {
    return (
        <>
            <Navbar />
            <main style={{ paddingTop: '80px' }}>{children}</main>
        </>
    );
};

export default UserLayout;
