// public/js/analitik.js

// Import necessary functions from firebaseService.js
import { initializeFirebase, getFirestoreInstance, updateCurrentDate, setupGlobalSampahListener } from "./firebaseService.js";
// You might also need specific Firestore imports if you do complex queries here
// import { collection, query, onSnapshot, Timestamp } from "https://www.gstatic.com/firebasejs/11.6.1/firebase-firestore.js";

let db; // Firestore instance
let analitikBarChart; // Global variable for the chart instance

/**
 * Initializes the vertical grouped bar chart for Analitik page.
 * @param {string} ctxId - The ID of the canvas element.
 */
function initAnalitikBarChart(ctxId) {
    const ctx = document.getElementById(ctxId)?.getContext('2d');
    if (ctx) {
        analitikBarChart = new Chart(ctx, {
            type: 'bar', // Vertical bar chart
            data: {
                labels: [], // Faculty names
                datasets: [
                    {
                        label: 'Sampah Hari Ini (kg)',
                        data: [],
                        backgroundColor: '#447F40', // Green color
                        borderColor: '#447F40',
                        borderWidth: 1,
                        barPercentage: 0.8, // Control bar thickness
                        categoryPercentage: 0.7 // Control spacing between groups
                    },
                    {
                        label: 'Pengurangan (%)',
                        data: [],
                        backgroundColor: '#5C7AF3', // Blue color
                        borderColor: '#5C7AF3',
                        borderWidth: 1,
                        barPercentage: 0.8,
                        categoryPercentage: 0.7
                    }
                ]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false, // Allow height to be controlled by container
                scales: {
                    x: {
                        beginAtZero: true,
                        title: {
                            display: true,
                            text: 'Fakultas'
                        }
                    },
                    y: {
                        beginAtZero: true,
                        title: {
                            display: true,
                            text: 'Nilai' // Can be 'Berat (kg)' or 'Persentase (%)'
                        }
                    }
                },
                plugins: {
                    legend: {
                        display: true,
                        position: 'top' // Position legend at the top
                    }
                }
            }
        });
        console.log(`DEBUG: Chart '${ctxId}' initialized.`);
    } else {
        console.warn(`DEBUG: Canvas element with ID '${ctxId}' not found for chart initialization.`);
    }
}

/**
 * Updates the Analitik page UI, specifically the bar chart, with data.
 * This function will be passed as a callback to setupGlobalSampahListener.
 * @param {object} data - Aggregated data from firebaseService.js.
 */
function updateAnalitikUI(data) {
    console.log("DEBUG: updateAnalitikUI called. Received data:", data);

    const { facultyDataAggregates } = data;

    const facultyNames = Object.keys(facultyDataAggregates);

    // Prepare data for "Sampah Hari Ini (kg)"
    const sampahHariIniData = facultyNames.map(name => facultyDataAggregates[name].totalBerat || 0);

    // Prepare MOCK data for "Pengurangan (%)"
    // In a real app, you'd calculate this based on historical data.
    const penguranganPercentageData = facultyNames.map((name, index) => {
        // Example: Generate a random percentage between 5% and 30% for demo
        return parseFloat((Math.random() * (30 - 5) + 5).toFixed(1));
    });

    if (analitikBarChart) {
        const hasData = facultyNames.length > 0 && 
                        (sampahHariIniData.some(val => val > 0) || 
                         penguranganPercentageData.some(val => val > 0));

        if (hasData) {
            analitikBarChart.data.labels = facultyNames;
            analitikBarChart.data.datasets[0].data = sampahHariIniData;
            analitikBarChart.data.datasets[1].data = penguranganPercentageData;
            analitikBarChart.options.plugins.legend.display = true; // Ensure legend is visible
        } else {
            // Handle no data state
            analitikBarChart.data.labels = ['No Data Available'];
            analitikBarChart.data.datasets[0].data = [0];
            analitikBarChart.data.datasets[1].data = [0];
            analitikBarChart.options.plugins.legend.display = true; // Keep legend visible even with no data
        }
        analitikBarChart.update();
        console.log("DEBUG: Analitik Bar Chart updated.");
    } else {
        console.warn("DEBUG: analitikBarChart instance is null or undefined.");
    }
}


/**
 * Initializes the Analitik page scripts.
 * This is the main entry point for the Analitik page's JavaScript.
 * @param {object} firebaseConfig - Firebase project configuration.
 */
export function initAnalitikPage(firebaseConfig) {
    console.log("DEBUG: initAnalitikPage called.");

    // 1. Initialize Firebase app and get DB instance
    initializeFirebase(firebaseConfig);
    db = getFirestoreInstance();

    if (!db) {
        console.error("DEBUG ERROR: Firestore DB is not available. Cannot set up Analitik page.");
        return;
    }
    console.log("DEBUG: Firestore DB available in initAnalitikPage.");

    // 2. Update current date in header (if you use x-header component on this page)
    updateCurrentDate('current-date');

    // 3. Initialize the chart(s) specific to this page
    initAnalitikBarChart('analitikBarChart');

    // 4. Setup global data listener and provide callback for this page's UI updates
    //    setupGlobalSampahListener aggregates data and passes it to the provided callback.
    setupGlobalSampahListener(updateAnalitikUI);
    console.log("DEBUG: Global sampah listener setup call initiated for Analitik page.");
}