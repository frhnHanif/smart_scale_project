<?php

use Illuminate\Support\Facades\Route;
use App\Http\Controllers\SampahController; // Pastikan ini ada

/*
|--------------------------------------------------------------------------
| Rute API
|--------------------------------------------------------------------------
|
| Rute ini akan dipanggil oleh JavaScript (frontend) kita.
|
*/

// Rute ini akan kita ubah untuk Paginasi
Route::get('/api/sampah-data', [SampahController::class, 'getData']);

// Rute BARU untuk mengambil SEMUA data (tanpa pagination) untuk Ekspor Excel
Route::get('/api/sampah-export', [SampahController::class, 'exportData']);


/*
|--------------------------------------------------------------------------
| Rute Halaman (Views)
|--------------------------------------------------------------------------
*/
Route::get('/', function () {
    return redirect('/dashboard');
});

Route::get('/dashboard', function () {
    return view('dashboard');
});

Route::get('/fakultas', function () {
    return view('fakultas');
});

Route::get('/analitik', function () {
    return view('analitik');
});

Route::get('/laporan', function () {
    return view('laporan');
});