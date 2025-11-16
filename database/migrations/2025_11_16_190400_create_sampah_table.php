<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Jalankan migrasi.
     * Membuat skema tabel 'sampah' yang SANGAT SPESIFIK 
     * dan cocok dengan logika Model/Controller yang sudah ada.
     */
    public function up(): void
    {
        // Selalu hapus tabel sebelum membuat ulang saat menggunakan migrate:fresh
        Schema::dropIfExists('sampah');

        Schema::create('sampah', function (Blueprint $table) {
            // 1. id (Primary, bigint, unsigned, auto_increment)
            $table->id(); 

            // 2. berat (Menggantikan 'berat_kg') - Sesuai Controller
            $table->double('berat');

            // 3. jenis - Sesuai Controller & Model
            $table->string('jenis', 50)->index();

            // 4. fakultas (Menggantikan 'fakultas_kode') - Sesuai Controller
            $table->string('fakultas', 10)->nullable()->index();

            // 5. timestamp (Menggantikan 'created_at') - Sesuai Controller & Model
            // Kolom ini akan menjadi kolom waktu pencatatan.
            $table->timestamp('timestamp')->nullable()->index();
        });
    }

    /**
     * Batalkan migrasi (rollback).
     */
    public function down(): void
    {
        Schema::dropIfExists('sampah');
    }
};