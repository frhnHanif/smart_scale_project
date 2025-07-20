<!DOCTYPE html>
<html lang="id">

<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>EcoScale - Fakultas</title>

    {{-- Favicon --}}
    <link rel="icon" type="image/x-icon" href="{{ asset('favicon.ico') }}">

    {{-- Tailwind CSS --}}
    <script src="https://cdn.tailwindcss.com"></script>

    {{-- Chart Js --}}
    <script src="https://cdn.jsdelivr.net/npm/chart.js"></script>

    {{-- Google Fonts (Inter) --}}
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
        {{-- <header class="text-center mb-8">
            <h1 class="text-3xl font-bold" style="color: #447F40;">Performa Fakultas</h1>
            <p class="text-md text-gray-600 mt-1">Monitoring produksi sampah per fakultas berdasarkan periode.</p>
        </header> --}}
        <x-header></x-header>

        {{-- Summary Cards --}}
        <x-cards-stats></x-cards-stats>



        <!-- Navigasi Tab -->
        {{-- <div class="border-b border-gray-200 mb-6">
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
        </div> --}}
        <x-navbar></x-navbar>

        <!-- Tombol Filter -->
        <div class="mb-6 flex justify-center">
            <div class="inline-flex rounded-md shadow-sm" role="group">
                <button type="button" id="btn-today"
                    class="border border-gray-200 rounded-l-lg"> {{-- Initial classes --}}
                    Hari Ini
                </button>
                <button type="button" id="btn-weekly"
                    class="border-y border-r border-gray-200 rounded-r-lg -ml-px"> {{-- Initial classes --}}
                    Mingguan
                </button>
            </div>
        </div>

        <!-- Bagian Leaderboard (Menggantikan Kartu) -->
        <div class="mt-6">
            <div id="leaderboard-container" class="space-y-4">
                <!-- Data leaderboard akan dimuat di sini -->
                <p id="loading-text-leaderboard" class="text-center col-span-full text-gray-500">Memuat data...</p>
            </div>
        </div>

    </div>

    <!-- Firebase SDK -->
    <script>
        window.firebaseConfig = @json(config('services.firebase'));
    </script>

    <script type="module">
        import { initFakultasPage } from "{{ asset('js/fakultas.js') }}";

        // Wait for the DOM to be fully loaded before initializing scripts
        document.addEventListener('DOMContentLoaded', function() {
            const firebaseConfig = window.firebaseConfig;

            if (firebaseConfig) {
                initFakultasPage(firebaseConfig); // Initialize the Fakultas page's leaderboard
            } else {
                console.error("Firebase configuration not found. Cannot initialize Fakultas page.");
            }
        });
    </script>

</body>

</html>
