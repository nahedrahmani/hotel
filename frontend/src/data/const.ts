export interface NavbarItem {
    label: string;
    path?: string;
    dropdown?: { label: string; path: string }[];
}

export const navbarItems: NavbarItem[] = [
    { label: "Circuits", path: "/circuits-touristiques-randonnee-event" },
    { label: "Maison d'hôte", path: "/hebergement-maison-hote" },
    { label: "Artisans", path: "/produits-artisanaux-handmade" },
    { label: "Blog", path: "/produits-artisanaux-handmade/artisan" },
    {
        label: "TND",
        dropdown: [
            { label: "EUR", path: "/" },
            { label: "USD", path: "/" },
        ],
    },
    {
        label: "Français",
        dropdown: [
            { label: "Français", path: "/" },
            { label: "English", path: "/" },
        ],
    },
];
