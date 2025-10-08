import {
    initializeFirebase,
    updateCurrentDate,
    setupGlobalSampahListener
} from "./firebaseService.js";

// Global variables for charts
let weeklyTrendChart;
let typeDistributionChart;

// --- Helper Functions for Chart/UI Initialization ---

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
function updateDashboardSpecificUI(data) {
    // Default values untuk mencegah error jika data tidak lengkap
    const {
        overviewOrganikToday = 0,
        overviewAnorganikToday = 0,
        overviewResiduToday = 0,
        weeklyTotalData = [0, 0, 0, 0, 0, 0, 0]
    } = data || {};

    // 1. Update kartu ringkasan "Overview Garbage Summary"
    // (Logika ini sudah benar, tidak perlu diubah)
    const overviewTotalSampahElem = document.getElementById('total-sampah');
    if (overviewTotalSampahElem) overviewTotalSampahElem.textContent = (overviewOrganikToday + overviewAnorganikToday + overviewResiduToday).toFixed(1);

    const overviewTotalOrganikElem = document.getElementById('total-organik');
    if (overviewTotalOrganikElem) overviewTotalOrganikElem.textContent = overviewOrganikToday.toFixed(1);

    const overviewTotalAnorganikElem = document.getElementById('total-anorganik');
    if (overviewTotalAnorganikElem) overviewTotalAnorganikElem.textContent = overviewAnorganikToday.toFixed(1);

    const overviewTotalResiduElem = document.getElementById('total-residu');
    if (overviewTotalResiduElem) overviewTotalResiduElem.textContent = overviewResiduToday.toFixed(1);


    // 2. Update Grafik Tren Mingguan
    // (Logika ini sudah benar, tidak perlu diubah)
    if (weeklyTrendChart) {
        weeklyTrendChart.data.datasets[0].data = weeklyTotalData;
        weeklyTrendChart.update();
    }


    // 3. Update Grafik Distribusi Jenis (Doughnut)
    if (typeDistributionChart) {
        const hasActualData = overviewOrganikToday > 0 || overviewAnorganikToday > 0 || overviewResiduToday > 0;

        if (hasActualData) {
            // Jika ADA DATA, tampilkan data aktual
            typeDistributionChart.data.datasets[0].data = [overviewOrganikToday, overviewAnorganikToday, overviewResiduToday];
            typeDistributionChart.data.datasets[0].backgroundColor = ['#62B682', '#5C7AF3', '#D35748'];
            typeDistributionChart.data.labels = ['Organik (kg)', 'Anorganik (kg)', 'Residu (kg)'];
            typeDistributionChart.options.plugins.legend.display = true;
        } else {
            // Jika TIDAK ADA DATA, biarkan plugin yang bekerja
            // Kita hanya perlu mengatur data agar plugin terpicu
            typeDistributionChart.data.datasets[0].data = [1]; // Data dummy untuk memicu plugin
            typeDistributionChart.data.datasets[0].backgroundColor = ['#E5E7EB']; // Warna abu-abu netral
            typeDistributionChart.data.labels = ['No Data Today']; // Label yang dikenali plugin
            typeDistributionChart.options.plugins.legend.display = false; // Sembunyikan legenda
        }

        // PERUBAHAN PENTING:
        // Biarkan 'cutout' konsisten agar bentuk donat tidak berubah-ubah.
        // Plugin akan menggambar teks "No Data Today" di tengah.
        typeDistributionChart.options.cutout = '80%';
        
        typeDistributionChart.update();
    }
}


// --- DOMContentLoaded Listener ---
document.addEventListener('DOMContentLoaded', function () {
    const firebaseConfig = window.firebaseConfig;

    if (firebaseConfig) {
        initializeFirebase(firebaseConfig);
        updateCurrentDate('current-date');

        initWeeklyTrendChart('weeklyTrendChart');
        initTypeDistributionChart('typeDistributionChart');

        setupGlobalSampahListener(updateDashboardSpecificUI);

    } else {
        console.error("Firebase configuration not found in window.firebaseConfig. Check your Blade file.");
    }
});