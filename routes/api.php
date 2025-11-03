<?php

use Illuminate\Http\Request;
use Illuminate\Support\Facades\Route;
use App\Http\Controllers\SampahController;

// Existing routes
Route::post('/receive-sampah', [SampahController::class, 'receiveDataFromESP32']);

// NEW REAL-TIME ROUTES
Route::get('/latest-sampah', [SampahController::class, 'getLatestData']);
Route::get('/dashboard-stats', [SampahController::class, 'getDashboardStats']);
Route::get('/mqtt-config', [SampahController::class, 'getMqttConfig']);

// Existing data routes
Route::get('/sampah-data', [SampahController::class, 'getData']);
Route::get('/sampah-export', [SampahController::class, 'exportData']);

Route::get('/test-connection', function() {
    return response()->json([
        'message' => 'API is working!',
        'timestamp' => now(),
        'ip' => request()->ip()
    ]);
});