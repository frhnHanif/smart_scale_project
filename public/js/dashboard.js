// public/js/dashboard.js

import {
    initializeFirebase,
    updateCurrentDate, // Keeping this if you use it for the header date
    setupGlobalSampahListener
} from "./firebaseService.js";

// Global variables for charts (scoped to this module)
let weeklyTrendChart;
let typeDistributionChart;
let facultyPerformanceChart;

// --- Helper Functions for Chart/UI Initialization ---

// Update header date (from firebaseService.js)
// This function remains here as it's part of dashboard.js's responsibilities to call it.
// The actual logic is in firebaseService.js.
// If you want the actual current date, ensure updateCurrentDate in firebaseService.js uses `formattedDate`.
// If you want fixed 'Kamis, 17 Juli 2025', that's also handled in firebaseService.js now.
// No changes here.


// Initialize Weekly Trend Chart (as it was, no specific "no data" for it here)
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

        // Check if it's the 'no data' state (single slice, grey color, 'No Data Today' label)
        const isNoRealData = (total === 1 && data.labels.length === 1 && data.labels[0] === 'No Data Today' && data.datasets[0].backgroundColor[0] === '#e0e0e0');

        if (isNoRealData) {
            ctx.save();
            ctx.font = '16px Inter, sans-serif';
            ctx.fillStyle = '#888'; // Grey color for text
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
                    data: [1, 1, 1], // Initial data
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
            plugins: [noDataDoughnutText] // <--- REGISTER THE PLUGIN HERE
        });
    } else {
        console.warn(`Canvas element with ID '${ctxId}' not found.`);
    }
}


// Initialize Faculty Performance Chart (as it was)
function initFacultyPerformanceChart(ctxId) {
    const ctx = document.getElementById(ctxId)?.getContext('2d');
    if (ctx) {
        facultyPerformanceChart = new Chart(ctx, {
            type: 'bar',
            data: {
                labels: [], // Faculty names will be the labels for groups
                datasets: [
                    {
                        label: 'Total Sampah Hari Ini',
                        data: [],
                        backgroundColor: '#447F40', // Green
                        borderColor: '#447F40',
                        borderWidth: 1,
                        barPercentage: 0.4, // Significantly thinner individual bars
                        categoryPercentage: 0.6 // More compact grouping
                    },
                    {
                        label: 'Sampah Organik',
                        data: [],
                        backgroundColor: '#62B682', // Green-ish
                        borderColor: '#62B682',
                        borderWidth: 1,
                        barPercentage: 0.4,
                        categoryPercentage: 0.6
                    },
                    {
                        label: 'Sampah Anorganik',
                        data: [],
                        backgroundColor: '#5C7AF3', // Blue-ish
                        borderColor: '#5C7AF3',
                        borderWidth: 1,
                        barPercentage: 0.4,
                        categoryPercentage: 0.6
                    },
                    {
                        label: 'Sampah Umum',
                        data: [],
                        backgroundColor: '#D35748', // Red-ish
                        borderColor: '#D35748',
                        borderWidth: 1,
                        barPercentage: 0.4,
                        categoryPercentage: 0.6
                    }
                ]
            },
            options: {
                indexAxis: 'y', // Horizontal bars
                scales: {
                    x: {
                        beginAtZero: true,
                        title: {
                            display: true,
                            text: 'Berat Sampah (kg)'
                        }
                    },
                    y: {
                        beginAtZero: true,
                        title: {
                            display: true,
                            text: 'Fakultas'
                        }
                    }
                },
                plugins: {
                    legend: {
                        display: true, // Legend is always true in the initial options
                        position: 'bottom'
                    }
                },
                responsive: true,
                maintainAspectRatio: false
            }
        });
    } else {
        console.warn(`Canvas element with ID '${ctxId}' not found.`);
    }
}


// --- Page-specific UI Update Function (called by firebaseService) ---
function updateDashboardSpecificUI(data) {
    // console.log('DEBUG: updateDashboardSpecificUI called. Data received:', data);

    const {
        overviewOrganikToday,
        overviewAnorganikToday,
        overviewUmumToday,
        weeklyTotalData,
        facultyDataAggregates
    } = data;

    // 1. Update "Overview Garbage Summary" cards (unchanged from your last working version)
    const overviewTotalSampahElem = document.getElementById('total-sampah');
    if (overviewTotalSampahElem) overviewTotalSampahElem.textContent = (overviewOrganikToday + overviewAnorganikToday + overviewUmumToday).toFixed(1);

    const overviewTotalOrganikElem = document.getElementById('total-organik');
    if (overviewTotalOrganikElem) overviewTotalOrganikElem.textContent = overviewOrganikToday.toFixed(1);

    const overviewTotalAnorganikElem = document.getElementById('total-anorganik');
    if (overviewTotalAnorganikElem) overviewTotalAnorganikElem.textContent = overviewAnorganikToday.toFixed(1);

    const overviewTotalUmumElem = document.getElementById('total-umum');
    if (overviewTotalUmumElem) overviewTotalUmumElem.textContent = overviewUmumToday.toFixed(1);


    // 2. Update Weekly Trend Chart (unchanged from your last working version)
    if (weeklyTrendChart) {
        weeklyTrendChart.data.datasets[0].data = weeklyTotalData;
        weeklyTrendChart.update();
    }


    // 3. Update Type Distribution Chart (Doughnut) with "No Data Today" handling
    if (typeDistributionChart) {
        let hasActualData = overviewUmumToday > 0 || overviewOrganikToday > 0 || overviewAnorganikToday > 0;

        if (hasActualData) {
            typeDistributionChart.data.datasets[0].data = [overviewUmumToday, overviewOrganikToday, overviewAnorganikToday];
            typeDistributionChart.data.datasets[0].backgroundColor = ['#D35748', '#62B682', '#5C7AF3'];
            typeDistributionChart.data.labels = ['Umum (kg)', 'Organik (kg)', 'Anorganik (kg)'];
            typeDistributionChart.options.plugins.legend.display = true;
            typeDistributionChart.options.cutout = '80%'; // Standard doughnut hole size
        } else {
            typeDistributionChart.data.datasets[0].data = [1]; // One slice to fill the chart
            typeDistributionChart.data.datasets[0].backgroundColor = ['#e0e0e0']; // Light grey for no data
            typeDistributionChart.data.labels = ['No Data Today']; // Changed label for legend
            typeDistributionChart.options.plugins.legend.display = true; // <-- CHANGED: Legend always visible
            typeDistributionChart.options.cutout = '0%'; // Make it a full pie circle to show "no data" better
        }
        typeDistributionChart.update();
    }


    // 4. Update Faculty Performance Chart (Grouped Bar Chart)
    const facultyNames = Object.keys(facultyDataAggregates);

    // Prepare data arrays for each waste type based on facultyDataAggregates
    const totalSampahFacultyData = facultyNames.map(name => facultyDataAggregates[name].total || 0);
    const organikFacultyData = facultyNames.map(name => facultyDataAggregates[name].organik || 0);
    const anorganikFacultyData = facultyNames.map(name => facultyDataAggregates[name].anorganik || 0);
    const umumFacultyData = facultyNames.map(name => facultyDataAggregates[name].umum || 0);


    if (facultyPerformanceChart) {
        // Check if there is any data to display
        const hasFacultyData = facultyNames.length > 0 &&
                               (totalSampahFacultyData.some(val => val > 0) ||
                                organikFacultyData.some(val => val > 0) ||
                                anorganikFacultyData.some(val => val > 0) ||
                                umumFacultyData.some(val => val > 0));

        if (hasFacultyData) {
            facultyPerformanceChart.data.labels = facultyNames;
            facultyPerformanceChart.data.datasets[0].data = totalSampahFacultyData; // Updates the 'Total Sampah Hari Ini' dataset
            facultyPerformanceChart.data.datasets[1].data = organikFacultyData;    // Updates the 'Sampah Organik' dataset
            facultyPerformanceChart.data.datasets[2].data = anorganikFacultyData; // Updates the 'Sampah Anorganik' dataset
            facultyPerformanceChart.data.datasets[3].data = umumFacultyData;      // Updates the 'Sampah Umum' dataset

            facultyPerformanceChart.options.plugins.legend.display = true; // <-- REMAINS TRUE: Always show legend
            facultyPerformanceChart.options.scales.x.stacked = false; // Ensure bars are grouped (not stacked)
            facultyPerformanceChart.options.scales.y.stacked = false; // Ensure bars are grouped (not stacked)
        } else {
            // Handle no data for faculty performance - clear all datasets
            facultyPerformanceChart.data.labels = ['No Data Available']; // Can be a single "No Data" label
            facultyPerformanceChart.data.datasets[0].data = [0];
            facultyPerformanceChart.data.datasets[1].data = [0];
            facultyPerformanceChart.data.datasets[2].data = [0];
            facultyPerformanceChart.data.datasets[3].data = [0];

            facultyPerformanceChart.options.plugins.legend.display = true; // <-- CHANGED: Legend always visible
            // You might add a custom "No Data" plugin here for text overlay if desired,
            // similar to the Doughnut chart's noDataDoughnutText plugin.
        }
        facultyPerformanceChart.update();
    }
}


// --- DOMContentLoaded Listener ---
document.addEventListener('DOMContentLoaded', function() {
    const firebaseConfig = window.firebaseConfig;

    if (firebaseConfig) {
        initializeFirebase(firebaseConfig);
        updateCurrentDate('current-date');

        initWeeklyTrendChart('weeklyTrendChart');
        initTypeDistributionChart('typeDistributionChart');
        initFacultyPerformanceChart('facultyPerformanceChart');

        // This call relies on firebaseService.js to correctly aggregate and return data
        setupGlobalSampahListener(updateDashboardSpecificUI);

    } else {
        console.error("Firebase configuration not found in window.firebaseConfig. Check your Blade file.");
    }
});