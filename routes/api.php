<?php

use Illuminate\Http\Request;
use Illuminate\Support\Facades\Route;
use App\Http\Controllers\SampahController; // Pastikan ini ada

/*
|--------------------------------------------------------------------------
| API Routes
|--------------------------------------------------------------------------
|
| Rute-rute ini biasanya stateless dan tidak menggunakan session state.
| Prefix '/api' ditambahkan secara otomatis oleh Laravel.
|
*/

// Rute BARU untuk menerima data sampah dari ESP32 via POST
Route::post('/receive-sampah', [SampahController::class, 'receiveDataFromESP32']);

// Rute yang sudah ada untuk mengambil data (opsional, bisa dipindah ke sini juga)
// Route::get('/sampah-data', [SampahController::class, 'getData']);
// Route::get('/sampah-export', [SampahController::class, 'exportData']);

// Contoh rute default (jika ada)
// Route::middleware('auth:sanctum')->get('/user', function (Request $request) {
//     return $request->user();
// });