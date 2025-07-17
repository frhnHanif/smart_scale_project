<!DOCTYPE html>
<html lang="id">

<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>EcoScale - Fakultas</title>

    <!-- Memuat Tailwind CSS -->
    <script src="https://cdn.tailwindcss.com"></script>

    <!-- Memuat Google Fonts (Inter) -->
    <link rel="preconnect" href="https://fonts.googleapis.com">
    <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
    <link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800&display=swap" rel="stylesheet">

    <style>
        body {
            font-family: 'Inter', sans-serif;
        }

        /* Style untuk tombol filter aktif */
        .filter-btn-active {
            background-color: #0d9488;
            /* teal-600 */
            color: white;
        }
    </style>
</head>

<body style="background-color: #F2FCF8;" class="text-gray-800">

    <!-- Kontainer Utama -->
    <div class="container mx-auto p-4 sm:p-6 lg:p-8">

        <!-- Header -->
        <header class="text-center mb-8">
            <h1 class="text-3xl font-bold" style="color: #447F40;">Data Sampah per Fakultas</h1>
            <p class="text-md text-gray-600 mt-1">Lihat rincian total sampah yang dihasilkan oleh setiap fakultas.</p>
        </header>

        <!-- Navigasi Tab -->
        <div class="border-b border-gray-200 mb-6">
            <nav class="-mb-px flex space-x-8" aria-label="Tabs">
                <a href="/dashboard" class="border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300 whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm">
                    Overview
                </a>
                <a href="/fakultas" class="border-teal-500 text-teal-600 whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm">
                    Fakultas
                </a>
                <a href="#" class="border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300 whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm">
                    Analitik
                </a>
                <a href="#" class="border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300 whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm">
                    Laporan
                </a>
            </nav>
        </div>

        <!-- Tombol Filter -->
        <div class="flex justify-center mb-8">
            <div class="inline-flex rounded-md shadow-sm" role="group">
                <button type="button" id="btn-today" class="filter-btn-active px-4 py-2 text-sm font-medium text-white bg-teal-600 border border-gray-200 rounded-l-lg hover:bg-teal-700">
                    Hari Ini
                </button>
                <button type="button" id="btn-weekly" class="px-4 py-2 text-sm font-medium text-gray-900 bg-white border-t border-b border-gray-200 hover:bg-gray-100 hover:text-teal-700">
                    Mingguan
                </button>
            </div>
        </div>

        <!-- Kontainer untuk Kartu Fakultas -->
        <div id="fakultas-container" class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            <!-- Data kartu fakultas akan dimuat di sini -->
            <p id="loading-text-cards" class="text-center col-span-full text-gray-500">Memuat data kartu...</p>
        </div>

        <!-- Bagian Leaderboard Baru -->
        <div class="mt-12">
            <header class="mb-6">
                <h2 class="text-2xl font-bold" style="color: #447F40;">Performa Fakultas</h2>
                <p class="text-md text-gray-600 mt-1">Monitoring produksi sampah per fakultas.</p>
            </header>
            <div id="leaderboard-container" class="space-y-4">
                <!-- Data leaderboard akan dimuat di sini -->
                <p id="loading-text-leaderboard" class="text-center col-span-full text-gray-500">Memuat data leaderboard...</p>
            </div>
        </div>

    </div>

    <!-- Firebase SDK -->
    <script type="module">
        import { initializeApp } from "https://www.gstatic.com/firebasejs/11.6.1/firebase-app.js";
        import { getFirestore, collection, query, where, onSnapshot, Timestamp } from "https://www.gstatic.com/firebasejs/11.6.1/firebase-firestore.js";

        const firebaseConfig = @json(config('services.firebase'));
        const app = initializeApp(firebaseConfig);
        const db = getFirestore(app);

        const fakultasContainer = document.getElementById('fakultas-container');
        const leaderboardContainer = document.getElementById('leaderboard-container');
        const btnToday = document.getElementById('btn-today');
        const btnWeekly = document.getElementById('btn-weekly');

        // Data target untuk setiap fakultas (bisa dipindah ke database nanti)
        const facultyTargets = {
            'Teknik': 50,
            'Kedokteran': 45,
            'Ekonomika dan Bisnis': 55,
            'Hukum': 35,
            'Ilmu Budaya': 40,
            'Peternakan dan Pertanian': 60
        };
        const colors = ['#2dd4bf', '#38bdf8', '#a78bfa', '#facc15', '#fb923c'];

        let currentFilter = 'today';
        let unsubscribe;

        function fetchAndDisplayData(filter) {
            if (unsubscribe) unsubscribe();

            fakultasContainer.innerHTML = '<p id="loading-text-cards" class="text-center col-span-full text-gray-500">Memuat data kartu...</p>';
            leaderboardContainer.innerHTML = '<p id="loading-text-leaderboard" class="text-center col-span-full text-gray-500">Memuat data leaderboard...</p>';

            const now = new Date();
            let startDate;

            if (filter === 'today') {
                startDate = new Date(now.setHours(0, 0, 0, 0));
            } else { // weekly
                const day = now.getDay();
                const diff = now.getDate() - day + (day === 0 ? -6 : 1);
                startDate = new Date(new Date().setDate(diff));
                startDate.setHours(0, 0, 0, 0);
            }

            const firebaseStartDate = Timestamp.fromDate(startDate);
            const q = query(collection(db, "sampah"), where("timestamp", ">=", firebaseStartDate));

            unsubscribe = onSnapshot(q, (querySnapshot) => {
                const facultyData = {};
                querySnapshot.forEach(doc => {
                    const data = doc.data();
                    if (!data.fakultas) return;
                    const fakultas = data.fakultas;
                    const jenis = data.jenis.toLowerCase();
                    const berat = parseFloat(data.berat) || 0;
                    if (!facultyData[fakultas]) {
                        facultyData[fakultas] = { organik: 0, anorganik: 0, umum: 0, total: 0 };
                    }
                    if (jenis === 'organik') facultyData[fakultas].organik += berat;
                    else if (jenis === 'anorganik') facultyData[fakultas].anorganik += berat;
                    else if (jenis === 'umum') facultyData[fakultas].umum += berat;
                    facultyData[fakultas].total += berat;
                });

                renderCards(facultyData);
                renderLeaderboard(facultyData);
            });
        }

        function renderCards(data) {
            fakultasContainer.innerHTML = '';
            if (Object.keys(data).length === 0) {
                fakultasContainer.innerHTML = '<p class="text-center col-span-full text-gray-500">Tidak ada data untuk periode ini.</p>';
                return;
            }
            for (const fakultas in data) {
                const info = data[fakultas];
                const cardHTML = `
                    <div class="bg-white p-6 rounded-xl shadow-md transform hover:scale-105 transition-transform duration-300">
                        <h3 class="text-xl font-bold text-gray-900 truncate">${fakultas}</h3>
                        <p class="text-3xl font-bold text-teal-600 mt-2">${info.total.toFixed(1)} kg</p>
                        <div class="mt-4 pt-4 border-t border-gray-100 text-sm text-gray-600 space-y-2">
                            <div class="flex justify-between"><span>Organik</span> <span class="font-semibold">${info.organik.toFixed(1)} kg</span></div>
                            <div class="flex justify-between"><span>Anorganik</span> <span class="font-semibold">${info.anorganik.toFixed(1)} kg</span></div>
                            <div class="flex justify-between"><span>Umum</span> <span class="font-semibold">${info.umum.toFixed(1)} kg</span></div>
                        </div>
                    </div>`;
                fakultasContainer.innerHTML += cardHTML;
            }
        }

        function renderLeaderboard(data) {
            leaderboardContainer.innerHTML = '';
            if (Object.keys(data).length === 0) {
                leaderboardContainer.innerHTML = '<p class="text-center col-span-full text-gray-500">Tidak ada data untuk leaderboard.</p>';
                return;
            }

            const sortedFaculties = Object.entries(data)
                .map(([name, values]) => ({ name, ...values }))
                .sort((a, b) => b.total - a.total);

            sortedFaculties.forEach((faculty, index) => {
                const target = facultyTargets[faculty.name] || 50; // Default target 50kg
                const progress = Math.min((faculty.total / target) * 100, 100);
                const color = colors[index % colors.length];

                const leaderboardRowHTML = `
                <div class="bg-white p-4 rounded-xl shadow-md">
                    <div class="flex items-center justify-between">
                        <div class="flex items-center">
                            <span class="w-3 h-3 rounded-full mr-4" style="background-color: ${color};"></span>
                            <span class="font-bold text-lg text-gray-800">${faculty.name}</span>
                        </div>
                        <div class="text-right">
                            <span class="font-semibold text-teal-600">${faculty.total.toFixed(1)} / ${target} kg</span>
                            <span class="text-yellow-500 ml-2">🎗️</span>
                        </div>
                    </div>
                    <div class="mt-3">
                        <div class="w-full bg-gray-200 rounded-full h-2">
                            <div class="h-2 rounded-full" style="width: ${progress}%; background-color: #34495e;"></div>
                        </div>
                        <div class="flex justify-between text-sm text-gray-500 mt-1">
                            <span>Pengurangan: N/A</span>
                            <span>${progress.toFixed(0)}% dari target</span>
                        </div>
                    </div>
                </div>`;
                leaderboardContainer.innerHTML += leaderboardRowHTML;
            });
        }

        btnToday.addEventListener('click', () => {
            currentFilter = 'today';
            btnToday.classList.add('filter-btn-active');
            btnWeekly.classList.remove('filter-btn-active');
            fetchAndDisplayData(currentFilter);
        });

        btnWeekly.addEventListener('click', () => {
            currentFilter = 'weekly';
            btnWeekly.classList.add('filter-btn-active');
            btnToday.classList.remove('filter-btn-active');
            fetchAndDisplayData(currentFilter);
        });

        fetchAndDisplayData(currentFilter);
    </script>

</body>
</html>
