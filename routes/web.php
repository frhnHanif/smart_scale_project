<?php

use Illuminate\Support\Facades\Route;

// Arahkan URL utama langsung ke /dashboard
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