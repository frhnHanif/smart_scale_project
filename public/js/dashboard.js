import {
    initializeFirebase,
    updateCurrentDate,
    setupGlobalSampahListener
} from "./firebaseService.js";

// Global variables for charts (faculty chart removed)
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
        const { ctx, data } = chart;
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
                labels: ['Umum (kg)', 'Organik (kg)', 'Anorganik (kg)'],
                datasets: [{
                    data: [1, 1, 1],
                    backgroundColor: ['#D35748', '#62B682', '#5C7AF3'],
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
    const {
        overviewOrganikToday,
        overviewAnorganikToday,
        overviewUmumToday,
        weeklyTotalData
        // facultyDataAggregates has been removed
    } = data;

    // 1. Update "Overview Garbage Summary" cards
    const overviewTotalSampahElem = document.getElementById('total-sampah');
    if (overviewTotalSampahElem) overviewTotalSampahElem.textContent = (overviewOrganikToday + overviewAnorganikToday + overviewUmumToday).toFixed(1);

    const overviewTotalOrganikElem = document.getElementById('total-organik');
    if (overviewTotalOrganikElem) overviewTotalOrganikElem.textContent = overviewOrganikToday.toFixed(1);

    const overviewTotalAnorganikElem = document.getElementById('total-anorganik');
    if (overviewTotalAnorganikElem) overviewTotalAnorganikElem.textContent = overviewAnorganikToday.toFixed(1);

    const overviewTotalUmumElem = document.getElementById('total-umum');
    if (overviewTotalUmumElem) overviewTotalUmumElem.textContent = overviewUmumToday.toFixed(1);


    // 2. Update Weekly Trend Chart
    if (weeklyTrendChart) {
        weeklyTrendChart.data.datasets[0].data = weeklyTotalData;
        weeklyTrendChart.update();
    }


    // 3. Update Type Distribution Chart (Doughnut)
    if (typeDistributionChart) {
        let hasActualData = overviewUmumToday > 0 || overviewOrganikToday > 0 || overviewAnorganikToday > 0;

        if (hasActualData) {
            typeDistributionChart.data.datasets[0].data = [overviewUmumToday, overviewOrganikToday, overviewAnorganikToday];
            typeDistributionChart.data.datasets[0].backgroundColor = ['#D35748', '#62B682', '#5C7AF3'];
            typeDistributionChart.data.labels = ['Umum (kg)', 'Organik (kg)', 'Anorganik (kg)'];
            typeDistributionChart.options.plugins.legend.display = true;
            typeDistributionChart.options.cutout = '80%';
        } else {
            typeDistributionChart.data.datasets[0].data = [1];
            typeDistributionChart.data.datasets[0].backgroundColor = ['#e0e0e0'];
            typeDistributionChart.data.labels = ['No Data Today'];
            typeDistributionChart.options.plugins.legend.display = true;
            typeDistributionChart.options.cutout = '0%';
        }
        typeDistributionChart.update();
    }

    // Section 4 for Faculty Performance Chart has been completely removed.
}


// --- DOMContentLoaded Listener ---
document.addEventListener('DOMContentLoaded', function () {
    const firebaseConfig = window.firebaseConfig;

    if (firebaseConfig) {
        initializeFirebase(firebaseConfig);
        updateCurrentDate('current-date');

        initWeeklyTrendChart('weeklyTrendChart');
        initTypeDistributionChart('typeDistributionChart');
        // The call to initFacultyPerformanceChart has been removed.

        setupGlobalSampahListener(updateDashboardSpecificUI);

    } else {
        console.error("Firebase configuration not found in window.firebaseConfig. Check your Blade file.");
    }
});
