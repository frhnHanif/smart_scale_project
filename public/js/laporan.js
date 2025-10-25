// public/js/laporan.js

// 1. IMPORTS
import { fetchData, updateGlobalStatCards } from "./firebaseService.js";
// (Impor XLSX ini adalah perbaikan Anda yang sudah benar)
import * as XLSX from 'https://cdn.sheetjs.com/xlsx-0.20.2/package/xlsx.mjs';

// 2. VARIABEL GLOBAL
// HAPUS: let allData = [];
let currentReportData = []; // Data untuk tabel di halaman saat ini
let currentSortKey = 'timestamp';
let currentSortDirection = 'desc';
// BARU: Variabel untuk state pagination
let currentPage = 1;
let lastPage = 1;
let totalItems = 0;

// Variabel DOM
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
let co2ReductionSpan;
let monthlyReductionSpan;
let monthlyTotalSpan;
let achievementsListUl;
// BARU: Variabel DOM untuk pagination
let paginationControls;
let perPageSelect;
let pageInfoSpan;
let prevPageBtn;
let nextPageBtn;


// 3. FUNGSI UTILITAS TANGGAL (SAMA)
function updateCurrentDate(elementId) {
    const dateElement = document.getElementById(elementId);
    if (dateElement) {
        const today = new Date();
        const options = {
            weekday: 'long',
            day: 'numeric',
            month: 'long',
            year: 'numeric'
        };
        dateElement.textContent = today.toLocaleDateString('id-ID', options);
    }
}

// ==============================
// === BAGIAN 1: STATISTIK RINGKASAN & PENCAPAIAN ===
// (Fungsi-fungsi ini sekarang mengambil data mereka sendiri)
// ==============================

/**
 * FUNGSI BARU (ASYNC): Memuat data khusus untuk statistik ringkasan.
 */
async function loadSummaryData() {
    console.log("Memuat statistik ringkasan...");
    try {
        const now = new Date();
        const startOfThisMonth = new Date(now.getFullYear(), now.getMonth(), 1);
        const endOfThisMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59, 999);
        const startOfLastMonth = new Date(now.getFullYear(), now.getMonth() - 1, 1);
        const endOfLastMonth = new Date(startOfThisMonth.getTime() - 1);

        // Helper untuk format tanggal YYYY-MM-DD
        const toISODate = (date) => date.toISOString().split('T')[0];

        // 1. Panggil API ekspor untuk mengambil data bulan ini
        const dataBulanIniArr = await fetchData({
            start_date: toISODate(startOfThisMonth),
            end_date: toISODate(endOfThisMonth)
        }, '/api/sampah-export'); // Gunakan endpoint ekspor

        // 2. Panggil API ekspor untuk mengambil data bulan lalu
        const dataBulanLaluArr = await fetchData({
            start_date: toISODate(startOfLastMonth),
            end_date: toISODate(endOfLastMonth)
        }, '/api/sampah-export'); // Gunakan endpoint ekspor

        // 3. Proses data (logika dari 'processMonthlyData' lama)
        const calculateCO2Total = (organik, anorganik) => (organik * 1.0) + (anorganik * 0.4);
        
        const processData = (dataset) => {
            let organikTotal = 0, anorganikTotal = 0, beratTotal = 0;
            dataset.forEach(item => {
                if (item.jenis === 'Umum') return;
                const berat = item.berat; // sudah float
                if (item.jenis === 'Organik') {
                    organikTotal += berat;
                } else if (item.jenis === 'Anorganik' || item.jenis === 'Kertas' || item.jenis === 'Botol') {
                    anorganikTotal += berat;
                }
                beratTotal += berat;
            });
            return {
                co2: calculateCO2Total(organikTotal, anorganikTotal),
                totalBerat: beratTotal,
                organikTotal, anorganikTotal
            };
        };

        const dataBulanIni = processData(dataBulanIniArr);
        const dataBulanLalu = processData(dataBulanLaluArr);

        // 4. Update UI Statistik
        const co2Reduction = dataBulanLalu.co2 - dataBulanIni.co2;
        const monthlyReductionKg = dataBulanLalu.totalBerat - dataBulanIni.totalBerat;

        co2ReductionSpan.textContent = co2Reduction.toFixed(1);
        monthlyReductionSpan.textContent = monthlyReductionKg.toFixed(1);
        monthlyTotalSpan.textContent = dataBulanIni.totalBerat.toFixed(1);

        // 5. Panggil fungsi pencapaian (passing data yang sudah diolah)
        // (Kita perlu helper 'calculateInputConsistency' & 'getActiveFaculties')
        const consistencyData = calculateInputConsistency(dataBulanIniArr, now);
        const activeFacultyCount = getActiveFaculties(dataBulanIniArr);
        
        displayAchievements({
            monthlyReductionKg,
            lastMonthTotal: dataBulanLalu.totalBerat,
            activeFacultyCount,
            consistencyData,
        });

    } catch (error) {
        console.error("Gagal memuat statistik ringkasan:", error);
        co2ReductionSpan.textContent = 'N/A';
        monthlyReductionSpan.textContent = 'N/A';
        monthlyTotalSpan.textContent = 'N/A';
    }
}

// Helper untuk 'loadSummaryData'
function getActiveFaculties(data) {
    const facultySet = new Set();
    data.forEach(item => {
        if (item.fakultas) facultySet.add(item.fakultas);
    });
    return facultySet.size;
}

// Helper untuk 'loadSummaryData'
function calculateInputConsistency(data, today) {
    const daysWithData = new Set();
    data.forEach(item => {
        daysWithData.add(item.timestamp.toISOString().split('T')[0]);
    });
    return {
        count: daysWithData.size,
        totalDays: today.getDate()
    };
}

/**
 * FUNGSI INI DIUBAH (dihapus 'fetchAnd')
 * Sekarang hanya menampilkan data, tidak mengambil.
 */
/**
 * FUNGSI INI DIUBAH (dihapus 'fetchAnd')
 * Sekarang hanya menampilkan data, tidak mengambil.
 */
function displayAchievements(summaryData) {
    console.log("Menampilkan Pencapaian.");
    achievementsListUl.innerHTML = '';
    if (!summaryData) {
        achievementsListUl.innerHTML = '<li class="text-center text-gray-500 py-2">Gagal memuat data pencapaian.</li>';
        return;
    }
    const { monthlyReductionKg, lastMonthTotal, activeFacultyCount, consistencyData } = summaryData;

    const achievementsData = [
        { text: `Jumlah fakultas aktif bulan ini: <strong>${activeFacultyCount}</strong>`, status: activeFacultyCount > 0 ? 'checked' : 'hourglass' },
        { text: `Total pengurangan <strong>${monthlyReductionKg.toFixed(1)} kg</strong> dari ${lastMonthTotal.toFixed(1)} kg`, status: 'checked' },
        { text: 'Target berat sampah tercapai', status: monthlyReductionKg >= 0 ? 'checked' : 'hourglass' },
        { text: `Konsistensi input data: <strong>${consistencyData.count} dari ${consistencyData.totalDays} hari</strong>`, status: (consistencyData.totalDays > 0 && (consistencyData.count / consistencyData.totalDays) >= 0.7) ? 'checked' : 'hourglass' }
    ];

    // PERBAIKAN: Kode SVG lengkap dikembalikan
    achievementsData.forEach(achievement => {
        let icon = achievement.status === 'checked'
            ? `<svg class="text-green-500 w-4 h-4" fill="currentColor" viewBox="0 0 20 20"><path fill-rule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586l-1.293-1.293A1 1 0 006.293 9.707l2 2a1 1 0 001.414 0l4-4z" clip-rule="evenodd"/></svg>`
            : `<svg class="w-4 h-4" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
    <circle cx="12" cy="12" r="10" fill="#F97316" />
    <path fill-rule="evenodd" clip-rule="evenodd" fill="#FFFFFF"
          transform="scale(0.7) translate(5, 5)"
          d="M5.5 3a1 1 0 0 0 0 2H7v2.333a3 3 0 0 0 .556 1.74l1.57 2.814A1.1 1.1 0 0 0 9.2 12a.998.998 0 0 0-.073.113l-1.57 2.814A3 3 0 0 0 7 16.667V19H5.5a1 1 0 1 0 0 2h13a1 1 0 1 0 0-2H17v-2.333a3 3 0 0 0-.56-1.745l-1.616-2.82a1 1 0 0 0-.067-.102 1 1 0 0 0 .067-.103l1.616-2.819A3 3 0 0 0 17 7.333V5h1.5a1 1 0 1 0 0-2h-13Z" />
</svg>`;
        
        // Baris ini adalah kuncinya, memastikan 'flex' ada di class
        achievementsListUl.innerHTML += `<li class="flex items-center gap-2 mb-1">${icon}<span class="text-sm">${achievement.text}</span></li>`;
    });
}


// ==============================
// === BAGIAN 2: TABEL LAPORAN (PAGINATION) ===
// ==============================

/**
 * FUNGSI UTAMA BARU (ASYNC): Mengambil data paginasi dari backend
 */
async function fetchAndDisplayReportData() {
    loadingReportText.classList.remove('hidden');
    noDataReportText.classList.add('hidden');
    reportTable.classList.add('hidden');
    exportReportBtn.classList.add('hidden'); // Sembunyikan tombol ekspor saat loading
    paginationControls.classList.add('hidden');

    // 1. Kumpulkan semua filter
    const params = {
        start_date: startDateInput.value,
        end_date: endDateInput.value,
        fakultas: facultyFilterSelect.value,
        page: currentPage,
        per_page: perPageSelect.value,
        // (Kita tidak mengirim sort key/direction ke backend, sorting tetap di frontend)
    };
    
    // 2. Panggil API paginasi
    // 'fetchData' sekarang mengembalikan objek: { data: [], total: X, ... }
    const response = await fetchData(params, '/api/sampah-data');

    loadingReportText.classList.add('hidden');

    // 3. Cek jika tidak ada data
    if (!response || !response.data || response.data.length === 0) {
        noDataReportText.classList.remove('hidden');
        currentReportData = [];
        renderTable([]);
        return;
    }

    // 4. Update data global dan UI
    reportTable.classList.remove('hidden');
    exportReportBtn.classList.remove('hidden'); // Tampilkan tombol ekspor
    paginationControls.classList.remove('hidden');
    
    // Update state pagination
    currentPage = response.current_page;
    lastPage = response.last_page;
    totalItems = response.total;

    // 5. Format data untuk tabel (dari 'response.data')
    currentReportData = response.data.map(item => {
        // 'item.timestamp' dan 'item.berat' sudah diproses oleh fetchData
        const docDate = item.timestamp;
        return {
            'timestamp': docDate,
            'Tanggal': docDate.toLocaleDateString('id-ID', { year: 'numeric', month: 'long', day: 'numeric' }),
            'Hari': docDate.toLocaleDateString('id-ID', { weekday: 'long' }),
            'Waktu': docDate.toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' }),
            'Fakultas': item.fakultas || 'N/A',
            'Jenis Sampah': item.jenis || 'N/A',
            'Berat (kg)': item.berat.toFixed(1) // berat sudah number
        };
    });

    // 6. Panggil sort & render
    sortAndRenderData();
    updatePaginationUI();
}

/**
 * FUNGSI HELPER BARU: Mengupdate tombol dan teks pagination
 */
function updatePaginationUI() {
    pageInfoSpan.textContent = `Halaman ${currentPage} dari ${lastPage} (Total ${totalItems} data)`;
    prevPageBtn.disabled = (currentPage <= 1);
    nextPageBtn.disabled = (currentPage >= lastPage);
}

// Fungsi renderTable (SAMA, tidak perlu diubah)
function renderTable(dataToRender) {
    reportTableBody.innerHTML = '';
    if (dataToRender.length === 0) {
        return;
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

// Fungsi updateSortIcons (SAMA, tidak perlu diubah)
function updateSortIcons() {
    document.querySelectorAll('.sortable-header').forEach(header => {
        const key = header.getAttribute('data-sort-key');
        const iconSpan = header.querySelector('.sort-icon');
        if (key === currentSortKey) {
            iconSpan.classList.add('active');
            iconSpan.innerHTML = currentSortDirection === 'asc' ? '▲' : '▼';
        } else {
            iconSpan.classList.remove('active');
            iconSpan.innerHTML = '';
        }
    });
}

/**
 * FUNGSI INI DIUBAH: Sekarang hanya mengurutkan 'currentReportData'
 * (PERBAIKAN BUG TYPO 'valB' DITERAPKAN)
 */
function sortAndRenderData() {
    const sortedData = [...currentReportData].sort((a, b) => {
        const valA = a[currentSortKey];
        const valB = b[currentSortKey];

        if (currentSortKey === 'timestamp') {
            return currentSortDirection === 'asc' ? valA - valB : valB - valA;
        } else if (currentSortKey === 'Berat (kg)') {
            const numA = parseFloat(valA) || 0;
            const numB = parseFloat(valB) || 0; // <-- PERBAIKAN TYPO
            return currentSortDirection === 'asc' ? numA - numB : numB - numA;
        } else {
            return currentSortDirection === 'asc' ?
                String(valA).localeCompare(String(valB)) :
                String(valB).localeCompare(String(valA));
        }
    });

    renderTable(sortedData);
    updateSortIcons();
}

// ==============================
// === BAGIAN 3: EKSPOR EXCEL (DIUBAH) ===
// ==============================

/**
 * FUNGSI EKSPOR (ASYNC): Sekarang memanggil API ekspor
 */
async function exportReport() {
    Toastify({
    text: "Mempersiapkan data ekspor. Ini mungkin perlu waktu beberapa saat.",
    duration: 2500, // Durasi 5 detik
    gravity: "bottom", // Posisi 'top' atau 'bottom'
    position: "right", // Posisi 'left', 'center', atau 'right'
    style: {
        background: "#2563EB", // Warna gradient hijau
    },}).showToast();
    exportReportBtn.disabled = true;
    exportReportBtn.textContent = "Loading...";

    try {
        // 1. Ambil filter saat ini
        const params = {
            start_date: startDateInput.value,
            end_date: endDateInput.value,
            fakultas: facultyFilterSelect.value,
        };
        
        // 2. Panggil API EKSPOR (mengambil SEMUA data)
        const dataToExport = await fetchData(params, '/api/sampah-export');

        if (!dataToExport || dataToExport.length === 0) {
            Toastify({
                text: "Tidak ada data untuk diekspor.",
                duration: 1000,
                gravity: "bottom",
                position: "right",
                style: { background: "#FFA500" }, // Warna oranye
            }).showToast();
            return;
        }

        // 3. Format data (SAMA, tapi menggunakan 'dataToExport' baru)
        const formattedData = dataToExport.map(item => {
            const docDate = item.timestamp; // sudah Date
            return {
                'Tanggal': docDate.toLocaleDateString('id-ID', { year: 'numeric', month: 'long', day: 'numeric' }),
                'Hari': docDate.toLocaleDateString('id-ID', { weekday: 'long' }),
                'Waktu': docDate.toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' }),
                'Fakultas': item.fakultas || 'N/A',
                'Jenis Sampah': item.jenis || 'N/A',
                'Berat (kg)': item.berat.toFixed(1) // sudah float
            };
        });

        // 4. Buat Excel (SAMA)
        const wb = XLSX.utils.book_new();
        const ws = XLSX.utils.json_to_sheet(formattedData);
        XLSX.utils.book_append_sheet(wb, ws, "Laporan Sampah");
        XLSX.writeFile(wb, "Laporan_Sampah.xlsx");

    } catch (error) {
        Toastify({
            text: "Gagal mengekspor data. 😢 Cek konsol (F12).",
            duration: 1000,
            gravity: "bottom",
            position: "right",
            style: { background: "#FF0000" }, // Warna merah
        }).showToast();
        console.error("Gagal ekspor:", error);
    } finally {
        // Kembalikan tombol ke normal
        exportReportBtn.disabled = false;
        exportReportBtn.textContent = "Export ke Excel";
    }
}

// ==============================
// === BAGIAN 4: INISIALISASI HALAMAN (DIUBAH) ===
// ==============================

export function initLaporanPage() {
    // Panggil fungsi global (SAMA)
    updateCurrentDate('current-date');
    updateGlobalStatCards();

    // Setup variabel DOM (TAMBAHAN ELEMEN PAGINATION)
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
    
    // DOM Pagination baru
    paginationControls = document.getElementById('pagination-controls');
    perPageSelect = document.getElementById('per-page-select');
    pageInfoSpan = document.getElementById('page-info-span');
    prevPageBtn = document.getElementById('prev-page-btn');
    nextPageBtn = document.getElementById('next-page-btn');


    // Default date range (SAMA)
    if (!startDateInput.value) {
        const today = new Date();
        const firstDay = new Date(today.getFullYear(), today.getMonth(), 1);
        startDateInput.valueAsDate = firstDay;
    }
    if (!endDateInput.value) endDateInput.valueAsDate = new Date();

    // --- Setup Event Listeners (DIUBAH) ---
    
    // Tombol "Buat Laporan"
    generateReportBtn.addEventListener('click', () => {
        currentPage = 1; // Reset ke halaman 1 setiap kali filter baru
        fetchAndDisplayReportData();
    });
    
    // Tombol Export (SAMA)
    exportReportBtn.addEventListener('click', exportReport);
    
    // Header Tabel (SAMA)
    document.querySelectorAll('.sortable-header').forEach(header => {
        header.addEventListener('click', () => {
            const sortKey = header.getAttribute('data-sort-key');
            if (currentSortKey === sortKey) {
                currentSortDirection = currentSortDirection === 'asc' ? 'desc' : 'asc';
            } else {
                currentSortKey = sortKey;
                currentSortDirection = (sortKey === 'timestamp') ? 'desc' : 'asc';
            }
            // Panggil sortAndRenderData (HANYA sorting, BUKAN fetch ulang)
            sortAndRenderData(); 
        });
    });

    // --- EVENT LISTENER BARU UNTUK PAGINATION ---
    
    // Dropdown "Tampil per halaman"
    perPageSelect.addEventListener('change', () => {
        currentPage = 1; // Reset ke halaman 1
        fetchAndDisplayReportData();
    });
    
    // Tombol "Sebelumnya"
    prevPageBtn.addEventListener('click', () => {
        if (currentPage > 1) {
            currentPage--;
            fetchAndDisplayReportData();
        }
    });

    // Tombol "Selanjutnya"
    nextPageBtn.addEventListener('click', () => {
        if (currentPage < lastPage) {
            currentPage++;
            fetchAndDisplayReportData();
        }
    });

    // --- Panggilan Fungsi Saat Halaman Dimuat ---
    
    // 1. Muat statistik (kartu CO2, dll.)
    loadSummaryData();
    
    // 2. Muat data tabel untuk halaman 1
    fetchAndDisplayReportData();
}