// 1. GANTI IMPORT: Kita hanya import 'fetchData'
import { fetchData, updateGlobalStatCards } from "./firebaseService.js";

// Global variables for charts (SAMA)
let weeklyTrendChart;
let typeDistributionChart;

// 2. FUNGSI UTILITAS BARU (Pengganti dari firebaseService.js)
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


// --- Helper Functions for Chart/UI Initialization ---
// (BAGIAN INI SEMUA SAMA, TIDAK PERLU DIUBAH)

// Initialize Weekly Trend Chart
function initWeeklyTrendChart(ctxId) {
    const ctx = document.getElementById(ctxId)?.getContext('2d');
    if (ctx) {
        weeklyTrendChart = new Chart(ctx, {
            type: 'line',
            data: {
                labels: ['Senin', 'Selasa', 'Rabu', 'Kamis', 'Jumat', 'Sabtu', 'Minggu'],
                datasets: [{
                    label: 'Berat Sampah (kg)',
                    data: [0, 0, 0, 0, 0, 0, 0],
                    borderColor: '#14b8a6',
                    backgroundColor: 'rgba(20, 184, 166, 0.1)',
                    fill: true,
                    tension: 0.4
                }]
            },
            options: {
                scales: {
                    y: {
                        beginAtZero: true
                    }
                },
                plugins: {
                    legend: {
                        display: false
                    }
                }
            }
        });
    } else {
        console.warn(`Canvas element with ID '${ctxId}' not found.`);
    }
}


// --- Custom Chart.js Plugin for "No Data Today" text in Doughnut Chart ---
// (SAMA, TIDAK PERLU DIUBAH)
const noDataDoughnutText = {
    id: 'noDataDoughnutText',
    beforeDraw(chart, args, options) {
        const {
            ctx,
            data
        } = chart;
        const total = data.datasets[0].data.reduce((sum, val) => sum + val, 0);
        const isNoRealData = (total === 1 && data.labels.length === 1 && data.labels[0] === 'No Data Today');

        if (isNoRealData) {
            ctx.save();
            ctx.font = '16px Inter, sans-serif';
            ctx.fillStyle = '#888';
            ctx.textAlign = 'center';
            ctx.textBaseline = 'middle';
            const centerX = (chart.chartArea.left + chart.chartArea.right) / 2;
            const centerY = (chart.chartArea.top + chart.chartArea.bottom) / 2;
            ctx.fillText('No Data Today', centerX, centerY);
            ctx.restore();
        }
    }
};


// Initialize Type Distribution Chart (Doughnut) with "No Data" plugin
// (SAMA, TIDAK PERLU DIUBAH)
function initTypeDistributionChart(ctxId) {
    const ctx = document.getElementById(ctxId)?.getContext('2d');
    if (ctx) {
        typeDistributionChart = new Chart(ctx, {
            type: 'doughnut',
            data: {
                labels: ['Organik (kg)', 'Anorganik (kg)', 'Residu (kg)'],
                datasets: [{
                    data: [1, 1, 1],
                    backgroundColor: ['#62B682', '#5C7AF3', '#D35748'],
                    hoverOffset: 4,
                    borderColor: '#ffffff',
                    borderWidth: 2
                }]
            },
            options: {
                plugins: {
                    legend: {
                        position: 'bottom'
                    },
                },
                responsive: true,
                maintainAspectRatio: false
            },
            plugins: [noDataDoughnutText] // Register the plugin
        });
    } else {
        console.warn(`Canvas element with ID '${ctxId}' not found.`);
    }
}


// --- Page-specific UI Update Function (called by firebaseService) ---
// (FUNGSI INI SAMA, TIDAK PERLU DIUBAH)
// Fungsi ini menerima data yang sudah diproses dan menampilkannya
function updateDashboardSpecificUI(data) {
    // Default values untuk mencegah error jika data tidak lengkap
    const {
        overviewOrganikToday = 0,
        overviewAnorganikToday = 0,
        overviewResiduToday = 0,
        weeklyTotalData = [0, 0, 0, 0, 0, 0, 0]
    } = data || {};

    // 1. Update kartu ringkasan "Overview Garbage Summary"
    const overviewTotalSampahElem = document.getElementById('total-sampah');
    if (overviewTotalSampahElem) overviewTotalSampahElem.textContent = (overviewOrganikToday + overviewAnorganikToday + overviewResiduToday).toFixed(1);

    const overviewTotalOrganikElem = document.getElementById('total-organik');
    if (overviewTotalOrganikElem) overviewTotalOrganikElem.textContent = overviewOrganikToday.toFixed(1);

    const overviewTotalAnorganikElem = document.getElementById('total-anorganik');
    if (overviewTotalAnorganikElem) overviewTotalAnorganikElem.textContent = overviewAnorganikToday.toFixed(1);

    const overviewTotalResiduElem = document.getElementById('total-residu');
    if (overviewTotalResiduElem) overviewTotalResiduElem.textContent = overviewResiduToday.toFixed(1);


    // 2. Update Grafik Tren Mingguan
    if (weeklyTrendChart) {
        weeklyTrendChart.data.datasets[0].data = weeklyTotalData;
        weeklyTrendChart.update();
    }


    // 3. Update Grafik Distribusi Jenis (Doughnut)
    if (typeDistributionChart) {
        const hasActualData = overviewOrganikToday > 0 || overviewAnorganikToday > 0 || overviewResiduToday > 0;

        if (hasActualData) {
            typeDistributionChart.data.datasets[0].data = [overviewOrganikToday, overviewAnorganikToday, overviewResiduToday];
            typeDistributionChart.data.datasets[0].backgroundColor = ['#62B682', '#5C7AF3', '#D35748'];
            typeDistributionChart.data.labels = ['Organik (kg)', 'Anorganik (kg)', 'Residu (kg)'];
            typeDistributionChart.options.plugins.legend.display = true;
        } else {
            typeDistributionChart.data.datasets[0].data = [1]; 
            typeDistributionChart.data.datasets[0].backgroundColor = ['#E5E7EB']; 
            typeDistributionChart.data.labels = ['No Data Today']; 
            typeDistributionChart.options.plugins.legend.display = false; 
        }

        typeDistributionChart.options.cutout = '80%';
        typeDistributionChart.update();
    }
}


// 3. FUNGSI BARU UNTUK MEMPROSES DATA DARI API
/**
 * Mengubah data mentah dari API (array) menjadi objek
 * yang dibutuhkan oleh 'updateDashboardSpecificUI'
 */
function processDataForDashboard(data) {
    const stats = {
        overviewOrganikToday: 0,
        overviewAnorganikToday: 0,
        overviewResiduToday: 0,
        weeklyTotalData: [0, 0, 0, 0, 0, 0, 0] // Senin(0) - Minggu(6)
    };

    const today = new Date();
    const todayStr = today.toDateString(); // "Sat Oct 25 2025"

    // Dapatkan hari Senin di minggu ini
    const startOfWeek = new Date(today);
    const dayOfWeek = today.getDay(); // 0 (Minggu) - 6 (Sabtu)
    const diffToMonday = (dayOfWeek === 0) ? -6 : (1 - dayOfWeek);
    startOfWeek.setDate(today.getDate() + diffToMonday);
    startOfWeek.setHours(0, 0, 0, 0);

    // Dapatkan hari Minggu di minggu ini
    const endOfWeek = new Date(startOfWeek);
    endOfWeek.setDate(startOfWeek.getDate() + 6);
    endOfWeek.setHours(23, 59, 59, 999);

    data.forEach(item => {
        // 'timestamp' sudah diubah menjadi objek Date oleh 'fetchData'
        const itemDate = item.timestamp;

        // 1. Cek data "Today"
        if (itemDate.toDateString() === todayStr) {
            if (item.jenis === 'Organik') {
                stats.overviewOrganikToday += item.berat;
            } else if (item.jenis === 'Anorganik') {
                stats.overviewAnorganikToday += item.berat;
            } else if (item.jenis === 'Residu') {
                stats.overviewResiduToday += item.berat;
            }
        }

        // 2. Cek data "Weekly"
        if (itemDate >= startOfWeek && itemDate <= endOfWeek) {
            let dayIndex = itemDate.getDay(); // 0=Minggu, 1=Senin, ..., 6=Sabtu

            // Ubah agar 0=Senin, 1=Selasa, ..., 6=Minggu (sesuai label chart)
            if (dayIndex === 0) {
                dayIndex = 6; // Minggu jadi 6
            } else {
                dayIndex -= 1; // Senin(1) jadi 0, Selasa(2) jadi 1, dst.
            }

            if (dayIndex >= 0 && dayIndex <= 6) { // Pastikan index valid
                stats.weeklyTotalData[dayIndex] += item.berat;
            }
        }
    });

    // Bulatkan angka di akhir
    stats.overviewOrganikToday = parseFloat(stats.overviewOrganikToday.toFixed(1));
    stats.overviewAnorganikToday = parseFloat(stats.overviewAnorganikToday.toFixed(1));
    stats.overviewResiduToday = parseFloat(stats.overviewResiduToday.toFixed(1));
    stats.weeklyTotalData = stats.weeklyTotalData.map(val => parseFloat(val.toFixed(1)));

    return stats;
}

// 4. FUNGSI BARU UNTUK MEMUAT DATA
/**
 * Fungsi utama untuk memuat data dari API dan memperbarui UI
 */
async function loadDashboardData() {
    try {
        // Panggil fetchData, hasilnya adalah objek pagination
        const response = await fetchData(); 
        // Ambil array data dari properti 'data'
        const allData = response.data;

        // Proses data mentah menjadi format yg dibutuhkan
        const dashboardData = processDataForDashboard(allData);

        // Update UI dengan data yang sudah diproses
        updateDashboardSpecificUI(dashboardData);

    } catch (error) {
        console.error("Gagal memuat data dashboard:", error);
        // Anda bisa tambahkan pesan error di UI di sini
    }
}


// --- DOMContentLoaded Listener (BAGIAN INI DIUBAH TOTAL) ---
document.addEventListener('DOMContentLoaded', function () {
    
    // Hapus semua yang berhubungan dengan 'firebaseConfig'

    // Panggil fungsi utilitas tanggal
    updateCurrentDate('current-date');
    updateGlobalStatCards();

    // Inisialisasi chart (SAMA)
    initWeeklyTrendChart('weeklyTrendChart');
    initTypeDistributionChart('typeDistributionChart');

    // Panggil fungsi utama baru kita untuk memuat data dari API
    loadDashboardData();

});