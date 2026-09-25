
// --- VARIABLES GLOBALES ---
let carDatabase = [];
let currentSearchTerm = "";
let selectedCarForBooking = null;
let phoneInputIti = null;
const WHATSAPP_NUMBER = "243997708115";
const AGENCE_ADDRESS = "5573. AV. KAUKA COMMUNE DE LA GOMBE\nREF: IMMEUBLE MAISHA PARK, ARRET : ROYAL";

// --- INITIALISATION ---
document.addEventListener('DOMContentLoaded', async () => {
    initMobileMenu();
    await fetchAllCars();
    routeLogic();
});

function initMobileMenu() {
    const btn = document.getElementById('mobileMenuBtn');
    const menu = document.getElementById('mobileMenu');
    if (btn && menu) {
        btn.addEventListener('click', () => {
            menu.classList.toggle('hidden'); 
            menu.classList.toggle('flex');
        });
    }
}

async function fetchAllCars() {
    try {
        const { data } = await window.supabaseClient.from('cars').select('*').order('id', { ascending: false });
        carDatabase = data || [];
    } catch (error) {
        console.error("Erreur de chargement des véhicules:", error);
    }
}

function routeLogic() {
    const path = window.location.pathname;
    const spinner = document.getElementById('loading-spinner') || document.getElementById('carousel-spinner');
    if(spinner) spinner.classList.add('hidden');

    if (document.getElementById('carousel-grid')) {
        initIndexPage();
    } 
    if (path.includes('aeroport') || document.getElementById('aeroport-page-marker')) {
        initAirportPage();
    } 
    if (document.getElementById('catalog-search')) {
        initCatalogPage();
    }
}

// --- UTILITAIRES PARTAGÉS ---
function initPhoneInput(inputId) {
    const phoneInput = document.getElementById(inputId);
    if (phoneInput && window.intlTelInput && !phoneInputIti) {
        try { 
            phoneInputIti = window.intlTelInput(phoneInput, { 
                initialCountry: "cd", 
                separateDialCode: true, 
                utilsScript: "https://cdnjs.cloudflare.com/ajax/libs/intl-tel-input/17.0.19/js/utils.js" 
            }); 
        } catch(err) { console.error(err); }
    }
}

function sendWhatsAppMessage(message) {
    const whatsappUrl = `https://wa.me/${WHATSAPP_NUMBER}?text=${encodeURIComponent(message)}`;
    if (!window.open(whatsappUrl, '_blank')) window.location.href = whatsappUrl;
}

window.closeBookingModal = function() { 
    document.getElementById('booking-modal').classList.add('hidden'); 
};

window.closeDetailsModal = function() {
    document.getElementById('car-details-modal').classList.add('hidden'); 
};

// Fonction pour envoyer l'email via FormSubmit
window.sendBookingToEmail = async function(data, subject) {
    try {
        await fetch("https://formsubmit.co/ajax/contact@mutukrentals.com", {
            method: "POST",
            headers: { 
                'Content-Type': 'application/json',
                'Accept': 'application/json'
            },
            body: JSON.stringify({
                _subject: subject,
                ...data
            })
        });
    } catch (err) {
        console.error("Erreur envoi email :", err);
    }
};


// --- MODAL DÉTAILS COMMUN ---
window.openCarDetailsModal = function(index) {
    const car = carDatabase[index]; 
    if (!car) return;
    selectedCarForBooking = car;
    const images = (car.images && car.images.length > 0) ? car.images : [car.image_url || 'https://placehold.co/600x400'];

    const isAirport = window.location.pathname.includes('aeroport') || document.getElementById('aeroport-page-marker');

    document.getElementById('detail-title').innerText = `${car.marque} ${car.modele}`;
    
    let priceDisplay = '';
    if (isAirport) {
        priceDisplay = car.prix_aeroport ? car.prix_aeroport : 'Sur demande';
        if(priceDisplay !== 'Sur demande' && !priceDisplay.includes('$')) priceDisplay += '$';
    } else {
        priceDisplay = car.prix_jour ? (car.prix_jour.includes('$') ? car.prix_jour : `${car.prix_jour}$`) : 'Sur devis';
    }
    
    document.getElementById('detail-price').innerText = priceDisplay;
    document.getElementById('detail-category-badge').innerText = isAirport ? 'AÉROPORT' : car.categorie.toUpperCase().replace('_', ' ');
    document.getElementById('detail-seats').innerText = car.places || 5;
    document.getElementById('detail-boite').innerText = car.boite || 'Automatique';
    document.getElementById('detail-fuel').innerText = car.carburant || 'Essence';
    document.getElementById('detail-desc').innerText = car.description || "Véhicule VIP d'exception disponible à Kinshasa.";
    document.getElementById('detail-main-img').src = images[0];
    
    const thumbsContainer = document.getElementById('detail-thumbs');
    thumbsContainer.innerHTML = "";
    images.slice(0, 5).forEach((imgSrc) => {
        thumbsContainer.innerHTML += `<img src="${imgSrc}" onclick="document.getElementById('detail-main-img').src='${imgSrc}'" class="h-14 w-16 md:h-16 md:w-20 object-cover rounded-lg border-2 border-transparent hover:border-mutuk-blue cursor-pointer transition">`;
    });

    const btnReserver = document.getElementById('btn-reserver-details');
    if (isAirport) {
        btnReserver.onclick = openAirportBookingFormFromDetails;
    } else {
        btnReserver.onclick = openBookingFormFromDetails;
    }

    document.getElementById('car-details-modal').classList.remove('hidden');
};

window.openBookingFormFromDetails = function() {
    window.closeDetailsModal();
    if (!selectedCarForBooking) return;
    document.getElementById('booking-car-name').value = `${selectedCarForBooking.marque} ${selectedCarForBooking.modele}`;
    document.getElementById('booking-date').valueAsDate = new Date();
    document.getElementById('booking-modal').classList.remove('hidden');
    initPhoneInput("booking-client-phone");
};

window.openAirportBookingFormFromDetails = function() {
    window.closeDetailsModal();
    if (!selectedCarForBooking) return;
    document.getElementById('booking-car-name').value = `${selectedCarForBooking.marque} ${selectedCarForBooking.modele}`;
    document.getElementById('booking-date').valueAsDate = new Date();
    document.getElementById('booking-modal').classList.remove('hidden');
    initPhoneInput("booking-client-phone");
};

// ==========================================
// LOGIQUE : PAGE ACCUEIL (index.html)
// ==========================================
function initIndexPage() {
    const mainForm = document.getElementById('mainSearchForm');
    if (mainForm) {
        mainForm.addEventListener('submit', function(e) {
            e.preventDefault();
            window.location.href = `catalogue.html?recherche=${encodeURIComponent(document.getElementById('search-car').value)}`;
        });
    }

    const grid = document.getElementById('carousel-grid');
    if(!grid) return;
    
    let featured = carDatabase.filter(car => car.is_featured).slice(0, 6);
    if (featured.length === 0) featured = carDatabase.slice(0, 6);

    grid.innerHTML = "";
    featured.forEach((car) => {
        const originalIndex = carDatabase.findIndex(c => c.id === car.id);
        const price = car.prix_jour ? (car.prix_jour.includes('$') ? car.prix_jour : `${car.prix_jour}$`) : 'Sur devis';
        const coverImg = (car.images && car.images.length > 0) ? car.images[0] : (car.image_url || 'https://placehold.co/600x400');
    
grid.innerHTML += `
<div class="min-w-[85vw] sm:min-w-[320px] md:min-w-[360px] snap-center bg-white rounded-2xl shadow-sm border border-gray-100 flex flex-col overflow-hidden hover:shadow-lg transition-all duration-300">
    <div class="h-52 sm:h-56 md:h-60 relative bg-gray-900 cursor-pointer overflow-hidden group" onclick="openCarDetailsModal(${originalIndex})">
        <!-- Image adaptée : object-cover avec centrage optimisé -->
        <img src="${coverImg}" alt="${car.marque}" class="w-full h-full object-cover object-center group-hover:scale-105 transition-transform duration-500">
        <!-- Dégradé sombre en bas de l'image pour faire ressortir le visuel -->
        <div class="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-black/20 pointer-events-none"></div>
        <span class="absolute top-3 left-3 bg-white/90 backdrop-blur-md text-gray-900 text-[10px] md:text-xs font-bold px-2.5 py-1 rounded-full uppercase tracking-wider shadow-sm">${car.categorie.replace('_',' ')}</span>
    </div>
    <div class="p-4 md:p-5 flex-1 flex flex-col justify-between">
        <div>
            <h3 class="font-display text-base md:text-xl font-bold text-gray-900 cursor-pointer hover:text-mutuk-blue transition-colors" onclick="openCarDetailsModal(${originalIndex})">${car.marque} ${car.modele}</h3>
            <div class="flex items-center gap-4 text-xs font-semibold text-gray-500 my-3">
                <span class="flex items-center gap-1.5 bg-gray-50 px-2 py-1 rounded-md"><span class="material-symbols-outlined text-[16px] text-mutuk-blue">event_seat</span> ${car.places || 5} places</span>
                <span class="flex items-center gap-1.5 bg-gray-50 px-2 py-1 rounded-md"><span class="material-symbols-outlined text-[16px] text-mutuk-blue">settings</span> ${car.boite || 'Auto'}</span>
            </div>
        </div>
        <div class="flex justify-between items-center pt-3 border-t border-gray-100 mt-2">
            <div>
                <span class="block text-[10px] text-gray-400 font-bold uppercase tracking-wider">À partir de</span>
                <span class="block text-lg md:text-2xl font-black text-mutuk-blue">${price}</span>
            </div>
            <button onclick="openCarDetailsModal(${originalIndex})" class="bg-mutuk-blue text-white font-bold px-4 py-2 rounded-xl text-xs md:text-sm hover:bg-mutuk-dark transition-colors shadow-sm">Réserver</button>
        </div>
    </div>
</div>`;
    });
    grid.classList.remove('hidden');
    initDiaphragmControls();
}

// --- SYSTÈME DE DÉPLACEMENT DU DIAPHRAGME (CARROUSEL) ---
window.scrollDiaphragm = function(direction) {
    const container = document.getElementById('carousel-grid');
    if (!container) return;
    const scrollAmount = container.clientWidth * 0.75;
    container.scrollBy({
        left: direction === 'left' ? -scrollAmount : scrollAmount,
        behavior: 'smooth'
    });
};

function initDiaphragmControls() {
    const container = document.getElementById('carousel-grid');
    if (!container) return;

    let isDown = false;
    let startX;
    let scrollLeft;

    container.addEventListener('mousedown', (e) => {
        isDown = true;
        container.classList.add('cursor-grabbing');
        startX = e.pageX - container.offsetLeft;
        scrollLeft = container.scrollLeft;
    });

    container.addEventListener('mouseleave', () => {
        isDown = false;
        container.classList.remove('cursor-grabbing');
    });

    container.addEventListener('mouseup', () => {
        isDown = false;
        container.classList.remove('cursor-grabbing');
    });

    container.addEventListener('mousemove', (e) => {
        if (!isDown) return;
        e.preventDefault();
        const x = e.pageX - container.offsetLeft;
        const walk = (x - startX) * 2;
        container.scrollLeft = scrollLeft - walk;
    });
}

window.goToCatalog = function(cat) { 
    window.location.href = `catalogue.html?categorie=${encodeURIComponent(cat)}`;
};


// ==========================================
// LOGIQUE : PAGE CATALOGUE (catalogue.html)
// ==========================================
function initCatalogPage() {
    const params = new URLSearchParams(window.location.search);
    const searchParam = params.get('recherche');
    const catParam = params.get('categorie');
    
    if (searchParam) {
        currentSearchTerm = searchParam;
        document.getElementById('catalog-search').value = searchParam;
        window.filterCars('tout'); 
    } else if (catParam) {
        const buttons = document.querySelectorAll('.filter-btn');
        buttons.forEach(btn => { if (btn.getAttribute('onclick').includes(catParam)) btn.click(); });
    } else { 
        renderCatalogCards(carDatabase); 
    }
}

function getFilteredCars() {
    const activeBtn = document.querySelector('.filter-btn.active');
    let category = 'tout';
    if (activeBtn && activeBtn.getAttribute('onclick')) {
        const match = activeBtn.getAttribute('onclick').match(/'(.*?)'/);
        if(match) category = match[1];
    }
    let filtered = carDatabase;
    if (category !== 'tout') { filtered = filtered.filter(car => car.categorie === category); }
    if (currentSearchTerm !== "") {
        filtered = filtered.filter(car => car.marque.toLowerCase().includes(currentSearchTerm.toLowerCase()) || car.modele.toLowerCase().includes(currentSearchTerm.toLowerCase()));
    }
    return filtered;
}

function renderCatalogCards(carsToDisplay) {
    const grid = document.getElementById('cars-grid');
    const noResults = document.getElementById('no-results');
    if(!grid) return;

    grid.innerHTML = "";
    if (carsToDisplay.length === 0) { grid.classList.add('hidden'); noResults.classList.remove('hidden'); return; }
    
    grid.classList.remove('hidden'); 
    grid.style.display = 'grid'; 
    noResults.classList.add('hidden');

    carsToDisplay.forEach((car) => {
        const originalIndex = carDatabase.findIndex(c => c.id === car.id);
        const coverImg = (car.images && car.images.length > 0) ? car.images[0] : (car.image_url || 'https://placehold.co/600x400');
        const priceDisplay = car.prix_jour ? (car.prix_jour.includes('$') ? car.prix_jour : `${car.prix_jour}$`) : 'Sur devis';
        
        grid.innerHTML += `
        <div class="bg-white rounded-lg md:rounded-xl shadow-sm border border-gray-100 flex flex-col overflow-hidden hover:shadow-md transition-shadow">
            <div class="h-32 sm:h-40 md:h-48 relative bg-gray-100 cursor-pointer" onclick="openCarDetailsModal(${originalIndex})">
                <img src="${coverImg}" alt="${car.marque}" class="w-full h-full object-cover">
                <span class="absolute top-1.5 left-1.5 bg-gray-900/80 text-white text-[9px] md:text-[10px] font-bold px-1.5 py-0.5 rounded uppercase backdrop-blur-sm">${car.categorie.replace('_',' ')}</span>
            </div>
            <div class="p-2.5 sm:p-3 md:p-4 flex-1 flex flex-col">
                <h3 class="font-display text-xs sm:text-base md:text-lg font-bold text-gray-900 cursor-pointer truncate" onclick="openCarDetailsModal(${originalIndex})">${car.marque} ${car.modele}</h3>
                <div class="flex items-center gap-2 md:gap-3 text-[10px] md:text-xs font-bold text-gray-500 my-1.5 md:my-3">
                    <span class="flex items-center gap-0.5"><span class="material-symbols-outlined text-[13px] md:text-[16px] text-mutuk-blue">event_seat</span> ${car.places || 5}</span>
                    <span class="flex items-center gap-0.5"><span class="material-symbols-outlined text-[13px] md:text-[16px] text-mutuk-blue">settings</span> ${car.boite || 'Auto'}</span>
                </div>
                <div class="flex flex-col sm:flex-row sm:items-center justify-between mt-auto pt-2 border-t border-gray-50 gap-1">
                    <div><span class="block text-sm sm:text-lg md:text-xl font-extrabold text-mutuk-blue">${priceDisplay}</span></div>
                    <button onclick="openCarDetailsModal(${originalIndex})" class="bg-gray-100 text-mutuk-blue font-bold px-2 py-1 md:px-3 md:py-1.5 rounded-md md:rounded-lg text-[10px] sm:text-xs hover:bg-mutuk-blue hover:text-white transition-colors">Réserver</button>
                </div>
            </div>
        </div>`;
    });
}

window.handleCatalogSearch = function() {
    currentSearchTerm = document.getElementById('catalog-search').value.trim();
    if(currentSearchTerm !== "") {
        document.getElementById('search-indicator').classList.remove('hidden');
        document.getElementById('search-term').innerText = currentSearchTerm;
    } else { 
        document.getElementById('search-indicator').classList.add('hidden'); 
    }
    renderCatalogCards(getFilteredCars());
};

window.filterCars = function(category, btnElement) {
    document.querySelectorAll('.filter-btn').forEach(btn => btn.classList.remove('active'));
    if(btnElement) btnElement.classList.add('active');
    renderCatalogCards(getFilteredCars());
};

window.clearSearch = function() {
    currentSearchTerm = ""; 
    document.getElementById('catalog-search').value = "";
    document.getElementById('search-indicator').classList.add('hidden'); 
    renderCatalogCards(getFilteredCars());
};

window.toggleLocationInput = function(type) {
    const select = document.getElementById(`booking-${type}-type`);
    const textarea = document.getElementById(`booking-${type}-address`);
    if (select.value === 'agence') {
        textarea.value = AGENCE_ADDRESS; textarea.readOnly = true; textarea.classList.add('bg-slate-100', 'text-slate-600');
    } else {
        textarea.value = ""; textarea.readOnly = false; textarea.placeholder = "Entrez l'adresse exacte...";
        textarea.classList.remove('bg-slate-100', 'text-slate-600'); textarea.focus();
    }
};

window.handleBookingFormSubmit = async function(e) {
    e.preventDefault();
    try {
        const carName = document.getElementById('booking-car-name').value;
        const clientName = document.getElementById('booking-client-name').value;
        const depart = document.getElementById('booking-depart-address').value;
        const arrivee = document.getElementById('booking-arrivee-address').value;
        let clientPhone = phoneInputIti && typeof phoneInputIti.getNumber === 'function' ? phoneInputIti.getNumber() : document.getElementById('booking-client-phone').value;
        const date = document.getElementById('booking-date').value;
        const days = document.getElementById('booking-days').value;
        const time = document.getElementById('booking-time').value;

        // 1. Envoi par e-mail
        await sendBookingToEmail({
            Vehicule: carName, Nom: clientName, Telephone: clientPhone,
            Depart: depart, Arrivee: arrivee, Date: date, Heure: time, Duree: `${days} jour(s)`
        }, `Réservation Express - ${carName}`);

        // 2. Message WhatsApp
        const message = `RÉSERVATION EXPRESS\n\n[Véhicule] ${carName}\n[Nom] ${clientName}\n[Téléphone] ${clientPhone}\n[Lieu de départ] ${depart}\n[Lieu d'arrivée] ${arrivee}\n[Date] ${date}\n[Heure] ${time}\n[Durée] ${days} jour(s)\n\nMerci de me confirmer la disponibilité.`;
        sendWhatsAppMessage(message);
        window.closeBookingModal();
    } catch (err) { alert("Erreur lors de la réservation."); }
};


// ==========================================
// LOGIQUE : PAGE AÉROPORT (aeroport.html)
// ==========================================
function initAirportPage() {
    const grid = document.getElementById('cars-grid');
    if(!grid) return;
    grid.innerHTML = "";
    grid.classList.remove('hidden');

    carDatabase.forEach((car, index) => {
        const originalIndex = carDatabase.findIndex(c => c.id === car.id);
        const coverImg = (car.images && car.images.length > 0) ? car.images[0] : (car.image_url || 'https://placehold.co/600x400');
        let priceDisplay = car.prix_aeroport ? car.prix_aeroport : 'Sur demande';
        if(priceDisplay !== 'Sur demande' && !priceDisplay.includes('$')) priceDisplay += '$';

        grid.innerHTML += `
        <div class="bg-white rounded-lg md:rounded-xl shadow-sm border border-gray-100 flex flex-col overflow-hidden hover:shadow-md transition-shadow">
            <div class="h-32 sm:h-40 md:h-48 relative bg-gray-100 cursor-pointer" onclick="openCarDetailsModal(${originalIndex})">
                <img src="${coverImg}" alt="${car.marque}" class="w-full h-full object-cover">
                <span class="absolute top-1.5 left-1.5 bg-gray-900/80 text-white text-[9px] md:text-[10px] font-bold px-1.5 py-0.5 rounded uppercase backdrop-blur-sm">Aéroport</span>
            </div>
            <div class="p-3 md:p-4 flex-1 flex flex-col text-center md:text-left">
                <h3 class="font-display text-sm md:text-lg font-bold text-gray-900 cursor-pointer truncate" onclick="openCarDetailsModal(${originalIndex})">${car.marque} ${car.modele}</h3>
                <p class="text-[10px] md:text-xs text-gray-500 mt-1 mb-3 hidden md:block">Jusqu'à ${car.places || 5} passagers</p>
                <div class="mt-auto pt-3 border-t border-gray-50 flex flex-col md:flex-row items-center justify-between gap-3">
                    <div class="text-center md:text-left">
                        <span class="block text-[10px] text-gray-400 font-bold uppercase">Le transfert</span>
                        <span class="block text-lg md:text-2xl font-extrabold text-mutuk-blue">${priceDisplay}</span>
                    </div>
                    <button onclick="openCarDetailsModal(${originalIndex})" class="w-full md:w-auto bg-mutuk-blue text-white font-bold px-4 py-2 rounded-lg text-xs hover:bg-mutuk-dark transition-colors">Réserver</button>
                </div>
            </div>
        </div>`;
    });
}

window.handleAirportBooking = async function(e) {
    e.preventDefault();
    try {
        const carName = document.getElementById('booking-car-name').value;
        const clientName = document.getElementById('booking-client-name').value;
        const pickup = document.getElementById('booking-pickup').value;
        const dropoff = document.getElementById('booking-dropoff').value;
        let clientPhone = phoneInputIti && typeof phoneInputIti.getNumber === 'function' ? phoneInputIti.getNumber() : document.getElementById('booking-client-phone').value;
        const date = document.getElementById('booking-date').value;
        const time = document.getElementById('booking-time').value;

        // 1. Envoi par e-mail
        await sendBookingToEmail({
            Vehicule: carName, Nom: clientName, Telephone: clientPhone,
            Prise_En_Charge: pickup, Destination: dropoff, Date: date, Heure: time
        }, `Navette Aéroport - ${carName}`);

        // 2. Message WhatsApp
        const message = `RÉSERVATION TRANSFERT AÉROPORT\n\n[Véhicule] ${carName}\n[Nom] ${clientName}\n[Téléphone] ${clientPhone}\n[Prise en charge] ${pickup}\n[Destination] ${dropoff}\n[Date] ${date}\n[Heure] ${time}\n\nMerci de me confirmer la navette.`;
        sendWhatsAppMessage(message);
        window.closeBookingModal();
    } catch (err) { alert("Erreur lors de la réservation."); }
};

// ==========================================
// LOGIQUE : INSTALLATION PWA
// ==========================================
let deferredPrompt;
const installToast = document.getElementById('pwa-install-toast');
const installBtn = document.getElementById('pwa-install-btn');
const closeBtn = document.getElementById('pwa-close-btn');

if (installToast && installBtn && closeBtn) {
    // 1. Écoute si l'appareil autorise l'installation (et si ce n'est pas déjà installé)
    window.addEventListener('beforeinstallprompt', (e) => {
        // Empêche l'affichage de la mini-barre native sur mobile
        e.preventDefault();
        // Sauvegarde l'événement pour le déclencher plus tard
        deferredPrompt = e;
        // Affiche notre notification personnalisée
        installToast.classList.remove('hidden');
    });

    // 2. Clic sur le bouton "Installer"
    installBtn.addEventListener('click', async () => {
        installToast.classList.add('hidden');
        if (deferredPrompt) {
            // Affiche la popup native d'installation du navigateur
            deferredPrompt.prompt();
            // Attend la réponse de l'utilisateur
            const { outcome } = await deferredPrompt.userChoice;
            if (outcome === 'accepted') {
                console.log('Installation PWA acceptée');
            }
            deferredPrompt = null;
        }
    });

    // 3. Clic sur le bouton "Fermer" (X)
    closeBtn.addEventListener('click', () => {
        installToast.classList.add('hidden');
    });

    // 4. Cache la notification une fois l'installation réussie
    window.addEventListener('appinstalled', () => {
        installToast.classList.add('hidden');
        deferredPrompt = null;
    });


}

    // --- CARROUSEL HERO AUTOMATIQUE ---
document.addEventListener('DOMContentLoaded', () => {
    initHeroAutoSlider();
});

function initHeroAutoSlider() {
    const slides = document.querySelectorAll('.hero-bg-slide');
    if (slides.length <= 1) return;

    let currentSlide = 0;
    const intervalTime = 4000; // Temps d'affichage par photo : 4 secondes

    setInterval(() => {
        // Cache l'image actuelle
        slides[currentSlide].classList.remove('opacity-100');
        slides[currentSlide].classList.add('opacity-0');

        // Passe à l'image suivante (boucle indéfiniment)
        currentSlide = (currentSlide + 1) % slides.length;

        // Affiche la nouvelle image
        slides[currentSlide].classList.remove('opacity-0');
        slides[currentSlide].classList.add('opacity-100');
    }, intervalTime);
}