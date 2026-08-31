// js/service.js

let serviceCars = [];
let serviceFilter = 'tout';
let serviceSearch = '';
let serviceSelectedCar = null;

document.addEventListener('DOMContentLoaded', async () => {
    // 1. Gestion du preloader
    const preloader = document.getElementById('preloader');
    if(preloader) {
        setTimeout(() => {
            preloader.style.opacity = '0';
            setTimeout(() => { 
                preloader.remove(); 
                document.body.classList.remove('loading-active'); 
            }, 700);
        }, 800);
    }

    // 2. Si on n'est pas sur une page de service (pas de grille), on arrête le script ici
    if(!document.getElementById('cars-grid')) return;

    // 3. Chargement des voitures depuis Supabase
    try {
        const { data } = await window.supabaseClient.from('cars').select('*').order('id', { ascending: false });
        if (data) {
            serviceCars = data;
            applyServiceFilters();
        }
    } catch (err) {
        console.error("Erreur chargement des véhicules :", err);
    }
});

// --- LOGIQUE DE RECHERCHE ET DE FILTRAGE ---
window.filterCars = function(cat, btn) {
    document.querySelectorAll('.filter-btn').forEach(b => b.classList.remove('active'));
    if(btn) btn.classList.add('active');
    serviceFilter = cat;
    applyServiceFilters();
}

window.handleSearch = function() {
    const searchInput = document.getElementById('page-search');
    if(searchInput) serviceSearch = searchInput.value.toLowerCase();
    applyServiceFilters();
}

function applyServiceFilters() {
    const grid = document.getElementById('cars-grid');
    const noResults = document.getElementById('no-results');
    const spinner = document.getElementById('loading-spinner');
    
    if(spinner) spinner.classList.add('hidden');
    if(!grid) return;

    let filtered = serviceCars;

    // Filtre par catégorie
    if (serviceFilter !== 'tout') {
        filtered = filtered.filter(c => c.categorie === serviceFilter);
    }
    // Filtre par recherche textuelle
    if (serviceSearch !== '') {
        filtered = filtered.filter(c => c.marque.toLowerCase().includes(serviceSearch) || c.modele.toLowerCase().includes(serviceSearch));
    }

    grid.innerHTML = "";
    if (filtered.length === 0) {
        grid.classList.add('hidden');
        if(noResults) noResults.classList.remove('hidden');
        return;
    }
    
    grid.classList.remove('hidden');
    if(noResults) noResults.classList.add('hidden');

    // Détection de la page actuelle pour adapter les textes et prix
    const isAeroport = document.getElementById('aeroport-page-marker') !== null;
    const isLLD = document.getElementById('lld-duration') !== null;
    const isPro = document.getElementById('pro-itinerary') !== null;
    const isMariage = document.getElementById('booking-forfait') !== null;

    filtered.forEach(car => {
        const coverImg = (car.images && car.images.length > 0) ? car.images[0] : (car.image_url || 'https://placehold.co/600');
        
        let priceDisplay = 'Devis';
        let priceLabel = 'par jour';
        
        // Configuration du prix selon la page
        if (isAeroport) {
            priceDisplay = car.prix_aeroport ? (car.prix_aeroport.includes('$') ? car.prix_aeroport : `${car.prix_aeroport}$`) : 'Sur demande';
            priceLabel = 'par transfert';
        } else {
            priceDisplay = car.prix_jour ? (car.prix_jour.includes('$') ? car.prix_jour : `${car.prix_jour}$`) : 'Sur devis';
        }

        // Configuration des boutons selon la page
        let badge = '';
        let btnText = 'Réserver';
        
        if(isAeroport) { badge = 'Navette VIP'; btnText = 'Réserver'; }
        else if(isLLD) { badge = 'Dispo LLD'; btnText = 'Devis LLD'; }
        else if(isPro) { badge = 'Pro/Event'; btnText = 'Logistique'; }
        else if(isMariage) { badge = 'Prestige'; btnText = 'Réserver VIP'; }

        grid.innerHTML += `
        <div class="bg-white rounded-xl shadow-sm border border-gray-100 flex flex-col overflow-hidden hover:shadow-md transition">
            <div class="h-40 md:h-48 relative cursor-pointer group overflow-hidden" onclick="openServiceDetails(${car.id})">
                <img src="${coverImg}" class="w-full h-full object-cover group-hover:scale-105 transition duration-500">
                <span class="absolute top-2 left-2 bg-mutuk-navy/80 backdrop-blur-sm text-white text-[10px] font-bold px-2 py-1 rounded shadow-sm uppercase">${badge}</span>
            </div>
            <div class="p-4 flex flex-col flex-1">
                <h3 class="font-display text-base md:text-lg font-bold text-gray-900 leading-tight">${car.marque} ${car.modele}</h3>
                <span class="text-[10px] text-gray-400 uppercase font-bold mb-3 border-b border-gray-50 pb-2 block">${car.categorie.replace('_', ' ')}</span>
                <div class="flex items-end justify-between mt-auto">
                    <div>
                        <span class="text-xl md:text-2xl font-extrabold text-mutuk-blue block leading-none mb-1">${priceDisplay}</span>
                        <span class="text-[9px] text-gray-400 uppercase font-bold tracking-wider">${priceLabel}</span>
                    </div>
                    <div class="flex gap-2">
                        <button onclick="openServiceDetails(${car.id})" class="hidden sm:block bg-blue-50 text-mutuk-blue text-xs font-bold p-2.5 rounded-lg hover:bg-mutuk-blue hover:text-white transition-colors" title="Voir détails"><span class="material-symbols-outlined text-sm">visibility</span></button>
                        <button onclick="directServiceBook(${car.id})" class="bg-mutuk-navy text-white px-3 py-2 rounded-lg hover:bg-gray-800 transition-colors text-xs font-bold shadow-md">${btnText}</button>
                    </div>
                </div>
            </div>
        </div>`;
    });
}

// --- LOGIQUE DES MODALES DÉTAILS & RÉSERVATION ---
window.openServiceDetails = function(id) {
    serviceSelectedCar = serviceCars.find(c => c.id === id);
    if(!serviceSelectedCar) return;

    const isAeroport = document.getElementById('aeroport-page-marker') !== null;
    const images = (serviceSelectedCar.images && serviceSelectedCar.images.length > 0) ? serviceSelectedCar.images : [serviceSelectedCar.image_url || 'https://placehold.co/600'];
    
    document.getElementById('detail-title').innerText = `${serviceSelectedCar.marque} ${serviceSelectedCar.modele}`;
    
    if(isAeroport) {
        document.getElementById('detail-price').innerText = serviceSelectedCar.prix_aeroport ? (serviceSelectedCar.prix_aeroport.includes('$') ? serviceSelectedCar.prix_aeroport : `${serviceSelectedCar.prix_aeroport}$`) : 'Sur demande';
        document.getElementById('detail-category-badge').innerText = "AÉROPORT";
    } else {
        document.getElementById('detail-price').innerText = serviceSelectedCar.prix_jour ? (serviceSelectedCar.prix_jour.includes('$') ? serviceSelectedCar.prix_jour : `${serviceSelectedCar.prix_jour}$`) : 'Sur devis';
        document.getElementById('detail-category-badge').innerText = serviceSelectedCar.categorie.toUpperCase().replace('_', ' ');
    }

    document.getElementById('detail-seats').innerText = serviceSelectedCar.places || 5;
    document.getElementById('detail-boite').innerText = serviceSelectedCar.boite || 'Auto';
    document.getElementById('detail-fuel').innerText = serviceSelectedCar.carburant || 'Essence';
    document.getElementById('detail-desc').innerText = serviceSelectedCar.description || "Véhicule premium disponible avec chauffeur.";
    document.getElementById('detail-main-img').src = images[0];
    
    const thumbs = document.getElementById('detail-thumbs');
    if(thumbs) {
        thumbs.innerHTML = "";
        images.slice(0, 5).forEach(src => { 
            thumbs.innerHTML += `<img src="${src}" onclick="document.getElementById('detail-main-img').src='${src}'" class="h-14 w-16 object-cover rounded-lg border-2 border-transparent hover:border-mutuk-blue cursor-pointer transition">`; 
        });
    }

    document.getElementById('car-details-modal').classList.remove('hidden');
};

window.closeDetailsModal = function() {
    const modal = document.getElementById('car-details-modal');
    if(modal) modal.classList.add('hidden');
};

window.directServiceBook = function(id) { 
    serviceSelectedCar = serviceCars.find(c => c.id === id); 
    openServiceBooking(); 
};

window.openServiceBooking = function() {
    // Ferme la modale détail si ouverte
    const detailsModal = document.getElementById('car-details-modal');
    if(detailsModal) detailsModal.classList.add('hidden');

    // Remplir le nom de la voiture dans le bon input selon la page
    const carNameInput = document.getElementById('booking-car-name') || document.getElementById('lld-car') || document.getElementById('pro-car');
    if(carNameInput && serviceSelectedCar) {
        carNameInput.value = `${serviceSelectedCar.marque} ${serviceSelectedCar.modele}`;
    }

    // Initialiser l'input téléphonique
    if(window.initPhoneInput) {
        if(document.getElementById('booking-client-phone')) window.initPhoneInput('booking-client-phone');
        if(document.getElementById('lld-phone')) window.initPhoneInput('lld-phone');
        if(document.getElementById('pro-phone')) window.initPhoneInput('pro-phone');
    }
    
    document.getElementById('booking-modal').classList.remove('hidden');
};


// ==========================================
// SOUMISSION DES FORMULAIRES (WhatsApp + Email)
// ==========================================

// 1. PAGE MARIAGE
window.handleMariageBooking = async function(e) {
    e.preventDefault();
    const btn = e.target.querySelector('button[type="submit"]'); 
    if(btn) { btn.innerText = "Envoi..."; btn.disabled = true; }

    const carName = document.getElementById('booking-car-name').value;
    const name = document.getElementById('booking-client-name').value;
    const phone = document.getElementById('booking-client-phone').value;
    const lieux = document.getElementById('booking-lieux').value;
    const date = document.getElementById('booking-date').value;
    const forfait = document.getElementById('booking-forfait').value;

    if(window.sendBookingToEmail) {
        await window.sendBookingToEmail({
            Vehicule: carName, Client: name, Telephone: phone,
            Date: date, Lieux: lieux, Forfait: forfait
        }, `Réservation Mariage/VIP - ${carName}`);
    }

    const msg = `👑 RÉSERVATION MARIAGE / VIP\n\n[Véhicule] ${carName}\n[Nom] ${name}\n[Téléphone] ${phone}\n[Date] ${date}\n[Lieux] ${lieux}\n[Forfait] ${forfait}\n\nMerci de me confirmer la disponibilité.`;
    window.open(`https://wa.me/243997708115?text=${encodeURIComponent(msg)}`, '_blank');
    
    document.getElementById('booking-modal').classList.add('hidden');
    if(btn) { btn.innerText = "Demander un devis VIP"; btn.disabled = false; }
};

// 2. PAGE PRO
window.handleProBooking = async function(e) {
    e.preventDefault();
    const btn = e.target.querySelector('button[type="submit"]'); 
    if(btn) { btn.innerText = "Envoi..."; btn.disabled = true; }

    const carName = document.getElementById('pro-car').value;
    const name = document.getElementById('pro-name').value;
    const phone = document.getElementById('pro-phone').value;
    const date = document.getElementById('pro-date').value;
    const qty = document.getElementById('pro-qty').value;
    const itinerary = document.getElementById('pro-itinerary').value;

    if(window.sendBookingToEmail) {
        await window.sendBookingToEmail({
            Vehicule: `${qty}x ${carName}`, Client: name, Telephone: phone,
            Date: date, Itineraire: itinerary
        }, `Réservation Logistique Pro - ${carName}`);
    }

    const msg = `💼 RÉSERVATION PRO / ÉVÉNEMENT\n\n[Véhicule] ${carName} (x${qty})\n[Client] ${name}\n[Téléphone] ${phone}\n[Date] ${date}\n[Itinéraire] ${itinerary}\n\nMerci de valider la faisabilité logistique.`;
    window.open(`https://wa.me/243997708115?text=${encodeURIComponent(msg)}`, '_blank');
    
    document.getElementById('booking-modal').classList.add('hidden');
    if(btn) { btn.innerText = "Confirmer la logistique"; btn.disabled = false; }
};

// 3. PAGE LONGUE DUREE (LLD)
window.handleLLDBooking = async function(e) {
    e.preventDefault();
    const btn = e.target.querySelector('button[type="submit"]'); 
    if(btn) { btn.innerText = "Envoi..."; btn.disabled = true; }

    const carName = document.getElementById('lld-car').value;
    const name = document.getElementById('lld-name').value;
    const company = document.getElementById('lld-company').value;
    const phone = document.getElementById('lld-phone').value;
    const date = document.getElementById('lld-date').value;
    const duration = document.getElementById('lld-duration').value;

    if(window.sendBookingToEmail) {
        await window.sendBookingToEmail({
            Vehicule: carName, Client: name, Entreprise: company, Telephone: phone,
            DateDebut: date, Duree: duration
        }, `Devis Longue Durée - ${carName}`);
    }

    const msg = `🏢 DEVIS LONGUE DURÉE\n\n[Véhicule] ${carName}\n[Nom] ${name}\n[Entreprise] ${company}\n[Téléphone] ${phone}\n[Début] ${date}\n[Durée] ${duration}\n\nMerci de me communiquer vos tarifs mensuels dégressifs.`;
    window.open(`https://wa.me/243997708115?text=${encodeURIComponent(msg)}`, '_blank');
    
    document.getElementById('booking-modal').classList.add('hidden');
    if(btn) { btn.innerText = "Demander mon devis dégressif"; btn.disabled = false; }
};

// 4. PAGE AEROPORT
window.handleAirportBooking = async function(e) {
    e.preventDefault();
    const btn = e.target.querySelector('button[type="submit"]'); 
    if(btn) { btn.innerText = "Envoi..."; btn.disabled = true; }

    const carName = document.getElementById('booking-car-name').value;
    const name = document.getElementById('booking-client-name').value;
    const phone = document.getElementById('booking-client-phone').value;
    const pickup = document.getElementById('booking-pickup').value;
    const dropoff = document.getElementById('booking-dropoff').value;
    const date = document.getElementById('booking-date').value;
    const time = document.getElementById('booking-time').value;

    if(window.sendBookingToEmail) {
        await window.sendBookingToEmail({
            Vehicule: carName, Client: name, Telephone: phone,
            PriseEnCharge: pickup, Destination: dropoff, Date: date, Heure: time
        }, `Navette Aéroport - ${carName}`);
    }

    const msg = `✈️ RÉSERVATION NAVETTE AÉROPORT\n\n[Véhicule] ${carName}\n[Nom] ${name}\n[Téléphone] ${phone}\n[Prise en charge] ${pickup}\n[Destination] ${dropoff}\n[Date] ${date}\n[Heure] ${time}\n\nMerci de me confirmer la navette.`;
    window.open(`https://wa.me/243997708115?text=${encodeURIComponent(msg)}`, '_blank');
    
    document.getElementById('booking-modal').classList.add('hidden');
    if(btn) { btn.innerText = "Confirmer la navette"; btn.disabled = false; }
};