{{-- resources/views/components/navbar.blade.php --}}

<div class="border-b border-gray-200 mb-6">
    <nav class="-mb-px flex flex-wrap justify-center sm:justify-start space-x-4 sm:space-x-8" aria-label="Tabs">

        {{-- Overview Tab --}}
        <a href="/" {{-- The href is still '/', as this is the user-friendly entry point --}}
            class="group inline-flex items-center px-1 py-4 border-b-2 text-sm font-medium
                   {{ request()->is('dashboard') ? 'border-teal-500 text-teal-600' : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300' }}
                   transition-colors duration-200 ease-in-out">
            {{-- Icon: Home/Overview --}}
            <svg class="mr-2 h-5 w-5 {{ request()->is('dashboard') ? 'text-teal-500 group-hover:text-teal-600' : 'text-gray-400 group-hover:text-gray-500' }} transition-colors duration-200 ease-in-out" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
                <path stroke-linecap="round" stroke-linejoin="round" d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m0 0l-7 7m7-7v10a1 1 0 01-1 1h-3m-6-9H9M9 5h6" />
            </svg>
            <span>Overview</span>
        </a>

        {{-- Fakultas Tab --}}
        <a href="/fakultas"
            class="group inline-flex items-center px-1 py-4 border-b-2 text-sm font-medium
                   {{ request()->is('fakultas') ? 'border-teal-500 text-teal-600' : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300' }}
                   transition-colors duration-200 ease-in-out">
            {{-- Icon: Academic Cap (for faculties) --}}
            <svg class="mr-2 h-5 w-5 {{ request()->is('fakultas') ? 'text-teal-500 group-hover:text-teal-600' : 'text-gray-400 group-hover:text-gray-500' }} transition-colors duration-200 ease-in-out" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
                <path stroke-linecap="round" stroke-linejoin="round" d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a2 2 0 00-2-2H8a2 2 0 00-2 2v3m0 0l2 2m0-2l2 2m-2-2l2-2m0 0l2 2m-2-2l2-2m-2 2V5" />
            </svg>
            <span>Fakultas</span>
        </a>

        {{-- Analitik Tab --}}
        <a href="/analitik"
            class="group inline-flex items-center px-1 py-4 border-b-2 text-sm font-medium
                   {{ request()->is('analitik') ? 'border-teal-500 text-teal-600' : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300' }}
                   transition-colors duration-200 ease-in-out">
            {{-- Icon: Chart Bar (for analytics) --}}
            <svg class="mr-2 h-5 w-5 {{ request()->is('analitik') ? 'text-teal-500 group-hover:text-teal-600' : 'text-gray-400 group-hover:text-gray-500' }} transition-colors duration-200 ease-in-out" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
                <path stroke-linecap="round" stroke-linejoin="round" d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
            </svg>
            <span>Analitik</span>
        </a>

        {{-- Laporan Tab --}}
        <a href="/laporan"
            class="group inline-flex items-center px-1 py-4 border-b-2 text-sm font-medium
                   {{ request()->is('laporan') ? 'border-teal-500 text-teal-600' : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300' }}
                   transition-colors duration-200 ease-in-out">
            {{-- Icon: Document Report (for reports) --}}
            <svg class="mr-2 h-5 w-5 {{ request()->is('laporan') ? 'text-teal-500 group-hover:text-teal-600' : 'text-gray-400 group-hover:text-gray-500' }} transition-colors duration-200 ease-in-out" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
                <path stroke-linecap="round" stroke-linejoin="round" d="M9 17v-2m3 2v-4m3 2v-6m2 10H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
            </svg>
            <span>Laporan</span>
        </a>

    </nav>
</div>