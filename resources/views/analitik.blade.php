{{-- resources/views/analitik.blade.php --}}

<!DOCTYPE html>
<html lang="id">

<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>EcoScale - Analitik</title>

    {{-- Favicon --}}
    <link rel="icon" type="image/x-icon" href="{{ asset('favicon.ico') }}">

    {{-- Tailwind CSS --}}
    <script src="https://cdn.tailwindcss.com"></script>

    {{-- Chart Js (Include if you plan to have charts on this page) --}}
    <script src="https://cdn.jsdelivr.net/npm/chart.js"></script>

    {{-- Google Fonts (Inter) --}}
    <link rel="preconnect" href="https://fonts.googleapis.com">
    <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
    <link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800&display=swap" rel="stylesheet">

    <style>
        body {
            font-family: 'Inter', sans-serif;
            background-color: #F2FCF8; /* Same background as dashboard/fakultas */
        }
        /* You might add specific styles for filter buttons etc. if needed here */
    </style>
</head>

<body class="text-gray-800">

    <div class="container mx-auto p-4 sm:p-6 lg:p-8">

        <x-header></x-header>

        <x-cards-stats></x-cards-stats>

        <x-navbar></x-navbar>

        {{-- Card title --}}
        <div class="lg:col-span-3 bg-white p-6 rounded-xl shadow-md ">
            <h3 class="font-semibold text-2xl" style="color: #447F40;">Analisis Mendalam</h3>
            <p class="text-sm mb-4 text-gray-500">Insight dari data tren EcoScale</p>
            <div class="bg-white p-6 rounded-xl shadow-md my-4 border-2">
                <div style="height: 450px;"> {{-- Set a fixed height for the chart container --}}
                    <canvas id="analitikBarChart"></canvas>
                </div>
            </div>
        </div>
        </div>

    <!-- Inject Firebase Config -->
    <script>
        window.firebaseConfig = @json(config('services.firebase'));
    </script>

    <!-- Load Analitik page specific JavaScript -->
    <script type="module">
        import { initAnalitikPage } from "{{ asset('js/analitik.js') }}";

        document.addEventListener('DOMContentLoaded', function() {
            const firebaseConfig = window.firebaseConfig;

            if (firebaseConfig) {
                initAnalitikPage(firebaseConfig);
            } else {
                console.error("Firebase configuration not found. Cannot initialize Analitik page.");
            }
        });
    </script>


</body>

</html>