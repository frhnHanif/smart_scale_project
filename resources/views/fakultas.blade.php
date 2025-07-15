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

<body class="bg-slate-50 text-gray-800">

    <!-- Kontainer Utama -->
    <div class="container mx-auto p-4 sm:p-6 lg:p-8">

        <!-- Header -->
        <header class="text-center mb-8">
            <h1 class="text-3xl font-bold text-gray-900">Data Sampah per Fakultas</h1>
            <p class="text-md text-gray-600 mt-1">Lihat rincian total sampah yang dihasilkan oleh setiap fakultas.</p>
        </header>

        <!-- Navigasi Tab -->
        <div class="border-b border-gray-200 mb-6">
            <nav class="-mb-px flex space-x-8" aria-label="Tabs">
                <a href="/dashboard"
                    class="border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300 whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm">
                    Overview
                </a>
                <a href="/fakultas"
                    class="border-teal-500 text-teal-600 whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm">
                    Fakultas
                </a>
                <a href="#"
                    class="border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300 whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm">
                    Analitik
                </a>
                <a href="#"
                    class="border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300 whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm">
                    Laporan
                </a>
            </nav>
        </div>

        <!-- Tombol Filter -->
        <div class="flex justify-center mb-8">
            <div class="inline-flex rounded-md shadow-sm" role="group">
                <button type="button" id="btn-today"
                    class="filter-btn-active px-4 py-2 text-sm font-medium text-white bg-teal-600 border border-gray-200 rounded-l-lg hover:bg-teal-700">
                    Hari Ini
                </button>
                <button type="button" id="btn-weekly"
                    class="px-4 py-2 text-sm font-medium text-gray-900 bg-white border-t border-b border-gray-200 hover:bg-gray-100 hover:text-teal-700">
                    Mingguan
                </button>
            </div>
        </div>

        <!-- Kontainer untuk Kartu Fakultas -->
        <div id="fakultas-container" class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            <!-- Data fakultas akan dimuat di sini oleh JavaScript -->
            <p id="loading-text" class="text-center col-span-full text-gray-500">Memuat data...</p>
        </div>

    </div>

    <!-- Firebase SDK -->
    <script type="module">
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

        // Ganti dengan konfigurasi Firebase proyek Anda
        const firebaseConfig = @json(config('services.firebase'));

        const app = initializeApp(firebaseConfig);
        const db = getFirestore(app);

        const fakultasContainer = document.getElementById('fakultas-container');
        const loadingText = document.getElementById('loading-text');
        const btnToday = document.getElementById('btn-today');
        const btnWeekly = document.getElementById('btn-weekly');

        let currentFilter = 'today'; // Filter awal
        let unsubscribe; // Untuk menyimpan fungsi listener agar bisa dilepas

        function fetchAndDisplayData(filter) {
            // Hapus listener sebelumnya jika ada
            if (unsubscribe) {
                unsubscribe();
            }

            fakultasContainer.innerHTML =
                '<p id="loading-text" class="text-center col-span-full text-gray-500">Memuat data...</p>';

            const now = new Date();
            let startDate;

            if (filter === 'today') {
                startDate = new Date(now.setHours(0, 0, 0, 0));
            } else { // weekly
                const day = now.getDay();
                const diff = now.getDate() - day + (day === 0 ? -6 : 1);
                startDate = new Date(now.setDate(diff));
                startDate.setHours(0, 0, 0, 0);
            }

            const firebaseStartDate = Timestamp.fromDate(startDate);
            const q = query(collection(db, "sampah"), where("timestamp", ">=", firebaseStartDate));

            unsubscribe = onSnapshot(q, (querySnapshot) => {
                const facultyData = {};

                querySnapshot.forEach(doc => {
                    const data = doc.data();
                    if (!data.fakultas) return; // Lewati jika tidak ada data fakultas

                    const fakultas = data.fakultas;
                    const jenis = data.jenis.toLowerCase();
                    const berat = parseFloat(data.berat) || 0;

                    if (!facultyData[fakultas]) {
                        facultyData[fakultas] = {
                            organik: 0,
                            anorganik: 0,
                            umum: 0,
                            total: 0
                        };
                    }

                    if (jenis === 'organik') facultyData[fakultas].organik += berat;
                    else if (jenis === 'anorganik') facultyData[fakultas].anorganik += berat;
                    else if (jenis === 'umum') facultyData[fakultas].umum += berat;

                    facultyData[fakultas].total += berat;
                });

                renderData(facultyData);
            });
        }

        function renderData(data) {
            fakultasContainer.innerHTML = ''; // Kosongkan kontainer

            if (Object.keys(data).length === 0) {
                fakultasContainer.innerHTML =
                    '<p class="text-center col-span-full text-gray-500">Tidak ada data untuk periode ini.</p>';
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
                    </div>
                `;
                fakultasContainer.innerHTML += cardHTML;
            }
        }

        // Event Listeners untuk Tombol
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

        // Panggil fungsi saat halaman pertama kali dimuat
        fetchAndDisplayData(currentFilter);
    </script>

</body>

</html>
