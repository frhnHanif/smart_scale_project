<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Jalankan migrasi.
     * Mengubah skema agar sesuai dengan logika aplikasi yang menggunakan:
     * - 'berat' (bukan 'berat_kg')
     * - 'fakultas' (bukan 'fakultas_kode')
     * - 'timestamp' (bukan 'created_at')
     */
    public function up(): void
    {
        // Pastikan tabel 'sampah' yang lama dihapus atau di-rollback.
        // Jika Anda menggunakan migrate:fresh, langkah ini opsional.
        Schema::dropIfExists('sampah');

        Schema::create('sampah', function (Blueprint $table) {
            // 1. id (Primary, bigint, unsigned, auto_increment)
            $table->id(); 

            // 2. berat (double, No Null) - Menggantikan 'berat_kg'
            $table->double('berat')->comment('Berat sampah dalam kilogram (kg).');

            // 3. jenis (varchar(50), No Null, Index) - Tetap sama
            $table->string('jenis', 50)->index();

            // 4. fakultas (varchar(10), Nullable, Index) - Menggantikan 'fakultas_kode'
            $table->string('fakultas', 10)->nullable()->index();

            // 5. timestamp (timestamp, Nullable, Index) - Menggantikan 'created_at'
            // Ini adalah kolom yang dicari oleh SampahController
            $table->timestamp('timestamp')->nullable()->index();
            
            // 6. updated_at (timestamp, Nullable) - Tetap diperlukan untuk Eloquent jika Anda mau
            // Karena kode Anda hanya menggunakan 'timestamp' (created_at), 
            // kita bisa menggunakan kolom ini sebagai pengganti 'updated_at'
            $table->timestamp('updated_at')->nullable(); 

            // Tambahkan foreign key jika ada tabel 'fakultas'
            // $table->foreign('fakultas')->references('kode')->on('fakultas')->onDelete('set null');
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