// Importing all images from the assets directory using ES6 import
import addImage from './add-image.png';
import argent from './argent.png';
import artisan from './artisan.png';
import avatar from './avatar.png';
import blog1 from './blog-1.jpg';
import blog2 from './blog-2.jpg';
import blog3 from './blog-3.jpg';
import breadcrumbBg from './breadcrumb-bg.jpg';
import calander from './calander.png';
import carousel1 from './carousel-1.jpg';
import carousel2 from './carousel-2.jpg';
import carousel3 from './carousel-3.jpg';
import carteProfessionnelle from './carte-professionne.png';
import carteProfessionnelVideEtnafes from './carte-professionnel-vide-etnafes-tn.png';
import destination1 from './destination-1.jpg';
import destination2 from './destination-2.jpg';
import destination3 from './destination-3.jpg';
import destination4 from './destination-4.jpg';
import destination5 from './destination-5.jpg';
import destination6 from './destination-6.jpg';
import destination7 from './destination-7.jpg';
import destination8 from './destination-8.jpg';
import destination9 from './destination-9.jpg';
import editProperty from './edit-property.png';
import exploreTour1 from './explore-tour-1.jpg';
import exploreTour2 from './explore-tour-2.jpg';
import exploreTour3 from './explore-tour-3.jpg';
import exploreTour4 from './explore-tour-4.jpg';
import exploreTour5 from './explore-tour-5.jpg';
import exploreTour6 from './explore-tour-6.jpg';
import femme from './femme.png';
import guide1 from './guide-1.jpg';
import guide2 from './guide-2.jpg';
import guide3 from './guide-3.jpg';
import guide4 from './guide-4.jpg';
import hedi from './hedi.jpg';
import homme from './homme.png';
import hour from './hour.png';
import logo from './logo.webp';
import map from './map.png';
import mood from './mood.png';
import packages1 from './packages-1.jpg';
import packages2 from './packages-2.jpg';
import packages3 from './packages-3.jpg';
import packages4 from './packages-4.jpg';
import people from './people.png';
import reactSvg from './react.svg';
import testimonial1 from './testimonial-1.jpg';
import testimonial2 from './testimonial-2.jpg';
import testimonial3 from './testimonial-3.jpg';
import testimonial4 from './testimonial-4.jpg';
import tourBookingBg from './tour-booking-bg.jpg';
import yoga from './yoga.png';
import etape1 from './etape1.mp4';
import etape2 from './etape2.mp4';
import etape3 from './etape3.mp4';

import zaghouen from './zaghouen.webp';
import header from './header.jpg';

// Additional images from subdirectories
import dislike from './icons_circuit/dislike.png';
import etnafesTnDislike from './icons_circuit/etnafes-tn-dislike.png';
import etnafesTnLike from './icons_circuit/etnafes-tn-like.png';
import like from './icons_circuit/like.png';
import image360DarHssine from './image_360/360-Dar-hssine.jpg';
import calque3 from './image_360/Calque -3.jpg';
import calque0 from './image_360/Calque0.jpg';
import calque1 from './image_360/Calque1.jpg';
import f360 from './image_360/f360.jpg';
import fr360 from './image_360/fr360.jpg';
import free360 from './image_360/fre360.jpg';
import free360_ from './image_360/free360.jpg';
import profDarHssine from './maison_dhote/profil/prof-dar-hssine.jpg';
import airConditioner from './maison_dhote/air-conditioner.png';
import bath from './maison_dhote/bath.png';
import bedEtnafes from './maison_dhote/bed-etnafes.png';
import computer from './maison_dhote/computer.png';
import espaceEnfant from './maison_dhote/espace-enfant.png';
import heating from './maison_dhote/heating.png';
import iconPositionMaison from './maison_dhote/icon-position_maison.png';
import kitchen from './maison_dhote/kitchen.png';
import personMaleEtnafes from './maison_dhote/person-male-etnafes.png';
import tumbleDry from './maison_dhote/tumble-dry.png';
import typeHoteIcon from './maison_dhote/type-hote-icon.png';
import visible from './maison_dhote/visible.png';
import waterHeater from './maison_dhote/water-heater.png';
import wifi from './maison_dhote/wifi.png';

// NEW HOTEL IMAGES (added below)
import hotel1 from './hotel1.jpg';
import hotel2 from './hotel2.jpeg';
import hotel3 from './hotel3.jpg';
import hammam from './hammam.jpg';
import spa from './spa.jpg';
import salle from './salle.jpeg';
import suite from './suite.jpg';
import spa2 from './spa2.jpg';
import golf from './golf.jpg';
import jetski from './jetski.jpg';
import catamaran from './catamaran.jpg';
import park from './park.jpg';
import TT from './TT.png';
import unimed from './unimed.png';
import total from './total.png';
import man from './man.jpg';
import logoroyal from './logoroyal.png';

// Update the interface to include new images
interface Images {
    addImage: string;
    argent: string;
    artisan: string;
    avatar: string;
    blog1: string;
    blog2: string;
    blog3: string;
    breadcrumbBg: string;
    calander: string;
    carousel1: string;
    carousel2: string;
    carousel3: string;
    carteProfessionnelle: string;
    carteProfessionnelVideEtnafes: string;
    destination1: string;
    destination2: string;
    destination3: string;
    destination4: string;
    destination5: string;
    destination6: string;
    destination7: string;
    destination8: string;
    destination9: string;
    editProperty: string;
    exploreTour1: string;
    exploreTour2: string;
    exploreTour3: string;
    exploreTour4: string;
    exploreTour5: string;
    exploreTour6: string;
    femme: string;
    guide1: string;
    guide2: string;
    guide3: string;
    guide4: string;
    hedi: string;
    homme: string;
    hour: string;
    logo: string;
    map: string;
    mood: string;
    packages1: string;
    packages2: string;
    packages3: string;
    packages4: string;
    people: string;
    reactSvg: string;
    testimonial1: string;
    testimonial2: string;
    testimonial3: string;
    testimonial4: string;
    tourBookingBg: string;
    yoga: string;
    zaghouen: string;
    dislike: string;
    etnafesTnDislike: string;
    etnafesTnLike: string;
    like: string;
    image360DarHssine: string;
    calque3: string;
    calque0: string;
    calque1: string;
    f360: string;
    fr360: string;
    free360: string;
    free360_: string;
    profDarHssine: string;
    airConditioner: string;
    bath: string;
    bedEtnafes: string;
    computer: string;
    espaceEnfant: string;
    heating: string;
    iconPositionMaison: string;
    kitchen: string;
    personMaleEtnafes: string;
    tumbleDry: string;
    typeHoteIcon: string;
    visible: string;
    waterHeater: string;
    wifi: string;
    etape1: string;
    etape2: string;
    etape3: string;
    header: string;

    // NEW HOTEL IMAGES
    hotel1: string;
    hotel2: string;
    hotel3: string;
    hammam: string;
    spa: string;
    salle: string;
    suite: string;
    spa2: string;
    golf: string;
    jetski: string;
    catamaran: string;
    park: string;
    TT: string;
    unimed: string;
    total: string;
    man: string;
    logoroyal: string;
}

const images: Images = {
    header,
    addImage,
    argent,
    artisan,
    avatar,
    blog1,
    blog2,
    blog3,
    breadcrumbBg,
    calander,
    carousel1,
    carousel2,
    carousel3,
    carteProfessionnelle,
    carteProfessionnelVideEtnafes,
    destination1,
    destination2,
    destination3,
    destination4,
    destination5,
    destination6,
    destination7,
    destination8,
    destination9,
    editProperty,
    exploreTour1,
    exploreTour2,
    exploreTour3,
    exploreTour4,
    exploreTour5,
    exploreTour6,
    femme,
    guide1,
    guide2,
    guide3,
    guide4,
    hedi,
    homme,
    hour,
    logo,
    map,
    mood,
    packages1,
    packages2,
    packages3,
    packages4,
    people,
    reactSvg,
    testimonial1,
    testimonial2,
    testimonial3,
    testimonial4,
    tourBookingBg,
    yoga,
    zaghouen,
    dislike,
    etnafesTnDislike,
    etnafesTnLike,
    like,
    image360DarHssine,
    calque3,
    calque0,
    calque1,
    f360,
    fr360,
    free360,
    free360_,
    profDarHssine,
    airConditioner,
    bath,
    bedEtnafes,
    computer,
    espaceEnfant,
    heating,
    iconPositionMaison,
    kitchen,
    personMaleEtnafes,
    tumbleDry,
    typeHoteIcon,
    visible,
    waterHeater,
    wifi,
    etape1,
    etape2,
    etape3,

    // NEW IMAGES ADDED HERE
    hotel1,
    hotel2,
    hotel3,
    hammam,
    spa,
    salle,
    suite,
    spa2,
    golf,
    jetski,
    catamaran,
    park,
    TT,
    unimed,
    total,
    man,
    logoroyal,
};

export default images;