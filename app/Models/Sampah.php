<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class Sampah extends Model
{
    use HasFactory;

    /**
     * Nama tabel yang terhubung dengan model ini.
     * Kita pastikan namanya 'sampah' sesuai dengan yang Anda buat.
     */
    protected $table = 'sampah';

    /**
     * Ini SANGAT PENTING.
     * Tabel Anda tidak punya kolom 'created_at' dan 'updated_at' bawaan Laravel.
     * Baris ini memberitahu Laravel untuk tidak mencari kedua kolom tersebut.
     */
    public $timestamps = false;

    /**
     * Kolom-kolom yang boleh diisi jika kita ingin menambah data baru
     * menggunakan model ini nanti.
     */
    protected $fillable = [
        'berat',
        'fakultas',
        'jenis',
        'timestamp',
    ];

    /**
     * Ini opsional tapi bagus:
     * Memberitahu Laravel bahwa kolom 'timestamp' Anda harus diperlakukan
     * sebagai objek Tanggal/Waktu (bukan teks biasa).
     */
    protected $casts = [
        'timestamp' => 'datetime',
    ];
}