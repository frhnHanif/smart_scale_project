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


    // --- DATE DEFINITIONS ---
    const now = new Date();
    const startOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate());

    // For weekly trend
    const startOfWeek = new Date(now);
    const day = startOfWeek.getDay();
    const diff = startOfWeek.getDate() - day + (day === 0 ? -6 : 1); // adjust when day is sunday
    startOfWeek.setDate(diff);
    startOfWeek.setHours(0, 0, 0, 0);

    // For monthly reduction calculation
    const startOfThisMonth = new Date(now.getFullYear(), now.getMonth(), 1);
    const startOfLastMonth = new Date(now.getFullYear(), now.getMonth() - 1, 1);
    const startOfMonthBeforeLast = new Date(now.getFullYear(), now.getMonth() - 2, 1);

    // The query needs to go back to the start of the month before last to get all necessary data
    const firebaseQueryStartDate = Timestamp.fromDate(startOfMonthBeforeLast);

    const q = query(collection(firestoreDb, "sampah"), where("timestamp", ">=", firebaseQueryStartDate));

    return onSnapshot(q, (querySnapshot) => {
        // --- AGGREGATION VARIABLES ---

        // For Global Cards
        let totalBeratToday = 0;
        let activeFacultiesSet = new Set();
        let totalBeratBulanIni = 0;
        let totalBeratBulanLalu = 0;
        let totalBeratBulanSebelumnyaLagi = 0;

        // For Dashboard: Weekly Trend
        let weeklyTotalData = [0, 0, 0, 0, 0, 0, 0];

        // For Dashboard: Today's breakdown
        let overviewOrganikToday = 0;
        let overviewAnorganikToday = 0;
        let overviewUmumToday = 0;

        // For Analitik/Fakultas pages
        const facultyDataAggregates = {}; // { 'Fakultas Teknik': { totalBerat: 0, reduction: 0, target: 0 } }


        querySnapshot.forEach((doc) => {
            const data = doc.data();
            const berat = data.berat || 0;
            const docDate = data.timestamp.toDate();
            const jenis = data.jenis;
            const fakultas = data.fakultas;

            // --- DATA AGGREGATION LOGIC ---

            // 1. Monthly totals for reduction calculation
            if (docDate >= startOfThisMonth) {
                totalBeratBulanIni += berat;
            } else if (docDate >= startOfLastMonth) {
                totalBeratBulanLalu += berat;
            } else if (docDate >= startOfMonthBeforeLast) {
                totalBeratBulanSebelumnyaLagi += berat;
            }

            // 2. Today's totals for global card and dashboard overview
            if (docDate >= startOfToday) {
                totalBeratToday += berat; // Sum for global "Total Sampah Hari Ini"
                if (jenis === 'Organik') overviewOrganikToday += berat;
                else if (jenis === 'Anorganik') overviewAnorganikToday += berat;
                else if (jenis === 'Umum') overviewUmumToday += berat;
            }

            // 3. Active faculties (all time in query range)
            if (fakultas) {
                activeFacultiesSet.add(fakultas);
            }

            // 4. Weekly Trend Data (for dashboard chart) - only for current week
            if (docDate >= startOfWeek) {
                const dayOfWeek = docDate.getDay(); // Sunday=0, Monday=1, ...
                const index = dayOfWeek === 0 ? 6 : dayOfWeek - 1; // Adjust index to make Monday=0
                weeklyTotalData[index] += berat;
            }

            // 5. Faculty Performance Data (for analitik page chart, which is for today)
            if (fakultas && docDate >= startOfToday) {
                if (!facultyDataAggregates[fakultas]) {
                    facultyDataAggregates[fakultas] = { totalBerat: 0, reduction: 0, target: 0 };
                }
                facultyDataAggregates[fakultas].totalBerat += berat;
            }
        });

        // --- CALCULATIONS ---
        let avgReduction = 0;
        if (totalBeratBulanLalu > 0) {
            // Formula: ((last_month - this_month) / last_month) * 100
            avgReduction = ((totalBeratBulanLalu - totalBeratBulanIni) / totalBeratBulanLalu) * 100;
        }

        // Calculate last month's reduction to be used as this month's target
        let targetReductionFromLastMonth = 0;
        if (totalBeratBulanSebelumnyaLagi > 0) {
            // Formula: ((month_before_last - last_month) / month_before_last) * 100
            targetReductionFromLastMonth = ((totalBeratBulanSebelumnyaLagi - totalBeratBulanLalu) / totalBeratBulanSebelumnyaLagi) * 100;
        }

        // --- Update Global Stats Cards (present on every page) ---
        const globalTotalSampahElem = document.getElementById('total-sampah-today');
        if (globalTotalSampahElem) globalTotalSampahElem.textContent = totalBeratToday.toFixed(1);

        const globalActiveFacultiesElem = document.getElementById('active-faculties');
        if (globalActiveFacultiesElem) globalActiveFacultiesElem.textContent = activeFacultiesSet.size;

        const globalAvgReductionElem = document.getElementById('avg-reduction');
        if (globalAvgReductionElem) globalAvgReductionElem.textContent = avgReduction.toFixed(1);

        const globalEnvStatusElem = document.getElementById('env-status');
        const globalEnvStatusSubtitleElem = document.getElementById('env-status-subtitle');
        const envStatusBorderElem = document.getElementById('env-status-border');
        const envStatusTextElem = document.getElementById('env-status-text');

        if (globalEnvStatusElem && globalEnvStatusSubtitleElem && envStatusBorderElem && envStatusTextElem) {
            const TARGET_AVG_REDUCTION = targetReductionFromLastMonth;
            let achievementPercentage = 0;

            if (TARGET_AVG_REDUCTION > 0) {
                achievementPercentage = (Math.max(0, avgReduction) / TARGET_AVG_REDUCTION) * 100;
            } else if (avgReduction > 0) {
                achievementPercentage = 100; // Jika target 0 tapi ada pengurangan, anggap 100% tercapai
            }

            let envStatusText = 'Kurang';
            let envStatusSubtitleText;
            let borderColor = 'bg-red-500';
            let textColor = 'text-red-600';

            if (achievementPercentage >= 85) {
                envStatusText = 'Baik';
                envStatusSubtitleText = 'Capaian Pengurangan > 85%';
                borderColor = 'bg-green-500';
                textColor = 'text-green-600';
            } else if (achievementPercentage >= 60) {
                envStatusText = 'Cukup';
                envStatusSubtitleText = 'Capaian Pengurangan 60-85%';
                borderColor = 'bg-yellow-500';
                textColor = 'text-yellow-600';
            } else {
                envStatusSubtitleText = 'Capaian pengurangan < 60%';
            }

            globalEnvStatusElem.textContent = envStatusText;
            globalEnvStatusSubtitleElem.textContent = envStatusSubtitleText;
            envStatusBorderElem.className = `absolute top-0 left-0 h-full w-1.5 ${borderColor} rounded-l-xl`;
            envStatusTextElem.className = `text-3xl font-bold ${textColor}`;
        }

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