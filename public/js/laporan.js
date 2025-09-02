// public/js/laporan.js

import { initializeFirebase, getFirestoreInstance, updateCurrentDate, setupGlobalSampahListener } from "./firebaseService.js";
import { collection, query, where, getDocs, Timestamp, orderBy } from "https://www.gstatic.com/firebasejs/11.6.1/firebase-firestore.js";
import * as XLSX from 'https://cdn.sheetjs.com/xlsx-0.20.2/package/xlsx.mjs'; // For Excel export

let db; // Firestore instance
let currentReportData = []; // To store data for export

// DOM elements for existing report table filters
let startDateInput;
let endDateInput;
let facultyFilterSelect;
let generateReportBtn;
let reportResultsDiv;
let loadingReportText;
let noDataReportText;
let reportTable;
let reportTableBody;
let exportReportBtn;

// NEW DOM elements for Summary Statistics
let co2ReductionSpan;
let monthlyReductionSpan;
let civitasInvolvedSpan;

// NEW DOM elements for Achievements
let achievementsListUl;


/**
 * Fetches and displays the main summary statistics.
 * (Mock data for now, replace with actual Firestore fetches)
 */
async function fetchAndDisplaySummaryStatistics() {
    console.log("DEBUG: Fetching Summary Statistics.");
    // Mock data for demonstration. Replace with actual Firebase fetches.
    // In a real app, this would involve fetching from a dedicated collection
    // (e.g., 'app_stats' or 'global_summary') that holds these pre-calculated stats.
    try {
        // Example of how you would fetch from Firestore if you had a dedicated document:
        const now = new Date();
        const startOfThisMonth = new Date(now.getFullYear(), now.getMonth(), 1);
        const startOfLastMonth = new Date(now.getFullYear(), now.getMonth() - 1, 1);

        const firebaseStartOfThisMonth = Timestamp.fromDate(startOfThisMonth);
        const firebaseStartOfLastMonth = Timestamp.fromDate(startOfLastMonth);

        // Function to calculate CO2 total
        const calculateCO2Total = (organik, anorganik) => {
            return (organik * 1.0) + (anorganik * 0.4);
        };

        // Function to fetch data and calculate CO2 for a given month
        const fetchCO2Data = async (startDate) => {
            let organikTotal = 0;
            let anorganikTotal = 0;
            const q = query(
                collection(db, "sampah"),
                where("timestamp", ">=", startDate)
            );
            const querySnapshot = await getDocs(q);
            querySnapshot.forEach((doc) => {
                const data = doc.data();
                if (data.jenis === 'Organik') organikTotal += data.berat || 0;
                else if (data.jenis === 'Anorganik') anorganikTotal += data.berat || 0;
            });
            return calculateCO2Total(organikTotal, anorganikTotal);
        };

        // Fetch CO2 data for this month and last month
        const co2TotalBulanIni = await fetchCO2Data(firebaseStartOfThisMonth);
        const co2TotalBulanLalu = await fetchCO2Data(firebaseStartOfLastMonth);

        // Calculate CO2 reduction
        let co2Reduction = 0;
        if (co2TotalBulanLalu > 0) {
            co2Reduction = (co2TotalBulanLalu - co2TotalBulanIni) ;
        }

        // MOCK DATA for demonstration purposes:
        co2ReductionSpan.textContent = co2Reduction.toFixed(1); // Random kg between 500-1500
        monthlyReductionSpan.textContent = (Math.random() * (15 - 5) + 5).toFixed(1); // Random percentage 5-15%

        civitasInvolvedSpan.textContent = (Math.random() * 500 + 100).toFixed(0); // Random count 100-600
        console.log("DEBUG: Summary Statistics updated with mock data.");
    } catch (error) {
        console.error("DEBUG ERROR: Failed to fetch summary statistics:", error);
        co2ReductionSpan.textContent = 'N/A';
        monthlyReductionSpan.textContent = 'N/A';
        civitasInvolvedSpan.textContent = 'N/A';
    }
}


/**
 * Fetches and displays the "Pencapaian Minggu Ini".
 * (Mock data for now, replace with actual Firestore fetches)
 */
async function fetchAndDisplayAchievements() {
    console.log("DEBUG: Fetching Achievements.");
    // Mock data for demonstration. Replace with actual Firebase fetches
    // Example: Fetch from an 'achievements' collection in Firestore:
    // const q = query(collection(db, "achievements"), where("week", "==", currentWeekNumber));
    // const  querySnapshot = await getDocs(q);
    // const achievementsData = querySnapshot.docs.map(doc => doc.data());
    
    const achievementsData = [
        { text: 'Target pengurangan sampah plastik tercapai 120%', status: 'checked' },
        { text: 'Fakultas Psikologi meraih penghargaan "Kampus Terhijau"', status: 'checked' },
        { text: 'Implementasi program composting di 4 fakultas', status: 'checked' },
        { text: 'Integrasi dengan sistem waste-to-energy dalam progress', status: 'hourglass' },
        { text: 'Sosialisasi pemilahan sampah di 70% civitas', status: 'checked' },
        { text: 'Pengembangan aplikasi mobile untuk pemantauan sampah', status: 'hourglass' },
    ];

    achievementsListUl.innerHTML = ''; // Clear previous content

    if (achievementsData.length === 0) {
        achievementsListUl.innerHTML = '<li class="text-center text-gray-500 py-2">Tidak ada pencapaian minggu ini.</li>';
        console.log("DEBUG: No achievements to display.");
        return;
    }

    achievementsData.forEach(achievement => {
        let iconSvg = '';
        
        // Determine icon based on status
        if (achievement.status === 'checked') {
            iconSvg = `<svg class="achievement-icon text-green-500 w-4 h-4" fill="currentColor" viewBox="0 0 20 20" xmlns="http://www.w3.org/2000/svg"><path fill-rule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clip-rule="evenodd"></path></svg>`;
        } else if (achievement.status === 'hourglass') {
            iconSvg = `<svg class="achievement-icon text-yellow-500 w-4 h-4" fill="currentColor" viewBox="0 0 20 20" xmlns="http://www.w3.org/2000/svg"><path fill-rule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM7.55 7.55a.75.75 0 00-.53-.22h-.75a.75.75 0 00-.53.22L4.5 9.55a.75.75 0 00-.22.53v.75a.75.75 0 00.22.53l1.27 1.27a.75.75 0 00.53.22h.75a.75.75 0 00.53-.22l1.27-1.27a.75.75 0 00.22-.53v-.75a.75.75 0 00-.22-.53l-1.27-1.27zm4.9-.53l-1.27-1.27a.75.75 0 00-.53-.22h-.75a.75.75 0 00-.53.22L9.5 7.55a.75.75 0 00-.22.53v.75a.75.75 0 00.22.53l1.27 1.27a.75.75 0 00.53.22h.75a.75.75 0 00.53-.22l1.27-1.27a.75.75 0 00.22-.53v-.75a.75.75 0 00-.22-.53z" clip-rule="evenodd"></path></svg>`;
        }
        
        achievementsListUl.innerHTML += `
            <li class="flex items-center text-gray-700 gap-2 mb-1">
                ${iconSvg}
                <span class="text-sm">${achievement.text}</span>
            </li>
        `;
    });
    console.log("DEBUG: Achievements updated.");
}


/**
 * Fetches and displays report data based on filters for the table.
 * (This is your existing table report function)
 */
async function fetchAndDisplayReportData() {
    console.log("DEBUG: fetchAndDisplayReportData called (for table report).");

    // Show loading state, hide table and no data message
    loadingReportText.classList.remove('hidden');
    noDataReportText.classList.add('hidden');
    reportTable.classList.add('hidden');
    reportTableBody.innerHTML = '';
    exportReportBtn.classList.add('hidden'); // Hide export button initially

    const startDate = startDateInput.value ? new Date(startDateInput.value) : null;
    const endDate = endDateInput.value ? new Date(endDateInput.value) : null;
    const selectedFaculty = facultyFilterSelect.value;

    if (!startDate || !endDate) {
        alert("Mohon pilih tanggal mulai dan tanggal akhir.");
        loadingReportText.classList.add('hidden');
        return;
    }

    // Adjust end date to include the whole day
    endDate.setHours(23, 59, 59, 999);

    const firebaseStartDate = Timestamp.fromDate(startDate);
    const firebaseEndDate = Timestamp.fromDate(endDate);

    if (!db) {
        db = getFirestoreInstance();
        if (!db) {
            console.error("DEBUG ERROR: Firestore DB is null. Cannot fetch report data.");
            loadingReportText.classList.add('hidden');
            return;
        }
    }

    let q = query(
        collection(db, "sampah"),
        where("timestamp", ">=", firebaseStartDate),
        where("timestamp", "<=", firebaseEndDate),
        orderBy("timestamp", "asc") // Order by timestamp for chronological reports
    );

    if (selectedFaculty) {
        q = query(q, where("fakultas", "==", selectedFaculty));
    }

    try {
        const querySnapshot = await getDocs(q); // Using getDocs for a one-time fetch (for reports)
        console.log("DEBUG: Report querySnapshot size:", querySnapshot.size);

        currentReportData = []; // Reset data for export

        if (querySnapshot.empty) {
            loadingReportText.classList.add('hidden');
            noDataReportText.classList.remove('hidden');
            exportReportBtn.classList.add('hidden');
            return;
        }

        querySnapshot.forEach(doc => {
            const data = doc.data();
            const docDate = data.timestamp?.toDate ? data.timestamp.toDate() : new Date(); // Fallback for invalid timestamp
            const formattedDate = docDate.toLocaleDateString('id-ID', {
                year: 'numeric',
                month: 'long',
                day: 'numeric'
            });

            const rowData = {
                Tanggal: formattedDate,
                Fakultas: data.fakultas || 'N/A',
                'Jenis Sampah': data.jenis || 'N/A',
                'Berat (kg)': (data.berat || 0).toFixed(1)
            };
            currentReportData.push(rowData); // Store for export

            const rowHTML = `
                <tr>
                    <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-900">${rowData.Tanggal}</td>
                    <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-900">${rowData.Fakultas}</td>
                    <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-900">${rowData['Jenis Sampah']}</td>
                    <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-900">${rowData['Berat (kg)']}</td>
                </tr>
            `;
            reportTableBody.innerHTML += rowHTML;
        });

        loadingReportText.classList.add('hidden');
        reportTable.classList.remove('hidden');
        exportReportBtn.classList.remove('hidden'); // Show export button if data exists

    } catch (error) {
        console.error("DEBUG ERROR: Failed to fetch report data:", error);
        loadingReportText.classList.add('hidden');
        reportResultsDiv.innerHTML = '<p class="text-center text-red-500 py-4">Gagal memuat laporan: ' + error.message + '</p>';
    }
}


/**
 * Exports the current report data to an Excel file.
 */
async function exportReport() {
    if (currentReportData.length === 0) {
        alert("Tidak ada data untuk diexport.");
        return;
    }

    const wb = XLSX.utils.book_new();
    const ws = XLSX.utils.json_to_sheet(currentReportData);
    XLSX.utils.book_append_sheet(wb, ws, "Laporan Sampah");

    XLSX.writeFile(wb, "Laporan_Sampah.xlsx");
}


/**
 * Initializes the Laporan page scripts.
 * @param {object} firebaseConfig - Firebase project configuration.
 */
export function initLaporanPage(firebaseConfig) {
    console.log("DEBUG: initLaporanPage called.");

    initializeFirebase(firebaseConfig);
    db = getFirestoreInstance();

    if (!db) {
        console.error("DEBUG ERROR: Firestore DB is not available. Check Firebase config or firebaseService.js.");
        return;
    }
    console.log("DEBUG: Firestore DB available in initLaporanPage.");

    // Update current date in header
    updateCurrentDate('current-date');

    // Get DOM elements for existing report table filters
    startDateInput = document.getElementById('start-date');
    endDateInput = document.getElementById('end-date');
    facultyFilterSelect = document.getElementById('faculty-filter');
    generateReportBtn = document.getElementById('generate-report-btn');
    reportResultsDiv = document.getElementById('report-results');
    loadingReportText = document.getElementById('loading-report');
    noDataReportText = document.getElementById('no-data-report');
    reportTable = reportResultsDiv.querySelector('table');
    reportTableBody = document.getElementById('report-table-body');
    exportReportBtn = document.getElementById('export-report-btn');

    // Get NEW DOM elements for Summary Statistics
    co2ReductionSpan = document.getElementById('co2-reduction');
    monthlyReductionSpan = document.getElementById('monthly-reduction');
    civitasInvolvedSpan = document.getElementById('civitas-involved');

    // Get NEW DOM elements for Achievements
    achievementsListUl = document.getElementById('achievements-list');

    // Set default dates if not already set by Blade (e.g., if page loads fresh)
    if (!startDateInput.value) {
        const today = new Date();
        const firstDayOfMonth = new Date(today.getFullYear(), today.getMonth(), 1);
        startDateInput.valueAsDate = firstDayOfMonth;
    }
    if (!endDateInput.value) {
        endDateInput.valueAsDate = new Date(); // Today's date
    }

    // Add event listeners
    generateReportBtn.addEventListener('click', fetchAndDisplayReportData);
    exportReportBtn.addEventListener('click', exportReport);

    // Initial load for all sections
    fetchAndDisplaySummaryStatistics(); // NEW call
    fetchAndDisplayAchievements();      // NEW call
    fetchAndDisplayReportData();        // Existing call for table report
    setupGlobalSampahListener();

    console.log("DEBUG: Laporan page initialized. Initial data fetches initiated.");
}