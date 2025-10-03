import { initializeFirebase, getFirestoreInstance, setupGlobalSampahListener, updateCurrentDate } from "./firebaseService.js";

// --- KONFIGURASI & VARIABEL GLOBAL ---
const HARGA_ANORGANIK_PER_KG = 2000;
const FAKTOR_EMISI_CO2E_PER_KG = 0.5;
const TARGET_BULANAN_KG = 1100;
let db;
let analitikBarChart, trendChart, distributionChartWeekly,distributionChartMonthly, facultyStackedChart, hourlyPatternChart,
    monthlyEconomicChart, monthlyEmissionChart, monthlyReductionChart;

const CHART_COLORS = {
    organik: 'rgba(68, 127, 64, 0.8)',
    anorganik: 'rgba(92, 122, 243, 0.8)',
    residu: 'rgba(156, 163, 175, 0.8)',
};

// --- FUNGSI INISIALISASI GRAFIK ---

function initAnalitikBarChart(ctxId) {
    const ctx = document.getElementById(ctxId)?.getContext('2d');
    if (!ctx) return;
    analitikBarChart = new Chart(ctx, {
        type: 'bar',
        data: {
            labels: [],
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
            responsive: true, maintainAspectRatio: false,
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
        options: {
            responsive: true, maintainAspectRatio: false,
            scales: { y: { beginAtZero: true, title: { display: true, text: 'Berat (kg)' } } }
        }
    });
}

function initDistributionChart(ctxId) {
    const ctx = document.getElementById(ctxId)?.getContext('2d');
    if (!ctx) return null; // Kembalikan null jika tidak ditemukan
    return new Chart(ctx, {
        type: 'doughnut',
        data: {
            labels: ['Organik', 'Anorganik', 'Residu'],
            datasets: [{ 
                data: [1, 1, 1], // Data awal agar terlihat
                backgroundColor: [CHART_COLORS.organik, CHART_COLORS.anorganik, CHART_COLORS.residu]
            }]
        },
        options: { 
            responsive: true, 
            maintainAspectRatio: false,
            plugins: { legend: { position: 'bottom', labels: { boxWidth: 12 } } }
        }
    });
}

function initFacultyStackedChart() {
    const ctx = document.getElementById('facultyStackedChart')?.getContext('2d');
    if (!ctx) return;
    facultyStackedChart = new Chart(ctx, {
        type: 'bar',
        data: { labels: [], datasets: [] },
        options: {
            responsive: true, maintainAspectRatio: false,
            scales: {
                x: { stacked: true },
                y: { stacked: true, beginAtZero: true, title: { display: true, text: 'Berat (kg)' } }
            }
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
        options: {
            responsive: true, maintainAspectRatio: false,
            scales: { y: { beginAtZero: true, title: { display: true, text: 'Jumlah Entri' } } }
        }
    });
}

// --- FUNGSI INISIALISASI UNTUK 3 GRAFIK TREN ---
function initMonthlyEconomicChart() {
    const ctx = document.getElementById('monthlyEconomicChart')?.getContext('2d');
    if (!ctx) return;
    monthlyEconomicChart = new Chart(ctx, {
        type: 'bar', // Tipe utama adalah bar
        data: {
            labels: [],
            datasets: [
                {
                    label: 'Potensi Ekonomi (Rp)',
                    data: [],
                    backgroundColor: 'rgba(22, 163, 74, 0.7)',
                    order: 1 // Pastikan bar di belakang
                },
                {
                    label: 'Tren Ekonomi',
                    data: [],
                    borderColor: 'rgba(16, 115, 53, 1)', // Warna hijau lebih gelap
                    type: 'line', // Tipe dataset ini adalah garis
                    order: 0, // Pastikan garis di depan
                    tension: 0.3
                }
            ]
        },
        options: { responsive: true, maintainAspectRatio: false, scales: { y: { title: { display: true, text: 'Rupiah (Rp)' } } } }
    });
}

function initMonthlyEmissionChart() {
    const ctx = document.getElementById('monthlyEmissionChart')?.getContext('2d');
    if (!ctx) return;
    monthlyEmissionChart = new Chart(ctx, {
        type: 'bar', // Tipe utama adalah bar
        data: {
            labels: [],
            datasets: [
                {
                    label: 'Emisi Karbon (kg CO₂e)',
                    data: [],
                    backgroundColor: 'rgba(59, 130, 246, 0.7)',
                    order: 1
                },
                {
                    label: 'Tren Emisi',
                    data: [],
                    borderColor: 'rgba(37, 99, 235, 1)', // Warna biru lebih gelap
                    type: 'line',
                    order: 0,
                    tension: 0.3
                }
            ]
        },
        options: { responsive: true, maintainAspectRatio: false, scales: { y: { title: { display: true, text: 'kg CO₂e' } } } }
    });
}

function initMonthlyReductionChart() {
    const ctx = document.getElementById('monthlyReductionChart')?.getContext('2d');
    if (!ctx) return;
    monthlyReductionChart = new Chart(ctx, {
        type: 'bar',
        data: {
            labels: [],
            datasets: [
                { label: 'Total Sampah (kg)', backgroundColor: 'rgba(156, 163, 175, 0.6)', yAxisID: 'y' },
                { label: 'Pengurangan (%)', borderColor: 'rgba(239, 68, 68, 1)', type: 'line', yAxisID: 'y1' }
            ]
        },
        options: {
            responsive: true, maintainAspectRatio: false,
            scales: {
                y: { type: 'linear', display: true, position: 'left', title: { display: true, text: 'Berat (kg)' } },
                y1: { type: 'linear', display: true, position: 'right', title: { display: true, text: 'Pengurangan (%)' }, grid: { drawOnChartArea: false } }
            }
        }
    });
}



// --- FUNGSI UTAMA UNTUK UPDATE UI ---
// public/js/analitik.js

function updateAnalitikUI(data) {
    console.log("Analitik.js: Menerima paket data:", data);

    if (!data || !data.allDocs) {
        console.warn("Analitik.js: Menerima data kosong atau tanpa allDocs.");
        return;
    }
    const { allDocs, facultyDataAggregates } = data;

    // Filter data 'Umum' di awal. Semua proses di bawah ini akan menggunakan variabel ini.
    const filteredDocs = allDocs.filter(doc => doc.jenis !== 'Umum' && doc.timestamp);

    if (filteredDocs.length === 0) {
        console.warn("Tidak ada data valid untuk ditampilkan di analitik.");
        return;
    }
    
    // ========================================================================
    // --- 0. GRAFIK: ANALISIS HARIAN FAKULTAS (ORIGINAL) ---
    // ========================================================================
        if (analitikBarChart) {
            const todayTotals = {};
            const yesterdayTotals = {};

            const startOfToday = new Date(); startOfToday.setHours(0, 0, 0, 0);
            const startOfYesterday = new Date(new Date(startOfToday).setDate(startOfToday.getDate() - 1));

            filteredDocs.forEach(doc => {
                const docDate = doc.timestamp.toDate();
                if (doc.fakultas) {
                    if (docDate >= startOfToday) {
                        todayTotals[doc.fakultas] = (todayTotals[doc.fakultas] || 0) + doc.berat;
                    } else if (docDate >= startOfYesterday && docDate < startOfToday) {
                        yesterdayTotals[doc.fakultas] = (yesterdayTotals[doc.fakultas] || 0) + doc.berat;
                    }
                }
            });

            const facultyNames = [...new Set([...Object.keys(todayTotals), ...Object.keys(yesterdayTotals)])].sort();
            
            const sampahHariIniData = facultyNames.map(name => todayTotals[name] || 0);
            const penguranganPercentageData = facultyNames.map(name => {
                const today = todayTotals[name] || 0;
                const yesterday = yesterdayTotals[name] || 0;
                return yesterday > 0 ? (((yesterday - today) / yesterday) * 100).toFixed(1) : (today > 0 ? -Infinity : 0);
            });

            analitikBarChart.data.labels = facultyNames;
            analitikBarChart.data.datasets[0].data = sampahHariIniData;
            analitikBarChart.data.datasets[1].data = penguranganPercentageData;
            analitikBarChart.update();
        }
    
    // ========================================================================
    // --- 1. GRAFIK: TREN VOLUME SAMPAH (7 HARI TERAKHIR) ---
    // ========================================================================
    if (trendChart) {
        // Langkah 1: Buat template untuk 7 hari terakhir dengan nilai awal 0
        const trendData = {};
        const labels = [];
        for (let i = 6; i >= 0; i--) {
            const date = new Date();
            date.setDate(date.getDate() - i);
            const formattedDate = date.toLocaleDateString('id-ID', { day: '2-digit', month: 'short' });
            labels.push(formattedDate);
            trendData[formattedDate] = 0;
        }

        // Langkah 2: Filter data dari Firestore seperti sebelumnya
        const sevenDaysAgo = new Date();
        sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
        
        filteredDocs
            .filter(doc => doc.timestamp.toDate() > sevenDaysAgo)
            .forEach(doc => {
                const dateKey = doc.timestamp.toDate().toLocaleDateString('id-ID', { day: '2-digit', month: 'short' });
                // Langkah 3: Isi template dengan data nyata jika ada
                if (trendData.hasOwnProperty(dateKey)) {
                    trendData[dateKey] += doc.berat;
                }
            });

        // Langkah 4: Update grafik dengan data yang sudah lengkap (7 hari)
        trendChart.data.labels = labels;
        trendChart.data.datasets[0].data = Object.values(trendData);
        trendChart.update();
    }

    // ========================================================================
    // ---2. GRAFIK: DISTRIBUSI JENIS SAMPAH (MINGGUAN & BULANAN) ---
    // ========================================================================
    if (distributionChartWeekly && distributionChartMonthly) {
        // 1. Siapkan periode
        const firstDayOfMonth = new Date(new Date().getFullYear(), new Date().getMonth(), 1);
        const now = new Date();
        const firstDayOfWeek = new Date(now.setDate(now.getDate() - now.getDay() + (now.getDay() === 0 ? -6 : 1)));
        firstDayOfWeek.setHours(0,0,0,0);

        // 2. Filter data untuk masing-masing periode
        const docsBulanIni = filteredDocs.filter(doc => doc.timestamp.toDate() >= firstDayOfMonth);
        const docsMingguIni = filteredDocs.filter(doc => doc.timestamp.toDate() >= firstDayOfWeek);

        // 3. Kalkulasi data untuk grafik bulanan
        const monthlyData = { Organik: 0, Anorganik: 0, Residu: 0 };
        docsBulanIni.forEach(doc => { if (monthlyData.hasOwnProperty(doc.jenis)) monthlyData[doc.jenis] += doc.berat; });
        
        // 4. Kalkulasi data untuk grafik mingguan
        const weeklyData = { Organik: 0, Anorganik: 0, Residu: 0 };
        docsMingguIni.forEach(doc => { if (weeklyData.hasOwnProperty(doc.jenis)) weeklyData[doc.jenis] += doc.berat; });

        // 5. Update kedua grafik
        distributionChartMonthly.data.datasets[0].data = Object.values(monthlyData);
        distributionChartMonthly.update();
        
        distributionChartWeekly.data.datasets[0].data = Object.values(weeklyData);
        distributionChartWeekly.update();
    }

    // ========================================================================
    // --- 3. GRAFIK: KOMPARASI KOMPOSISI SAMPAH PER FAKULTAS ---
    // ========================================================================
    if (facultyStackedChart) {
        // PERBAIKAN DIMULAI DI SINI
        // 1. Ambil daftar fakultas yang valid dari objek facultyTargets (yang ada di file fakultas.js)
        // Kita definisikan ulang di sini agar modul ini mandiri
        const validFacultyTargets = {
            'FT': 50, 'FK': 45, 'FEB': 55, 'FH': 35, 'FSM': 40, 'FPP': 60
        };
        const faculties = Object.keys(validFacultyTargets);

        // 2. Filter data mentah agar HANYA berisi fakultas yang valid
        const relevantDocs = filteredDocs.filter(doc => faculties.includes(doc.fakultas));

        // 3. Proses data yang sudah bersih tersebut
        const facultyData = {}; 
        relevantDocs.forEach(doc => {
            if (doc.fakultas) {
                if (!facultyData[doc.fakultas]) facultyData[doc.fakultas] = {};
                facultyData[doc.fakultas][doc.jenis] = (facultyData[doc.fakultas][doc.jenis] || 0) + doc.berat;
            }
        });
        
        // 4. Update grafik menggunakan daftar fakultas yang sudah valid
        facultyStackedChart.data.labels = faculties;
        facultyStackedChart.data.datasets = ['Organik', 'Anorganik', 'Residu'].map(jenis => ({
            label: jenis,
            data: faculties.map(fakultas => facultyData[fakultas]?.[jenis] || 0),
            backgroundColor: CHART_COLORS[jenis.toLowerCase()],
        }));
        facultyStackedChart.update();
    }

    // ========================================================================
    // --- 4. GRAFIK: POLA WAKTU PEMBUANGAN (JAM SIBUK) ---
    // ========================================================================
    // ========================================================================
    // --- 4. GRAFIK: POLA WAKTU PEMBUANGAN (JAM SIBUK) ---
    // ========================================================================
    if (hourlyPatternChart) {
        const hourlyData = Array(24).fill(0);
        
        // Buat variabel baru untuk data 30 hari terakhir
        const thirtyDaysAgo = new Date();
        thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
        const recentDocs = filteredDocs.filter(doc => doc.timestamp.toDate() > thirtyDaysAgo);

        // Gunakan data yang sudah difilter 30 hari
        recentDocs.forEach(doc => {
            const hour = doc.timestamp.toDate().getHours();
            hourlyData[hour]++;
        });
        
        hourlyPatternChart.data.datasets[0].data = hourlyData;
        hourlyPatternChart.update();
    }
    
    // ========================================================================
    // --- 5. KARTU STATISTIK & TARGET (BULAN INI) ---
    // ========================================================================
    const firstDayOfMonth = new Date(new Date().getFullYear(), new Date().getMonth(), 1);
    const docsBulanIni = filteredDocs.filter(doc => doc.timestamp.toDate() >= firstDayOfMonth);
    const totalAnorganikBulanIni = docsBulanIni.filter(d => d.jenis === 'Anorganik').reduce((sum, d) => sum + d.berat, 0);
    const totalSampahBulanIni = docsBulanIni.reduce((sum, d) => sum + d.berat, 0);

    document.getElementById('potensi-ekonomi-value').textContent = `Rp ${Math.round(totalAnorganikBulanIni * HARGA_ANORGANIK_PER_KG).toLocaleString('id-ID')}`;
    document.getElementById('emisi-karbon-value').textContent = `${(totalSampahBulanIni * FAKTOR_EMISI_CO2E_PER_KG).toFixed(1)} kg CO₂e`;

    const percentage = Math.min((totalSampahBulanIni / TARGET_BULANAN_KG) * 100, 100);
    document.getElementById('progres-bar-fill').style.width = `${percentage}%`;
    document.getElementById('progres-bar-text').textContent = `${Math.round(percentage)}%`;
    document.getElementById('progres-bar-label').textContent = `${totalSampahBulanIni.toFixed(1)} kg / ${TARGET_BULANAN_KG} kg`;

    // ========================================================================
    // --- 6. GRAFIK-GRAFIK TREN BULANAN ---
    // ========================================================================
    const monthlyAggregates = {};
    // Tidak perlu filter 'sixMonthsAgo' lagi, cukup proses semua 'filteredDocs' yang diterima
    filteredDocs.forEach(doc => {
        const date = doc.timestamp.toDate();
        const monthKey = `${date.getFullYear()}-${(date.getMonth() + 1).toString().padStart(2, '0')}`;
        if (!monthlyAggregates[monthKey]) {
            monthlyAggregates[monthKey] = { totalAnorganik: 0, totalSampah: 0, label: date.toLocaleDateString('id-ID', { month: 'short', year: 'numeric' }) };
        }
        if (doc.jenis === 'Anorganik') monthlyAggregates[monthKey].totalAnorganik += doc.berat;
        monthlyAggregates[monthKey].totalSampah += doc.berat;
    });

    const sortedMonthKeys = Object.keys(monthlyAggregates).sort();
    const labels = sortedMonthKeys.map(key => monthlyAggregates[key].label);
    const economicData = sortedMonthKeys.map(key => Math.round(monthlyAggregates[key].totalAnorganik * HARGA_ANORGANIK_PER_KG));
    const emissionData = sortedMonthKeys.map(key => (monthlyAggregates[key].totalSampah * FAKTOR_EMISI_CO2E_PER_KG).toFixed(1));
    const totalKgData = sortedMonthKeys.map(key => monthlyAggregates[key].totalSampah.toFixed(1));

    const reductionData = [];
    for (let i = 0; i < sortedMonthKeys.length; i++) {
        if (i === 0) {
            reductionData.push(0);
        } else {
            const current = monthlyAggregates[sortedMonthKeys[i]].totalSampah;
            const prev = monthlyAggregates[sortedMonthKeys[i-1]].totalSampah;
            reductionData.push(prev > 0 ? (((prev - current) / prev) * 100).toFixed(1) : 0);
        }
    }

    if (monthlyEconomicChart) {
        monthlyEconomicChart.data.labels = labels;
        monthlyEconomicChart.data.datasets[0].data = economicData;
        monthlyEconomicChart.data.datasets[1].data = economicData; // Tren sama dengan data utama
        monthlyEconomicChart.update();
    }
    if (monthlyEmissionChart) {
        monthlyEmissionChart.data.labels = labels;
        monthlyEmissionChart.data.datasets[0].data = emissionData;
        monthlyEmissionChart.data.datasets[1].data = emissionData; // Tren sama dengan data utama
        monthlyEmissionChart.update();
    }
    if (monthlyReductionChart) {
        monthlyReductionChart.data.labels = labels;
        monthlyReductionChart.data.datasets[0].data = totalKgData;
        monthlyReductionChart.data.datasets[1].data = reductionData;
        monthlyReductionChart.update();
    }
}

// --- FUNGSI INISIALISASI UTAMA HALAMAN ---
export function initAnalitikPage(firebaseConfig) {
    console.log("Analitik.js: Menggunakan arsitektur modular yang benar.");

    initializeFirebase(firebaseConfig);
    db = getFirestoreInstance();

    if (!db) {
        console.error("Firestore DB tidak tersedia.");
        return;
    }
    
    updateCurrentDate('current-date');

    // Inisialisasi SEMUA kerangka grafik
    initAnalitikBarChart('analitikBarChart');
    initTrendChart();
        distributionChartWeekly = initDistributionChart('distributionChartWeekly');
    distributionChartMonthly = initDistributionChart('distributionChartMonthly');
    initFacultyStackedChart();
    initHourlyPatternChart();
    initMonthlyEconomicChart();
    initMonthlyEmissionChart();
    initMonthlyReductionChart();
    
    
    
    // Setup listener global, sama seperti halaman lainnya
    setupGlobalSampahListener(updateAnalitikUI);
    console.log("Global listener untuk analitik telah diatur.");
}