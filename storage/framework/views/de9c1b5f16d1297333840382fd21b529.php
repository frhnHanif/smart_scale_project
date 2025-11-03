

<header class="text-center mb-8">
    
    <div class="flex items-center justify-center mb-2">
        <img src="<?php echo e(asset('images/ecoscale-icon.png')); ?>" alt="Ikon EcoScale" class="h-10 w-10 mr-3"> 
        <h1 class="text-3xl font-bold" style="color: #447F40;">EcoScale Dashboard</h1>
    </div>

    
    <p class="text-md text-gray-600 mt-1">Monitoring sampah berbasis IoT untuk kampus hijau Universitas Diponegoro</p>
    
    
    <div class="flex items-center justify-center text-sm text-gray-400 mt-2">
        
        <svg class="w-4 h-4 mr-1 text-gray-400" fill="currentColor" viewBox="0 0 20 20" xmlns="http://www.w3.org/2000/svg">
            <path fill-rule="evenodd" d="M5.05 4.05a7 7 0 119.9 9.9L10 18.9l-4.95-4.95a7 7 0 010-9.9zM10 11a2 2 0 100-4 2 2 0 000 4z" clip-rule="evenodd"></path>
        </svg>
        <span>Semarang, Indonesia</span>
        
        
        <span class="mx-2">•</span> 

        
        <svg class="w-4 h-4 mr-1 text-gray-400" fill="currentColor" viewBox="0 0 20 20" xmlns="http://www.w3.org/2000/svg">
            <path fill-rule="evenodd" d="M6 2a1 1 0 00-1 1v1H4a2 2 0 00-2 2v10a2 2 0 002 2h12a2 2 0 002-2V6a2 2 0 00-2-2h-1V3a1 1 0 10-2 0v1H7V3a1 1 0 00-1-1zm0 5a1 1 0 000 2h8a1 1 0 100-2H6z" clip-rule="evenodd"></path>
        </svg>
        
        <span id="current-date"></span>

        
        <span class="mx-2">•</span> 
        <div id="connectionStatus" class="flex items-center text-sm py-2 rounded-lg">
            <span class="connection-status status-disconnected"></span>
            <span id="statusText">MQTT: Disconnected</span>
        </div>

    </div>
</header>
<?php /**PATH C:\laragon\www\smart_scale_project\resources\views/components/header.blade.php ENDPATH**/ ?>