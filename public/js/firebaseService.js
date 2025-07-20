// public/js/firebaseService.js

import {
    initializeApp
} from "https://www.gstatic.com/firebasejs/11.6.1/firebase-app.js";
import {
    getFirestore,
    collection,
    query,
    where,
    onSnapshot,
    Timestamp
} from "https://www.gstatic.com/firebasejs/11.6.1/firebase-firestore.js";

let app;
let db;

export function initializeFirebase(config) {
    if (!app) {
        app = initializeApp(config);
        db = getFirestore(app);
        console.log("Firebase initialized.");
    }
}

export function getFirestoreInstance() {
    if (!db) {
        console.error("Firestore not initialized. Call initializeFirebase() first.");
        return null;
    }
    return db;
}

/**
 * Updates the current date displayed on an HTML element.
 * This can be called from any page's main script.
 * @param {string} elementId - The ID of the HTML element to update.
 */
export function updateCurrentDate(elementId) {
    const today = new Date();
    const dateElement = document.getElementById(elementId);
    if (dateElement) {
        // Updated location to Semarang, Indonesia and current date
        const options = { 
            weekday: 'long', 
            year: 'numeric', 
            month: 'long', 
            day: 'numeric' };
        const formattedDate = today.toLocaleDateString('id-ID', options);
        // dateElement.textContent = `Kamis, 17 Juli 2025`; // Placeholder for the fixed date in the image
        // Or if you want the actual current date:
        dateElement.textContent = formattedDate; 
    } else {
        console.warn(`Element with ID '${elementId}' not found for date update.`);
    }
}

/**
 * Sets up a real-time listener for "sampah" collection data.
 * It also updates the global statistic cards (e.g., total sampah today, active faculties).
 * @param {function(object): void} [pageSpecificCallback] - Optional callback for page-specific logic
 * to receive aggregated data.
 * @returns {function(): void} - The unsubscribe function for the listener.
 */
export function setupGlobalSampahListener(pageSpecificCallback = null) {
    const firestoreDb = getFirestoreInstance();
    if (!firestoreDb) return () => {};

    const startOfToday = new Date();
    startOfToday.setHours(0, 0, 0, 0);

    const startOfWeek = new Date(); // To aggregate data for the entire week
    const day = startOfWeek.getDay();
    const diff = startOfWeek.getDate() - day + (day === 0 ? -6 : 1); // adjust when day is sunday
    startOfWeek.setDate(diff);
    startOfWeek.setHours(0, 0, 0, 0);
    const firebaseStartOfWeek = Timestamp.fromDate(startOfWeek);

    const q = query(collection(firestoreDb, "sampah"), where("timestamp", ">=", firebaseStartOfWeek));

    return onSnapshot(q, (querySnapshot) => {
        let totalBeratToday = 0; // For "Total Sampah Hari Ini" global card
        let activeFacultiesSet = new Set(); // For "Fakultas Aktif" global card
        let weeklyTotalData = [0, 0, 0, 0, 0, 0, 0]; // For weekly trend chart in dashboard

        // Data for the "Overview Garbage Summary" cards (Organik/Anorganik/Umum breakdown)
        let overviewOrganikToday = 0;
        let overviewAnorganikToday = 0;
        let overviewUmumToday = 0;

        // Data for Faculty Performance Chart
        const facultyDataAggregates = {}; // { 'Fakultas Teknik': { totalBerat: 0, reduction: 0, target: 0 } }


        querySnapshot.forEach((doc) => {
            const data = doc.data();
            const berat = data.berat || 0;
            const docDate = data.timestamp.toDate();
            const jenis = data.jenis;
            const fakultas = data.fakultas;

            // Global "Total Sampah Hari Ini" (Top Card) and Overview Garbage Summary (Organik/Anorganik/Umum)
            if (docDate >= startOfToday) {
                totalBeratToday += berat; // Sum for global "Total Sampah Hari Ini"
                if (jenis === 'Organik') overviewOrganikToday += berat;
                else if (jenis === 'Anorganik') overviewAnorganikToday += berat;
                else if (jenis === 'Umum') overviewUmumToday += berat;
            }

            // Global "Fakultas Aktif" (Top Card)
            if (fakultas) {
                activeFacultiesSet.add(fakultas);
            }

            // Weekly Trend Data (for dashboard chart)
            const dayOfWeek = docDate.getDay(); // Sunday=0, Monday=1, ...
            const index = dayOfWeek === 0 ? 6 : dayOfWeek - 1; // Adjust index to make Monday=0
            weeklyTotalData[index] += berat;

            // Faculty Performance Data (for dashboard chart)
            if (fakultas) {
                if (!facultyDataAggregates[fakultas]) {
                    facultyDataAggregates[fakultas] = { totalBerat: 0, reduction: 0, target: 0 };
                }
                facultyDataAggregates[fakultas].totalBerat += berat;
                // TODO: Add logic to aggregate reduction/target for faculties if available in data
            }
        });

        // --- Update Global Stats Cards (present on every page) ---
        const globalTotalSampahElem = document.getElementById('total-sampah-today');
        if (globalTotalSampahElem) globalTotalSampahElem.textContent = totalBeratToday.toFixed(1);

        const globalActiveFacultiesElem = document.getElementById('active-faculties');
        if (globalActiveFacultiesElem) globalActiveFacultiesElem.textContent = activeFacultiesSet.size;

        const globalAvgReductionElem = document.getElementById('avg-reduction');
        if (globalAvgReductionElem) globalAvgReductionElem.textContent = '16.8'; // Placeholder from image example

        const globalEnvStatusElem = document.getElementById('env-status');
        if (globalEnvStatusElem) globalEnvStatusElem.textContent = 'Baik'; // Placeholder from image example


        // --- Prepare data for page-specific callback ---
        const aggregatedDataForPage = {
            overviewOrganikToday,
            overviewAnorganikToday,
            overviewUmumToday,
            weeklyTotalData,
            facultyDataAggregates
        };

        // --- Invoke page-specific callback if provided ---
        if (pageSpecificCallback && typeof pageSpecificCallback === 'function') {
            pageSpecificCallback(aggregatedDataForPage);
        }

    }, (error) => {
        console.error("Error listening to Firestore data in firebaseService: ", error);
    });
}