// Script JS untuk dashboard page

// Import layanan umum dari Firebase
import {
    initializeFirebase,
    updateCurrentDate,
    setupStatisticCardListener
} from "./firebaseService.js"; // Path relatif ke firebaseService.js

// Instansi Chart (hanya berlaku di file ini)
let weeklyTrendChart;
let typeDistributionChart;

/**
 * Inisialisasi Grafik Tren Mingguan.
 * @param {string} ctxId - ID dari elemen canvas untuk chart ini.
 */
function initWeeklyTrendChart(ctxId) {
    const weeklyTrendChartCtx = document.getElementById(ctxId)?.getContext('2d');
    if (weeklyTrendChartCtx) {
        weeklyTrendChart = new Chart(weeklyTrendChartCtx, {
            type: 'line',
            data: {
                labels: ['Senin', 'Selasa', 'Rabu', 'Kamis', 'Jumat', 'Sabtu', 'Minggu'],
                datasets: [{
                    label: 'Berat Sampah (kg)',
                    data: [0, 0, 0, 0, 0, 0, 0], // Data awal
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
        console.warn(`Elemen canvas dengan ID '${ctxId}' tidak ditemukan untuk Grafik Tren Mingguan.`);
    }
}

/**
 * Inisialisasi Grafik Distribusi Jenis Sampah.
 * @param {string} ctxId - ID dari elemen canvas untuk chart ini.
 */
function initTypeDistributionChart(ctxId) {
    const typeDistributionChartCtx = document.getElementById(ctxId)?.getContext('2d');
    if (typeDistributionChartCtx) {
        typeDistributionChart = new Chart(typeDistributionChartCtx, {
            type: 'pie',
            data: {
                labels: ['Umum (kg)', 'Organik (kg)', 'Anorganik (kg)'],
                datasets: [{
                    data: [1, 1, 1], // Data awal agar tidak terjadi error
                    backgroundColor: ['#D35748', '#62B682', '#5C7AF3'],
                    hoverOffset: 4
                }]
            },
            options: {
                plugins: {
                    legend: {
                        position: 'bottom'
                    }
                }
            }
        });
    } else {
        console.warn(`Elemen canvas dengan ID '${ctxId}' tidak ditemukan untuk Grafik Distribusi Jenis Sampah.`);
    }
}

/**
 * Fungsi callback untuk memperbarui chart saat data baru dari Firestore diterima.
 * @param {object} data - Data yang sudah diolah dari Firestore.
 */
function updateCharts(data) {
    const {
        totalUmum,
        totalOrganik,
        totalAnorganik,
        weeklyData
    } = data;

    // Perbarui Grafik Distribusi Jenis
    if (typeDistributionChart) {
        typeDistributionChart.data.datasets[0].data = [totalUmum, totalOrganik, totalAnorganik];
        typeDistributionChart.update();
    }

    // Perbarui Grafik Tren Mingguan
    if (weeklyTrendChart) {
        weeklyTrendChart.data.datasets[0].data = weeklyData;
        weeklyTrendChart.update();
    }
}

document.addEventListener('DOMContentLoaded', function() {
    // Ambil konfigurasi Firebase (diasumsikan tersedia secara global atau disisipkan lewat Blade)
    // Agar ini berfungsi, pastikan ada tag <script> di Blade yang mendefinisikan window.firebaseConfig
    const firebaseConfig = window.firebaseConfig; 

    if (firebaseConfig) {
        // Inisialisasi Firebase
        initializeFirebase(firebaseConfig);

        // Inisialisasi grafik yang hanya muncul di dashboard
        initWeeklyTrendChart('weeklyTrendChart');
        initTypeDistributionChart('typeDistributionChart');

        // Pasang listener Firestore untuk kartu statistik dan gunakan fungsi callback
        // yang juga akan memperbarui grafik
        setupStatisticCardListener({
            totalSampah: 'total-sampah',
            totalOrganik: 'total-organik',
            totalAnorganik: 'total-anorganik',
            totalUmum: 'total-umum'
        }, updateCharts); // Kirim fungsi updateCharts sebagai callback

        // Perbarui tanggal saat ini jika terdapat elemen dengan ID 'current-date' di dashboard
        updateCurrentDate('current-date'); 

    } else {
        console.error("Konfigurasi Firebase tidak ditemukan. Pastikan konfigurasi sudah dimuat sebelum dashboard.js dijalankan.");
    }
});
