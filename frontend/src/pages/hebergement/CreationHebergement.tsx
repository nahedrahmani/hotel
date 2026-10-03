import { useState, useRef, useEffect, type ChangeEvent } from 'react';
import { useKeycloak } from '../../config/KeycloakProvider.tsx';
import { useParams, useNavigate } from "react-router-dom";
import images from "../../assets";

const MAISON_API = import.meta.env.VITE_MAISON_SERVICE_URL ?? 'http://localhost:8895';

const ALLOWED_IMAGE_TYPES = ['image/jpeg', 'image/png', 'image/webp', 'image/gif'];
const MAX_FILE_SIZE = 5 * 1024 * 1024; // 5 MB

type ListField = 'amenities' | 'uniqueAmenities' | 'safetyItems';
type CounterField = 'guests' | 'bedrooms' | 'beds' | 'bathrooms';

interface HebergementForm {
    propertyType: string;
    accommodationType: string;
    address: string;
    ville: string;
    pays: string;
    // kept as typed by the user; parsed with parseFloat on publish
    latitude: number | string;
    longitude: number | string;
    guests: number;
    bedrooms: number;
    beds: number;
    bathrooms: number;
    amenities: string[];
    uniqueAmenities: string[];
    safetyItems: string[];
    photos: File[];
    title: string;
    description: string;
    weekdayPrice: number;
    weekendPrice: number;
    weekendPricing: number;
}

function CreationHebergement() {
    const { id } = useParams();
    const isEdit = !!id;
    const navigate = useNavigate();
    const { keycloak, authenticated, initialized } = useKeycloak();
    const userId = initialized && authenticated ? keycloak.tokenParsed?.sub : null;
    const [step, setStep] = useState(1);
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);
    const [existingPhotos, setExistingPhotos] = useState<string[]>([]);
    const [newPhotos, setNewPhotos] = useState<File[]>([]);
    const fileInputRef = useRef<HTMLInputElement>(null);

    const [formData, setFormData] = useState<HebergementForm>({
        propertyType: '',
        accommodationType: '',
        address: '',
        ville: "Tunis",
        pays: "Tunisie",
        latitude: 36.8008,
        longitude: 10.1708,
        guests: 4,
        bedrooms: 1,
        beds: 1,
        bathrooms: 1,
        amenities: [],
        uniqueAmenities: [],
        safetyItems: [],
        photos: [],
        title: '',
        description: 'Passez un agréable séjour dans cet hébergement confortable.',
        weekdayPrice: 36,
        weekendPrice: 42,
        weekendPricing: 18
    });

    useEffect(() => {
        if (isEdit && userId) {
            fetchListing();
        }
    }, [id, userId]);

    const fetchListing = async () => {
        setLoading(true);
        try {
            const response = await fetch(`${MAISON_API}/api/maisons/${id}`);
            if (!response.ok) {
                throw new Error('Erreur lors du chargement des données');
            }
            const data = await response.json();
            setExistingPhotos(data.images || []);
            setFormData(prev => ({
                ...prev,
                propertyType: data.decritlogement || '',
                accommodationType: data.typeLogement ? data.typeLogement.toLowerCase() : '',
                address: data.adresse || '',
                ville: data.ville || "Tunis",
                pays: data.pays || "Tunisie",
                latitude: data.latitude || 36.8008,
                longitude: data.longitude || 10.1708,
                guests: data.capaciteVoyageurs || 4,
                bedrooms: data.nombreChambres || 1,
                beds: data.nombrelits || 1,
                bathrooms: data.nombrewcs || 1,
                amenities: data.equipements ? data.equipements.filter((e: string) => preferredAmenities.some(a => a.id === e)) : [],
                uniqueAmenities: data.equipements ? data.equipements.filter((e: string) => uniqueAmenities.some(a => a.id === e)) : [],
                safetyItems: data.equipements ? data.equipements.filter((e: string) => safetyItems.some(a => a.id === e)) : [],
                title: data.nom || '',
                description: data.description || '',
                weekdayPrice: data.prixParNuit || 36,
                weekendPricing: 18,
                weekendPrice: Math.round((data.prixParNuit || 36) * 1.18)
            }));
        } catch (error) {
            console.error('Error fetching listing:', error);
            setError('Erreur lors du chargement des données.');
        } finally {
            setLoading(false);
        }
    };

    const handleBackClick = () => {
        if (step === 1) {
            navigate("/dashboard/annonces");
        } else {
            handleBack();
        }
    };

    const propertyTypes = [
        { id: 'maison', icon: 'bi-house-door', label: 'Maison' },
        { id: 'appartement', icon: 'bi-building', label: 'Appartement' },
        { id: 'grange', icon: 'bi-shop', label: 'Grange' },
        { id: 'chambre', icon: 'bi-cup-hot', label: "Chambre d'hôtes" },
        { id: 'bateau', icon: 'bi-water', label: 'Bateau' },
        { id: 'cabane', icon: 'bi-tree', label: 'Cabane' },
        { id: 'caravane', icon: 'bi-truck', label: 'Caravane ou camping-car' },
        { id: 'casa', icon: 'bi-door-open', label: 'Casa particular' },
        { id: 'chateau', icon: 'bi-flag', label: 'Château' },
        { id: 'troglodyte', icon: 'bi-mountain', label: 'Maison troglodyte' },
        { id: 'conteneur', icon: 'bi-box', label: 'Conteneur maritime' },
        { id: 'cycladique', icon: 'bi-bicycle', label: 'Maison cycladique' }
    ];

    const accommodationTypes = [
        {
            id: 'LOGEMENT',
            icon: 'bi-house-door',
            title: 'Un logement entier',
            description: 'Les voyageurs disposent du logement dans son intégralité.'
        },
        {
            id: 'CHAMBRE',
            icon: 'bi-door-closed',
            title: 'Une chambre',
            description: 'Les voyageurs ont leur propre chambre dans un logement et ont accès à des espaces partagés.'
        },
        {
            id: 'CHAMBREPARTAGE',
            icon: 'bi-people',
            title: "Une chambre partagée dans une auberge de jeunesse",
            description: "Les voyageurs dorment dans une chambre partagée dans une auberge de jeunesse gérée par un professionnel, avec du personnel sur place 24h/24, 7j/7."
        }
    ];

    const preferredAmenities = [
        { id: 'wifi', icon: 'bi-wifi', label: 'Wifi' },
        { id: 'tv', icon: 'bi-tv', label: 'Télévision' },
        { id: 'cuisine', icon: 'bi-egg-fried', label: 'Cuisine' },
        { id: 'linge', icon: 'bi-droplet', label: 'Lave-linge' },
        { id: 'parking_gratuit', icon: 'bi-car-front', label: 'Parking gratuit sur place' },
        { id: 'parking_payant', icon: 'bi-p-circle', label: 'Parking payant sur place' },
        { id: 'climatisation', icon: 'bi-snow', label: 'Climatisation' },
        { id: 'espace_travail', icon: 'bi-laptop', label: 'Espace de travail dédié' }
    ];

    const uniqueAmenities = [
        { id: 'piscine', icon: 'bi-water', label: 'Piscine' },
        { id: 'jacuzzi', icon: 'bi-droplet-half', label: 'Jacuzzi' },
        { id: 'patio', icon: 'bi-umbrella', label: 'Patio' },
        { id: 'barbecue', icon: 'bi-fire', label: 'Barbecue' },
        { id: 'repas', icon: 'bi-cup-straw', label: 'Espace repas en plein air' },
        { id: 'brasero', icon: 'bi-brightness-high', label: 'Brasero' },
        { id: 'billard', icon: 'bi-circle', label: 'Billard' },
        { id: 'cheminee', icon: 'bi-fire', label: 'Cheminée' },
        { id: 'piano', icon: 'bi-music-note', label: 'Piano' },
        { id: 'fitness', icon: 'bi-heart-pulse', label: 'Appareils de fitness' },
        { id: 'lac', icon: 'bi-tree', label: 'Accès au lac' },
        { id: 'plage', icon: 'bi-sun', label: 'Accès à la plage' },
        { id: 'ski', icon: 'bi-snow', label: 'Accessible à skis' },
        { id: 'douche_ext', icon: 'bi-droplet', label: 'Douche extérieure' }
    ];

    const safetyItems = [
        { id: 'fumee', icon: 'bi-exclamation-triangle', label: 'Détecteur de fumée' },
        { id: 'secours', icon: 'bi-heart-pulse', label: 'Kit de premiers secours' },
        { id: 'extincteur', icon: 'bi-fire', label: 'Extincteur' },
        { id: 'monoxyde', icon: 'bi-shield-check', label: 'Détecteur de monoxyde de carbone' }
    ];

    const validateTitle = (title: string) => {
        if (!title.trim()) {
            return 'Veuillez saisir un titre.';
        }
        const hasRepeated = /[^a-zA-Z0-9À-ÿ\s]{3,}/.test(title);
        if (hasRepeated) {
            return "L'usage de caractères spéciaux répétés n'est pas autorisé dans les titres de liste";
        }
        return null;
    };

    const validateStep = (currentStep: number) => {
        switch (currentStep) {
            case 2:
                if (!formData.propertyType) {
                    setError('Veuillez sélectionner le type de logement.');
                    return false;
                }
                break;
            case 3:
                if (!formData.accommodationType) {
                    setError('Veuillez sélectionner le type d\'hébergement.');
                    return false;
                }
                break;
            case 4:
                if (!formData.address.trim() || !formData.ville.trim()) {
                    setError('Veuillez saisir l\'adresse et la ville.');
                    return false;
                }
                break;
            case 5:
                if (formData.guests < 1 || formData.bedrooms < 1 || formData.beds < 1 || formData.bathrooms < 1) {
                    setError('Veuillez définir au moins 1 pour chaque capacité.');
                    return false;
                }
                break;
            case 10:
                const totalPhotos = existingPhotos.length + newPhotos.length;
                if (totalPhotos < 1 || totalPhotos > 3) {
                    setError('Veuillez avoir entre 1 et 3 photos au total.');
                    return false;
                }
                break;
            case 11:
                const titleError = validateTitle(formData.title);
                setError(titleError ?? '');
                return titleError === null;
            case 12:
                if (!formData.description.trim()) {
                    setError('Veuillez saisir une description.');
                    return false;
                }
                break;
            case 14:
                if (formData.weekdayPrice < 10) {
                    setError('Le prix doit être au moins 10.');
                    return false;
                }
                break;
            case 15:
                if (formData.weekendPricing < 0) {
                    setError('Le pourcentage de supplément week-end doit être valide.');
                    return false;
                }
                break;
            default:
                break;
        }
        setError('');
        return true;
    };

    const handleNext = () => {
        if (step < 15 && validateStep(step)) {
            setStep(step + 1);
        }
    };

    const handleBack = () => {
        if (step > 1) {
            setStep(step - 1);
            setError('');
        }
    };

    const handlePublish = async () => {
        if (!validateStep(15)) return;

        if (!formData.title.trim() || !formData.description.trim() || !formData.address.trim() || !formData.propertyType || !formData.accommodationType || (existingPhotos.length + newPhotos.length < 1)) {
            setError('Veuillez compléter tous les champs obligatoires.');
            return;
        }

        if (!initialized) {
            setError('Authentification en cours...');
            return;
        }

        if (!authenticated || !userId) {
            setError('Utilisateur non authentifié.');
            return;
        }

        const maison: { images?: string[]; [key: string]: unknown } = {
            nom: formData.title,
            description: formData.description,
            decritlogement: formData.propertyType,
            adresse: formData.address,
            ville: formData.ville,
            pays: formData.pays,
            latitude: parseFloat(String(formData.latitude)),
            longitude: parseFloat(String(formData.longitude)),
            capaciteVoyageurs: formData.guests,
            nombreChambres: formData.bedrooms,
            nombrelits: formData.beds,
            nombrewcs: formData.bathrooms,
            typeLogement: formData.accommodationType.toUpperCase(),
            prixParNuit: formData.weekdayPrice,
            equipements: [...formData.amenities, ...formData.uniqueAmenities, ...formData.safetyItems],
            telephone: "98489587",
            email: "contact@darelmedina.tn",
            siteWeb: "https://www.darelmedina.tn",
            vues: 0,
            disponible: true,
            proprietaireId: userId
        };

        if (isEdit) {
            maison.images = existingPhotos;
        }

        const formDataToSend = new FormData();
        formDataToSend.append('maison', new Blob([JSON.stringify(maison)], { type: 'application/json' }));
        newPhotos.forEach((file) => {
            formDataToSend.append('images', file);
        });

        const url = isEdit ? `${MAISON_API}/api/maisons/${id}` : `${MAISON_API}/api/maisons`;
        const method = isEdit ? 'PUT' : 'POST';

        setLoading(true);
        try {
            const response = await fetch(url, {
                method,
                body: formDataToSend,
            });
            if (!response.ok) {
                const errorText = await response.text();
                throw new Error(`Server error: ${response.status} ${response.statusText} - ${errorText}`);
            }
            await response.json();
            setError('');
            navigate("/dashboard/annonces");
        } catch (error) {
            console.error('Publish failed:', error);
            setError('Erreur lors de la publication. Veuillez réessayer.');
        } finally {
            setLoading(false);
        }
    };

    const toggleSelection = (field: ListField, value: string) => {
        setFormData(prev => ({
            ...prev,
            [field]: prev[field].includes(value)
                ? prev[field].filter((item: string) => item !== value)
                : [...prev[field], value]
        }));
        if (error) setError(''); // Clear error on interaction
    };

    const updateCounter = (field: CounterField, delta: number) => {
        setFormData(prev => ({
            ...prev,
            [field]: Math.max(1, prev[field] + delta)
        }));
        if (error) setError('');
    };

    const handleAddressChange = (e: ChangeEvent<HTMLInputElement>) => {
        const newAddress = e.target.value;
        setFormData({...formData, address: newAddress});
        const addrError = !newAddress.trim() ? 'Veuillez saisir l\'adresse.' : null;
        setError(addrError ?? '');
    };

    const handleVilleChange = (e: ChangeEvent<HTMLInputElement>) => {
        const newVille = e.target.value;
        setFormData({...formData, ville: newVille});
        const villeError = !newVille.trim() ? 'Veuillez saisir la ville.' : null;
        setError(villeError ?? '');
    };

    const handleLatChange = (e: ChangeEvent<HTMLInputElement>) => {
        const newLat = e.target.value;
        setFormData({...formData, latitude: newLat});
    };

    const handleLongChange = (e: ChangeEvent<HTMLInputElement>) => {
        const newLong = e.target.value;
        setFormData({...formData, longitude: newLong});
    };

    const handleTitleChange = (e: ChangeEvent<HTMLTextAreaElement>) => {
        const newTitle = e.target.value;
        setFormData({...formData, title: newTitle});
        const titleError = validateTitle(newTitle);
        setError(titleError ?? '');
    };

    const handleDescriptionChange = (e: ChangeEvent<HTMLTextAreaElement>) => {
        const newDesc = e.target.value;
        setFormData({...formData, description: newDesc});
        const descError = !newDesc.trim() ? 'Veuillez saisir une description.' : null;
        setError(descError ?? '');
    };

    const handleFileChange = (e: ChangeEvent<HTMLInputElement>) => {
        const files = Array.from((e.target.files as FileList) || []).filter((file: File) => {
            if (file.size > MAX_FILE_SIZE) return false;
            if (!ALLOWED_IMAGE_TYPES.includes(file.type)) return false;
            return true;
        });
        setNewPhotos(files);
        const totalPhotos = existingPhotos.length + files.length;
        const photoError = totalPhotos < 1 || totalPhotos > 3 ? 'Veuillez avoir entre 1 et 3 photos au total.' : null;
        setError(photoError ?? '');
    };

    const handlePropertyTypeChange = (id: string) => {
        setFormData({...formData, propertyType: id});
        if (error) setError('');
    };

    const handleAccommodationTypeChange = (id: string) => {
        setFormData({...formData, accommodationType: id});
        if (error) setError('');
    };

    const handlePriceChange = (e: ChangeEvent<HTMLInputElement>) => {
        const val = parseInt(e.target.value) || 0;
        setFormData({...formData, weekdayPrice: val});
        const priceError = val < 10 ? 'Le prix doit être au moins 10.' : null;
        setError(priceError ?? '');
    };

    const handleWeekendPricingChange = (e: ChangeEvent<HTMLInputElement>) => {
        const percentage = parseInt(e.target.value) || 0;
        setFormData({
            ...formData,
            weekendPricing: percentage,
            weekendPrice: Math.round(formData.weekdayPrice * (1 + percentage / 100))
        });
        const weekendError = percentage < 0 ? 'Le pourcentage de supplément week-end doit être valide.' : null;
        setError(weekendError ?? '');
    };

    const renderError = () => {
        if (!error) return null;
        return (
            <div className="d-flex align-items-center text-danger small mt-3">
                <i className="bi bi-exclamation-triangle me-1"></i>
                {error}
            </div>
        );
    };

    if (loading) {
        return <div className="text-center p-4">Chargement...</div>;
    }

    const renderStep = () => {
        switch(step) {
            case 1:
                return (
                    <div className="container">
                        <div className="row align-items-center">
                            <div className="col-lg-6">
                                <div className="mb-3 fw-semibold small">Étape 1</div>
                                <h1 className="display-3 fw-bold mb-4">{isEdit ? 'Modifiez les informations de votre logement' : 'Parlez-nous de votre logement'}</h1>
                                <p className="lead text-muted">
                                    {isEdit ? 'Au cours de cette étape, vous pouvez modifier le type de logement que vous proposez et si les voyageurs pourront le réserver dans son intégralité ou si vous ne louez qu\'une chambre. Nous vous demanderons ensuite d\'indiquer son emplacement et sa capacité d\'accueil.' : 'Au cours de cette étape, nous allons vous demander quel type de logement vous proposez et si les voyageurs pourront le réserver dans son intégralité ou si vous ne louez qu\'une chambre. Nous vous demanderons ensuite d\'indiquer son emplacement et sa capacité d\'accueil.'}
                                </p>
                            </div>
                            <div className="col-lg-6">
                                <div
                                    style={{
                                        background: 'linear-gradient(135deg, #f3f4f6 0%, #e5e7eb 100%)',
                                        borderRadius: '16px',
                                        padding: '3rem',
                                        minHeight: '300px'
                                    }}
                                    className="d-flex align-items-center justify-content-center"
                                >
                                    <video
                                        src={images.etape1}
                                        autoPlay
                                        muted
                                        style={{
                                            width: '100%',
                                            height: '100%',
                                            borderRadius: '12px',
                                            objectFit: 'cover'
                                        }}
                                    ></video>
                                </div>
                            </div>
                        </div>
                    </div>
                );

            case 2:
                return (
                    <div className="container">
                        <h2 className="display-6 fw-bold mb-4">{isEdit ? 'Modifiez le type de votre logement' : 'Parmi les propositions suivantes, laquelle décrit le mieux votre logement ?'}</h2>
                        <div className="row g-3 mt-4">
                            {propertyTypes.map(type => (
                                <div key={type.id} className="col-md-4">
                                    <div
                                        style={{
                                            border: `2px solid ${formData.propertyType === type.id ? '#000' : '#dee2e6'}`,
                                            borderRadius: '12px',
                                            padding: '1.5rem',
                                            cursor: 'pointer',
                                            backgroundColor: formData.propertyType === type.id ? '#f8f9fa' : 'white',
                                            transition: 'all 0.2s'
                                        }}
                                        onClick={() => handlePropertyTypeChange(type.id)}
                                    >
                                        <i className={type.icon} style={{fontSize: '2rem', marginBottom: '1rem'}}></i>
                                        <div className="fw-semibold">{type.label}</div>
                                    </div>
                                </div>
                            ))}
                        </div>
                        {renderError()}
                    </div>
                );

            case 3:
                return (
                    <div className="container" style={{maxWidth: '800px'}}>
                        <h2 className="display-6 fw-bold mb-4">{isEdit ? 'Modifiez le type d\'hébergement' : 'Quel type de logement sera à la disposition des voyageurs ?'}</h2>
                        <div className="d-flex flex-column gap-3 mt-4">
                            {accommodationTypes.map(type => (
                                <div
                                    key={type.id}
                                    style={{
                                        border: `2px solid ${formData.accommodationType === type.id ? '#000' : '#dee2e6'}`,
                                        borderRadius: '12px',
                                        padding: '1.5rem',
                                        cursor: 'pointer',
                                        backgroundColor: formData.accommodationType === type.id ? '#f8f9fa' : 'white',
                                        transition: 'all 0.2s',
                                        display: 'flex',
                                        alignItems: 'center',
                                        gap: '1rem'
                                    }}
                                    onClick={() => handleAccommodationTypeChange(type.id)}
                                >
                                    <i className={type.icon} style={{fontSize: '2.5rem', flexShrink: 0}}></i>
                                    <div>
                                        <div className="fw-semibold fs-5 mb-1">{type.title}</div>
                                        <div className="text-muted">{type.description}</div>
                                    </div>
                                </div>
                            ))}
                        </div>
                        {renderError()}
                    </div>
                );

            case 4:
                return (
                    <div className="container" style={{maxWidth: '900px'}}>
                        <h2 className="display-6 fw-bold mb-2">{isEdit ? 'Modifiez l\'emplacement de votre logement' : 'Où est situé votre logement ?'}</h2>
                        <p className="text-muted mb-4">Votre adresse est uniquement communiquée aux voyageurs une fois leur réservation effectuée.</p>
                        <div className="row mb-4">
                            <div className="col-md-8">
                                <input
                                    type="text"
                                    className={`form-control form-control-lg ${error ? 'is-invalid' : ''}`}
                                    placeholder="Saisissez votre adresse"
                                    value={formData.address}
                                    onChange={handleAddressChange}
                                />
                            </div>
                            <div className="col-md-4">
                                <input
                                    type="text"
                                    className={`form-control form-control-lg ${error ? 'is-invalid' : ''}`}
                                    placeholder="Ville"
                                    value={formData.ville}
                                    onChange={handleVilleChange}
                                />
                            </div>
                        </div>
                        <div className="row mb-4">
                            <div className="col-md-6">
                                <input
                                    type="number"
                                    step="any"
                                    className="form-control form-control-lg"
                                    placeholder="Latitude"
                                    value={formData.latitude}
                                    onChange={handleLatChange}
                                />
                            </div>
                            <div className="col-md-6">
                                <input
                                    type="number"
                                    step="any"
                                    className="form-control form-control-lg"
                                    placeholder="Longitude"
                                    value={formData.longitude}
                                    onChange={handleLongChange}
                                />
                            </div>
                        </div>
                        <div style={{backgroundColor: '#f0f0f0', borderRadius: '8px', height: '400px'}} className="d-flex align-items-center justify-content-center">
                            <div className="text-center text-muted">
                                <i className="bi bi-geo-alt" style={{fontSize: '3rem'}}></i>
                                <p>Carte interactive</p>
                            </div>
                        </div>
                        {error && (
                            <div className="invalid-feedback d-block mt-1">
                                <i className="bi bi-exclamation-triangle me-1"></i>
                                {error}
                            </div>
                        )}
                    </div>
                );

            case 5:
                return (
                    <div className="container" style={{maxWidth: '700px'}}>
                        <h2 className="display-6 fw-bold mb-2">{isEdit ? 'Modifiez les informations principales de votre logement' : 'Donnez les informations principales concernant votre logement'}</h2>
                        <p className="text-muted mb-4">Vous pourrez ajouter d'autres informations plus tard, comme les types de lit.</p>
                        <div>
                            {([
                                { label: 'Voyageurs', field: 'guests' },
                                { label: 'Chambres', field: 'bedrooms' },
                                { label: 'Lits', field: 'beds' },
                                { label: 'Salles de bain', field: 'bathrooms' }
                            ] satisfies { label: string; field: CounterField }[]).map(item => (
                                <div key={item.field} style={{borderBottom: '1px solid #dee2e6', padding: '1.5rem 0'}}>
                                    <div className="d-flex justify-content-between align-items-center">
                                        <span className="fs-5 fw-medium">{item.label}</span>
                                        <div className="d-flex align-items-center gap-3">
                                            <button
                                                style={{
                                                    width: '40px',
                                                    height: '40px',
                                                    borderRadius: '50%',
                                                    border: '2px solid #dee2e6',
                                                    background: 'white',
                                                    cursor: 'pointer',
                                                    transition: 'all 0.2s'
                                                }}
                                                onClick={() => updateCounter(item.field, -1)}
                                                className="btn"
                                            >
                                                −
                                            </button>
                                            <span className="fs-4 fw-semibold" style={{width: '30px', textAlign: 'center'}}>
                                                {formData[item.field]}
                                            </span>
                                            <button
                                                style={{
                                                    width: '40px',
                                                    height: '40px',
                                                    borderRadius: '50%',
                                                    border: '2px solid #dee2e6',
                                                    background: 'white',
                                                    cursor: 'pointer',
                                                    transition: 'all 0.2s'
                                                }}
                                                onClick={() => updateCounter(item.field, 1)}
                                                className="btn"
                                            >
                                                +
                                            </button>
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>
                        {renderError()}
                    </div>
                );

            case 6:
                return (
                    <div className="container">
                        <div className="row align-items-center">
                            <div className="col-lg-6">
                                <div className="mb-3 fw-semibold small">Étape 2</div>
                                <h1 className="display-3 fw-bold mb-4">{isEdit ? 'Modifiez les équipements et photos de votre annonce' : 'Faites sortir votre annonce du lot'}</h1>
                                <p className="lead text-muted">
                                    {isEdit ? 'Au cours de cette étape, vous pouvez modifier les équipements proposés dans votre logement et les photos. Vous pourrez ensuite modifier le titre et la description.' : 'Au cours de cette étape, vous pourrez ajouter certains des équipements proposés dans votre logement et au moins 5 photos. Vous pourrez ensuite ajouter un titre et une description.'}
                                </p>
                            </div>
                            <div className="col-lg-6">
                                <div
                                    style={{
                                        background: 'linear-gradient(135deg, #f3f4f6 0%, #e5e7eb 100%)',
                                        borderRadius: '16px',
                                        padding: '3rem',
                                        minHeight: '300px'
                                    }}
                                    className="d-flex align-items-center justify-content-center"
                                >
                                    <video
                                        src={images.etape2}
                                        autoPlay
                                        muted
                                        style={{
                                            width: '100%',
                                            height: '100%',
                                            borderRadius: '12px',
                                            objectFit: 'cover'
                                        }}
                                    ></video>
                                </div>
                            </div>
                        </div>
                    </div>
                );

            case 7:
                return (
                    <div className="container">
                        <h2 className="display-6 fw-bold mb-2">{isEdit ? 'Modifiez les équipements préférés' : 'Indiquez aux voyageurs quels sont les équipements de votre logement'}</h2>
                        <p className="text-muted mb-4">Vous pourrez ajouter des équipements une fois votre annonce publiée.</p>
                        <h3 className="fs-4 fw-semibold mb-3">Qu'en est-il de ces équipements préférés des voyageurs ?</h3>
                        <div className="row g-3">
                            {preferredAmenities.map(amenity => (
                                <div key={amenity.id} className="col-md-6">
                                    <div
                                        style={{
                                            border: `2px solid ${formData.amenities.includes(amenity.id) ? '#000' : '#dee2e6'}`,
                                            borderRadius: '12px',
                                            padding: '1.5rem',
                                            cursor: 'pointer',
                                            backgroundColor: formData.amenities.includes(amenity.id) ? '#f8f9fa' : 'white',
                                            transition: 'all 0.2s'
                                        }}
                                        onClick={() => toggleSelection('amenities', amenity.id)}
                                    >
                                        <i className={amenity.icon} style={{fontSize: '2rem', marginBottom: '0.75rem', display: 'block'}}></i>
                                        <div className="fw-medium">{amenity.label}</div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                );

            case 8:
                return (
                    <div className="container">
                        <h2 className="display-6 fw-bold mb-4">{isEdit ? 'Modifiez les équipements hors du commun' : 'Possédez-vous des équipements hors du commun ?'}</h2>
                        <div className="row g-3">
                            {uniqueAmenities.map(amenity => (
                                <div key={amenity.id} className="col-md-4">
                                    <div
                                        style={{
                                            border: `2px solid ${formData.uniqueAmenities.includes(amenity.id) ? '#000' : '#dee2e6'}`,
                                            borderRadius: '12px',
                                            padding: '1.5rem',
                                            cursor: 'pointer',
                                            backgroundColor: formData.uniqueAmenities.includes(amenity.id) ? '#f8f9fa' : 'white',
                                            transition: 'all 0.2s'
                                        }}
                                        onClick={() => toggleSelection('uniqueAmenities', amenity.id)}
                                    >
                                        <i className={amenity.icon} style={{fontSize: '2rem', marginBottom: '0.75rem', display: 'block'}}></i>
                                        <div className="fw-medium small">{amenity.label}</div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                );

            case 9:
                return (
                    <div className="container" style={{maxWidth: '900px'}}>
                        <h2 className="display-6 fw-bold mb-4">{isEdit ? 'Modifiez les équipements de sécurité' : 'Possédez-vous ces équipements de sécurité ?'}</h2>
                        <div className="row g-3">
                            {safetyItems.map(item => (
                                <div key={item.id} className="col-md-6">
                                    <div
                                        style={{
                                            border: `2px solid ${formData.safetyItems.includes(item.id) ? '#000' : '#dee2e6'}`,
                                            borderRadius: '12px',
                                            padding: '1.5rem',
                                            cursor: 'pointer',
                                            backgroundColor: formData.safetyItems.includes(item.id) ? '#f8f9fa' : 'white',
                                            transition: 'all 0.2s'
                                        }}
                                        onClick={() => toggleSelection('safetyItems', item.id)}
                                    >
                                        <i className={item.icon} style={{fontSize: '2rem', marginBottom: '0.75rem', display: 'block'}}></i>
                                        <div className="fw-medium">{item.label}</div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                );

            case 10:
                return (
                    <div className="container" style={{maxWidth: '800px'}}>
                        <h2 className="display-6 fw-bold mb-2">{isEdit ? 'Modifiez les photos de votre maison' : 'Ajoutez quelques photos de votre maison'}</h2>
                        <p className="text-muted mb-4">{isEdit ? 'Vous pouvez ajouter ou modifier les photos. Vous aurez besoin de 1 à 3 photos au total.' : 'Pour commencer, vous aurez besoin de 1 à 3 photos. Vous pourrez en ajouter d\'autres ou faire des modifications plus tard.'}</p>
                        <div style={{border: `2px ${error ? 'dashed #dc3545' : 'dashed #dee2e6'}`, borderRadius: '12px', padding: '4rem', textAlign: 'center', cursor: 'pointer'}} onClick={() => fileInputRef.current?.click()}>
                            <i className="bi bi-camera" style={{fontSize: '4rem', color: '#6c757d', marginBottom: '1rem', display: 'block'}}></i>
                            <button className="btn btn-outline-dark btn-lg mb-3">{isEdit && existingPhotos.length > 0 ? 'Ajoutez plus de photos' : 'Ajoutez des photos'}</button>
                            <p className="text-muted small">{existingPhotos.length + newPhotos.length} photo(s) {isEdit ? 'au total' : 'ajoutée(s)'}</p>
                            <input
                                type="file"
                                multiple
                                accept="image/*"
                                ref={fileInputRef}
                                onChange={handleFileChange}
                                style={{ display: 'none' }}
                            />
                        </div>
                        {existingPhotos.length > 0 && (
                            <div className="mt-4">
                                <h5>Photos actuelles :</h5>
                                <div className="row">
                                    {existingPhotos.map((url, index) => (
                                        <div key={index} className="col-md-4 mb-3">
                                            <img
                                                src={url}
                                                alt={`Photo ${index + 1}`}
                                                style={{ width: '100%', height: '150px', objectFit: 'cover', borderRadius: '8px' }}
                                            />
                                        </div>
                                    ))}
                                </div>
                            </div>
                        )}
                        {newPhotos.length > 0 && (
                            <div className="mt-4">
                                <h5>Nouvelles photos :</h5>
                                <div className="row">
                                    {newPhotos.map((file, index) => (
                                        <div key={index} className="col-md-4 mb-3">
                                            <img
                                                src={URL.createObjectURL(file)}
                                                alt={`Photo ${index + 1}`}
                                                style={{ width: '100%', height: '150px', objectFit: 'cover', borderRadius: '8px' }}
                                            />
                                        </div>
                                    ))}
                                </div>
                            </div>
                        )}
                        {renderError()}
                    </div>
                );

            case 11:
                const selectedProperty = propertyTypes.find(p => p.id === formData.propertyType);
                const propertyLabel = selectedProperty ? selectedProperty.label : 'logement';
                return (
                    <div className="container" style={{maxWidth: '800px'}}>
                        <h2 className="display-6 fw-bold mb-2">{isEdit ? `Modifiez le titre de votre annonce (type : ${propertyLabel})` : `À présent, donnez un titre à votre annonce (type : ${propertyLabel})`}</h2>
                        <p className="text-muted mb-4">Les titres courts sont généralement les plus efficaces. Ne vous inquiétez pas, vous pourrez toujours le modifier plus tard.</p>
                        <textarea
                            className={`form-control form-control-lg ${error ? 'is-invalid' : ''}`}
                            rows={3}
                            maxLength={50}
                            value={formData.title}
                            onChange={handleTitleChange}
                            placeholder="Entrez votre titre ici..."
                        />
                        <div className="text-end text-muted small mt-2">{formData.title.length}/50</div>
                        {error && (
                            <div className="invalid-feedback d-block mt-1">
                                <i className="bi bi-exclamation-triangle me-1"></i>
                                {error}
                            </div>
                        )}
                    </div>
                );

            case 12:
                return (
                    <div className="container" style={{maxWidth: '800px'}}>
                        <h2 className="display-6 fw-bold mb-2">{isEdit ? 'Modifiez votre description' : 'Créez votre description'}</h2>
                        <p className="text-muted mb-4">Racontez ce qui rend votre logement unique.</p>
                        <textarea
                            className={`form-control form-control-lg ${error ? 'is-invalid' : ''}`}
                            rows={8}
                            maxLength={500}
                            value={formData.description}
                            onChange={handleDescriptionChange}
                        />
                        <div className="text-end text-muted small mt-2">{formData.description.length}/500</div>
                        {error && (
                            <div className="invalid-feedback d-block mt-1">
                                <i className="bi bi-exclamation-triangle me-1"></i>
                                {error}
                            </div>
                        )}
                    </div>
                );

            case 13:
                return (
                    <div className="container">
                        <div className="row align-items-center">
                            <div className="col-lg-6">
                                <div className="mb-3 fw-semibold small">Étape 3</div>
                                <h1 className="display-3 fw-bold mb-4">{isEdit ? 'Modifiez les paramètres et publiez' : 'Terminez et publiez'}</h1>
                                <p className="lead text-muted">
                                    {isEdit ? 'Enfin, vous pouvez choisir les paramètres de réservation, définir votre tarification et publier vos modifications.' : 'Enfin, vous choisissez les paramètres de réservation, définissez votre tarification et publiez votre annonce.'}
                                </p>
                            </div>
                            <div className="col-lg-6">
                                <div
                                    style={{
                                        background: 'linear-gradient(135deg, #f3f4f6 0%, #e5e7eb 100%)',
                                        borderRadius: '16px',
                                        padding: '3rem',
                                        minHeight: '300px'
                                    }}
                                    className="d-flex align-items-center justify-content-center"
                                >
                                    <video
                                        src={images.etape3}
                                        autoPlay
                                        muted
                                        style={{
                                            width: '100%',
                                            height: '100%',
                                            borderRadius: '12px',
                                            objectFit: 'cover'
                                        }}
                                    ></video>
                                </div>
                            </div>
                        </div>
                    </div>
                );

            case 14:
                return (
                    <div className="container" style={{maxWidth: '700px'}}>
                        <h2 className="display-6 fw-bold mb-2">{isEdit ? 'Modifiez le prix de base pour les jours de semaine' : 'À présent, définissez un prix de base pour les jours de semaine'}</h2>
                        <p className="text-muted mb-4">Prix conseillé : ${formData.weekdayPrice}. Vous fixerez ensuite un tarif week-end.</p>
                        <div style={{textAlign: 'center', margin: '3rem 0'}}>
                            <div style={{fontSize: '6rem', fontWeight: 'bold', marginBottom: '2rem'}}>${formData.weekdayPrice}</div>
                            <div className="fs-5 text-muted mb-4">
                                Prix à payer par le voyageur (hors taxes) ${Math.round(formData.weekdayPrice * 1.14)}
                            </div>
                            <input
                                type="range"
                                className={`form-range ${error ? 'is-invalid' : ''}`}
                                min="10"
                                max="500"
                                value={formData.weekdayPrice}
                                onChange={handlePriceChange}
                            />
                            {error && (
                                <div className="text-danger small mt-2">
                                    <i className="bi bi-exclamation-triangle me-1"></i>
                                    {error}
                                </div>
                            )}
                        </div>
                    </div>
                );

            case 15:
                return (
                    <div className="container" style={{maxWidth: '700px'}}>
                        <h2 className="display-6 fw-bold mb-2">{isEdit ? 'Modifiez le tarif week-end' : 'Fixez un tarif week-end'}</h2>
                        <p className="text-muted mb-4">Ajoutez un supplément pour les vendredis et samedis.</p>
                        <div style={{textAlign: 'center', margin: '3rem 0'}}>
                            <div style={{fontSize: '6rem', fontWeight: 'bold', marginBottom: '2rem'}}>${formData.weekendPrice}</div>
                            <div className="fs-5 text-muted mb-4">
                                Prix à payer par le voyageur (hors taxes) ${Math.round(formData.weekendPrice * 1.14)}
                            </div>
                            <div style={{backgroundColor: '#f0f0f0', borderRadius: '8px', padding: '1.5rem', marginBottom: '2rem'}}>
                                <div className="d-flex justify-content-between align-items-center mb-3">
                                    <div className="text-start">
                                        <div className="fw-semibold">Supplément week-end</div>
                                        <div className="small text-muted">Conseil : essayez 1 %</div>
                                    </div>
                                    <div style={{fontSize: '2.5rem', fontWeight: 'bold'}}>{formData.weekendPricing}%</div>
                                </div>
                                <input
                                    type="range"
                                    className={`form-range ${error ? 'is-invalid' : ''}`}
                                    min="0"
                                    max="99"
                                    value={formData.weekendPricing}
                                    onChange={handleWeekendPricingChange}
                                />
                                <div className="d-flex justify-content-between small text-muted mt-2">
                                    <span>0 %</span>
                                    <span>99 %</span>
                                </div>
                            </div>
                            {error && (
                                <div className="text-danger small mt-2">
                                    <i className="bi bi-exclamation-triangle me-1"></i>
                                    {error}
                                </div>
                            )}
                        </div>
                    </div>
                );

            default:
                return null;
        }
    };

    const progress = (step / 15) * 100;

    return (
        <>
            <style>{`
        body {
          padding-top: 10px;
          padding-bottom: 100px;
        }
        
        .progress-bar-custom {
          position: fixed;
          top: 0;
          left: 0;
          right: 0;
          height: 4px;
          background-color: #e9ecef;
          z-index: 1050;
        }
        
        .progress-bar-fill {
          height: 100%;
          background-color: #000;
          transition: width 0.3s ease;
        }
        
        .bottom-nav {
          position: fixed;
          bottom: 0;
          left: 0;
          right: 0;
          background: white;
          border-top: 1px solid #dee2e6;
          padding: 1.5rem;
          z-index: 1040;
        }
      `}</style>

            <div className="progress-bar-custom">
                <div className="progress-bar-fill" style={{width: `${progress}%`}}></div>
            </div>

            <div className="py-5">
                {renderStep()}
            </div>

            <div className="bottom-nav">
                <div className="container">
                    <div className="d-flex justify-content-between align-items-center">
                        <button
                            className="btn btn-link text-dark text-decoration-underline fw-semibold"
                            onClick={handleBackClick}
                            style={{ opacity: step === 1 ? 1 : 1 }}
                        >
                            Retour
                        </button>

                        <button
                            className="btn btn-dark btn-lg px-5"
                            onClick={step === 15 ? handlePublish : handleNext}
                        >
                            {step === 15 ? (isEdit ? 'Mettre à jour' : 'Publier') : 'Suivant'}
                        </button>
                    </div>
                </div>
            </div>
        </>
    );
}

export default CreationHebergement;