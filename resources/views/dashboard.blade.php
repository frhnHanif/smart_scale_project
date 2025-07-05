<!DOCTYPE html>
<html lang="id">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Dashboard Monitoring Sampah</title>
    
    <!-- Memuat Tailwind CSS via CDN untuk kemudahan -->
    <script src="https://cdn.tailwindcss.com"></script>
    
    <!-- Memuat Chart.js untuk grafik -->
    <script src="https://cdn.jsdelivr.net/npm/chart.js"></script>
    
    <!-- Memuat Google Fonts (Inter) -->
    <link rel="preconnect" href="https://fonts.googleapis.com">
    <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
    <link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800&display=swap" rel="stylesheet">
    
    <style>
        /* Mengaplikasikan font Inter ke seluruh halaman */
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
            <h1 class="text-3xl font-bold text-gray-900">Nama Alat</h1>
            <p class="text-md text-gray-600 mt-1">Monitoring sampah berbasis IoT untuk kampus hijau Universitas Diponegoro</p>
            <p class="text-sm text-gray-400 mt-2">Jumat, 4 Juli 2024</p>
        </header>

        <!-- Kartu Statistik -->
        <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
            <!-- Kartu 1: Total Sampah -->
            <div class="bg-white p-6 rounded-xl shadow-md">
                <h3 class="text-sm font-medium text-gray-500">Total Sampah Hari Ini</h3>
                <p class="text-3xl font-bold mt-2">231.7 kg</p>
            </div>
            <!-- Kartu 2: Sampah Organik -->
            <div class="bg-white p-6 rounded-xl shadow-md">
                <h3 class="text-sm font-medium text-gray-500">Sampah Organik</h3>
                <p class="text-3xl font-bold mt-2">231.7 kg</p>
            </div>
            <!-- Kartu 3: Sampah Anorganik -->
            <div class="bg-white p-6 rounded-xl shadow-md">
                <h3 class="text-sm font-medium text-gray-500">Sampah Anorganik</h3>
                <p class="text-3xl font-bold mt-2">231.7 kg</p>
            </div>
            <!-- Kartu 4: Sampah Umum -->
            <div class="bg-white p-6 rounded-xl shadow-md">
                <h3 class="text-sm font-medium text-gray-500">Sampah Umum</h3>
                <p class="text-3xl font-bold mt-2">231.7 kg</p>
            </div>
        </div>

        <!-- Navigasi Tab -->
        <div class="border-b border-gray-200 mb-6">
            <nav class="-mb-px flex space-x-8" aria-label="Tabs">
                <a href="#" class="border-teal-500 text-teal-600 whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm">
                    Overview
                </a>
                <a href="#" class="border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300 whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm">
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

        <!-- Konten Grafik -->
        <div class="grid grid-cols-1 lg:grid-cols-5 gap-8">
            <!-- Grafik Tren Mingguan (lebih besar) -->
            <div class="lg:col-span-3 bg-white p-6 rounded-xl shadow-md">
                <h3 class="font-semibold text-lg mb-4">Tren Sampah Mingguan</h3>
                <canvas id="weeklyTrendChart"></canvas>
            </div>
            <!-- Grafik Distribusi (lebih kecil) -->
            <div class="lg:col-span-2 bg-white p-6 rounded-xl shadow-md">
                <h3 class="font-semibold text-lg mb-4">Distribusi Jenis Sampah</h3>
                <div class="max-h-80 flex items-center justify-center">
                    <canvas id="typeDistributionChart"></canvas>
                </div>
            </div>
        </div>

    </div>

    <script>
        // Data dan konfigurasi untuk grafik
        document.addEventListener('DOMContentLoaded', function () {
            
            // 1. Grafik Garis: Tren Sampah Mingguan
            const ctxLine = document.getElementById('weeklyTrendChart').getContext('2d');
            new Chart(ctxLine, {
                type: 'line',
                data: {
                    labels: ['Sen', 'Sel', 'Rab', 'Kam', 'Jum', 'Sab', 'Min'],
                    datasets: [{
                        label: 'Berat Sampah (kg)',
                        data: [220, 240, 210, 250, 225, 140, 90], // Data contoh
                        borderColor: '#14b8a6', // Warna teal-500
                        backgroundColor: 'rgba(20, 184, 166, 0.1)',
                        fill: true,
                        tension: 0.4, // Membuat garis lebih melengkung
                        pointBackgroundColor: '#14b8a6',
                        pointBorderColor: '#fff',
                        pointHoverBackgroundColor: '#fff',
                        pointHoverBorderColor: '#14b8a6'
                    }]
                },
                options: {
                    responsive: true,
                    maintainAspectRatio: true,
                    scales: {
                        y: {
                            beginAtZero: true,
                            max: 280 // Sesuai gambar
                        }
                    },
                    plugins: {
                        legend: {
                            display: false // Sembunyikan legenda sesuai gambar
                        }
                    }
                }
            });

            // 2. Grafik Pai: Distribusi Jenis Sampah
            const ctxPie = document.getElementById('typeDistributionChart').getContext('2d');
            new Chart(ctxPie, {
                type: 'pie',
                data: {
                    labels: ['Umum', 'Organik', 'Anorganik'],
                    datasets: [{
                        data: [62.5, 25, 12.5], // Data contoh dalam persen
                        backgroundColor: [
                            '#5eead4', // Teal-300
                            '#14b8a6', // Teal-500
                            '#0f766e', // Teal-700
                        ],
                        hoverOffset: 4
                    }]
                },
                options: {
                    responsive: true,
                    maintainAspectRatio: true,
                    plugins: {
                        legend: {
                            position: 'bottom', // Posisikan legenda di bawah
                        }
                    }
                }
            });
        });
    </script>

</body>
</html>
