import { fetchData, updateGlobalStatCards } from "./firebaseService.js";

// === KONSTANTA GLOBAL ===
// Aturan bisnis (harga, emisi, target) tetap di sini.
// Daftar fakultas & jenis sampah akan dimuat dari JSON.
const HARGA_ANORGANIK_PER_KG = 2000;
// const FAKTOR_EMISI_CO2E_PER_KG = 0.5; // Tidak terpakai di logika Anda, bisa dihapus
const TARGET_BULANAN_KG = 1650;

// === VARIABEL GLOBAL DINAMIS ===
// Variabel-variabel ini akan diisi oleh app.config.json
let masterJenisSampah = [];
let masterFakultas = [];
let facultyTargetsMap = {}; // Untuk akses cepat target: {'FT': 50, 'FK': 45}
let chartColorsList = [];   // Daftar warna: ['#62B682', '#5C7AF3', ...]
let jenisSampahLabels = []; // Daftar nama: ['Organik', 'Anorganik', ...]
let fakultasLabels = [];    // Daftar kode: ['FT', 'FK', 'FEB', ...]
let recyclableTypes = [];   // Daftar jenis sampah yg bisa didaur ulang

// Variabel untuk menyimpan instance Chart
let analitikBarChart, trendChart, distributionChartWeekly, distributionChartMonthly, facultyStackedChart, hourlyPatternChart,
    monthlyEconomicChart, monthlyEmissionChart, monthlyReductionChart;

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

// === FUNGSI INISIALISASI GRAFIK ===
// (Fungsi-fungsi ini sekarang dipanggil SETELAH config dimuat)

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
            responsive: true,
            maintainAspectRatio: false,
            scales: {
                x: {
                    title: {
                        display: true,
                        text: 'Fakultas'
                    }
                },
                y: {
                    beginAtZero: true,
                    title: {
                        display: true,
                        text: 'Nilai'
                    }
                }
            },
            plugins: {
                legend: {
                    position: 'top'
                }
            }
        }
    });
}

function initTrendChart() {
    const ctx = document.getElementById('trendChart')?.getContext('2d');
    if (!ctx) return;
    trendChart = new Chart(ctx, {
        type: 'line',
        data: {
            labels: [],
            datasets: [{
                label: 'Total Berat Sampah (kg)',
                data: [],
                tension: 0.1,
                borderColor: '#447F40',
                fill: true
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            scales: {
                y: {
                    beginAtZero: true,
                    title: {
                        display: true,
                        text: 'Berat (kg)'
                    }
                }
            }
        }
    });
}

/**
 * REFACTOR: Fungsi ini sekarang dinamis
 * Menggunakan label & warna dari config global.
 */
function initDistributionChart(ctxId) {
    const ctx = document.getElementById(ctxId)?.getContext('2d');
    if (!ctx) return null;
    return new Chart(ctx, {
        type: 'doughnut',
        data: {
            // Menggunakan data dari config JSON
            labels: jenisSampahLabels,
            datasets: [{
                // Buat data placeholder sesuai jumlah label
                data: Array(jenisSampahLabels.length).fill(1), 
                backgroundColor: chartColorsList
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
                legend: {
                    position: 'bottom',
                    labels: {
                        boxWidth: 12
                    }
                },
                datalabels: {
                    color: '#000',
                    font: {
                        weight: 'bold'
                    },
                    formatter: (value, context) => {
                        const total = context.chart.data.datasets[0].data.reduce((sum, val) => sum + val, 0);
                        const percentage = total > 0 ? (value / total * 100) : 0;
                        if (percentage < 5) {
                            return null;
                        }
                        return `${value.toFixed(1)} kg\n(${percentage.toFixed(1)}%)`;
                    }
                }
            }
        }
    });
}

function initFacultyStackedChart() {
    const ctx = document.getElementById('facultyStackedChart')?.getContext('2d');
    if (!ctx) return;
    facultyStackedChart = new Chart(ctx, {
        type: 'bar',
        data: {
            labels: [],
            datasets: []
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            scales: {
                x: {
                    stacked: true
                },
                y: {
                    stacked: true,
                    beginAtZero: true,
                    title: {
                        display: true,
                        text: 'Berat (kg)'
                    }
                }
            },
            plugins: {
                datalabels: {
                    color: '#000',
                    font: {
                        weight: 'bold'
                    },
                    formatter: (value, context) => {
                        if (value < 5) {
                            return null;
                        }
                        const total = context.chart.data.datasets.reduce((sum, dataset) => {
                            return sum + (dataset.data[context.dataIndex] || 0);
                        }, 0);
                        const percentage = total > 0 ? (value / total * 100) : 0;
                        return `${value.toFixed(1)} kg\n(${percentage.toFixed(0)}%)`;
                    }
                }
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
            labels: Array.from({
                length: 24
            }, (_, i) => `${i.toString().padStart(2, '0')}:00`),
            datasets: [{
                label: 'Jumlah Entri Sampah',
                data: Array(24).fill(0),
                backgroundColor: '#F59E0B' // Warna ini tidak ada di config, jadi biarkan
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            scales: {
                y: {
                    beginAtZero: true,
                    title: {
                        display: true,
                        text: 'Jumlah Entri'
                    }
                }
            }
        }
    });
}

function initMonthlyEconomicChart() {
    const ctx = document.getElementById('monthlyEconomicChart')?.getContext('2d');
    if (!ctx) return;
    monthlyEconomicChart = new Chart(ctx, {
        type: 'bar',
        data: {
            labels: [],
            datasets: [{
                label: 'Potensi Ekonomi (Rp)',
                data: [],
                backgroundColor: 'rgba(22, 163, 74, 0.7)',
                order: 1
            }, {
                label: 'Tren Ekonomi',
                data: [],
                borderColor: 'rgba(16, 115, 53, 1)',
                type: 'line',
                order: 0,
                tension: 0.3
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            scales: {
                y: {
                    title: {
                        display: true,
                        text: 'Rupiah (Rp)'
                    }
                }
            }
        }
    });
}

function initMonthlyEmissionChart() {
    const ctx = document.getElementById('monthlyEmissionChart')?.getContext('2d');
    if (!ctx) return;
    monthlyEmissionChart = new Chart(ctx, {
        type: 'bar',
        data: {
            labels: [],
            datasets: [{
                label: 'Emisi Karbon (kg CO₂e)',
                data: [],
                backgroundColor: 'rgba(59, 130, 246, 0.7)',
                order: 1
            }, {
                label: 'Tren Emisi',
                data: [],
                borderColor: 'rgba(37, 99, 235, 1)',
                type: 'line',
                order: 0,
                tension: 0.3
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            scales: {
                y: {
                    title: {
                        display: true,
                        text: 'kg CO₂e'
                    }
                }
            }
        }
    });
}

function initMonthlyReductionChart() {
    const ctx = document.getElementById('monthlyReductionChart')?.getContext('2d');
    if (!ctx) return;
    monthlyReductionChart = new Chart(ctx, {
        type: 'bar',
        data: {
            labels: [],
            datasets: [{
                label: 'Total Sampah (kg)',
                backgroundColor: 'rgba(156, 163, 175, 0.6)',
                yAxisID: 'y'
            }, {
                label: 'Pengurangan (%)',
                borderColor: 'rgba(239, 68, 68, 1)',
                type: 'line',
                yAxisID: 'y1'
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            scales: {
                y: {
                    type: 'linear',
                    display: true,
                    position: 'left',
                    title: {
                        display: true,
                        text: 'Berat (kg)'
                    }
                },
                y1: {
                    type: 'linear',
                    display: true,
                    position: 'right',
                    title: {
                        display: true,
                        text: 'Pengurangan (%)'
                    },
                    grid: {
                        drawOnChartArea: false
                    }
                }
            }
        }
    });
}

/**
 * REFACTOR: Fungsi ini sekarang dinamis
 * Menggunakan data dari config global untuk memproses.
 */
function processDataForAnalitik(data) {
    console.log("Analitik.js: Memulai pemrosesan data...");

    const filteredDocs = data.filter(doc => doc.jenis !== 'Umum' && doc.timestamp);
    if (filteredDocs.length === 0) {
        console.warn("Tidak ada data valid untuk diproses.");
        return null;
    }

    // --- Siapkan Batas Waktu ---
    const now = new Date();
    const startOfToday = new Date(new Date().setHours(0, 0, 0, 0));
    const startOfYesterday = new Date(new Date(startOfToday).setDate(startOfToday.getDate() - 1));
    const firstDayOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
    const firstDayOfWeek = new Date(now);
    firstDayOfWeek.setDate(now.getDate() - now.getDay() + (now.getDay() === 0 ? -6 : 1));
    firstDayOfWeek.setHours(0, 0, 0, 0);
    const sevenDaysAgo = new Date(new Date().setDate(now.getDate() - 6)); 
    sevenDaysAgo.setHours(0, 0, 0, 0);
    const thirtyDaysAgo = new Date(new Date().setDate(now.getDate() - 29));
    thirtyDaysAgo.setHours(0, 0, 0, 0);
    const sixMonthsAgo = new Date(now.getFullYear(), now.getMonth() - 5, 1);
    sixMonthsAgo.setHours(0, 0, 0, 0);

    // --- Siapkan Variabel Hasil ---
    const results = {
        analitikBarChart: {
            labels: [],
            sampahHariIniData: [],
            penguranganPercentageData: []
        },
        trendChart: {
            labels: [],
            data: []
        },
        // Buat array dinamis berdasarkan jumlah jenis sampah
        distributionChartWeekly: Array(jenisSampahLabels.length).fill(0),
        distributionChartMonthly: Array(jenisSampahLabels.length).fill(0),
        facultyStackedChart: {
            labels: [],
            datasets: []
        },
        hourlyPatternChart: Array(24).fill(0),
        statCards: {
            potensiEkonomi: 0,
            emisiKarbon: 0,
            progressPercentage: 0,
            progressLabel: ""
        },
        monthlyTrends: {
            labels: [],
            economicData: [],
            emissionData: [],
            totalKgData: [],
            reductionData: []
        }
    };

    // --- 0. GRAFIK: ANALISIS HARIAN FAKULTAS ---
    const todayTotals = {};
    const yesterdayTotals = {};
    filteredDocs.forEach(doc => {
        const docDate = doc.timestamp; 
        if (doc.fakultas) {
            if (docDate >= startOfToday) {
                todayTotals[doc.fakultas] = (todayTotals[doc.fakultas] || 0) + doc.berat;
            } else if (docDate >= startOfYesterday && docDate < startOfToday) {
                yesterdayTotals[doc.fakultas] = (yesterdayTotals[doc.fakultas] || 0) + doc.berat;
            }
        }
    });
    // REFACTOR: Gunakan fakultasLabels dari config untuk memastikan semua ada
    const facultyNames = fakultasLabels.filter(f => todayTotals[f] || yesterdayTotals[f]);
    results.analitikBarChart.labels = facultyNames;
    results.analitikBarChart.sampahHariIniData = facultyNames.map(name => todayTotals[name] || 0);
    results.analitikBarChart.penguranganPercentageData = facultyNames.map(name => {
        const today = todayTotals[name] || 0;
        const yesterday = yesterdayTotals[name] || 0;
        return yesterday > 0 ? (((yesterday - today) / yesterday) * 100) : (today > 0 ? -Infinity : 0);
    });

    // --- 1. GRAFIK: TREN VOLUME SAMPAH (7 HARI TERAKHIR) ---
    // (Tidak ada perubahan, logika ini sudah dinamis)
    const trendData = {};
    for (let i = 6; i >= 0; i--) {
        const date = new Date();
        date.setDate(date.getDate() - i);
        const formattedDate = date.toLocaleDateString('id-ID', { day: '2-digit', month: 'short' });
        results.trendChart.labels.push(formattedDate);
        trendData[formattedDate] = 0;
    }
    filteredDocs.filter(doc => doc.timestamp >= sevenDaysAgo).forEach(doc => {
        const dateKey = doc.timestamp.toLocaleDateString('id-ID', { day: '2-digit', month: 'short' });
        if (trendData.hasOwnProperty(dateKey)) {
            trendData[dateKey] += doc.berat;
        }
    });
    results.trendChart.data = Object.values(trendData);

    // --- 2. GRAFIK: DISTRIBUSI JENIS SAMPAH (MINGGUAN & BULANAN) ---
    // REFACTOR: Buat objek dinamis
    const monthlyDataDist = {};
    const weeklyDataDist = {};
    jenisSampahLabels.forEach(label => {
        monthlyDataDist[label] = 0;
        weeklyDataDist[label] = 0;
    });

    filteredDocs.forEach(doc => {
        if (doc.timestamp >= firstDayOfMonth) {
            if (monthlyDataDist.hasOwnProperty(doc.jenis)) monthlyDataDist[doc.jenis] += doc.berat;
        }
        if (doc.timestamp >= firstDayOfWeek) {
            if (weeklyDataDist.hasOwnProperty(doc.jenis)) weeklyDataDist[doc.jenis] += doc.berat;
        }
    });
    // Urutan akan sama persis dengan jenisSampahLabels
    results.distributionChartMonthly = Object.values(monthlyDataDist);
    results.distributionChartWeekly = Object.values(weeklyDataDist);

    // --- 3. GRAFIK: KOMPARASI KOMPOSISI SAMPAH PER FAKULTAS (ALL TIME) ---
    // REFACTOR: Gunakan label & warna dinamis
    const faculties = fakultasLabels; // ['FT', 'FK', ...]
    const facultyData = {};
    // Inisialisasi data fakultas
    faculties.forEach(fakultas => {
        facultyData[fakultas] = {};
        jenisSampahLabels.forEach(jenis => {
            facultyData[fakultas][jenis] = 0;
        });
    });
    
    // Isi data
    filteredDocs.filter(doc => faculties.includes(doc.fakultas)).forEach(doc => {
        if (facultyData[doc.fakultas] && facultyData[doc.fakultas].hasOwnProperty(doc.jenis)) {
             facultyData[doc.fakultas][doc.jenis] += doc.berat;
        }
    });
    
    results.facultyStackedChart.labels = faculties;
    results.facultyStackedChart.datasets = jenisSampahLabels.map((jenis, index) => ({
        label: jenis,
        data: faculties.map(fakultas => facultyData[fakultas][jenis] || 0),
        backgroundColor: chartColorsList[index], // <-- Dinamis
    }));

    // --- 4. GRAFIK: POLA WAKTU PEMBUANGAN (30 HARI TERAKHIR) ---
    // (Tidak ada perubahan, logika ini sudah dinamis)
    const hourlyData = Array(24).fill(0);
    filteredDocs.filter(doc => doc.timestamp >= thirtyDaysAgo).forEach(doc => {
        const hour = doc.timestamp.getHours();
        hourlyData[hour]++;
    });
    results.hourlyPatternChart = hourlyData;

    // --- 5. KARTU STATISTIK & TARGET (BULAN INI) ---
    // REFACTOR: Hitung potensi ekonomi dan emisi secara dinamis
    const docsBulanIni = filteredDocs.filter(doc => doc.timestamp >= firstDayOfMonth);
    
    const totalOrganikBulanIni = docsBulanIni
        .filter(d => d.jenis === 'Organik')
        .reduce((sum, d) => sum + d.berat, 0);
        
    // Asumsi: 'recyclableTypes' diisi saat init (misal: ['Anorganik', 'Botol', 'Kertas'])
    const totalRecyclableBulanIni = docsBulanIni
        .filter(d => recyclableTypes.includes(d.jenis))
        .reduce((sum, d) => sum + d.berat, 0);

    const totalSampahBulanIni = docsBulanIni.reduce((sum, d) => sum + d.berat, 0);

    // Rumus emisi (diasumsikan anorganik/recyclable punya faktor sama)
    const totalEmisiKarbon = (totalOrganikBulanIni * 1.0) + (totalRecyclableBulanIni * 0.4);
    
    results.statCards.potensiEkonomi = Math.round(totalRecyclableBulanIni * HARGA_ANORGANIK_PER_KG);
    results.statCards.emisiKarbon = totalEmisiKarbon;
    const percentage = Math.min((totalSampahBulanIni / TARGET_BULANAN_KG) * 100, 100);
    results.statCards.progressPercentage = percentage;
    results.statCards.progressLabel = `${totalSampahBulanIni.toFixed(1)} kg / ${TARGET_BULANAN_KG} kg`;

    // --- 6. GRAFIK-GRAFIK TREN BULANAN (6 BULAN TERAKHIR) ---
    // REFACTOR: Gunakan logika dinamis untuk emisi & ekonomi
    const monthlyAggregates = {};
    filteredDocs.filter(doc => doc.timestamp >= sixMonthsAgo).forEach(doc => {
        const date = doc.timestamp;
        const monthKey = `${date.getFullYear()}-${(date.getMonth() + 1).toString().padStart(2, '0')}`;
        if (!monthlyAggregates[monthKey]) {
            monthlyAggregates[monthKey] = {
                totalOrganik: 0,
                totalRecyclable: 0, // <-- REFACTOR
                totalSampah: 0,
                label: date.toLocaleDateString('id-ID', { month: 'short', year: 'numeric' })
            };
        }
        if (doc.jenis === 'Organik') {
            monthlyAggregates[monthKey].totalOrganik += doc.berat;
        }
        if (recyclableTypes.includes(doc.jenis)) { // <-- REFACTOR
            monthlyAggregates[monthKey].totalRecyclable += doc.berat;
        }
        monthlyAggregates[monthKey].totalSampah += doc.berat;
    });

    const sortedMonthKeys = Object.keys(monthlyAggregates).sort();
    results.monthlyTrends.labels = sortedMonthKeys.map(key => monthlyAggregates[key].label);
    
    results.monthlyTrends.economicData = sortedMonthKeys.map(key => 
        Math.round(monthlyAggregates[key].totalRecyclable * HARGA_ANORGANIK_PER_KG) // <-- REFACTOR
    );
    
    results.monthlyTrends.emissionData = sortedMonthKeys.map(key => {
        const monthData = monthlyAggregates[key];
        return (monthData.totalOrganik * 1.0) + (monthData.totalRecyclable * 0.4); // <-- REFACTOR
    });
    
    results.monthlyTrends.totalKgData = sortedMonthKeys.map(key => monthlyAggregates[key].totalSampah);
    
    for (let i = 0; i < sortedMonthKeys.length; i++) {
        if (i === 0) {
            results.monthlyTrends.reductionData.push(0);
        } else {
            const current = monthlyAggregates[sortedMonthKeys[i]].totalSampah;
            const prev = monthlyAggregates[sortedMonthKeys[i - 1]].totalSampah;
            results.monthlyTrends.reductionData.push(prev > 0 ? (((prev - current) / prev) * 100) : 0);
        }
    }

    console.log("Analitik.js: Pemrosesan data selesai.");
    return results;
}


// --- 6. FUNGSI UTAMA UNTUK UPDATE UI ---
// (Tidak ada perubahan di sini, karena data sudah diproses)
function updateAnalitikUI(data) {
    if (!data) {
        console.warn("Analitik.js: Tidak ada data terproses untuk ditampilkan.");
        return;
    }
    console.log("Analitik.js: Memulai update UI dengan data terproses...", data);

    // 0. GRAFIK: ANALISIS HARIAN FAKULTAS
    if (analitikBarChart) {
        analitikBarChart.data.labels = data.analitikBarChart.labels;
        analitikBarChart.data.datasets[0].data = data.analitikBarChart.sampahHariIniData.map(d => d.toFixed(1));
        analitikBarChart.data.datasets[1].data = data.analitikBarChart.penguranganPercentageData.map(d => d.toFixed(1));
        analitikBarChart.update();
    }

    // 1. GRAFIK: TREN VOLUME SAMPAH (7 HARI TERAKHIR)
    if (trendChart) {
        trendChart.data.labels = data.trendChart.labels;
        trendChart.data.datasets[0].data = data.trendChart.data.map(d => d.toFixed(1));
        trendChart.update();
    }

    // 2. GRAFIK: DISTRIBUSI JENIS SAMPAH
    if (distributionChartMonthly) {
        distributionChartMonthly.data.datasets[0].data = data.distributionChartMonthly.map(d => d.toFixed(1));
        distributionChartMonthly.update();
    }
    if (distributionChartWeekly) {
        distributionChartWeekly.data.datasets[0].data = data.distributionChartWeekly.map(d => d.toFixed(1));
        distributionChartWeekly.update();
    }

    // 3. GRAFIK: KOMPARASI KOMPOSISI SAMPAH PER FAKULTAS
    if (facultyStackedChart) {
        facultyStackedChart.data.labels = data.facultyStackedChart.labels;
        facultyStackedChart.data.datasets = data.facultyStackedChart.datasets.map(dataset => ({
            ...dataset,
            data: dataset.data.map(d => d.toFixed(1))
        }));
        facultyStackedChart.update();
    }

    // 4. GRAFIK: POLA WAKTU PEMBUANGAN
    if (hourlyPatternChart) {
        hourlyPatternChart.data.datasets[0].data = data.hourlyPatternChart;
        hourlyPatternChart.update();
    }

    // 5. KARTU STATISTIK & TARGET (BULAN INI)
    document.getElementById('potensi-ekonomi-value').textContent = `Rp ${data.statCards.potensiEkonomi.toLocaleString('id-ID')}`;
    document.getElementById('emisi-karbon-value').textContent = `${data.statCards.emisiKarbon.toFixed(1)} kg CO₂e`;
    document.getElementById('progres-bar-fill').style.width = `${data.statCards.progressPercentage.toFixed(0)}%`;
    document.getElementById('progres-bar-text').textContent = `${data.statCards.progressPercentage.toFixed(0)}%`;
    document.getElementById('progres-bar-label').textContent = data.statCards.progressLabel;

    // 6. GRAFIK-GRAFIK TREN BULANAN
    if (monthlyEconomicChart) {
        monthlyEconomicChart.data.labels = data.monthlyTrends.labels;
        monthlyEconomicChart.data.datasets[0].data = data.monthlyTrends.economicData;
        monthlyEconomicChart.data.datasets[1].data = data.monthlyTrends.economicData; // Tren line
        monthlyEconomicChart.update();
    }
    if (monthlyEmissionChart) {
        monthlyEmissionChart.data.labels = data.monthlyTrends.labels;
        monthlyEmissionChart.data.datasets[0].data = data.monthlyTrends.emissionData.map(d => d.toFixed(1));
        monthlyEmissionChart.data.datasets[1].data = data.monthlyTrends.emissionData.map(d => d.toFixed(1)); // Tren line
        monthlyEmissionChart.update();
    }
    if (monthlyReductionChart) {
        monthlyReductionChart.data.labels = data.monthlyTrends.labels;
        monthlyReductionChart.data.datasets[0].data = data.monthlyTrends.totalKgData.map(d => d.toFixed(1));
        monthlyReductionChart.data.datasets[1].data = data.monthlyTrends.reductionData.map(d => d.toFixed(1));
        monthlyReductionChart.update();
    }

    console.log("Analitik.js: Update UI Selesai.");
}


// --- 7. FUNGSI MEMUAT DATA ---
// (Tidak ada perubahan, tapi sekarang dipanggil setelah config)
async function loadAnalitikData() {
    console.log("Analitik.js: Memulai pengambilan data...");
    try {
        const response = await fetchData();
        const allData = response.data;
        const processedData = processDataForAnalitik(allData);
        updateAnalitikUI(processedData);

    } catch (error) {
        console.error("Gagal memuat data analitik:", error);
    }
}

// --- 8. LISTENER MQTT ---
// (Tidak ada perubahan)
window.addEventListener('mqtt:data-baru', function(event) {
    console.log('🔄 ANALITIK: Trigger auto-refresh diterima!', event.detail);
    loadAnalitikData(); 
    updateGlobalStatCards();
});


// --- 9. FUNGSI INISIALISASI UTAMA ---
/**
 * REFACTOR: Fungsi ini sekarang ASYNC
 * Akan memuat config.json SEBELUM menginisialisasi chart
 */
export async function initAnalitikPage() {
    console.log("Analitik.js: Menggunakan arsitektur modular yang benar.");

    // Panggil fungsi utilitas tanggal (bisa jalan duluan)
    updateCurrentDate('current-date');
    updateGlobalStatCards();

    // ===================================================
    // LANGKAH 1: FETCH DATA KONFIGURASI DARI JSON
    // ===================================================
    try {
        const response = await fetch('/js/app.config.json'); // Ambil file JSON
        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }
        const config = await response.json();

        // Isi variabel global
        masterJenisSampah = config.jenisSampah;
        masterFakultas = config.fakultas;

        // Buat "peta" dan "daftar" untuk dipakai di seluruh skrip
        masterJenisSampah.forEach(j => {
            jenisSampahLabels.push(j.nama);
            chartColorsList.push(j.warna);
            // Tentukan jenis apa yg bisa didaur ulang (untuk ekonomi & emisi)
            if (j.nama !== 'Organik' && j.nama !== 'Residu') {
                recyclableTypes.push(j.nama);
            }
        });
        
        masterFakultas.forEach(f => {
            fakultasLabels.push(f.kode);
            facultyTargetsMap[f.kode] = f.target_harian_kg;
        });
        
        console.log("Konfigurasi aplikasi berhasil dimuat:", config);

    } catch (error) {
        console.error("KRITIS: Gagal memuat app.config.json. Halaman tidak dapat berfungsi.", error);
        // Tampilkan error ke pengguna di UI jika perlu
        return; // Hentikan eksekusi
    }
    // =G=================================================
    // DATA KONFIGURASI SELESAI DIMUAT
    // ===================================================

    // LANGKAH 2: Inisialisasi SEMUA kerangka grafik
    // (Fungsi-fungsi ini sekarang akan menggunakan data master global)
    initAnalitikBarChart('analitikBarChart');
    initTrendChart();
    distributionChartWeekly = initDistributionChart('distributionChartWeekly');
    distributionChartMonthly = initDistributionChart('distributionChartMonthly');
    initFacultyStackedChart();
    initHourlyPatternChart();
    initMonthlyEconomicChart();
    initMonthlyEmissionChart();
    initMonthlyReductionChart();

    // LANGKAH 3: Muat data utama
    loadAnalitikData();

    console.log("Inisialisasi halaman analitik selesai.");
}