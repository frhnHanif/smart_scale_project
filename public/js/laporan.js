// public/js/laporan.js

import { initializeFirebase, getFirestoreInstance, updateCurrentDate, setupGlobalSampahListener } from "./firebaseService.js";
import { collection, query, where, getDocs, Timestamp, orderBy, onSnapshot } from "https://www.gstatic.com/firebasejs/11.6.1/firebase-firestore.js";
import * as XLSX from 'https://cdn.sheetjs.com/xlsx-0.20.2/package/xlsx.mjs'; // For Excel export

let db;
let currentReportData = [];
let currentSortKey = 'timestamp'; // Default sort key
let currentSortDirection = 'desc'; // Default sort direction
let unsubscribeReportListener = null;

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
 // 🔹 NEW: dropdown untuk pengurutan

let co2ReductionSpan;
let monthlyReductionSpan;
let monthlyTotalSpan;
let achievementsListUl;

// ==============================
// === HELPER FUNCTIONS EXISTING ===
// ==============================

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

async function calculateInputConsistency() {
    const today = new Date();
    const startOfMonth = new Date(today.getFullYear(), today.getMonth(), 1);
    startOfMonth.setHours(0, 0, 0, 0);

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
        const docDate = doc.data().timestamp.toDate().toISOString().split('T')[0];
        daysWithData.add(docDate);
    });

    return {
        count: daysWithData.size,
        totalDays: today.getDate()
    };
}

// ==============================
// === SUMMARY & ACHIEVEMENTS ===
// ==============================

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
                if (data.jenis === 'Umum') return;

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

        return {
            monthlyReductionKg,
            lastMonthTotal: dataBulanLalu.totalBerat,
            activeFacultyCount,
            sortedWasteKg: dataBulanIni.organikTotal + dataBulanIni.anorganikTotal,
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

async function fetchAndDisplayAchievements(summaryData) {
    console.log("DEBUG: Fetching Achievements.");

    achievementsListUl.innerHTML = '';
    if (!summaryData) {
        achievementsListUl.innerHTML = '<li class="text-center text-gray-500 py-2">Gagal memuat data pencapaian.</li>';
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
        { text: `Jumlah fakultas aktif bulan ini: <strong>${activeFacultyCount}</strong>`, status: activeFacultyCount > 0 ? 'checked' : 'hourglass' },
        { text: `Total pengurangan <strong>${monthlyReductionKg.toFixed(1)} kg</strong> dari ${lastMonthTotal.toFixed(1)} kg`, status: 'checked' },
        { text: 'Target berat sampah tercapai', status: monthlyReductionKg >= 0 ? 'checked' : 'hourglass' },
        { text: `Konsistensi input data: <strong>${consistencyData.count} dari ${consistencyData.totalDays} hari</strong>`, status: (consistencyData.totalDays > 0 && (consistencyData.count / consistencyData.totalDays) >= 0.7) ? 'checked' : 'hourglass' }
    ];

    achievementsData.forEach(achievement => {
        let icon = achievement.status === 'checked'
            ? `<svg class="text-green-500 w-4 h-4" fill="currentColor" viewBox="0 0 20 20"><path fill-rule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586l-1.293-1.293A1 1 0 006.293 9.707l2 2a1 1 0 001.414 0l4-4z" clip-rule="evenodd"/></svg>`
            : `<svg class="text-yellow-500 w-4 h-4" fill="currentColor" viewBox="0 0 20 20"><path fill-rule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16z" clip-rule="evenodd"/></svg>`;
        achievementsListUl.innerHTML += `<li class="flex items-center gap-2 mb-1">${icon}<span class="text-sm">${achievement.text}</span></li>`;
    });
}

// ==============================
// === LAPORAN TABLE SECTION ===
// ==============================

/**
 * ✨ FUNGSI BARU: Me-render ulang baris tabel berdasarkan data yang ada.
 * @param {Array} dataToRender Data yang akan ditampilkan di tabel.
 */
function renderTable(dataToRender) {
    reportTableBody.innerHTML = ''; // Kosongkan tabel dulu
    if (dataToRender.length === 0) {
        return; // Tidak ada yang dirender jika data kosong
    }

    let tableHTML = '';
    dataToRender.forEach(rowData => {
        tableHTML += `
            <tr class="text-center">
                <td class="px-4 py-2">${rowData.Tanggal}</td>
                <td class="px-4 py-2">${rowData.Hari}</td>
                <td class="px-4 py-2">${rowData.Waktu}</td>
                <td class="px-4 py-2">${rowData.Fakultas}</td>
                <td class="px-4 py-2">${rowData['Jenis Sampah']}</td>
                <td class="px-4 py-2">${rowData['Berat (kg)']}</td>
            </tr>`;
    });
    reportTableBody.innerHTML = tableHTML;
}

/**
 * ✨ FUNGSI BARU: Mengupdate ikon sort di header tabel.
 */
function updateSortIcons() {
    document.querySelectorAll('.sortable-header').forEach(header => {
        const key = header.getAttribute('data-sort-key');
        const iconSpan = header.querySelector('.sort-icon');
        if (key === currentSortKey) {
            iconSpan.classList.add('active');
            iconSpan.innerHTML = currentSortDirection === 'asc' ? '▲' : '▼';
        } else {
            iconSpan.classList.remove('active');
            iconSpan.innerHTML = ''; // Atau ikon default sort '↕'
        }
    });
}

/**
 * ✨ FUNGSI BARU: Mengurutkan data yang ada di `currentReportData`
 */
function sortAndRenderData() {
    const sortedData = [...currentReportData].sort((a, b) => {
        const valA = a[currentSortKey];
        const valB = b[currentSortKey];

        // Logika sorting berdasarkan tipe data
        if (currentSortKey === 'timestamp') {
            // Sort by Date object
            return currentSortDirection === 'asc' ? valA - valB : valB - valA;
        } else if (currentSortKey === 'Berat (kg)') {
            // Sort by number
            const numA = parseFloat(valA) || 0;
            const numB = parseFloat(valB) || 0;
            return currentSortDirection === 'asc' ? numA - numB : numB - numA;
        } else {
            // Sort by string
            return currentSortDirection === 'asc'
                ? String(valA).localeCompare(String(valB))
                : String(valB).localeCompare(String(valA));
        }
    });

    renderTable(sortedData);
    updateSortIcons();
}

async function fetchAndDisplayReportData() {
    console.log("DEBUG: Fetching Report Data.");

        if (unsubscribeReportListener) {
        console.log("DEBUG: Unsubscribing from previous listener.");
        unsubscribeReportListener();
    }

    loadingReportText.classList.remove('hidden');
    noDataReportText.classList.add('hidden');
    reportTable.classList.add('hidden');
    reportTableBody.innerHTML = '';
    exportReportBtn.classList.add('hidden');

    const startDate = startDateInput.value ? new Date(startDateInput.value) : null;
    const endDate = endDateInput.value ? new Date(endDateInput.value) : null;
    const selectedFaculty = facultyFilterSelect.value;
    // const sortOrder = sortSelect ? sortSelect.value : "desc"; // 🔹 NEW

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
            console.error("Firestore DB null.");
            loadingReportText.classList.add('hidden');
            return;
        }
    }

    let q = query(
        collection(db, "sampah"),
        where("timestamp", ">=", firebaseStartDate),
        where("timestamp", "<=", firebaseEndDate),
        orderBy("timestamp") 
    );

    if (selectedFaculty) q = query(q, where("fakultas", "==", selectedFaculty));

    unsubscribeReportListener = onSnapshot(q, (querySnapshot) => {
        console.log("DEBUG: Real-time data received.");
        currentReportData = []; // Kosongkan data setiap kali ada update

        if (querySnapshot.empty) {
            loadingReportText.classList.add('hidden');
            noDataReportText.classList.remove('hidden');
            reportTable.classList.add('hidden');
            exportReportBtn.classList.add('hidden');
            renderTable([]); // Pastikan tabel kosong
            return;
        }

        querySnapshot.forEach(doc => {
            const data = doc.data();
            const docDate = data.timestamp?.toDate ? data.timestamp.toDate() : new Date();

            currentReportData.push({
                'timestamp': docDate,
                'Tanggal': docDate.toLocaleDateString('id-ID', { year: 'numeric', month: 'long', day: 'numeric' }),
                'Hari': docDate.toLocaleDateString('id-ID', { weekday: 'long' }),
                'Waktu': docDate.toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' }),
                'Fakultas': data.fakultas || 'N/A',
                'Jenis Sampah': data.jenis || 'N/A',
                'Berat (kg)': (data.berat || 0).toFixed(1)
            });
        });

        // Tampilkan UI setelah data diproses
        loadingReportText.classList.add('hidden');
        noDataReportText.classList.add('hidden');
        reportTable.classList.remove('hidden');
        exportReportBtn.classList.remove('hidden');

        // Panggil fungsi sort & render untuk menampilkan data yang baru diterima
        sortAndRenderData();

    }, (error) => {
        // Fungsi untuk menangani error dari listener
        console.error("DEBUG ERROR: Real-time listener failed:", error);
        loadingReportText.classList.add('hidden');
        reportResultsDiv.innerHTML = `<p class="text-center text-red-500 py-4">Gagal memuat laporan real-time: ${error.message}</p>`;
    });
}

// ==============================
// === EXPORT EXCEL ===
// ==============================

async function exportReport() {
    if (currentReportData.length === 0) {
        alert("Tidak ada data untuk diexport.");
        return;
    }

   // Export data sesuai dengan urutan saat ini
    const dataToExport = [...currentReportData].map(item => ({
        Tanggal: item.Tanggal,
        Hari: item.Hari,
        Waktu: item.Waktu,
        Fakultas: item.Fakultas,
        'Jenis Sampah': item['Jenis Sampah'],
        'Berat (kg)': item['Berat (kg)'],
    }));

    const wb = XLSX.utils.book_new();
    const ws = XLSX.utils.json_to_sheet(dataToExport);
    XLSX.utils.book_append_sheet(wb, ws, "Laporan Sampah");
    XLSX.writeFile(wb, "Laporan_Sampah.xlsx");
}

// ==============================
// === INIT PAGE ===
// ==============================

export function initLaporanPage(firebaseConfig) {
    initializeFirebase(firebaseConfig);
    db = getFirestoreInstance();

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

    // Default date range
    if (!startDateInput.value) {
        const today = new Date();
        const firstDay = new Date(today.getFullYear(), today.getMonth(), 1);
        startDateInput.valueAsDate = firstDay;
    }
    if (!endDateInput.value) endDateInput.valueAsDate = new Date();

    generateReportBtn.addEventListener('click', fetchAndDisplayReportData);
    exportReportBtn.addEventListener('click', exportReport);
    document.querySelectorAll('.sortable-header').forEach(header => {
        header.addEventListener('click', () => {
            const sortKey = header.getAttribute('data-sort-key');
            
            // Jika klik kolom yang sama, balik arah sort
            if (currentSortKey === sortKey) {
                currentSortDirection = currentSortDirection === 'asc' ? 'desc' : 'asc';
            } else {
                // Jika klik kolom baru, set key baru dan reset arah ke 'asc'
                currentSortKey = sortKey;
                currentSortDirection = (sortKey === 'timestamp') ? 'desc' : 'asc';
            }
            sortAndRenderData(); // Panggil fungsi sort & render
        });
    });

    const loadInitialData = async () => {
        const summaryData = await fetchAndDisplaySummaryStatistics();
        await fetchAndDisplayAchievements(summaryData);
        await fetchAndDisplayReportData();
        setupGlobalSampahListener();
    };

    loadInitialData();
}
