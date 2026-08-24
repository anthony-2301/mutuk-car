// js/admin.js

let carsData = [];
let existingImages = [];

document.addEventListener('DOMContentLoaded', async () => {
    const { data: { session } } = await window.supabaseClient.auth.getSession(); 
    if (session) showDashboard(session.user.email);
});

function showDashboard(email) {
    document.getElementById('login-screen').classList.add('hidden');
    document.getElementById('dashboard-screen').classList.remove('hidden');
    document.getElementById('user-email').innerText = email;
    fetchAdminCars();
}

window.handleLoginManual = async function() {
    const email = document.getElementById('login-email').value.trim();
    const password = document.getElementById('login-password').value;
    const errEl = document.getElementById('login-error');
    const btn = document.getElementById('login-btn');
    
    if (!email || !password) { errEl.innerText = "Champs requis."; errEl.classList.remove('hidden'); return; }
    
    btn.innerText = "Connexion..."; btn.disabled = true; errEl.classList.add('hidden');
    try {
        const { data, error } = await window.supabaseClient.auth.signInWithPassword({ email, password });
        if (error) throw error; 
        else if (data && data.session) showDashboard(data.session.user.email);
    } catch (e) { 
        errEl.innerText = e.message; errEl.classList.remove('hidden'); 
        btn.innerText = "Se connecter"; btn.disabled = false; 
    }
};

window.handleLogout = async function() {
    await window.supabaseClient.auth.signOut();
    document.getElementById('dashboard-screen').classList.add('hidden'); 
    document.getElementById('login-screen').classList.remove('hidden');
};

async function fetchAdminCars() {
    const { data } = await window.supabaseClient.from('cars').select('*').order('id', { ascending: false });
    carsData = data || [];
    renderAdminTable();
}

function renderAdminTable() {
    const tbody = document.getElementById('admin-table-body');
    tbody.innerHTML = "";
    carsData.forEach(car => {
        const cover = (car.images && car.images.length > 0) ? car.images[0] : (car.image_url || 'https://placehold.co/100');
        const featuredIcon = car.is_featured ? '<span class="material-symbols-outlined text-yellow-500">star</span>' : '-';
        tbody.innerHTML += `
        <tr class="hover:bg-gray-50">
            <td class="p-4"><img src="${cover}" class="w-12 h-10 object-cover rounded border"></td>
            <td class="p-4 font-bold text-gray-900">${car.marque} ${car.modele}</td>
            <td class="p-4 uppercase text-[10px] font-bold text-gray-500 tracking-wider">${car.categorie.replace('_', ' ')}</td>
            <td class="p-4 font-bold"><span class="text-mutuk-blue">${car.prix_jour}</span> <br><span class="text-[10px] text-gray-400">Aero: ${car.prix_aeroport || '-'}</span></td>
            <td class="p-4 text-center">${featuredIcon}</td>
            <td class="p-4 text-right">
                <button type="button" onclick='editCar(${JSON.stringify(car).replace(/'/g, "\\'")})' class="p-2 text-mutuk-dark hover:bg-blue-50 rounded mr-1"><span class="material-symbols-outlined text-lg">edit</span></button>
                <button type="button" onclick="deleteCar(${car.id})" class="p-2 text-red-500 hover:bg-red-50 rounded"><span class="material-symbols-outlined text-lg">delete</span></button>
            </td>
        </tr>`;
    });
}

window.showForm = function() {
    document.getElementById('list-view').classList.add('hidden'); 
    document.getElementById('form-view').classList.remove('hidden');
    
    // Réinitialisation du formulaire
    document.getElementById('car-id').value = ""; document.getElementById('car-brand').value = "";
    document.getElementById('car-model').value = ""; document.getElementById('car-price').value = "";
    document.getElementById('car-price-aero').value = ""; document.getElementById('car-featured').checked = false;
    document.getElementById('car-seats').value = "5"; document.getElementById('car-desc').value = "";
    document.getElementById('car-images').value = ""; document.getElementById('previews-container').innerHTML = "";
    
    existingImages = []; 
    document.getElementById('form-title').innerText = "Ajouter un véhicule";
};

window.showList = function() { 
    document.getElementById('form-view').classList.add('hidden'); 
    document.getElementById('list-view').classList.remove('hidden'); 
};

window.editCar = function(car) {
    window.showForm();
    document.getElementById('form-title').innerText = "Modifier le véhicule";
    document.getElementById('car-id').value = car.id;
    document.getElementById('car-brand').value = car.marque;
    document.getElementById('car-model').value = car.modele;
    document.getElementById('car-category').value = car.categorie;
    document.getElementById('car-price').value = car.prix_jour;
    document.getElementById('car-price-aero').value = car.prix_aeroport || "";
    document.getElementById('car-featured').checked = car.is_featured || false;
    document.getElementById('car-seats').value = car.places || "5";
    document.getElementById('car-boite').value = car.boite || "Automatique";
    document.getElementById('car-fuel').value = car.carburant || "Essence";
    document.getElementById('car-clim').value = car.climatisation || "Oui";
    document.getElementById('car-desc').value = car.description || "";
    
    existingImages = car.images && car.images.length > 0 ? car.images : (car.image_url ? [car.image_url] : []);
    const container = document.getElementById('previews-container');
    container.innerHTML = "";
    existingImages.forEach(src => { container.innerHTML += `<img src="${src}" class="h-16 w-20 object-cover rounded border">`; });
};

window.handleSaveCar = async function(e) {
    e.preventDefault();
    const btn = document.getElementById('save-btn'); 
    btn.innerText = "Enregistrement..."; btn.disabled = true;
    
    const id = document.getElementById('car-id').value;
    const fileInput = document.getElementById('car-images');
    let uploadedUrls = [...existingImages];

    try {
        if (fileInput.files.length > 0) {
            const files = Array.from(fileInput.files).slice(0, 10);
            for (let i = 0; i < files.length; i++) {
                const file = files[i];
                const fileName = `${Date.now()}_${i}_${file.name.replace(/[^a-zA-Z0-9.]/g, '')}`;
                const { error } = await window.supabaseClient.storage.from('cars-images').upload(fileName, file);
                if (!error) {
                    const { data } = window.supabaseClient.storage.from('cars-images').getPublicUrl(fileName);
                    if(i === 0 && uploadedUrls.length === 0) uploadedUrls = [data.publicUrl]; 
                    else uploadedUrls.push(data.publicUrl);
                }
            }
        }
        if (uploadedUrls.length === 0) throw new Error("Ajoutez au moins une photo.");

        const payload = {
            marque: document.getElementById('car-brand').value,
            modele: document.getElementById('car-model').value,
            categorie: document.getElementById('car-category').value,
            prix_jour: document.getElementById('car-price').value,
            prix_aeroport: document.getElementById('car-price-aero').value,
            is_featured: document.getElementById('car-featured').checked,
            places: document.getElementById('car-seats').value,
            boite: document.getElementById('car-boite').value,
            carburant: document.getElementById('car-fuel').value,
            climatisation: document.getElementById('car-clim').value,
            description: document.getElementById('car-desc').value,
            image_url: uploadedUrls[0], images: uploadedUrls
        };

        if (id) payload.id = id;
        const { error: dbErr } = await window.supabaseClient.from('cars').upsert([payload]);
        if (dbErr) throw dbErr;

        alert("Véhicule enregistré avec succès !"); 
        window.showList(); 
        fetchAdminCars();
    } catch (err) { 
        alert("Erreur: " + err.message); 
    } finally { 
        btn.innerText = "Enregistrer"; btn.disabled = false; 
    }
};

window.deleteCar = async function(id) {
    if (!confirm("Supprimer ce véhicule ?")) return;
    await window.supabaseClient.from('cars').delete().eq('id', id); 
    fetchAdminCars();
};