// public/js/analitik.js

import { initializeFirebase, getFirestoreInstance, setupGlobalSampahListener, updateCurrentDate } from "./firebaseService.js";

// --- KONFIGURASI & VARIABEL GLOBAL ---
const HARGA_ANORGANIK_PER_KG = 2000; // Rupiah
const FAKTOR_EMISI_CO2E_PER_KG = 0.5; // kg CO2 equivalent per kg sampah
const TARGET_BULANAN_KG = 500; // Target pengurangan sampah

let db;
// Menambahkan kembali variabel chart original
let analitikBarChart, trendChart, distributionChart, facultyStackedChart, hourlyPatternChart;

// Objek untuk warna yang konsisten
const CHART_COLORS = {
    organik: 'rgba(68, 127, 64, 0.8)', // Green
    anorganik: 'rgba(92, 122, 243, 0.8)', // Blue
    umum: 'rgba(156, 163, 175, 0.8)', // Gray
};

// --- FUNGSI INISIALISASI GRAFIK ---

// Mengembalikan fungsi inisialisasi untuk chart original
function initAnalitikBarChart(ctxId) {
    const ctx = document.getElementById(ctxId)?.getContext('2d');
    if (!ctx) return;
    analitikBarChart = new Chart(ctx, {
        type: 'bar',
        data: {
            labels: [], // Faculty names
            datasets: [{
                label: 'Sampah Hari Ini (kg)',
                data: [],
                backgroundColor: '#447F40',
            }, {
                label: 'Pengurangan (%)',
                data: [],
                backgroundColor: '#5C7AF3',
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            scales: {
                x: { title: { display: true, text: 'Fakultas' } },
                y: { beginAtZero: true, title: { display: true, text: 'Nilai' } }
            },
            plugins: { legend: { position: 'top' } }
        }
    });
}

function initTrendChart() {
    const ctx = document.getElementById('trendChart')?.getContext('2d');
    if (!ctx) return;
    trendChart = new Chart(ctx, {
        type: 'line',
        data: { labels: [], datasets: [{ label: 'Total Berat Sampah (kg)', data: [], tension: 0.1, borderColor: '#447F40', fill: true }] },
        options: { responsive: true, maintainAspectRatio: false }
    });
}

function initDistributionChart() {
    const ctx = document.getElementById('distributionChart')?.getContext('2d');
    if (!ctx) return;
    distributionChart = new Chart(ctx, {
        type: 'doughnut',
        data: {
            labels: ['Organik', 'Anorganik', 'Umum'],
            datasets: [{
                data: [],
                backgroundColor: [CHART_COLORS.organik, CHART_COLORS.anorganik, CHART_COLORS.umum]
            }]
        },
        options: { responsive: true, maintainAspectRatio: false }
    });
}

function initFacultyStackedChart() {
    const ctx = document.getElementById('facultyStackedChart')?.getContext('2d');
    if (!ctx) return;
    facultyStackedChart = new Chart(ctx, {
        type: 'bar',
        data: { labels: [], datasets: [] }, // Datasets akan dibuat dinamis
        options: {
            responsive: true, maintainAspectRatio: false,
            scales: { x: { stacked: true }, y: { stacked: true, beginAtZero: true } }
        }
    });
}

function initHourlyPatternChart() {
    const ctx = document.getElementById('hourlyPatternChart')?.getContext('2d');
    if (!ctx) return;
    hourlyPatternChart = new Chart(ctx, {
        type: 'bar',
        data: {
            labels: Array.from({ length: 24 }, (_, i) => `${i.toString().padStart(2, '0')}:00`),
            datasets: [{ label: 'Jumlah Entri Sampah', data: Array(24).fill(0), backgroundColor: '#F59E0B' }]
        },
        options: { responsive: true, maintainAspectRatio: false }
    });
}


// --- FUNGSI UTAMA UNTUK UPDATE UI ---

function updateAnalitikUI(data) {
    // Asumsi `data` dari `firebaseService` berisi: { allDocs, facultyDataAggregates }
    const { allDocs, facultyDataAggregates } = data;

    if (allDocs.length === 0) {
        console.warn("Tidak ada data untuk ditampilkan di analitik.");
        return;
    }
    
    // 0. Update Grafik Original (Komparasi Harian)
    if (analitikBarChart && facultyDataAggregates) {
        const facultyNames = Object.keys(facultyDataAggregates);
        const sampahHariIniData = facultyNames.map(name => facultyDataAggregates[name].totalBerat || 0);
        // Data MOCK untuk perbandingan
        const penguranganPercentageData = facultyNames.map(() => parseFloat((Math.random() * (30 - 5) + 5).toFixed(1)));

        analitikBarChart.data.labels = facultyNames;
        analitikBarChart.data.datasets[0].data = sampahHariIniData;
        analitikBarChart.data.datasets[1].data = penguranganPercentageData;
        analitikBarChart.update();
    }
    
    // 1. Update Grafik Tren (7 Hari Terakhir)
    if (trendChart) {
        const trendData = {};
        const sevenDaysAgo = new Date();
        sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);

        allDocs.filter(doc => doc.timestamp.toDate() > sevenDaysAgo)
            .forEach(doc => {
                const date = doc.timestamp.toDate().toLocaleDateString('id-ID', { day: '2-digit', month: 'short' });
                trendData[date] = (trendData[date] || 0) + doc.berat;
            });
        
        trendChart.data.labels = Object.keys(trendData).reverse();
        trendChart.data.datasets[0].data = Object.values(trendData).reverse();
        trendChart.update();
    }

    // 2. Update Grafik Distribusi Jenis Sampah
    if (distributionChart) {
        const distributionData = { Organik: 0, Anorganik: 0, Umum: 0 };
        allDocs.forEach(doc => {
            distributionData[doc.jenis_sampah] = (distributionData[doc.jenis_sampah] || 0) + doc.berat;
        });
        distributionChart.data.datasets[0].data = Object.values(distributionData);
        distributionChart.update();
    }

    // 3. Update Grafik Komparasi Fakultas (Stacked)
    if (facultyStackedChart) {
        const facultyData = {}; 
        const faculties = [...new Set(allDocs.map(doc => doc.fakultas))];
        
        allDocs.forEach(doc => {
            if (!facultyData[doc.fakultas]) facultyData[doc.fakultas] = {};
            facultyData[doc.fakultas][doc.jenis_sampah] = (facultyData[doc.fakultas][doc.jenis_sampah] || 0) + doc.berat;
        });

        facultyStackedChart.data.labels = faculties;
        facultyStackedChart.data.datasets = ['Organik', 'Anorganik', 'Umum'].map(jenis => ({
            label: jenis,
            data: faculties.map(fakultas => facultyData[fakultas]?.[jenis] || 0),
            backgroundColor: CHART_COLORS[jenis.toLowerCase()],
        }));
        facultyStackedChart.update();
    }

    // 4. Update Grafik Pola Waktu (Jam Sibuk)
    if (hourlyPatternChart) {
        const hourlyData = Array(24).fill(0);
        allDocs.forEach(doc => {
            const hour = doc.timestamp.toDate().getHours();
            hourlyData[hour]++;
        });
        hourlyPatternChart.data.datasets[0].data = hourlyData;
        hourlyPatternChart.update();
    }
    
    // 5. Update Kartu Statistik & Target
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
    const recentDocs = allDocs.filter(doc => doc.timestamp.toDate() > thirtyDaysAgo);

    const totalAnorganik = recentDocs.filter(d => d.jenis_sampah === 'Anorganik').reduce((sum, d) => sum + d.berat, 0);
    document.getElementById('potensi-ekonomi-value').textContent = `Rp ${Math.round(totalAnorganik * HARGA_ANORGANIK_PER_KG).toLocaleString('id-ID')}`;
    
    const totalSampah = recentDocs.reduce((sum, d) => sum + d.berat, 0);
    document.getElementById('emisi-karbon-value').textContent = `${(totalSampah * FAKTOR_EMISI_CO2E_PER_KG).toFixed(1)} kg CO₂e`;

    const firstDayOfMonth = new Date(new Date().getFullYear(), new Date().getMonth(), 1);
    const totalBulanIni = allDocs
        .filter(doc => doc.timestamp.toDate() >= firstDayOfMonth)
        .reduce((sum, d) => sum + d.berat, 0);

    const percentage = Math.min((totalBulanIni / TARGET_BULANAN_KG) * 100, 100);
    document.getElementById('progres-bar-fill').style.width = `${percentage}%`;
    document.getElementById('progres-bar-text').textContent = `${Math.round(percentage)}%`;
    document.getElementById('progres-bar-label').textContent = `${Math.round(totalBulanIni)} kg / ${TARGET_BULANAN_KG} kg`;
}


// --- FUNGSI INISIALISASI UTAMA HALAMAN ---

export function initAnalitikPage(firebaseConfig) {
    console.log("DEBUG: initAnalitikPage_v3 (integrated) called.");

    initializeFirebase(firebaseConfig);
    db = getFirestoreInstance();

    if (!db) {
        console.error("Firestore DB tidak tersedia.");
        return;
    }
    
    updateCurrentDate('current-date');

    // Inisialisasi SEMUA kerangka grafik
    initAnalitikBarChart('analitikBarChart'); // Grafik original
    initTrendChart();
    initDistributionChart();
    initFacultyStackedChart();
    initHourlyPatternChart();
    
    // Setup listener global. Ia akan mengambil data dan memanggil updateAnalitikUI.
    // Pastikan `firebaseService` mengirimkan `allDocs` dan `facultyDataAggregates`
    setupGlobalSampahListener(updateAnalitikUI);
    console.log("DEBUG: Global listener untuk semua grafik analitik telah diatur.");
}