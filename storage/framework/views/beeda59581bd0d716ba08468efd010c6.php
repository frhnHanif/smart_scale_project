<!DOCTYPE html>
<html lang="id">

<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>EcoScale - Dashboard</title>

    
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
        
        /* Connection status styles only */
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
        /* Tambahkan status error untuk konsistensi dengan JS */
        .status-error { background-color: #EF4444; }
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

        
        <div class="grid grid-cols-1 lg:grid-cols-5 gap-8 mb-8">
            <div class="lg:col-span-3 bg-white p-6 rounded-xl shadow-md">
                <h3 class="font-semibold text-2xl" style="color: #447F40;">Tren Sampah Mingguan</h3>
                <p class="text-sm mb-4 text-gray-500">Perbandingan produksi sampah harian dengan target</p>
                <canvas id="weeklyTrendChart"></canvas>
            </div>
            
            <div class="lg:col-span-2 bg-white p-6 rounded-xl shadow-md flex flex-col">
                <div class="flex flex-row justify-between items-start">
                    <div>
                        <h3 class="font-semibold text-2xl" style="color: #447F40;">Distribusi Jenis Sampah</h3>
                        <p class="text-sm mb-4 text-gray-500">Komposisi sampah hari ini</p>
                    </div>
                    <button id="refreshData" class="text-sm bg-white px-3 py-2 rounded-lg shadow-md text-green-600 hover:text-green-700 font-medium transition-colors">
                        Refresh Data
                    </button>
                </div>
                
                <div class="flex-grow flex items-center justify-center my-4"
                    style="max-height: 250px; min-height: 200px;">
                    <canvas id="typeDistributionChart"></canvas>
                </div>

                
                <div class="mt-auto">
                    
                    <div class="text-center mb-4 border-t pt-4">
                        <h4 class="text-sm font-medium text-gray-500">Total Sampah Hari Ini</h4>
                        <p class="text-2xl font-bold" style="color: #447F40;"><span id="total-sampah">0</span> kg</p>
                    </div>
                    
                    <div class="grid grid-cols-3 gap-4 text-center">
                        <div>
                            <h4 class="text-sm font-medium text-gray-500">Organik</h4>
                            <p class="text-xl font-bold" style="color: #62B682;"><span id="total-organik">0</span> kg
                            </p>
                        </div>
                        <div>
                            <h4 class="text-sm font-medium text-gray-500">Anorganik</h4>
                            <p class="text-xl font-bold" style="color: #5C7AF3;"><span id="total-anorganik">0</span> kg
                            </p>
                        </div>
                        <div>
                            <h4 class="text-sm font-medium text-gray-500">Residu</h4>
                            <p class="text-xl font-bold" style="color: #D35748;"><span id="total-residu">0</span> kg</p>
                        </div>
                        <div>
                            <h4 class="text-sm font-medium text-gray-500">Botol</h4>
                            <p class="text-xl font-bold" style="color: #F5C14E;"><span id="total-botol">0</span> kg</p>
                        </div>
                        <div>
                            <h4 class="text-sm font-medium text-gray-500">Kertas</h4>
                            <p class="text-xl font-bold" style="color: #8B5CF6;"><span id="total-kertas">0</span> kg</p>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    </div>

    
    
    
    
    <script src="<?php echo e(asset('js/GlobalMQTT.js')); ?>"></script>
    


    
    <script type="module" src="<?php echo e(asset('js/dashboard.js')); ?>"></script>

</body>

</html><?php /**PATH /home/hanif/Documents/Laravel/smart_scale_project/resources/views/dashboard.blade.php ENDPATH**/ ?>