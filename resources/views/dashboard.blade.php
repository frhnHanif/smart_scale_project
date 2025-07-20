<!DOCTYPE html>
<html lang="id">

<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>EcoScale - Dashboard</title>

    <link rel="icon" type="image/x-icon" href="{{ asset('favicon.ico') }}">

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

<body style="background-color: #F2FCF8;" class="text-gray-800">

    <!-- Kontainer Utama -->
    <div class="container mx-auto p-4 sm:p-6 lg:p-8">

        <!-- Header -->
        <x-header></x-header>
        <!-- Navigasi Tab -->
        <x-navbar></x-navbar>

        <!-- Kartu Statistik -->
        <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
            <div class="bg-white p-6 rounded-xl shadow-md">
                <h3 class="text-sm font-medium text-gray-500">Total Sampah Hari Ini</h3>
                <p class="text-3xl font-bold mt-2" style="color: #447F40;"><span id="total-sampah">0</span> kg</p>
            </div>
            <div class="bg-white p-6 rounded-xl shadow-md">
                <h3 class="text-sm font-medium text-gray-500">Sampah Organik</h3>
                <p class="text-3xl font-bold mt-2" style="color: #4D55D9;"><span id="total-organik">0</span> kg</p>
            </div>
            <div class="bg-white p-6 rounded-xl shadow-md">
                <h3 class="text-sm font-medium text-gray-500">Sampah Anorganik</h3>
                <p class="text-3xl font-bold mt-2" style="color: #7417CB;"><span id="total-anorganik">0</span> kg</p>
            </div>
            <div class="bg-white p-6 rounded-xl shadow-md">
                <h3 class="text-sm font-medium text-gray-500">Sampah Umum</h3>
                <p class="text-3xl font-bold mt-2" style="color: #936716;"><span id="total-umum">0</span> kg</p>
            </div>
        </div>


        <!-- Konten Grafik -->
        <div class="grid grid-cols-1 lg:grid-cols-5 gap-8">
            <div class="lg:col-span-3 bg-white p-6 rounded-xl shadow-md">
                <h3 class="font-semibold text-2xl" style="color: #447F40;">Tren Sampah Mingguan</h3>
                <p class="text-sm mb-4 text-gray-500">Perbandingan produksi sampah harian dengan target</p>
                <canvas id="weeklyTrendChart"></canvas>
            </div>
            <div class="lg:col-span-2 bg-white p-6 rounded-xl shadow-md">
                <h3 class="font-semibold text-2xl" style="color: #447F40;">Distribusi Jenis Sampah</h1>
                    <p class="text-sm mb-4 text-gray-500"">Komposisi sampah hari ini</p>
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

        const typeDistributionChartCtx = document.getElementById('typeDistributionChart').getContext('2d');
        const typeDistributionChart = new Chart(typeDistributionChartCtx, {
            type: 'pie',
            data: {
                labels: ['Umum (kg)', 'Organik (kg)', 'Anorganik (kg)'],
                datasets: [{
                    data: [1, 1, 1], // Data awal untuk menghindari error
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
