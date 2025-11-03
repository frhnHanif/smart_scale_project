

<!DOCTYPE html>
<html lang="id">

<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>EcoScale - Fakultas</title>

    
    <link rel="icon" type="image/x-icon" href="<?php echo e(asset('favicon.ico')); ?>">

    
    <script src="https://cdn.tailwindcss.com"></script>

    
    <script src="https://cdn.jsdelivr.net/npm/chart.js"></script>

    
    
    
    
    <script src="https://cdnjs.cloudflare.com/ajax/libs/paho-mqtt/1.0.2/mqttws31.min.js"></script>
    

    
    <link rel="preconnect" href="https://fonts.googleapis.com">
    <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
    <link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800&display=swap" rel="stylesheet">

    <style>
        body {
            font-family: 'Inter', sans-serif;
        }

        .filter-btn {
            @apply px-4 py-2 text-sm font-medium transition-colors duration-200;
        }

        .filter-btn-active {
            @apply bg-teal-600 text-white;
        }
        .filter-btn-active:hover {
            @apply bg-teal-700;
        }

        .filter-btn:not(.filter-btn-active) {
            @apply bg-white text-gray-900;
        }
        .filter-btn:not(.filter-btn-active):hover {
            @apply bg-gray-100 text-teal-700;
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

<body style="background-color: #F2FCF8;" class="text-gray-800">

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

        
        <div class="lg:col-span-3 bg-white p-6 rounded-xl shadow-md ">
            <h3 class="font-semibold text-2xl" style="color: #447F40;">Performa Fakultas</h3>
            <p class="text-sm mb-4 text-gray-500">Monitoring produksi sampah per-fakultas</p>

            <h4 class="font-bold text-lg text-gray-800 mt-8 mb-4">Pengurangan Sampah Tertinggi (%)</h4>
            <div class="flex justify-center mb-6">
                <div class="inline-flex rounded-md shadow-sm" role="group">
                    <button type="button" id="reduction-btn-today" class="filter-btn border border-gray-200 rounded-l-lg">Hari Ini</button>
                    <button type="button" id="reduction-btn-weekly" class="filter-btn border-y border-r border-gray-200 -ml-px">Mingguan</button>
                    <button type="button" id="reduction-btn-monthly" class="filter-btn border border-gray-200 rounded-r-lg -ml-px">Bulanan</button>
                </div>
            </div>
            <div id="reduction-leaderboard-container" class="space-y-4">
                <p id="loading-reduction" class="text-center col-span-full text-gray-500">Memuat data...</p>
            </div>

            <h4 class="font-bold text-lg text-gray-800 mt-8 mb-4">Pencapaian Target Produksi Sampah</h4>
            <div class="flex justify-center mb-6">
                <div class="inline-flex rounded-md shadow-sm" role="group">
                    <button type="button" id="target-btn-today" class="filter-btn border border-gray-200 rounded-l-lg">Hari Ini</button>
                    <button type="button" id="target-btn-weekly" class="filter-btn border-y border-r border-gray-200 -ml-px">Mingguan</button>
                    <button type="button" id="target-btn-monthly" class="filter-btn border border-gray-200 rounded-r-lg -ml-px">Bulanan</button>
                </div>
            </div>
            <div id="target-leaderboard-container" class="space-y-4">
                <p id="loading-target" class="text-center col-span-full text-gray-500">Memuat data...</p>
            </div>
            
        </div>
    </div>

    
    
    
    
    <script src="<?php echo e(asset('js/GlobalMQTT.js')); ?>"></script>
    

    
    <script type="module">
        import {
            initFakultasPage
        } from "<?php echo e(asset('js/fakultas.js')); ?>";

        // Langsung panggil initLaporanPage saat DOM siap,
        // tanpa perlu mengecek firebaseConfig lagi.
        document.addEventListener('DOMContentLoaded', function() {
            initFakultasPage();
        });
    </script>
</body>
</html><?php /**PATH C:\laragon\www\smart_scale_project\resources\views/fakultas.blade.php ENDPATH**/ ?>