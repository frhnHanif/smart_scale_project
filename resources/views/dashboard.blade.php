<!DOCTYPE html>
<html lang="id">

<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>EcoScale - Dashboard</title>

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

    {{-- Kontainer Utama --}}
    <div class="container mx-auto p-4 sm:p-6 lg:p-8">

        {{-- Header Component --}}
        <x-header></x-header>

        {{-- Statistik Cards --}}
        <x-cards-stats></x-cards-stats>

        {{-- Navbar Component --}}
        <x-navbar></x-navbar>

        {{-- Ringkasan Sampah --}}
<div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">

    {{-- Card 1: Total Sampah Hari Ini --}}
    <div class="relative bg-white p-6 rounded-xl shadow-md overflow-hidden">
        {{-- Colored Border Line (Top - Green) --}}
        <div class="absolute top-0 left-0 w-full h-1.5" style="background-color: #447F40; border-top-left-radius: 0.75rem; border-top-right-radius: 0.75rem;"></div>

        <h3 class="text-sm font-medium text-gray-500 mt-2">Total Sampah Hari Ini</h3> {{-- Added mt-2 to push content down from border --}}
        <p class="text-3xl font-bold mt-2" style="color: #447F40;"><span id="total-sampah">0</span> kg</p>
    </div>

    {{-- Card 2: Sampah Organik --}}
    <div class="relative bg-white p-6 rounded-xl shadow-md overflow-hidden">
        {{-- Colored Border Line (Top - Green-ish) --}}
        <div class="absolute top-0 left-0 w-full h-1.5" style="background-color: #62B682; border-top-left-radius: 0.75rem; border-top-right-radius: 0.75rem;"></div>

        <h3 class="text-sm font-medium text-gray-500 mt-2">Sampah Organik</h3>
        <p class="text-3xl font-bold mt-2" style="color: #62B682;"><span id="total-organik">0</span> kg</p>
    </div>

    {{-- Card 3: Sampah Anorganik --}}
    <div class="relative bg-white p-6 rounded-xl shadow-md overflow-hidden">
        {{-- Colored Border Line (Top - Blue-ish) --}}
        <div class="absolute top-0 left-0 w-full h-1.5" style="background-color: #5C7AF3; border-top-left-radius: 0.75rem; border-top-right-radius: 0.75rem;"></div>

        <h3 class="text-sm font-medium text-gray-500 mt-2">Sampah Anorganik</h3>
        <p class="text-3xl font-bold mt-2" style="color: #5C7AF3;"><span id="total-anorganik">0</span> kg</p>
    </div>

    {{-- Card 4: Sampah Umum --}}
    <div class="relative bg-white p-6 rounded-xl shadow-md overflow-hidden">
        {{-- Colored Border Line (Top - Red-ish) --}}
        <div class="absolute top-0 left-0 w-full h-1.5" style="background-color: #D35748; border-top-left-radius: 0.75rem; border-top-right-radius: 0.75rem;"></div>

        <h3 class="text-sm font-medium text-gray-500 mt-2">Sampah Umum</h3>
        <p class="text-3xl font-bold mt-2" style="color: #D35748;"><span id="total-umum">0</span> kg</p>
    </div>
</div>

        {{-- Konten Grafik --}}
        <div class="grid grid-cols-1 lg:grid-cols-5 gap-8">
            <div class="lg:col-span-3 bg-white p-6 rounded-xl shadow-md">
                <h3 class="font-semibold text-2xl" style="color: #447F40;">Tren Sampah Mingguan</h3>
                <p class="text-sm mb-4 text-gray-500">Perbandingan produksi sampah harian dengan target</p>
                <canvas id="weeklyTrendChart"></canvas>
            </div>
            <div class="lg:col-span-2 bg-white p-6 rounded-xl shadow-md">
                <h3 class="font-semibold text-2xl" style="color: #447F40;">Distribusi Jenis Sampah</h3>
                <p class="text-sm mb-4 text-gray-500">Komposisi sampah hari ini</p>
                <div class="max-h-80 flex items-center justify-center">
                    <canvas id="typeDistributionChart"></canvas>
                </div>
            </div>
        </div>
         <div class="grid grid-cols-1 lg:grid-cols-5 gap-8">
            
         </div>
        <div class="bg-white p-6 rounded-xl shadow-md my-8">
            <h3 class="font-semibold text-2xl" style="color: #447F40;">Frekuensi Fakultas</h3>
            <p class="text-sm mb-4 text-gray-500">Frekuensi pembuangan sampah di tiap fakultas</p>
            {{-- CHANGED HEIGHT FROM h-80 TO h-64 --}}
            <div class="h-64">
                <canvas id="facultyPerformanceChart"></canvas>
            </div>
        </div>
    </div>

    {{-- TODO: Ganti dengan konfigurasi Firebase proyek  --}}
    {{-- Script Js untuk Firebase --}}
    <script>
        window.firebaseConfig = @json(config('services.firebase'));
    </script>

    {{-- Script Js khusus Dashboard --}}
    <script type="module" src="{{ asset('js/dashboard.js') }}"></script>

</body>

</html>