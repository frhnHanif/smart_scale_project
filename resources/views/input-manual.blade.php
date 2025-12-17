<!DOCTYPE html>
<html lang="id">

<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>EcoScale - Input Manual</title>

    {{-- CSRF Token for AJAX --}}
    <meta name="csrf-token" content="{{ csrf_token() }}">

    {{-- Favicon --}}
    <link rel="icon" type="image/x-icon" href="{{ asset('favicon.ico') }}">

    {{-- Tailwind CSS --}}
    <script src="https://cdn.tailwindcss.com"></script>

    {{-- Paho MQTT Library --}}
    <script src="https://cdnjs.cloudflare.com/ajax/libs/paho-mqtt/1.0.2/mqttws31.min.js"></script>

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

        {{-- Global Summary Cards --}}
        <x-cards-stats></x-cards-stats>

        {{-- Navbar Component --}}
        <x-navbar></x-navbar>

        {{-- Konten Form Input Manual --}}
        <div class="bg-white p-6 sm:p-8 rounded-xl shadow-md max-w-2xl mx-auto">
            <h2 class="font-semibold text-2xl text-center mb-1" style="color: #447F40;">Input Data Sampah Manual</h2>
            <p class="text-sm text-center text-gray-500 mb-6">Masukkan data penimbangan sampah secara manual ke dalam sistem.</p>

            {{-- Placeholder for AJAX response messages --}}
            <div id="response-message" class="mb-4"></div>

            {{-- Form --}}
            <form id="manual-input-form" action="/submit-manual-input" method="POST" class="space-y-6">
                {{-- Input Jenis Sampah --}}
                <div>
                    <label for="jenis_sampah" class="block text-sm font-medium text-gray-700 mb-1">Jenis Sampah</label>
                    <select id="jenis_sampah" name="jenis_sampah" required
                        class="mt-1 block w-full pl-3 pr-10 py-2 text-base border-gray-300 focus:outline-none focus:ring-teal-500 focus:border-teal-500 sm:text-sm rounded-md shadow-sm">
                        <option value="" disabled selected>Pilih jenis sampah...</option>
                        <option value="organik">Organik</option>
                        <option value="anorganik">Anorganik</option>
                        <option value="residu">Residu</option>
                        <option value="botol">Botol</option>
                        <option value="kertas">Kertas</option>
                    </select>
                </div>

                {{-- Input Fakultas --}}
                <div>
                    <label for="fakultas" class="block text-sm font-medium text-gray-700 mb-1">Fakultas</label>
                    <select id="fakultas" name="fakultas" required
                        class="mt-1 block w-full pl-3 pr-10 py-2 text-base border-gray-300 focus:outline-none focus:ring-teal-500 focus:border-teal-500 sm:text-sm rounded-md shadow-sm">
                        <option value="" disabled selected>Pilih fakultas...</option>
                        {{-- Placeholder faculties --}}
                        <option value="FT">Fakultas Teknik</option>
                        <option value="FKM">Fakultas Kesehatan Masyarakat</option>
                        <option value="FK">Fakultas Kedokteran</option>
                        <option value="FEB">Fakultas Ekonomika dan Bisnis</option>
                        <option value="TPST">Tempat Pengolahan Sampah Terpadu</option>
                        <option value="FSM">Fakultas Sains dan Matematika</option>
                        <option value="FIB">Fakultas Ilmu Budaya</option>
                    </select>
                </div>

                {{-- Input Berat --}}
                <div>
                    <label for="berat" class="block text-sm font-medium text-gray-700 mb-1">Berat (kg)</label>
                    <div class="mt-1 relative rounded-md shadow-sm">
                        <input type="number" name="berat" id="berat" required step="0.01" min="0"
                            class="focus:ring-teal-500 focus:border-teal-500 block w-full pl-4 pr-12 sm:text-sm border-gray-300 rounded-md"
                            placeholder="0.00">
                        <div class="absolute inset-y-0 right-0 pr-3 flex items-center pointer-events-none">
                            <span class="text-gray-500 sm:text-sm">kg</span>
                        </div>
                    </div>
                </div>

                {{-- Tombol Submit --}}
                <div class="pt-4">
                    <button type="submit"
                        style="background-color: #447F40;"
                        class="w-full flex justify-center py-3 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white hover:bg-teal-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-teal-500 transition-colors">
                        Simpan Data
                    </button>
                </div>
            </form>
        </div>

    </div>

    <script src="{{ asset('js/GlobalMQTT.js') }}"></script>

    {{-- JS for manual input form --}}
    <script type="module">
        // Import functions from firebaseService
        import { updateGlobalStatCards } from "./js/firebaseService.js";
        
        // Load the input-manual module
        import("./js/input-manual.js");
        
        // Update cards on page load
        document.addEventListener('DOMContentLoaded', function() {
            updateGlobalStatCards();
        });
    </script>

</body>

</html>
