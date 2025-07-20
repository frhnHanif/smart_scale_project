// public/js/fakultas.js

// Import necessary functions from Firebase SDK (Timestamp, collection, query, where, onSnapshot)
import { Timestamp, collection, query, where, onSnapshot } from "https://www.gstatic.com/firebasejs/11.6.1/firebase-firestore.js";

// Import Firebase service functions
// Corrected: Import initializeFirebase (as it's exported from firebaseService.js)
import { initializeFirebase, getFirestoreInstance, updateCurrentDate, setupGlobalSampahListener } from "./firebaseService.js"; 

let db; 
let unsubscribe;

const facultyTargets = {
    'Teknik': 50, 'Kedokteran': 45, 'Ekonomika dan Bisnis': 55, 'Hukum': 35, 'Ilmu Budaya': 40, 'Peternakan dan Pertanian': 60
};
const colors = ['#2dd4bf', '#38bdf8', '#a78bfa', '#facc15', '#fb923c'];

let currentFilter = 'today';

let leaderboardContainer;
let btnToday;
let btnWeekly;
// Base classes common to all buttons
const baseButtonClasses = "px-4 py-2 text-sm font-medium transition-colors duration-200";

// Classes for the ACTIVE button state
const activeClasses = "bg-teal-600 text-white hover:bg-teal-700";

// Classes for the INACTIVE button state
const inactiveClasses = "bg-white text-gray-900 hover:bg-gray-100 hover:text-teal-700";

function applyFilterButtonStyles() {
    // Define the full set of structural classes for each button
    const todayBtnStructuralClasses = "border border-gray-200 rounded-l-lg";
    const weeklyBtnStructuralClasses = "border-y border-r border-gray-200 rounded-r-lg -ml-px";

    // Reset and apply current state classes
    if (currentFilter === 'today') {
        btnToday.className = baseButtonClasses + " " + todayBtnStructuralClasses + " " + activeClasses;
        btnWeekly.className = baseButtonClasses + " " + weeklyBtnStructuralClasses + " " + inactiveClasses;
    } else { // currentFilter === 'weekly'
        btnWeekly.className = baseButtonClasses + " " + weeklyBtnStructuralClasses + " " + activeClasses;
        btnToday.className = baseButtonClasses + " " + todayBtnStructuralClasses + " " + inactiveClasses;
    }
}

function fetchAndDisplayData(filter) {
    console.log(`DEBUG: fetchAndDisplayData called with filter: ${filter}`);
    if (unsubscribe) {
        unsubscribe();
        console.log("DEBUG: Previous Firestore listener unsubscribed.");
    }

    if (!leaderboardContainer) {
        console.error("DEBUG ERROR: Leaderboard container (id: leaderboard-container) not found when fetching data. Check HTML ID.");
        return;
    }

    leaderboardContainer.innerHTML =
        '<p id="loading-text-leaderboard" class="text-center col-span-full text-gray-500">Memuat data...</p>';

    const now = new Date();
    let startDate;

    if (filter === 'today') {
        startDate = new Date(now);
        startDate.setHours(0, 0, 0, 0);
    } else {
        const day = now.getDay();
        const diff = now.getDate() - day + (day === 0 ? -6 : 1); 
        startDate = new Date(new Date().setDate(diff));
        startDate.setHours(0, 0, 0, 0);
    }
    console.log("DEBUG: Query startDate (JS Date):", startDate);
    const firebaseStartDate = Timestamp.fromDate(startDate);
    console.log("DEBUG: Query startDate (Firestore Timestamp):", firebaseStartDate);

    if (!db) {
        db = getFirestoreInstance();
        if (!db) {
            console.error("DEBUG ERROR: Firestore DB is null. Cannot fetch data. Check Firebase initialization.");
            return;
        }
    }
    console.log("DEBUG: Firestore DB instance obtained.");

    const q = query(collection(db, "sampah"), where("timestamp", ">=", firebaseStartDate));
    console.log("DEBUG: Firestore query constructed for collection 'sampah'.");

    unsubscribe = onSnapshot(q, (querySnapshot) => {
        console.log("DEBUG: onSnapshot callback triggered. Query Snapshot Size:", querySnapshot.size);
        if (querySnapshot.empty) {
            console.log("DEBUG INFO: Query Snapshot is empty. No documents found for the current period.");
        }
        const facultyData = {};
        querySnapshot.forEach(doc => {
            const data = doc.data();
            // console.log("DEBUG: Processing doc data:", data);

            if (!data.fakultas || !data.jenis || typeof data.berat === 'undefined' || !data.timestamp || typeof data.timestamp.toDate !== 'function') {
                console.warn("DEBUG WARNING: Skipping document due to invalid/missing required fields or invalid timestamp:", data);
                return;
            }

            const fakultas = data.fakultas;
            const jenis = data.jenis.toLowerCase();
            const berat = parseFloat(data.berat) || 0;

            if (!facultyData[fakultas]) {
                facultyData[fakultas] = { organik: 0, anorganik: 0, umum: 0, total: 0 };
            }
            if (jenis === 'organik') facultyData[fakultas].organik += berat;
            else if (jenis === 'anorganik') facultyData[fakultas].anorganik += berat;
            else if (jenis === 'umum') facultyData[fakultas].umum += berat;
            facultyData[fakultas].total += berat;
        });
        console.log("DEBUG: Aggregated facultyData:", facultyData);
        renderLeaderboard(facultyData);
    }, (error) => {
        console.error("DEBUG ERROR: Error in Firestore onSnapshot listener:", error);
        leaderboardContainer.innerHTML = '<p class="text-center col-span-full text-red-500">Gagal memuat data.</p>';
    });
}

function renderLeaderboard(data) {
    console.log("DEBUG: renderLeaderboard called with data:", data);
    leaderboardContainer.innerHTML = ''; 

    if (Object.keys(data).length === 0) {
        console.log("DEBUG INFO: No faculty data to render, showing 'Tidak ada data'.");
        leaderboardContainer.innerHTML =
            '<p class="text-center col-span-full text-gray-500">Tidak ada data untuk periode ini.</p>';
        return;
    }
    console.log("DEBUG: Rendering sorted faculties. Count:", Object.keys(data).length);

    const sortedFaculties = Object.entries(data)
        .map(([name, values]) => ({ name, ...values }))
        .sort((a, b) => b.total - a.total);

    sortedFaculties.forEach((faculty, index) => {
        const target = facultyTargets[faculty.name] || 50;
        const progress = Math.min((faculty.total / target) * 100, 100);
        const color = colors[index % colors.length];

        // --- Determine the icon based on rank (index) ---
        let rankIcon = '';
        if (index === 0) {
            rankIcon = '🥇'; // Gold medal for 1st place
        } else if (index === 1) {
            rankIcon = '🥈'; // Silver medal for 2nd place
        } else if (index === 2) {
            rankIcon = '🥉'; // Bronze medal for 3rd place
        } else {
            rankIcon = '✨'; // A generic sparkle for other ranks, or simply '' for no icon
        }
        // --- End of icon determination ---

        const leaderboardRowHTML = `
        <div class="bg-white p-6 rounded-xl shadow-md border-2">
            <div class="flex items-center justify-between mb-3">
                <div class="flex items-center">
                    <span class="w-3 h-3 rounded-full mr-4" style="background-color: ${color};"></span>
                    <span class="font-bold text-lg text-gray-800">${faculty.name}</span>
                </div>
                <div class="text-right">
                    <span class="font-semibold text-teal-600">${faculty.total.toFixed(1)} / ${target} kg</span>
                    <span class="ml-2">${rankIcon}</span> </div>
            </div>
            <div class="mt-3">
                <div class="w-full bg-gray-200 rounded-full h-2">
                    <div class="h-2 rounded-full" style="width: ${progress}%; background-color: #34495e;"></div>
                </div>
                <div class="flex justify-between text-sm text-gray-500 mt-1">
                    <span>Pengurangan: N/A</span>
                    <span>${progress.toFixed(0)}% dari target</span>
                </div>
            </div>
            <div class="mt-4 pt-4 border-t border-gray-100 text-sm text-gray-600 space-y-2">
                <div class="flex justify-between"><span>Organik</span> <span class="font-semibold">${faculty.organik.toFixed(1)} kg</span></div>
                <div class="flex justify-between"><span>Anorganik</span> <span class="font-semibold">${faculty.anorganik.toFixed(1)} kg</span></div>
                <div class="flex justify-between"><span>Umum</span> <span class="font-semibold">${faculty.umum.toFixed(1)} kg</span></div>
            </div>
        </div>`;
        leaderboardContainer.innerHTML += leaderboardRowHTML;
    });
}

export function initFakultasPage(firebaseConfig) {
    console.log("DEBUG: initFakultasPage called.");
    
    initializeFirebase(firebaseConfig); 
    db = getFirestoreInstance();

    if (!db) {
        console.error("DEBUG ERROR: Firestore database instance is NOT available. Check Firebase config or firebaseService.js.");
        return;
    }
    console.log("DEBUG: Firestore DB available in initFakultasPage.");

    leaderboardContainer = document.getElementById('leaderboard-container');
    btnToday = document.getElementById('btn-today');
    btnWeekly = document.getElementById('btn-weekly');

    if (!leaderboardContainer || !btnToday || !btnWeekly) {
        console.error("DEBUG ERROR: Missing one or more required DOM elements for Fakultas page (leaderboard-container, btn-today, btn-weekly). Check IDs in HTML.");
        return;
    }
    console.log("DEBUG: All required DOM elements found.");

    // Call updateCurrentDate to fill the header date span
    updateCurrentDate('current-date'); // <--- ADDED THIS LINE

    // Initial application of styles and data fetch
    applyFilterButtonStyles();
    fetchAndDisplayData(currentFilter);

    // Add event listeners
    btnToday.addEventListener('click', () => {
        currentFilter = 'today';
        applyFilterButtonStyles();
        fetchAndDisplayData(currentFilter);
    });

    btnWeekly.addEventListener('click', () => {
        currentFilter = 'weekly';
        applyFilterButtonStyles();
        fetchAndDisplayData(currentFilter);
    });
    // This call relies on firebaseService.js to correctly aggregate and return data
    setupGlobalSampahListener();
    console.log("DEBUG: Initial fetchAndDisplayData call initiated from initFakultasPage.");
}