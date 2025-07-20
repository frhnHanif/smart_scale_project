{{-- resources/views/components/global-stats-cards.blade.php --}}

{{-- These are the top-level cards that appear on EVERY page --}}
<div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">

    {{-- Card 1: Total Sampah Hari Ini --}}
    <div class="relative bg-white p-6 rounded-xl shadow-md overflow-hidden">
        {{-- Colored Border Line --}}
        <div class="absolute top-0 left-0 h-full w-1.5 bg-green-500 rounded-l-xl"></div>

        {{-- Icon in top-right (CHANGED TO TRASH ICON) --}}
        <div class="absolute top-4 right-4">
            <svg class="h-6 w-6 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
                <path stroke-linecap="round" stroke-linejoin="round" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
            </svg>
        </div>

        <h3 class="text-sm font-medium text-gray-500 mb-2">Total Sampah Hari Ini</h3>
        <p class="text-3xl font-bold" style="color: #447F40;"><span id="total-sampah-today">0</span> kg</p>
        <p class="text-xs text-gray-400 mt-1">~17% dari target minggu lalu</p>
    </div>

    {{-- Card 2: Fakultas Aktif --}}
    <div class="relative bg-white p-6 rounded-xl shadow-md overflow-hidden">
        {{-- Colored Border Line --}}
        <div class="absolute top-0 left-0 h-full w-1.5 bg-blue-500 rounded-l-xl"></div>
        
        {{-- Icon in top-right --}}
        <div class="absolute top-4 right-4">
            <svg class="h-6 w-6 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
                <path stroke-linecap="round" stroke-linejoin="round" d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a2 2 0 00-2-2H8a2 2 0 00-2 2v3m0 0l2 2m0-2l2 2m-2-2l2-2m0 0l2 2m-2-2l2-2m-2 2V5" />
            </svg>
        </div>

        <h3 class="text-sm font-medium text-gray-500 mb-2">Fakultas Aktif</h3>
        <p class="text-3xl font-bold text-indigo-600"><span id="active-faculties">0</span></p>
        <p class="text-xs text-gray-400 mt-1">Terhubung dengan EcoScale</p>
    </div>

    {{-- Card 3: Rata-rata Pengurangan --}}
    <div class="relative bg-white p-6 rounded-xl shadow-md overflow-hidden">
        {{-- Colored Border Line --}}
        <div class="absolute top-0 left-0 h-full w-1.5 bg-purple-500 rounded-l-xl"></div>
        
        {{-- Icon in top-right --}}
        <div class="absolute top-4 right-4">
            <svg class="h-6 w-6 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
                <path stroke-linecap="round" stroke-linejoin="round" d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
            </svg>
        </div>

        <h3 class="text-sm font-medium text-gray-500 mb-2">Rata-rata Pengurangan</h3>
        <p class="text-3xl font-bold text-purple-600"><span id="avg-reduction">0</span>%</p>
        <p class="text-xs text-gray-400 mt-1">Dibanding bulan lalu</p>
    </div>

    {{-- Card 4: Status Lingkungan --}}
    <div class="relative bg-white p-6 rounded-xl shadow-md overflow-hidden">
        {{-- Colored Border Line --}}
        <div class="absolute top-0 left-0 h-full w-1.5 bg-yellow-500 rounded-l-xl"></div>
        
        {{-- Icon in top-right --}}
        <div class="absolute top-4 right-4">
            <svg class="h-6 w-6 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
                <path stroke-linecap="round" stroke-linejoin="round" d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.007 12.007 0 002.944 12c.047 2.15 1.018 4.086 2.58 5.577A12.007 12.007 0 0012 21.056c2.15-.047 4.086-1.018 5.577-2.58A12.007 12.007 0 0021.056 12a11.955 11.955 0 01-3.04-8.618z" />
            </svg>
        </div>

        <h3 class="text-sm font-medium text-gray-500 mb-2">Status Lingkungan</h3>
        <p class="text-3xl font-bold text-yellow-600"><span id="env-status">Baik</span></p>
        <p class="text-xs text-gray-400 mt-1">Target tercapai 85%</p>
    </div>
</div>