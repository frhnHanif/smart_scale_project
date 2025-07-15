<!DOCTYPE html>
<html lang="id">

<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>EcoScale - Dashboard</title>

    <!-- Memuat Tailwind CSS -->
    <script src="https://cdn.tailwindcss.com"></script>

    <!-- Memuat Chart.js -->
    <script src="https://cdn.jsdelivr.net/npm/chart.js"></script>

    <!-- Memuat Google Fonts (Inter) -->
    <link rel="preconnect" href="https://fonts.googleapis.com">
    <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
    <link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800&display=swap" rel="stylesheet">

    <style>
        body {
            font-family: 'Inter', sans-serif;
        }
    </style>
</head>

<body class="bg-slate-50 text-gray-800">

    <!-- Kontainer Utama -->
    <div class="container mx-auto p-4 sm:p-6 lg:p-8">

        <!-- Header -->
        <header class="text-center mb-8">
            <h1 class="text-3xl font-bold text-gray-900">Eco Scale</h1>
            <p class="text-md text-gray-600 mt-1">Monitoring sampah berbasis IoT untuk kampus hijau Universitas
                Diponegoro</p>
            <p id="current-date" class="text-sm text-gray-400 mt-2"></p>
        </header>

        <!-- Kartu Statistik -->
        <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
            <div class="bg-white p-6 rounded-xl shadow-md">
                <h3 class="text-sm font-medium text-gray-500">Total Sampah Hari Ini</h3>
                <p class="text-3xl font-bold mt-2"><span id="total-sampah">0</span> kg</p>
            </div>
            <div class="bg-white p-6 rounded-xl shadow-md">
                <h3 class="text-sm font-medium text-gray-500">Sampah Organik</h3>
                <p class="text-3xl font-bold mt-2"><span id="total-organik">0</span> kg</p>
            </div>
            <div class="bg-white p-6 rounded-xl shadow-md">
                <h3 class="text-sm font-medium text-gray-500">Sampah Anorganik</h3>
                <p class="text-3xl font-bold mt-2"><span id="total-anorganik">0</span> kg</p>
            </div>
            <div class="bg-white p-6 rounded-xl shadow-md">
                <h3 class="text-sm font-medium text-gray-500">Sampah Umum</h3>
                <p class="text-3xl font-bold mt-2"><span id="total-umum">0</span> kg</p>
            </div>
        </div>

        <!-- Navigasi Tab -->
        <div class="border-b border-gray-200 mb-6">
            <nav class="-mb-px flex space-x-8" aria-label="Tabs">
                <a href="#"
                    class="border-teal-500 text-teal-600 whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm">Overview</a>
                <a href="/fakultas"
                    class="border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300 whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm">Fakultas</a>
                <a href="#"
                    class="border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300 whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm">Analitik</a>
                <a href="#"
                    class="border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300 whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm">Laporan</a>
            </nav>
        </div>

        <!-- Konten Grafik -->
        <div class="grid grid-cols-1 lg:grid-cols-5 gap-8">
            <div class="lg:col-span-3 bg-white p-6 rounded-xl shadow-md">
                <h3 class="font-semibold text-lg mb-4">Tren Sampah Mingguan</h3>
                <canvas id="weeklyTrendChart"></canvas>
            </div>
            <div class="lg:col-span-2 bg-white p-6 rounded-xl shadow-md">
                <h3 class="font-semibold text-lg mb-4">Distribusi Jenis Sampah</h3>
                <div class="max-h-80 flex items-center justify-center">
                    <canvas id="typeDistributionChart"></canvas>
                </div>
            </div>
        </div>
    </div>

    <!-- Firebase SDK -->
    <script type="module">
        // Import fungsi yang diperlukan dari Firebase SDK
        import {
            initializeApp
        } from "https://www.gstatic.com/firebasejs/11.6.1/firebase-app.js";
        import {
            getFirestore,
            collection,
            query,
            where,
            onSnapshot,
            Timestamp
        } from "https://www.gstatic.com/firebasejs/11.6.1/firebase-firestore.js";

        // TODO: Ganti dengan konfigurasi Firebase proyek Anda
        const firebaseConfig = @json(config('services.firebase'));

        // Inisialisasi Firebase
        const app = initializeApp(firebaseConfig);
        const db = getFirestore(app);

        // --- Fungsi untuk memformat tanggal ---
        const today = new Date();
        document.getElementById('current-date').textContent = today.toLocaleDateString('id-ID', {
            weekday: 'long',
            year: 'numeric',
            month: 'long',
            day: 'numeric'
        });

        // --- Inisialisasi Grafik ---
        const weeklyTrendChartCtx = document.getElementById('weeklyTrendChart').getContext('2d');
        const weeklyTrendChart = new Chart(weeklyTrendChartCtx, {
            type: 'line',
            data: {
                labels: ['Sen', 'Sel', 'Rab', 'Kam', 'Jum', 'Sab', 'Min'],
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

        const typeDistributionChartCtx = document.getElementById('typeDistributionChart').getContext('2d');
        const typeDistributionChart = new Chart(typeDistributionChartCtx, {
            type: 'pie',
            data: {
                labels: ['Umum', 'Organik', 'Anorganik'],
                datasets: [{
                    data: [1, 1, 1], // Data awal untuk menghindari error
                    backgroundColor: ['#5eead4', '#14b8a6', '#0f766e'],
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


        // --- Logika untuk mengambil data dari Firestore ---
        document.addEventListener('DOMContentLoaded', function() {
            const startOfToday = new Date();
            startOfToday.setHours(0, 0, 0, 0);
            const firebaseStartOfToday = Timestamp.fromDate(startOfToday);

            const startOfWeek = new Date();
            const day = startOfWeek.getDay();
            const diff = startOfWeek.getDate() - day + (day === 0 ? -6 : 1); // adjust when day is sunday
            startOfWeek.setDate(diff);
            startOfWeek.setHours(0, 0, 0, 0);
            const firebaseStartOfWeek = Timestamp.fromDate(startOfWeek);


            // Query untuk mendapatkan data sampah
            const q = query(collection(db, "sampah"), where("timestamp", ">=", firebaseStartOfWeek));

            // Listener real-time
            onSnapshot(q, (querySnapshot) => {
                let totalOrganik = 0,
                    totalAnorganik = 0,
                    totalUmum = 0;
                let weeklyData = [0, 0, 0, 0, 0, 0, 0]; // [Sen, Sel, Rab, Kam, Jum, Sab, Min]

                querySnapshot.forEach((doc) => {
                    const data = doc.data();
                    const docDate = data.timestamp.toDate();

                    // Kalkulasi untuk kartu statistik (hanya data hari ini)
                    if (docDate >= startOfToday) {
                        if (data.jenis === 'Organik') totalOrganik += data.berat;
                        else if (data.jenis === 'Anorganik') totalAnorganik += data.berat;
                        else if (data.jenis === 'Umum') totalUmum += data.berat;
                    }

                    // Kalkulasi untuk tren mingguan
                    const dayOfWeek = docDate.getDay(); // Minggu=0, Senin=1, ...
                    const index = dayOfWeek === 0 ? 6 : dayOfWeek - 1; // Sesuaikan index array
                    weeklyData[index] += data.berat;
                });

                const totalSampah = totalOrganik + totalAnorganik + totalUmum;

                // Update Tampilan (Kartu Statistik)
                document.getElementById('total-sampah').textContent = totalSampah.toFixed(1);
                document.getElementById('total-organik').textContent = totalOrganik.toFixed(1);
                document.getElementById('total-anorganik').textContent = totalAnorganik.toFixed(1);
                document.getElementById('total-umum').textContent = totalUmum.toFixed(1);

                // Update Grafik Distribusi
                typeDistributionChart.data.datasets[0].data = [totalUmum, totalOrganik, totalAnorganik];
                typeDistributionChart.update();

                // Update Grafik Tren Mingguan
                weeklyTrendChart.data.datasets[0].data = weeklyData;
                weeklyTrendChart.update();
            });
        });
    </script>

</body>

</html>
