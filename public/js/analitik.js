import { initializeFirebase, getFirestoreInstance, setupGlobalSampahListener, updateCurrentDate } from "./firebaseService.js";

// --- KONFIGURASI & VARIABEL GLOBAL ---
Chart.register(ChartDataLabels); // Daftarkan plugin datalabels secara global
// Menetapkan pengaturan default untuk semua plugin datalabels
Chart.defaults.plugins.datalabels.color = '#000';
Chart.defaults.plugins.datalabels.font = {
    weight: 'bold'
};
const HARGA_ANORGANIK_PER_KG = 2000;
const FAKTOR_EMISI_CO2E_PER_KG = 0.5;
const TARGET_BULANAN_KG = 1650;
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


// public/js/analitik.js

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
            // SEMUA plugin harus berada di dalam satu objek 'plugins' ini
            plugins: { 
                legend: { 
                    position: 'bottom', 
                    labels: { boxWidth: 12 } 
                },
                
                // Konfigurasi datalabels sekarang berada di tempat yang benar
                datalabels: {
                    color: '#000', // Warna teks
                    font: {
                        weight: 'bold'
                    },
                    formatter: (value, context) => {
                        const total = context.chart.data.datasets[0].data.reduce((sum, val) => sum + val, 0);
                        const percentage = total > 0 ? (value / total * 100) : 0;
                        // Hanya tampilkan jika persentase lebih dari 5% agar tidak terlalu ramai
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

// public/js/analitik.js

function initFacultyStackedChart() {
    const ctx = document.getElementById('facultyStackedChart')?.getContext('2d');
    if (!ctx) return;
    facultyStackedChart = new Chart(ctx, {
        type: 'bar',
        data: { labels: [], datasets: [] },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            scales: {
                x: { stacked: true },
                y: { stacked: true, beginAtZero: true, title: { display: true, text: 'Berat (kg)' } }
            },
            plugins: {
                datalabels: {
                    color: '#000',
                    font: {
                        weight: 'bold'
                    },
                    // align: 'start',   // <-- HAPUS BARIS INI
                    // anchor: 'start',  // <-- HAPUS BARIS INI
                    // offset: 8,        // <-- HAPUS BARIS INI
                    formatter: (value, context) => {
                        // Sembunyikan label jika nilainya terlalu kecil (misal: < 5 kg)
                        if (value < 5) {
                            return null;
                        }

                        // Hitung total dari semua segmen di satu batang
                        const total = context.chart.data.datasets.reduce((sum, dataset) => {
                            return sum + (dataset.data[context.dataIndex] || 0);
                        }, 0);
                        
                        // Hitung persentase segmen ini
                        const percentage = total > 0 ? (value / total * 100) : 0;
                        
                        // Format teks menjadi dua baris
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

// ========================================================================
// --- FUNGSI BARU: KHUSUS UNTUK UPDATE KARTU STATISTIK (ON-DEMAND) ---
// ========================================================================
async function updateStatCardsOnDemand() {
    console.log("Analitik.js: Memulai fetch on-demand untuk Kartu Statistik...");
    try {
        const firstDayOfMonth = new Date(new Date().getFullYear(), new Date().getMonth(), 1);
        const q = query(collection(db, "sampah"), where("timestamp", ">=", Timestamp.fromDate(firstDayOfMonth)));
        const querySnapshot = await getDocs(q);

        let totalOrganikBulanIni = 0;
        let totalAnorganikBulanIni = 0;
        let totalSampahBulanIni = 0;

        querySnapshot.forEach(doc => {
            const data = doc.data();
            if (data.jenis !== 'Umum' && data.timestamp) {
                if (data.jenis === 'Organik') totalOrganikBulanIni += data.berat;
                if (data.jenis === 'Anorganik') totalAnorganikBulanIni += data.berat;
                totalSampahBulanIni += data.berat;
            }
        });

        // Terapkan rumus baru untuk Emisi Karbon
        const totalEmisiKarbon = (totalOrganikBulanIni * 1.0) + (totalAnorganikBulanIni * 0.4);

        // Update semua kartu statistik
        document.getElementById('potensi-ekonomi-value').textContent = `Rp ${Math.round(totalAnorganikBulanIni * HARGA_ANORGANIK_PER_KG).toLocaleString('id-ID')}`;
        document.getElementById('emisi-karbon-value').textContent = `${totalEmisiKarbon.toFixed(1)} kg CO₂e`;

        const percentage = Math.min((totalSampahBulanIni / TARGET_BULANAN_KG) * 100, 100);
        document.getElementById('progres-bar-fill').style.width = `${percentage}%`;
        document.getElementById('progres-bar-text').textContent = `${Math.round(percentage)}%`;
        document.getElementById('progres-bar-label').textContent = `${totalSampahBulanIni.toFixed(1)} kg / ${TARGET_BULANAN_KG} kg`;
        
        console.log("Analitik.js: Kartu Statistik berhasil diperbarui (on-demand).");

    } catch (error) {
        console.error("Gagal memperbarui Kartu Statistik:", error);
    }
}


// --- FUNGSI UTAMA UNTUK UPDATE UI ---
// public/js/analitik.js

function updateAnalitikUI(data) {
    console.log("Analitik.js: Menerima paket data real-time untuk grafik:", data);
    if (!data || !data.allDocs) { return; }
    
    const { allDocs, facultyDataAggregates } = data;
    const filteredDocs = allDocs.filter(doc => doc.jenis !== 'Umum' && doc.timestamp);
    if (filteredDocs.length === 0) { return; }
    
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

    const { totalEmisiBulanIni } = data;
    
    const firstDayOfMonth = new Date(new Date().getFullYear(), new Date().getMonth(), 1);
    const docsBulanIni = filteredDocs.filter(doc => doc.timestamp.toDate() >= firstDayOfMonth);

    // Hitung total Organik dan Anorganik secara terpisah
    const totalAnorganikBulanIni = docsBulanIni.filter(d => d.jenis === 'Anorganik').reduce((sum, d) => sum + d.berat, 0);
    const totalOrganikBulanIni = docsBulanIni.filter(d => d.jenis === 'Organik').reduce((sum, d) => sum + d.berat, 0);

    //  Terapkan rumus baru Anda untuk Emisi Karbon
    // const totalEmisiKarbon = (totalOrganikBulanIni * 1.0) + (totalAnorganikBulanIni * 0.4);

    // Update kartu Potensi Ekonomi (tidak berubah)
    document.getElementById('potensi-ekonomi-value').textContent = `Rp ${Math.round(totalAnorganikBulanIni * HARGA_ANORGANIK_PER_KG).toLocaleString('id-ID')}`;
    
    // Update kartu Emisi Karbon dengan hasil perhitungan baru
    document.getElementById('emisi-karbon-value').textContent = `${totalEmisiBulanIni.toFixed(1)} kg CO₂e`;

    // Update progress bar (menggunakan total dari semua jenis sampah)
    const totalSampahBulanIni = docsBulanIni.reduce((sum, d) => sum + d.berat, 0);
    const percentage = Math.min((totalSampahBulanIni / TARGET_BULANAN_KG) * 100, 100);
    document.getElementById('progres-bar-fill').style.width = `${percentage}%`;
    document.getElementById('progres-bar-text').textContent = `${Math.round(percentage)}%`;
    document.getElementById('progres-bar-label').textContent = `${totalSampahBulanIni.toFixed(1)} kg / ${TARGET_BULANAN_KG} kg`;

    // ========================================================================
    // --- 6. GRAFIK-GRAFIK TREN BULANAN ---
    // ========================================================================
    const monthlyAggregates = {};
    const sixMonthsAgo = new Date();
    sixMonthsAgo.setMonth(sixMonthsAgo.getMonth() - 5);
    sixMonthsAgo.setDate(1);
    sixMonthsAgo.setHours(0,0,0,0);
    
    filteredDocs.filter(doc => doc.timestamp.toDate() >= sixMonthsAgo).forEach(doc => {
        const date = doc.timestamp.toDate();
        const monthKey = `${date.getFullYear()}-${(date.getMonth() + 1).toString().padStart(2, '0')}`;
        if (!monthlyAggregates[monthKey]) {
            // Tambahkan properti totalOrganik untuk perhitungan CO2
            monthlyAggregates[monthKey] = { totalOrganik: 0, totalAnorganik: 0, totalSampah: 0, label: date.toLocaleDateString('id-ID', { month: 'short', year: 'numeric' }) };
        }
        if (doc.jenis === 'Organik') monthlyAggregates[monthKey].totalOrganik += doc.berat;
        if (doc.jenis === 'Anorganik') monthlyAggregates[monthKey].totalAnorganik += doc.berat;
        monthlyAggregates[monthKey].totalSampah += doc.berat;
    });

    const sortedMonthKeys = Object.keys(monthlyAggregates).sort();
    const labels = sortedMonthKeys.map(key => monthlyAggregates[key].label);
    
    // Perhitungan Potensi Ekonomi (tidak berubah)
    const economicData = sortedMonthKeys.map(key => Math.round(monthlyAggregates[key].totalAnorganik * HARGA_ANORGANIK_PER_KG));

    // PERBAIKAN: Terapkan rumus baru untuk data emisi bulanan
    const emissionData = sortedMonthKeys.map(key => {
        const monthData = monthlyAggregates[key];
        const totalEmisi = (monthData.totalOrganik * 1.0) + (monthData.totalAnorganik * 0.4);
        return totalEmisi.toFixed(1);
    });
    
    // Perhitungan untuk grafik pengurangan (tidak berubah)
    const totalKgData = sortedMonthKeys.map(key => monthlyAggregates[key].totalSampah.toFixed(1));
    const reductionData = [];
    for (let i = 0; i < sortedMonthKeys.length; i++) {
        if (i === 0) { reductionData.push(0); } else {
            const current = monthlyAggregates[sortedMonthKeys[i]].totalSampah;
            const prev = monthlyAggregates[sortedMonthKeys[i-1]].totalSampah;
            reductionData.push(prev > 0 ? (((prev - current) / prev) * 100).toFixed(1) : 0);
        }
    }

    // Update semua grafik tren bulanan
    if (monthlyEconomicChart) {
        monthlyEconomicChart.data.labels = labels;
        monthlyEconomicChart.data.datasets[0].data = economicData;
        monthlyEconomicChart.data.datasets[1].data = economicData;
        monthlyEconomicChart.update();
    }
    if (monthlyEmissionChart) {
        monthlyEmissionChart.data.labels = labels;
        monthlyEmissionChart.data.datasets[0].data = emissionData;
        monthlyEmissionChart.data.datasets[1].data = emissionData;
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