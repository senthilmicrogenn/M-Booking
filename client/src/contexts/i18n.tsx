import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';

// Supported languages
export const SUPPORTED_LANGUAGES = {
  en: { code: 'en', name: 'English', flag: '🇺🇸' },
  hi: { code: 'hi', name: 'हिंदी', flag: '🇮🇳' },
  es: { code: 'es', name: 'Español', flag: '🇪🇸' },
} as const;

export type LanguageCode = keyof typeof SUPPORTED_LANGUAGES;

// Translation interface
interface Translations {
  [key: string]: string | Translations;
}

// i18n Context interface
interface I18nContextType {
  currentLanguage: LanguageCode;
  setLanguage: (lang: LanguageCode) => void;
  t: (key: string, variables?: Record<string, string | number>) => string;
  languages: typeof SUPPORTED_LANGUAGES;
}

const I18nContext = createContext<I18nContextType | null>(null);

// Translation data
const translations: Record<LanguageCode, Translations> = {
  en: {
    // Navigation
    nav: {
      bookingPortal: 'Booking Portal',
      adminPanel: 'Admin Panel',
      myTrips: 'My Trips',
    },
    // Common
    common: {
      loading: 'Loading...',
      save: 'Save',
      cancel: 'Cancel',
      edit: 'Edit',
      delete: 'Delete',
      add: 'Add',
      search: 'Search',
      filter: 'Filter',
      back: 'Back',
      next: 'Next',
      previous: 'Previous',
      submit: 'Submit',
      select: 'Select',
      upload: 'Upload',
      download: 'Download',
      view: 'View',
      manage: 'Manage',
      settings: 'Settings',
      profile: 'Profile',
      logout: 'Logout',
      login: 'Login',
      signup: 'Sign Up',
      welcome: 'Welcome',
      language: 'Language',
    },
    // Booking Portal
    booking: {
      title: 'Book Your Perfect Trip',
      subtitle: 'Discover amazing destinations and create unforgettable memories',
      searchHotels: 'Search Hotels',
      searchFlights: 'Search Flights',
      searchTrains: 'Search Trains',
      searchBuses: 'Search Buses',
      checkIn: 'Check-in',
      checkOut: 'Check-out',
      guests: 'Guests',
      rooms: 'Rooms',
      destination: 'Destination',
      departure: 'Departure',
      arrival: 'Arrival',
      departureDate: 'Departure Date',
      returnDate: 'Return Date',
      passengers: 'Passengers',
      bookNow: 'Book Now',
      viewDetails: 'View Details',
      perNight: 'per night',
      available: 'Available',
      soldOut: 'Sold Out',
      bestPrice: 'Best Price',
      freeWifi: 'Free WiFi',
      freeBreakfast: 'Free Breakfast',
      swimmingPool: 'Swimming Pool',
      airConditioning: 'Air Conditioning',
      parking: 'Parking',
      gym: 'Gym',
    },
    // Admin Panel
    admin: {
      dashboard: 'Dashboard',
      bookings: 'Travel Bookings',
      properties: 'Property Master',
      inventory: 'Room Inventory',
      plans: 'Plan Masters',
      rates: 'Rate Master',
      currencies: 'Currency Master',
      ledger: 'General Ledger',
      subledger: 'Subledger Master',
      tariff: 'Tariff Setup',
      reports: 'Reports & Analytics',
      users: 'User Management',
      roles: 'Role Management',
      masterData: 'Master Data',
      integrations: 'System Integrations',
      totalBookings: 'Total Bookings',
      totalRevenue: 'Total Revenue',
      activeProperties: 'Active Properties',
      pendingApprovals: 'Pending Approvals',
    },
    // Property Management
    property: {
      addProperty: 'Add Property',
      editProperty: 'Edit Property',
      propertyName: 'Property Name',
      propertyType: 'Property Type',
      location: 'Location',
      address: 'Address',
      city: 'City',
      area: 'Area',
      pincode: 'PIN Code',
      description: 'Description',
      pricePerNight: 'Price per Night',
      currency: 'Currency',
      starRating: 'Star Rating',
      reviewRating: 'Review Rating',
      availability: 'Availability',
      roomTypes: 'Room Types',
      amenities: 'Amenities',
      policies: 'Policies',
      media: 'Media',
      photos: 'Photos',
      videos: 'Videos',
      approved: 'Approved',
      pending: 'Pending',
      rejected: 'Rejected',
    },
    // Room Management
    room: {
      roomType: 'Room Type',
      maxOccupancy: 'Max Occupancy',
      bedType: 'Bed Type',
      roomSize: 'Room Size',
      roomView: 'Room View',
      pricePerNight: 'Price per Night',
      availability: 'Availability',
      amenities: 'Room Amenities',
      photos: 'Room Photos',
      videos: 'Room Videos',
      uploadMedia: 'Upload Media',
      setAsMain: 'Set as Main',
      bedroom: 'Bedroom',
      washroom: 'Washroom',
      balcony: 'Balcony',
      livingArea: 'Living Area',
      kitchen: 'Kitchen',
      diningArea: 'Dining Area',
      outdoorSpace: 'Outdoor Space',
      commonArea: 'Common Area',
    },
    // Error Messages
    error: {
      general: 'Something went wrong. Please try again.',
      network: 'Network error. Please check your connection.',
      validation: 'Please check the form for errors.',
      required: 'This field is required.',
      invalidEmail: 'Please enter a valid email address.',
      invalidPhone: 'Please enter a valid phone number.',
      passwordTooShort: 'Password must be at least 8 characters.',
      passwordMismatch: 'Passwords do not match.',
    },
    // Success Messages
    success: {
      saved: 'Successfully saved!',
      updated: 'Successfully updated!',
      deleted: 'Successfully deleted!',
      uploaded: 'Successfully uploaded!',
      bookingConfirmed: 'Booking confirmed successfully!',
      profileUpdated: 'Profile updated successfully!',
    },
  },
  hi: {
    // Navigation
    nav: {
      bookingPortal: 'बुकिंग पोर्टल',
      adminPanel: 'एडमिन पैनल',
      myTrips: 'मेरी यात्राएं',
    },
    // Common
    common: {
      loading: 'लोड हो रहा है...',
      save: 'सेव करें',
      cancel: 'रद्द करें',
      edit: 'संपादित करें',
      delete: 'हटाएं',
      add: 'जोड़ें',
      search: 'खोजें',
      filter: 'फिल्टर',
      back: 'वापस',
      next: 'अगला',
      previous: 'पिछला',
      submit: 'सबमिट करें',
      select: 'चुनें',
      upload: 'अपलोड',
      download: 'डाउनलोड',
      view: 'देखें',
      manage: 'प्रबंधित करें',
      settings: 'सेटिंग्स',
      profile: 'प्रोफाइल',
      logout: 'लॉगआउट',
      login: 'लॉगिन',
      signup: 'साइन अप',
      welcome: 'स्वागत है',
      language: 'भाषा',
    },
    // Booking Portal
    booking: {
      title: 'अपनी परफेक्ट ट्रिप बुक करें',
      subtitle: 'अद्भुत गंतव्यों की खोज करें और अविस्मरणीय यादें बनाएं',
      searchHotels: 'होटल खोजें',
      searchFlights: 'फ्लाइट खोजें',
      searchTrains: 'ट्रेन खोजें',
      searchBuses: 'बस खोजें',
      checkIn: 'चेक-इन',
      checkOut: 'चेक-आउट',
      guests: 'मेहमान',
      rooms: 'कमरे',
      destination: 'गंतव्य',
      departure: 'प्रस्थान',
      arrival: 'आगमन',
      departureDate: 'प्रस्थान तिथि',
      returnDate: 'वापसी तिथि',
      passengers: 'यात्री',
      bookNow: 'अभी बुक करें',
      viewDetails: 'विवरण देखें',
      perNight: 'प्रति रात',
      available: 'उपलब्ध',
      soldOut: 'बुक हो गया',
      bestPrice: 'सर्वोत्तम मूल्य',
      freeWifi: 'मुफ्त वाईफाई',
      freeBreakfast: 'मुफ्त नाश्ता',
      swimmingPool: 'स्विमिंग पूल',
      airConditioning: 'एयर कंडीशनिंग',
      parking: 'पार्किंग',
      gym: 'जिम',
    },
    // Admin Panel
    admin: {
      dashboard: 'डैशबोर्ड',
      bookings: 'यात्रा बुकिंग',
      properties: 'प्रॉपर्टी मास्टर',
      inventory: 'कक्ष इन्वेंटरी',
      plans: 'प्लान मास्टर',
      rates: 'रेट मास्टर',
      currencies: 'करेंसी मास्टर',
      ledger: 'जनरल लेजर',
      subledger: 'सबलेजर मास्टर',
      tariff: 'टैरिफ सेटअप',
      reports: 'रिपोर्ट्स और एनालिटिक्स',
      users: 'यूजर मैनेजमेंट',
      roles: 'रोल मैनेजमेंट',
      masterData: 'मास्टर डेटा',
      integrations: 'सिस्टम इंटीग्रेशन',
      totalBookings: 'कुल बुकिंग',
      totalRevenue: 'कुल राजस्व',
      activeProperties: 'सक्रिय प्रॉपर्टी',
      pendingApprovals: 'लंबित अनुमोदन',
    },
    // Property Management
    property: {
      addProperty: 'प्रॉपर्टी जोड़ें',
      editProperty: 'प्रॉपर्टी संपादित करें',
      propertyName: 'प्रॉपर्टी का नाम',
      propertyType: 'प्रॉपर्टी का प्रकार',
      location: 'स्थान',
      address: 'पता',
      city: 'शहर',
      area: 'क्षेत्र',
      pincode: 'पिन कोड',
      description: 'विवरण',
      pricePerNight: 'प्रति रात मूल्य',
      currency: 'मुद्रा',
      starRating: 'स्टार रेटिंग',
      reviewRating: 'समीक्षा रेटिंग',
      availability: 'उपलब्धता',
      roomTypes: 'कक्ष प्रकार',
      amenities: 'सुविधाएं',
      policies: 'नीतियां',
      media: 'मीडिया',
      photos: 'फोटो',
      videos: 'वीडियो',
      approved: 'अनुमोदित',
      pending: 'लंबित',
      rejected: 'अस्वीकृत',
    },
    // Room Management
    room: {
      roomType: 'कक्ष प्रकार',
      maxOccupancy: 'अधिकतम क्षमता',
      bedType: 'बेड का प्रकार',
      roomSize: 'कक्ष का आकार',
      roomView: 'कक्ष का दृश्य',
      pricePerNight: 'प्रति रात मूल्य',
      availability: 'उपलब्धता',
      amenities: 'कक्ष सुविधाएं',
      photos: 'कक्ष फोटो',
      videos: 'कक्ष वीडियो',
      uploadMedia: 'मीडिया अपलोड करें',
      setAsMain: 'मुख्य के रूप में सेट करें',
      bedroom: 'शयनकक्ष',
      washroom: 'शौचालय',
      balcony: 'बालकनी',
      livingArea: 'बैठक क्षेत्र',
      kitchen: 'रसोई',
      diningArea: 'भोजन क्षेत्र',
      outdoorSpace: 'बाहरी स्थान',
      commonArea: 'सामान्य क्षेत्र',
    },
    // Error Messages
    error: {
      general: 'कुछ गलत हुआ। कृपया पुनः प्रयास करें।',
      network: 'नेटवर्क त्रुटि। कृपया अपना कनेक्शन जांचें।',
      validation: 'कृपया त्रुटियों के लिए फॉर्म जांचें।',
      required: 'यह फील्ड आवश्यक है।',
      invalidEmail: 'कृपया एक वैध ईमेल पता दर्ज करें।',
      invalidPhone: 'कृपया एक वैध फोन नंबर दर्ज करें।',
      passwordTooShort: 'पासवर्ड कम से कम 8 अक्षर का होना चाहिए।',
      passwordMismatch: 'पासवर्ड मेल नहीं खाते।',
    },
    // Success Messages
    success: {
      saved: 'सफलतापूर्वक सेव किया गया!',
      updated: 'सफलतापूर्वक अपडेट किया गया!',
      deleted: 'सफलतापूर्वक हटाया गया!',
      uploaded: 'सफलतापूर्वक अपलोड किया गया!',
      bookingConfirmed: 'बुकिंग सफलतापूर्वक पुष्ट!',
      profileUpdated: 'प्रोफाइल सफलतापूर्वक अपडेट!',
    },
  },
  es: {
    // Navigation
    nav: {
      bookingPortal: 'Portal de Reservas',
      adminPanel: 'Panel de Administración',
      myTrips: 'Mis Viajes',
    },
    // Common
    common: {
      loading: 'Cargando...',
      save: 'Guardar',
      cancel: 'Cancelar',
      edit: 'Editar',
      delete: 'Eliminar',
      add: 'Agregar',
      search: 'Buscar',
      filter: 'Filtrar',
      back: 'Atrás',
      next: 'Siguiente',
      previous: 'Anterior',
      submit: 'Enviar',
      select: 'Seleccionar',
      upload: 'Subir',
      download: 'Descargar',
      view: 'Ver',
      manage: 'Gestionar',
      settings: 'Configuración',
      profile: 'Perfil',
      logout: 'Cerrar Sesión',
      login: 'Iniciar Sesión',
      signup: 'Registrarse',
      welcome: 'Bienvenido',
      language: 'Idioma',
    },
    // Booking Portal
    booking: {
      title: 'Reserva Tu Viaje Perfecto',
      subtitle: 'Descubre destinos increíbles y crea recuerdos inolvidables',
      searchHotels: 'Buscar Hoteles',
      searchFlights: 'Buscar Vuelos',
      searchTrains: 'Buscar Trenes',
      searchBuses: 'Buscar Autobuses',
      checkIn: 'Check-in',
      checkOut: 'Check-out',
      guests: 'Huéspedes',
      rooms: 'Habitaciones',
      destination: 'Destino',
      departure: 'Salida',
      arrival: 'Llegada',
      departureDate: 'Fecha de Salida',
      returnDate: 'Fecha de Regreso',
      passengers: 'Pasajeros',
      bookNow: 'Reservar Ahora',
      viewDetails: 'Ver Detalles',
      perNight: 'por noche',
      available: 'Disponible',
      soldOut: 'Agotado',
      bestPrice: 'Mejor Precio',
      freeWifi: 'WiFi Gratis',
      freeBreakfast: 'Desayuno Gratis',
      swimmingPool: 'Piscina',
      airConditioning: 'Aire Acondicionado',
      parking: 'Estacionamiento',
      gym: 'Gimnasio',
    },
    // Admin Panel
    admin: {
      dashboard: 'Panel de Control',
      bookings: 'Reservas de Viaje',
      properties: 'Master de Propiedades',
      inventory: 'Inventario de Habitaciones',
      plans: 'Master de Planes',
      rates: 'Master de Tarifas',
      currencies: 'Master de Monedas',
      ledger: 'Libro Mayor General',
      subledger: 'Master de Sublibros',
      tariff: 'Configuración de Tarifas',
      reports: 'Reportes y Análisis',
      users: 'Gestión de Usuarios',
      roles: 'Gestión de Roles',
      masterData: 'Datos Maestros',
      integrations: 'Integraciones del Sistema',
      totalBookings: 'Total de Reservas',
      totalRevenue: 'Ingresos Totales',
      activeProperties: 'Propiedades Activas',
      pendingApprovals: 'Aprobaciones Pendientes',
    },
    // Property Management
    property: {
      addProperty: 'Agregar Propiedad',
      editProperty: 'Editar Propiedad',
      propertyName: 'Nombre de la Propiedad',
      propertyType: 'Tipo de Propiedad',
      location: 'Ubicación',
      address: 'Dirección',
      city: 'Ciudad',
      area: 'Área',
      pincode: 'Código Postal',
      description: 'Descripción',
      pricePerNight: 'Precio por Noche',
      currency: 'Moneda',
      starRating: 'Clasificación de Estrellas',
      reviewRating: 'Calificación de Reseñas',
      availability: 'Disponibilidad',
      roomTypes: 'Tipos de Habitación',
      amenities: 'Comodidades',
      policies: 'Políticas',
      media: 'Multimedia',
      photos: 'Fotos',
      videos: 'Videos',
      approved: 'Aprobado',
      pending: 'Pendiente',
      rejected: 'Rechazado',
    },
    // Room Management
    room: {
      roomType: 'Tipo de Habitación',
      maxOccupancy: 'Ocupación Máxima',
      bedType: 'Tipo de Cama',
      roomSize: 'Tamaño de Habitación',
      roomView: 'Vista de la Habitación',
      pricePerNight: 'Precio por Noche',
      availability: 'Disponibilidad',
      amenities: 'Comodidades de la Habitación',
      photos: 'Fotos de la Habitación',
      videos: 'Videos de la Habitación',
      uploadMedia: 'Subir Multimedia',
      setAsMain: 'Establecer como Principal',
      bedroom: 'Dormitorio',
      washroom: 'Baño',
      balcony: 'Balcón',
      livingArea: 'Área de Estar',
      kitchen: 'Cocina',
      diningArea: 'Área de Comedor',
      outdoorSpace: 'Espacio Exterior',
      commonArea: 'Área Común',
    },
    // Error Messages
    error: {
      general: 'Algo salió mal. Por favor, inténtalo de nuevo.',
      network: 'Error de red. Por favor, verifica tu conexión.',
      validation: 'Por favor, revisa el formulario en busca de errores.',
      required: 'Este campo es obligatorio.',
      invalidEmail: 'Por favor, ingresa una dirección de correo válida.',
      invalidPhone: 'Por favor, ingresa un número de teléfono válido.',
      passwordTooShort: 'La contraseña debe tener al menos 8 caracteres.',
      passwordMismatch: 'Las contraseñas no coinciden.',
    },
    // Success Messages
    success: {
      saved: '¡Guardado exitosamente!',
      updated: '¡Actualizado exitosamente!',
      deleted: '¡Eliminado exitosamente!',
      uploaded: '¡Subido exitosamente!',
      bookingConfirmed: '¡Reserva confirmada exitosamente!',
      profileUpdated: '¡Perfil actualizado exitosamente!',
    },
  },
};

// Helper function to get nested translation
const getNestedTranslation = (obj: Translations, path: string[]): string => {
  let current: any = obj;
  for (const key of path) {
    if (current && typeof current === 'object' && key in current) {
      current = current[key];
    } else {
      return '';
    }
  }
  return typeof current === 'string' ? current : '';
};

// Translation function with variable interpolation
const translate = (
  translations: Translations,
  key: string,
  variables?: Record<string, string | number>
): string => {
  const keys = key.split('.');
  let translation = getNestedTranslation(translations, keys);
  
  if (!translation) {
    console.warn(`Translation missing for key: ${key}`);
    return key; // Return the key if translation is not found
  }
  
  // Replace variables in translation
  if (variables) {
    Object.entries(variables).forEach(([varKey, varValue]) => {
      translation = translation.replace(new RegExp(`{{${varKey}}}`, 'g'), String(varValue));
    });
  }
  
  return translation;
};

interface I18nProviderProps {
  children: ReactNode;
}

export function I18nProvider({ children }: I18nProviderProps) {
  const [currentLanguage, setCurrentLanguage] = useState<LanguageCode>(() => {
    // Get language from localStorage or default to English
    const savedLanguage = localStorage.getItem('preferred-language') as LanguageCode;
    return savedLanguage && savedLanguage in SUPPORTED_LANGUAGES ? savedLanguage : 'en';
  });

  const setLanguage = (lang: LanguageCode) => {
    setCurrentLanguage(lang);
    localStorage.setItem('preferred-language', lang);
    
    // Update document language attribute for accessibility
    document.documentElement.lang = lang;
  };

  const t = (key: string, variables?: Record<string, string | number>): string => {
    return translate(translations[currentLanguage], key, variables);
  };

  useEffect(() => {
    // Set initial document language
    document.documentElement.lang = currentLanguage;
  }, [currentLanguage]);

  const value: I18nContextType = {
    currentLanguage,
    setLanguage,
    t,
    languages: SUPPORTED_LANGUAGES,
  };

  return (
    <I18nContext.Provider value={value}>
      {children}
    </I18nContext.Provider>
  );
}

// Hook to use i18n context
export function useI18n(): I18nContextType {
  const context = useContext(I18nContext);
  if (!context) {
    throw new Error('useI18n must be used within an I18nProvider');
  }
  return context;
}