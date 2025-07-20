{{-- resources/views/components/header.blade.php --}}

<header class="text-center mb-8">
    {{-- Ikon dan Judul EcoScale --}}
    <div class="flex items-center justify-center mb-2">
        <img src="{{ asset('images/ecoscale-icon.png') }}" alt="Ikon EcoScale" class="h-10 w-10 mr-3"> 
        <h1 class="text-3xl font-bold" style="color: #447F40;">EcoScale Dashboard</h1>
    </div>

    {{-- Deskripsi Singkat --}}
    <p class="text-md text-gray-600 mt-1">Monitoring sampah berbasis IoT untuk kampus hijau Universitas Diponegoro</p>
    
    {{-- Lokasi dan Tanggal --}}
    <div class="flex items-center justify-center text-sm text-gray-400 mt-2">
        {{-- Ikon Lokasi (menggunakan SVG agar ringan dan fleksibel) --}}
        <svg class="w-4 h-4 mr-1 text-gray-400" fill="currentColor" viewBox="0 0 20 20" xmlns="http://www.w3.org/2000/svg">
            <path fill-rule="evenodd" d="M5.05 4.05a7 7 0 119.9 9.9L10 18.9l-4.95-4.95a7 7 0 010-9.9zM10 11a2 2 0 100-4 2 2 0 000 4z" clip-rule="evenodd"></path>
        </svg>
        <span>Semarang, Indonesia</span>
        
        {{-- Pemisah (titik tengah) --}}
        <span class="mx-2">•</span> 

        {{-- Ikon Tanggal (juga pakai SVG agar fleksibel) --}}
        <svg class="w-4 h-4 mr-1 text-gray-400" fill="currentColor" viewBox="0 0 20 20" xmlns="http://www.w3.org/2000/svg">
            <path fill-rule="evenodd" d="M6 2a1 1 0 00-1 1v1H4a2 2 0 00-2 2v10a2 2 0 002 2h12a2 2 0 002-2V6a2 2 0 00-2-2h-1V3a1 1 0 10-2 0v1H7V3a1 1 0 00-1-1zm0 5a1 1 0 000 2h8a1 1 0 100-2H6z" clip-rule="evenodd"></path>
        </svg>
        {{-- Tanggal akan diisi secara otomatis oleh JavaScript --}}
        <span id="current-date"></span>
    </div>
</header>
