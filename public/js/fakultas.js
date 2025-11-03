// public/js/fakultas.js

// 1. GANTI IMPORT: Hapus semua dari Firebase, ganti dengan 'fetchData'
import { fetchData, updateGlobalStatCards } from "./firebaseService.js";

// 2. HAPUS GLOBAL FIREBASE: 'db' dan 'unsubscribe' dihapus

// Variabel global (SAMA)
const facultyTargets = {
    'FT': 50,
    'FK': 45,
    'FEB': 55,
    'FH': 35,
    'FSM': 40,
    'FPP': 60
};
const colors = ['#2dd4bf', '#38bdf8', '#a78bfa', '#facc15', '#fb923c'];

let reductionFilter = 'today';
let targetFilter = 'today';

let reductionLeaderboardContainer;
let targetLeaderboardContainer;
let reductionBtnToday, reductionBtnWeekly, reductionBtnMonthly;
let targetBtnToday, targetBtnWeekly, targetBtnMonthly;

const baseButtonClasses = "px-4 py-2 text-sm font-medium transition-colors duration-200";
const activeClasses = "bg-teal-600 text-white hover:bg-teal-700";
const inactiveClasses = "bg-white text-gray-900 hover:bg-gray-100 hover:text-teal-700";

// Variabel global untuk menyimpan data yang sudah diproses dari API
let allAggregatedData = null;

// 3. TAMBAHKAN FUNGSI UTILITAS: (Diambil dari firebaseService.js sebelumnya)
/**
 * Memperbarui elemen teks dengan tanggal hari ini dalam format Bahasa Indonesia.
 */
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


// 4. FUNGSI INI TETAP SAMA
function applyFilterButtonStyles(type) {
    if (type === 'reduction') {
        const structuralClasses = "border border-gray-200";
        reductionBtnToday.className = baseButtonClasses + " " + structuralClasses + " rounded-l-lg";
        reductionBtnWeekly.className = baseButtonClasses + " border-y border-r border-gray-200 -ml-px";
        reductionBtnMonthly.className = baseButtonClasses + " " + structuralClasses + " rounded-r-lg -ml-px";

        if (reductionFilter === 'today') reductionBtnToday.className += " " + activeClasses;
        else reductionBtnToday.className += " " + inactiveClasses;
        if (reductionFilter === 'weekly') reductionBtnWeekly.className += " " + activeClasses;
        else reductionBtnWeekly.className += " " + inactiveClasses;
        if (reductionFilter === 'monthly') reductionBtnMonthly.className += " " + activeClasses;
        else reductionBtnMonthly.className += " " + inactiveClasses;

    } else if (type === 'target') {
        const structuralClasses = "border border-gray-200";
        targetBtnToday.className = baseButtonClasses + " " + structuralClasses + " rounded-l-lg";
        targetBtnWeekly.className = baseButtonClasses + " border-y border-r border-gray-200 -ml-px";
        targetBtnMonthly.className = baseButtonClasses + " " + structuralClasses + " rounded-r-lg -ml-px";

        if (targetFilter === 'today') targetBtnToday.className += " " + activeClasses;
        else targetBtnToday.className += " " + inactiveClasses;
        if (targetFilter === 'weekly') targetBtnWeekly.className += " " + activeClasses;
        else targetBtnWeekly.className += " " + inactiveClasses;
        if (targetFilter === 'monthly') targetBtnMonthly.className += " " + activeClasses;
        else targetBtnMonthly.className += " " + inactiveClasses;
    }
}

// 5. HAPUS FUNGSI: 'getPeriodDates()' dihapus karena logika digabung di 'processData'

// 6. FUNGSI BARU: Untuk memproses data mentah dari API
/**
 * Mengubah data mentah dari API menjadi objek agregat yang dibutuhkan
 * oleh leaderboard (today, previousDay, last7Days, dst.)
 */
function processDataForFakultas(data) {
    const aggregatedData = {
        today: {},
        previousDay: {},
        last7Days: {},
        previous7Days: {},
        last30Days: {},
        previous30Days: {}
    };

    // Inisialisasi semua fakultas di semua periode agar nilainya 0, bukan 'undefined'
    Object.keys(facultyTargets).forEach(fakultas => {
        Object.keys(aggregatedData).forEach(period => {
            aggregatedData[period][fakultas] = 0;
        });
    });

    // --- Tentukan Batas Waktu ---
    const now = new Date();
    const endOfToday = new Date(new Date().setHours(23, 59, 59, 999));
    const startOfToday = new Date(new Date().setHours(0, 0, 0, 0));
    // Kembalikan logika untuk 'kemarin'
    const startOfYesterday = new Date(new Date(startOfToday).setDate(startOfToday.getDate() - 1));

    // Untuk mingguan (7 hari)
    const startOfLast7Days = new Date(new Date().setDate(now.getDate() - 6));
    startOfLast7Days.setHours(0, 0, 0, 0);
    const startOfPrevious7Days = new Date(new Date(startOfLast7Days).setDate(startOfLast7Days.getDate() - 7));

    // Untuk bulanan (30 hari)
    const startOfLast30Days = new Date(new Date().setDate(now.getDate() - 29));
    startOfLast30Days.setHours(0, 0, 0, 0);
    const startOfPrevious30Days = new Date(new Date(startOfLast30Days).setDate(startOfLast30Days.getDate() - 30));
    // --- Batas Waktu Selesai ---

    data.forEach(item => {
        // 'timestamp' sudah jadi objek Date dari fetchData
        const docDate = item.timestamp;
        if (!docDate) return;

        const fakultas = item.fakultas;
        const berat = parseFloat(item.berat) || 0;

        // Skip jika bukan fakultas yg kita lacak atau jenis 'Umum'
        if (!fakultas || !facultyTargets[fakultas] || item.jenis === 'Umum') {
            return;
        }

        // --- Logika Agregasi (SAMA SEPERTI ASLINYA) ---
        if (docDate >= startOfToday && docDate <= endOfToday) {
            aggregatedData.today[fakultas] += berat;
        } else if (docDate >= startOfYesterday && docDate < startOfToday) { // <-- DIKEMBALIKAN
            aggregatedData.previousDay[fakultas] += berat;
        }

        // Rolling 7 Days
        if (docDate >= startOfLast7Days && docDate <= endOfToday) {
            aggregatedData.last7Days[fakultas] += berat;
        } else if (docDate >= startOfPrevious7Days && docDate < startOfLast7Days) {
            aggregatedData.previous7Days[fakultas] += berat;
        }

        // Rolling 30 Days
        if (docDate >= startOfLast30Days && docDate <= endOfToday) {
            aggregatedData.last30Days[fakultas] += berat;
        } else if (docDate >= startOfPrevious30Days && docDate < startOfLast30Days) {
            aggregatedData.previous30Days[fakultas] += berat;
        }
    });

    // Bulatkan semua hasil
    Object.keys(aggregatedData).forEach(period => {
        Object.keys(aggregatedData[period]).forEach(fakultas => {
            aggregatedData[period][fakultas] = parseFloat(aggregatedData[period][fakultas].toFixed(1));
        });
    });

    return aggregatedData;
}


// 7. FUNGSI BARU: Untuk memuat data dari API
/**
 * Menggantikan 'setupFakultasPageListener'
 * Mengambil data dari API, memprosesnya, lalu merender.
 */
async function loadFakultasData() {
    // Jangan tampilkan 'Memuat data...' jika data sudah ada (saat auto-refresh)
    if (!allAggregatedData) {
        reductionLeaderboardContainer.innerHTML = '<p class="text-center text-gray-500">Memuat data...</p>';
        targetLeaderboardContainer.innerHTML = '<p class="text-center text-gray-500">Memuat data...</p>';
    }

    try {
        // 1. Ambil semua data dari API
        // Panggil fetchData TAPI arahkan ke endpoint export
        const allData = await fetchData({}, '/api/sampah-export'); 
        // Hasilnya langsung array, tidak perlu .data

        // 2. Proses data mentah menjadi format agregat
        allAggregatedData = processDataForFakultas(allData);

        // 3. Render leaderboard (pertama kali atau refresh)
        renderAllLeaderboards();

    } catch (error) {
        console.error("Error fetching data for fakultas:", error);
        reductionLeaderboardContainer.innerHTML = '<p class="text-center text-red-500">Gagal memuat data.</p>';
        targetLeaderboardContainer.innerHTML = '<p class="text-center text-red-500">Gagal memuat data.</p>';
    }
}


// 8. FUNGSI INI TETAP SAMA
// Fungsi ini sekarang akan membaca 'allAggregatedData'
function renderAllLeaderboards() {
    if (!allAggregatedData) {
        reductionLeaderboardContainer.innerHTML = '<p class="text-center text-gray-500">Menunggu data...</p>';
        targetLeaderboardContainer.innerHTML = '<p class="text-center text-gray-500">Menunggu data...</p>';
        return;
    }

    let reductionCurrentData, reductionPreviousData, targetData;

    if (reductionFilter === 'today') {
        reductionCurrentData = allAggregatedData.today;
        reductionPreviousData = allAggregatedData.previousDay;
    } else if (reductionFilter === 'weekly') {
        reductionCurrentData = allAggregatedData.last7Days;
        reductionPreviousData = allAggregatedData.previous7Days;
    } else {
        reductionCurrentData = allAggregatedData.last30Days;
        reductionPreviousData = allAggregatedData.previous30Days;
    }

    if (targetFilter === 'today') {
        targetData = allAggregatedData.today;
    } else if (targetFilter === 'weekly') {
        targetData = allAggregatedData.last7Days;
    } else {
        targetData = allAggregatedData.last30Days;
    }

    renderReductionLeaderboard(reductionCurrentData, reductionPreviousData);
    renderTargetLeaderboard(targetData);
}

// 9. FUNGSI INI DIMODIFIKASI SEDIKIT
// Mengganti filter '.filter(name => currentData[name] !== undefined ...)'
// menjadi '.filter(name => currentData[name] > 0 ...)'
// karena data kita sekarang diinisialisasi sebagai 0, bukan undefined.
function renderReductionLeaderboard(currentData, previousData) {
    const container = document.getElementById('reduction-leaderboard-container');
    container.innerHTML = '';
    const combinedData = {};
    Object.keys(facultyTargets)
        // MODIFIKASI FILTER:
        .filter(name => (currentData[name] || 0) > 0 || (previousData[name] || 0) > 0)
        .forEach(fakultas => {
            const currentTotal = currentData[fakultas] || 0;
            const previousTotal = previousData[fakultas] || 0;
            const reduction = previousTotal > 0 ? ((previousTotal - currentTotal) / previousTotal) * 100 : (currentTotal > 0 ? -Infinity : 0); // Handle 'Infinity' jika data sebelumnya 0
            combinedData[fakultas] = {
                total: currentTotal,
                reduction: reduction
            };
        });

    // (Kode debug dari file asli Anda, boleh dihapus jika mau)
    console.log("--- DEBUG DATA PENGURANGAN ---");
    console.log("Filter Aktif:", reductionFilter);
    console.log("Data Periode Saat Ini:", currentData);
    console.log("Data Periode Pembanding:", previousData);
    console.log("Hasil Kalkulasi (sebelum disortir):", combinedData);
    
    const sorted = Object.entries(combinedData).map(([name, values]) => ({
        name,
        ...values
    })).sort((a, b) => b.reduction - a.reduction);

    if (sorted.length === 0) {
        container.innerHTML = '<p class="text-center text-gray-500">Tidak ada data untuk ditampilkan pada periode ini.</p>';
        return;
    }

    sorted.forEach((faculty, index) => {
        const color = colors[index % colors.length];
        const reductionValue = faculty.reduction;
        let textColorClass = 'text-gray-600';
        if (reductionValue > 0) {
            textColorClass = 'text-green-600';
        } else if (reductionValue < 0) {
            textColorClass = 'text-red-600';
        }

        const progress = Math.min(Math.max(reductionValue, 0), 100);
        const rankDisplay = (idx) => idx === 0 ? '🥇' : idx === 1 ? '🥈' : idx === 2 ? '🥉' : `<span class="text-gray-500">${idx + 1}</span>`;

        container.innerHTML += `
            <div class="bg-white p-6 rounded-xl shadow-md border-2" style="border-color:${color};">
                <div class="flex items-center justify-between">
                    <div class="flex items-center">
                        <span class="w-3 h-3 rounded-full mr-4" style="background-color: ${color};"></span>
                        <span class="font-bold text-lg text-gray-800">${faculty.name}</span>
                    </div>
                    <div class="text-right">
                        <span class="font-semibold ${textColorClass}">${reductionValue === -Infinity ? 'Naik Drastis' : reductionValue.toFixed(1) + ' %'}</span>
                        <span class="ml-2">${rankDisplay(index)}</span>
                    </div>
                </div>
                
                <div class="mt-3">
                    <div class="w-full bg-gray-200 rounded-full h-2.5">
                        <div class="bg-teal-600 h-2.5 rounded-full" style="width: ${progress}%"></div>
                    </div>
                    <div class="flex justify-between text-xs text-gray-500 mt-1">
                        <span>Total Sampah: <strong>${faculty.total.toFixed(1)} kg</strong></span>
                        <span>Progress Pengurangan: <strong>${progress.toFixed(0)}%</strong></span>
                    </div>
                </div>
            </div>
        `;
    });
}

// 10. FUNGSI INI DIMODIFIKASI SEDIKIT
// Mengganti filter '.filter(name => data[name] !== undefined)'
// menjadi '.filter(name => (data[name] || 0) > 0)'
function renderTargetLeaderboard(data) {
    const container = document.getElementById('target-leaderboard-container');
    container.innerHTML = '';
    const sorted = Object.keys(facultyTargets)
        // MODIFIKASI FILTER:
        .filter(name => (data[name] || 0) > 0)
        .map(name => {
            return {
                name: name,
                total: data[name] || 0,
                target: facultyTargets[name]
            };
        }).sort((a, b) => a.total - b.total);

    if (sorted.length === 0) { // Cek baru (menggantikan .every())
        container.innerHTML = '<p class="text-center text-gray-500">Belum ada data timbunan untuk periode ini.</p>';
        return;
    }

    sorted.forEach((faculty, index) => {
        const color = colors[index % colors.length];
        const progress = Math.min((faculty.total / faculty.target) * 100, 100);
        const rankDisplay = (idx) => idx === 0 ? '🥇' : idx === 1 ? '🥈' : idx === 2 ? '🥉' : `<span class="text-gray-500">${idx + 1}</span>`;

        container.innerHTML += `
            <div class="bg-white p-6 rounded-xl shadow-md border-2" style="border-color:${color};">
                <div class="flex items-center justify-between">
                    <div class="flex items-center">
                        <span class="w-3 h-3 rounded-full mr-4" style="background-color: ${color};"></span>
                        <span class="font-bold text-lg text-gray-800">${faculty.name}</span>
                    </div>
                    <div class="text-right">
                        <span class="font-semibold text-teal-600">${faculty.total.toFixed(1)} / ${faculty.target} kg</span>
                        <span class="ml-2">${rankDisplay(index)}</span>
                    </div>
                </div>
                <div class="mt-3">
                    <div class="w-full bg-gray-200 rounded-full h-2">
                        <div class="bg-teal-600 h-2.5 rounded-full" style="width: ${progress}%"></div>
                    </div>
                    <div class="flex justify-between text-sm text-gray-500 mt-1">
                        <span>Pencapaian: ${progress.toFixed(0)}%</span>
                    </div>
                </div>
            </div>
        `;
    });
}

// ===================================================================
// BARU: Listener untuk Global MQTT Event
// ===================================================================
/**
 * Mendengarkan event 'mqtt:data-baru' yang disiarkan oleh GlobalMQTT.js
 * Jika ada data baru, panggil fungsi refresh untuk halaman fakultas.
 */
window.addEventListener('mqtt:data-baru', function(event) {
    console.log('🔄 FAKULTAS: Trigger auto-refresh diterima!', event.detail);
    
    // Panggil fungsi refresh spesifik fakultas
    loadFakultasData(); 
    updateGlobalStatCards();
});
// ===================================================================


// 11. FUNGSI UTAMA (INIT) DIUBAH
// Hapus 'firebaseConfig' dan panggil 'loadFakultasData'
export function initFakultasPage() {
    // HAPUS SEMUA KONEKSI FIREBASE
    // initializeFirebase(firebaseConfig);
    // db = getFirestoreInstance();
    // if (!db) { console.error("Firestore DB is NOT available."); return; }

    reductionLeaderboardContainer = document.getElementById('reduction-leaderboard-container');
    targetLeaderboardContainer = document.getElementById('target-leaderboard-container');
    reductionBtnToday = document.getElementById('reduction-btn-today');
    reductionBtnWeekly = document.getElementById('reduction-btn-weekly');
    reductionBtnMonthly = document.getElementById('reduction-btn-monthly');
    targetBtnToday = document.getElementById('target-btn-today');
    targetBtnWeekly = document.getElementById('target-btn-weekly');
    targetBtnMonthly = document.getElementById('target-btn-monthly');

    if (!reductionLeaderboardContainer || !targetLeaderboardContainer || !reductionBtnToday || !targetBtnToday) {
        console.error("Missing required DOM elements for Fakultas page.");
        return;
    }

    updateCurrentDate('current-date');
    updateGlobalStatCards();

    applyFilterButtonStyles('reduction');
    applyFilterButtonStyles('target');

    // Event listener ini SAMA dan akan berfungsi
    reductionBtnToday.addEventListener('click', () => {
        reductionFilter = 'today';
        applyFilterButtonStyles('reduction');
        renderAllLeaderboards();
    });
    reductionBtnWeekly.addEventListener('click', () => {
        reductionFilter = 'weekly';
        applyFilterButtonStyles('reduction');
        renderAllLeaderboards();
    });
    reductionBtnMonthly.addEventListener('click', () => {
        reductionFilter = 'monthly';
        applyFilterButtonStyles('reduction');
        renderAllLeaderboards();
    });

    targetBtnToday.addEventListener('click', () => {
        targetFilter = 'today';
        applyFilterButtonStyles('target');
        renderAllLeaderboards();
    });
    targetBtnWeekly.addEventListener('click', () => {
        targetFilter = 'weekly';
        applyFilterButtonStyles('target');
        renderAllLeaderboards();
    });
    targetBtnMonthly.addEventListener('click', () => {
        targetFilter = 'monthly';
        applyFilterButtonStyles('target');
        renderAllLeaderboards();
    });

    // GANTI 'setupFakultasPageListener' dengan 'loadFakultasData'
    loadFakultasData();
    
    // HAPUS 'setupGlobalSampahListener'
}