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

// DOM elements for Summary Statistics
let co2ReductionSpan;
let monthlyReductionSpan;
let monthlyTotalSpan;

// DOM elements for Achievements
let achievementsListUl;


/**
 * HELPER: Calculates the number of unique faculties that submitted data in a date range.
 * @param {Timestamp} startDate - The start date for the query.
 * @param {Timestamp} endDate - The end date for the query.
 * @returns {Promise<number>} - The count of active faculties.
 */
async function getActiveFaculties(startDate, endDate) {
    const facultySet = new Set();
    const q = query(
        collection(db, "sampah"),
        where("timestamp", ">=", startDate),
        where("timestamp", "<=", endDate)
    );
    const querySnapshot = await getDocs(q);
    querySnapshot.forEach(doc => {
        if (doc.data().fakultas) {
            facultySet.add(doc.data().fakultas);
        }
    });
    return facultySet.size;
}

/**
 * HELPER: Calculates data input consistency from the start of the current month to today.
 * @returns {Promise<{count: number, totalDays: number}>} - An object containing the count of days with entries
 * and the current day of the month.
 */
async function calculateInputConsistency() {
    const today = new Date();
    // Set the start date to the 1st day of the current month
    const startOfMonth = new Date(today.getFullYear(), today.getMonth(), 1);
    startOfMonth.setHours(0, 0, 0, 0); // Ensure it starts from the very beginning of the day

    const firebaseStartDate = Timestamp.fromDate(startOfMonth);
    const firebaseEndDate = Timestamp.fromDate(today);

    const daysWithData = new Set();
    const q = query(
        collection(db, "sampah"),
        where("timestamp", ">=", firebaseStartDate),
        where("timestamp", "<=", firebaseEndDate)
    );

    const querySnapshot = await getDocs(q);
    querySnapshot.forEach(doc => {
        const docDate = doc.data().timestamp.toDate().toISOString().split('T')[0]; // Format as 'YYYY-MM-DD'
        daysWithData.add(docDate);
    });

    // Return an object with the count and the total days so far this month
    return {
        count: daysWithData.size,
        totalDays: today.getDate() // Returns the day of the month (e.g., 10 for Sep 10th)
    };
}


/**
 * Fetches and displays the main summary statistics AND returns data for achievements.
 * @returns {Promise<object|null>} - An object with calculated data or null on error.
 */
async function fetchAndDisplaySummaryStatistics() {
    console.log("DEBUG: Fetching Summary Statistics.");
    try {
        const now = new Date();
        const startOfThisMonth = new Date(now.getFullYear(), now.getMonth(), 1);
        const endOfThisMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59, 999);
        const startOfLastMonth = new Date(now.getFullYear(), now.getMonth() - 1, 1);
        const endOfLastMonth = new Date(startOfThisMonth.getTime() - 1);

        const firebaseStartOfThisMonth = Timestamp.fromDate(startOfThisMonth);
        const firebaseEndOfThisMonth = Timestamp.fromDate(endOfThisMonth);
        const firebaseStartOfLastMonth = Timestamp.fromDate(startOfLastMonth);
        const firebaseEndOfLastMonth = Timestamp.fromDate(endOfLastMonth);

        const calculateCO2Total = (organik, anorganik) => (organik * 1.0) + (anorganik * 0.4);

        const fetchMonthlyData = async (startDate, endDate) => {
            let organikTotal = 0, anorganikTotal = 0, residuTotal = 0, beratTotal = 0;
            const q = query(collection(db, "sampah"), where("timestamp", ">=", startDate), where("timestamp", "<=", endDate));
            const querySnapshot = await getDocs(q);
            
            querySnapshot.forEach((doc) => {
                const data = doc.data();

                // --- TAMBAHKAN FILTER INI ---
                // Abaikan data lama yang jenisnya 'Umum'
                if (data.jenis === 'Umum') {
                    return;
                }

                const berat = data.berat || 0;
                if (data.jenis === 'Organik') organikTotal += berat;
                else if (data.jenis === 'Anorganik') anorganikTotal += berat;
                else if (data.jenis === 'Residu') residuTotal += berat;
                
                beratTotal += berat;
            });
            
            return {
                co2: calculateCO2Total(organikTotal, anorganikTotal),
                totalBerat: beratTotal,
                organikTotal,
                anorganikTotal,
                residuTotal,
            };
        };

        const [dataBulanIni, dataBulanLalu, activeFacultyCount, consistencyData] = await Promise.all([
            fetchMonthlyData(firebaseStartOfThisMonth, firebaseEndOfThisMonth),
            fetchMonthlyData(firebaseStartOfLastMonth, firebaseEndOfLastMonth),
            getActiveFaculties(firebaseStartOfThisMonth, firebaseEndOfThisMonth),
            calculateInputConsistency()
        ]);

        const co2Reduction = (dataBulanLalu.co2 > 0) ? (dataBulanLalu.co2 - dataBulanIni.co2) : 0;
        const monthlyReductionKg = dataBulanLalu.totalBerat - dataBulanIni.totalBerat;

        co2ReductionSpan.textContent = co2Reduction.toFixed(1);
        monthlyReductionSpan.textContent = monthlyReductionKg.toFixed(1);
        monthlyTotalSpan.textContent = dataBulanIni.totalBerat.toFixed(1);

        console.log("DEBUG: Summary Statistics updated.");

        return {
            monthlyReductionKg,
            lastMonthTotal: dataBulanLalu.totalBerat,
            activeFacultyCount,
            sortedWasteKg: dataBulanIni.organikTotal + dataBulanIni.anorganikTotal,
            // unsortedWasteKg: dataBulanIni.umumTotal,
            unsortedWasteKg: dataBulanIni.residuTotal,
            consistencyData,
        };

    } catch (error) {
        console.error("DEBUG ERROR: Failed to fetch summary statistics:", error);
        co2ReductionSpan.textContent = 'N/A';
        monthlyReductionSpan.textContent = 'N/A';
        monthlyTotalSpan.textContent = 'N/A';
        return null;
    }
}


/**
 * Displays the "Pencapaian Minggu Ini" based on calculated data.
 * @param {object} summaryData - The data object from fetchAndDisplaySummaryStatistics.
 */
async function fetchAndDisplayAchievements(summaryData) {
    console.log("DEBUG: Fetching Achievements.");

    achievementsListUl.innerHTML = '';

    if (!summaryData) {
        achievementsListUl.innerHTML = '<li class="text-center text-gray-500 py-2">Gagal memuat data pencapaian.</li>';
        console.log("DEBUG: No summary data for achievements.");
        return;
    }

    const {
        monthlyReductionKg,
        lastMonthTotal,
        activeFacultyCount,
        sortedWasteKg,
        unsortedWasteKg,
        consistencyData
    } = summaryData;

    const achievementsData = [
        {
            text: `Jumlah fakultas aktif bulan ini: <strong>${activeFacultyCount}</strong>`,
            status: activeFacultyCount > 0 ? 'checked' : 'hourglass'
        },
        {
            text: `Total pengurangan <strong>${monthlyReductionKg.toFixed(1)} kg</strong> sampah dari ${lastMonthTotal.toFixed(1)} kg sampah bulan lalu`,
            status: 'checked'
        },
        {
            text: 'Target berat sampah tercapai',
            status: monthlyReductionKg >= 0 ? 'checked' : 'hourglass'
        },
        {
            text: `Konsistensi input data: <strong>${consistencyData.count} dari ${consistencyData.totalDays} hari</strong> bulan ini (${consistencyData.totalDays > 0 ? Math.round((consistencyData.count / consistencyData.totalDays) * 100) : 0}%)`,
            status: (consistencyData.totalDays > 0 && (consistencyData.count / consistencyData.totalDays) >= 0.7) ? 'checked' : 'hourglass'
        }
    ];

    achievementsData.forEach(achievement => {
        let iconSvg = '';
        if (achievement.status === 'checked') {
            iconSvg = `<svg class="achievement-icon text-green-500 w-4 h-4" fill="currentColor" viewBox="0 0 20 20" xmlns="http://www.w3.org/2000/svg"><path fill-rule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clip-rule="evenodd"></path></svg>`;
        } else {
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
 */
async function fetchAndDisplayReportData() {
    console.log("DEBUG: fetchAndDisplayReportData called (for table report).");

    loadingReportText.classList.remove('hidden');
    noDataReportText.classList.add('hidden');
    reportTable.classList.add('hidden');
    reportTableBody.innerHTML = '';
    exportReportBtn.classList.add('hidden');

    const startDate = startDateInput.value ? new Date(startDateInput.value) : null;
    const endDate = endDateInput.value ? new Date(endDateInput.value) : null;
    const selectedFaculty = facultyFilterSelect.value;

    if (!startDate || !endDate) {
        alert("Mohon pilih tanggal mulai dan tanggal akhir.");
        loadingReportText.classList.add('hidden');
        return;
    }

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
        orderBy("timestamp", "asc")
    );

    if (selectedFaculty) {
        q = query(q, where("fakultas", "==", selectedFaculty));
    }

    try {
        const querySnapshot = await getDocs(q);
        currentReportData = [];

        if (querySnapshot.empty) {
            loadingReportText.classList.add('hidden');
            noDataReportText.classList.remove('hidden');
            return;
        }

        querySnapshot.forEach(doc => {
            const data = doc.data();
            const docDate = data.timestamp?.toDate ? data.timestamp.toDate() : new Date();
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
            currentReportData.push(rowData);

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
        exportReportBtn.classList.remove('hidden');

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
        console.error("DEBUG ERROR: Firestore DB is not available.");
        return;
    }

    updateCurrentDate('current-date');

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

    co2ReductionSpan = document.getElementById('co2-reduction');
    monthlyReductionSpan = document.getElementById('monthly-reduction');
    monthlyTotalSpan = document.getElementById('monthly-total');
    achievementsListUl = document.getElementById('achievements-list');

    if (!startDateInput.value) {
        const today = new Date();
        const firstDayOfMonth = new Date(today.getFullYear(), today.getMonth(), 1);
        startDateInput.valueAsDate = firstDayOfMonth;
    }
    if (!endDateInput.value) {
        endDateInput.valueAsDate = new Date();
    }

    generateReportBtn.addEventListener('click', fetchAndDisplayReportData);
    exportReportBtn.addEventListener('click', exportReport);

    const loadInitialData = async () => {
        const summaryData = await fetchAndDisplaySummaryStatistics();
        await fetchAndDisplayAchievements(summaryData);
        await fetchAndDisplayReportData();
        setupGlobalSampahListener();
    };

    loadInitialData();

    console.log("DEBUG: Laporan page initialized. Initial data fetches initiated.");
}