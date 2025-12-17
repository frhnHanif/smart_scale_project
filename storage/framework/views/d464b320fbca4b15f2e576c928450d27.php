

<!DOCTYPE html>
<html lang="id">

<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>EcoScale - Analitik Mendalam</title>

    
    <link rel="icon" type="image/x-icon" href="<?php echo e(asset('favicon.ico')); ?>">

    
    <script src="https://cdn.tailwindcss.com"></script>
    <script src="https://cdn.jsdelivr.net/npm/chart.js"></script>
    <script src="https://cdn.jsdelivr.net/npm/chartjs-plugin-datalabels@2.0.0"></script>
    <script src="https://cdn.jsdelivr.net/npm/chartjs-adapter-date-fns"></script>
    
    
    
    
    
    <script src="https://cdnjs.cloudflare.com/ajax/libs/paho-mqtt/1.0.2/mqttws31.min.js"></script>
    
    
    <link rel="preconnect" href="https://fonts.googleapis.com">
    <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
    <link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800&display=swap" rel="stylesheet">

    <style>
        body {
            font-family: 'Inter', sans-serif;
            background-color: #F2FCF8;
        }

        /* =================================================================== */
        /* STYLE INI DITAMBAHKAN (Agar indikator status di header tampil) */
        /* =================================================================== */
        .connection-status {
            display: inline-block;
            width: 8px;
            height: 8px;
            border-radius: 50%;
            margin-right: 8px;
        }
        .status-connected { background-color: #10B981; }
        .status-connecting { background-color: #F59E0B; }
        .status-disconnected { background-color: #EF4444; }
        .status-error { background-color: #EF4444; }
        /* =================================================================== */

    </style>
</head>

<body class="text-gray-800">

    <div class="container mx-auto p-4 sm:p-6 lg:p-8">

        
        
        
        <?php if (isset($component)) { $__componentOriginalfd1f218809a441e923395fcbf03e4272 = $component; } ?>
<?php if (isset($attributes)) { $__attributesOriginalfd1f218809a441e923395fcbf03e4272 = $attributes; } ?>
<?php $component = Illuminate\View\AnonymousComponent::resolve(['view' => 'components.header','data' => []] + (isset($attributes) && $attributes instanceof Illuminate\View\ComponentAttributeBag ? $attributes->all() : [])); ?>
<?php $component->withName('header'); ?>
<?php if ($component->shouldRender()): ?>
<?php $__env->startComponent($component->resolveView(), $component->data()); ?>
<?php if (isset($attributes) && $attributes instanceof Illuminate\View\ComponentAttributeBag): ?>
<?php $attributes = $attributes->except(\Illuminate\View\AnonymousComponent::ignoredParameterNames()); ?>
<?php endif; ?>
<?php $component->withAttributes([]); ?> <?php echo $__env->renderComponent(); ?>
<?php endif; ?>
<?php if (isset($__attributesOriginalfd1f218809a441e923395fcbf03e4272)): ?>
<?php $attributes = $__attributesOriginalfd1f218809a441e923395fcbf03e4272; ?>
<?php unset($__attributesOriginalfd1f218809a441e923395fcbf03e4272); ?>
<?php endif; ?>
<?php if (isset($__componentOriginalfd1f218809a441e923395fcbf03e4272)): ?>
<?php $component = $__componentOriginalfd1f218809a441e923395fcbf03e4272; ?>
<?php unset($__componentOriginalfd1f218809a441e923395fcbf03e4272); ?>
<?php endif; ?>
        <?php if (isset($component)) { $__componentOriginal4546b78580f6745ef52d45a2c7626972 = $component; } ?>
<?php if (isset($attributes)) { $__attributesOriginal4546b78580f6745ef52d45a2c7626972 = $attributes; } ?>
<?php $component = App\View\Components\CardsStats::resolve([] + (isset($attributes) && $attributes instanceof Illuminate\View\ComponentAttributeBag ? $attributes->all() : [])); ?>
<?php $component->withName('cards-stats'); ?>
<?php if ($component->shouldRender()): ?>
<?php $__env->startComponent($component->resolveView(), $component->data()); ?>
<?php if (isset($attributes) && $attributes instanceof Illuminate\View\ComponentAttributeBag): ?>
<?php $attributes = $attributes->except(\App\View\Components\CardsStats::ignoredParameterNames()); ?>
<?php endif; ?>
<?php $component->withAttributes([]); ?> <?php echo $__env->renderComponent(); ?>
<?php endif; ?>
<?php if (isset($__attributesOriginal4546b78580f6745ef52d45a2c7626972)): ?>
<?php $attributes = $__attributesOriginal4546b78580f6745ef52d45a2c7626972; ?>
<?php unset($__attributesOriginal4546b78580f6745ef52d45a2c7626972); ?>
<?php endif; ?>
<?php if (isset($__componentOriginal4546b78580f6745ef52d45a2c7626972)): ?>
<?php $component = $__componentOriginal4546b78580f6745ef52d45a2c7626972; ?>
<?php unset($__componentOriginal4546b78580f6745ef52d45a2c7626972); ?>
<?php endif; ?>
        <?php if (isset($component)) { $__componentOriginalb9eddf53444261b5c229e9d8b9f1298e = $component; } ?>
<?php if (isset($attributes)) { $__attributesOriginalb9eddf53444261b5c229e9d8b9f1298e = $attributes; } ?>
<?php $component = App\View\Components\Navbar::resolve([] + (isset($attributes) && $attributes instanceof Illuminate\View\ComponentAttributeBag ? $attributes->all() : [])); ?>
<?php $component->withName('navbar'); ?>
<?php if ($component->shouldRender()): ?>
<?php $__env->startComponent($component->resolveView(), $component->data()); ?>
<?php if (isset($attributes) && $attributes instanceof Illuminate\View\ComponentAttributeBag): ?>
<?php $attributes = $attributes->except(\App\View\Components\Navbar::ignoredParameterNames()); ?>
<?php endif; ?>
<?php $component->withAttributes([]); ?> <?php echo $__env->renderComponent(); ?>
<?php endif; ?>
<?php if (isset($__attributesOriginalb9eddf53444261b5c229e9d8b9f1298e)): ?>
<?php $attributes = $__attributesOriginalb9eddf53444261b5c229e9d8b9f1298e; ?>
<?php unset($__attributesOriginalb9eddf53444261b5c229e9d8b9f1298e); ?>
<?php endif; ?>
<?php if (isset($__componentOriginalb9eddf53444261b5c229e9d8b9f1298e)): ?>
<?php $component = $__componentOriginalb9eddf53444261b5c229e9d8b9f1298e; ?>
<?php unset($__componentOriginalb9eddf53444261b5c229e9d8b9f1298e); ?>
<?php endif; ?>
        
        
        <div class="mb-6">
            <h2 class="font-bold text-3xl" style="color: #447F40;">Analisis Mendalam</h2>
            <p class="text-gray-500">Insight dari data tren dan komparasi EcoScale.</p>
        </div>


        
        
        
        <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-6">
            
            <div class="bg-white p-6 rounded-xl shadow-md flex flex-col justify-between">
                <div>
                    <h4 class="font-semibold text-gray-500">Potensi Ekonomi Daur Ulang</h4>
                    <p class="text-3xl font-bold text-green-600" id="potensi-ekonomi-value">Rp 0</p>
                </div>
                <p class="text-xs text-gray-400 mt-2">Estimasi dari sampah anorganik (Bulan Ini).</p>
            </div>

            
            <div class="bg-white p-6 rounded-xl shadow-md flex flex-col justify-between">
                <div>
                    <h4 class="font-semibold text-gray-500">Pengurangan Emisi Karbon</h4>
                    <p class="text-3xl font-bold text-blue-500" id="emisi-karbon-value">0 kg CO₂e</p>
                </div>
                <p class="text-xs text-gray-400 mt-2">Estimasi emisi yang dihindari (Bulan Ini).</p>
            </div>

            
            <div class="bg-white p-6 rounded-xl shadow-md lg:col-span-2">
               <h4 class="font-semibold text-gray-500 mb-2">Progres Target Pengurangan Sampah Bulan Ini</h4>
               <div class="w-full bg-gray-200 rounded-full h-6">
                   <div id="progres-bar-fill" class="bg-yellow-400 h-6 text-xs font-medium text-blue-800 text-center p-1 leading-none rounded-full" style="width: 0%">
                       <span id="progres-bar-text">0%</span>
                   </div>
               </div>
               <p class="text-center text-sm text-gray-500 mt-2" id="progres-bar-label">0 kg / 500 kg</p>
            </div>
        </div>


        
        
        
        <div class="grid grid-cols-1 lg:grid-cols-2 gap-6">

            
            <div class="lg:col-span-2 bg-white p-6 rounded-xl shadow-md">
                <h3 class="font-semibold text-xl mb-1">Analisis Harian Fakultas</h3>
                <p class="text-sm mb-4 text-gray-500">Perbandingan total sampah hari ini dan persentase pengurangan.</p>
                <div class="h-96">
                    <canvas id="analitikBarChart"></canvas>
                </div>
            </div>
            
            
            <div class="lg:col-span-2 bg-white p-6 rounded-xl shadow-md">
                <h3 class="font-semibold text-xl mb-4">Tren Volume Sampah (7 Hari Terakhir)</h3>
                <div class="h-80">
                    <canvas id="trendChart"></canvas>
                </div>
            </div>

            
            
            

            
            <div class="lg:col-span-2 bg-white p-6 rounded-xl shadow-md">
                <h3 class="font-semibold text-xl mb-4">Distribusi Jenis Sampah (kg)</h3>
                <div class="grid grid-cols-1 md:grid-cols-2 gap-6 h-80">
                    <div class="flex flex-col items-center">
                        <h4 class="font-medium text-gray-600 mb-2">Minggu Ini Berjalan</h4>
                        <div class="relative w-full h-full">
                            <canvas id="distributionChartWeekly"></canvas>
                        </div>
                    </div>
                    <div class="flex flex-col items-center">
                        <h4 class="font-medium text-gray-600 mb-2">Bulan Ini Berjalan</h4>
                        <div class="relative w-full h-full">
                            <canvas id="distributionChartMonthly"></canvas>
                        </div>
                    </div>
                </div>
            </div>

            
            <div class="lg:col-span-2 bg-white p-6 rounded-xl shadow-md">
                <h3 class="font-semibold text-xl mb-4">Komparasi Komposisi Sampah per Fakultas</h3>
                <div class="h-96">
                    <canvas id="facultyStackedChart"></canvas>
                </div>
            </div>
            
            
            <div class="lg:col-span-2 bg-white p-6 rounded-xl shadow-md">
                <h3 class="font-semibold text-xl mb-4">Pola Waktu Pembuangan (Jam Sibuk) Selama 30 Hari Terakhir</h3>
                <div class="h-96">
                    <canvas id="hourlyPatternChart"></canvas>
                </div>
            </div>

            
            <div class="bg-white p-6 rounded-xl shadow-md">
                <h3 class="font-semibold text-xl mb-4">Tren Potensi Ekonomi Bulanan</h3>
                <div class="h-80">
                    <canvas id="monthlyEconomicChart"></canvas>
                </div>
            </div>

            
            <div class="bg-white p-6 rounded-xl shadow-md">
                <h3 class="font-semibold text-xl mb-4">Tren Emisi Karbon Bulanan</h3>
                <div class="h-80">
                    <canvas id="monthlyEmissionChart"></canvas>
                </div>
            </div>

            
            <div class="lg:col-span-2 bg-white p-6 rounded-xl shadow-md">
                <h3 class="font-semibold text-xl mb-4">Tren Pengurangan Sampah Bulanan</h3>
                <div class="h-96">
                    <canvas id="monthlyReductionChart"></canvas>
                </div>
            </div>
            
        </div>
    </div>

    
    
    
    
    
    
    
    
    <script src="<?php echo e(asset('js/GlobalMQTT.js')); ?>"></script>
    


    
    
    
    
    <script type="module">
        import {
            initAnalitikPage
        } from "<?php echo e(asset('js/analitik.js')); ?>";

        // Langsung panggil initAnalitikPage saat DOM siap
        document.addEventListener('DOMContentLoaded', function() {
            initAnalitikPage();
        });
    </script>
    

</body>
</html><?php /**PATH H:\Smart Scale Project\smart_scale_project\resources\views/analitik.blade.php ENDPATH**/ ?>