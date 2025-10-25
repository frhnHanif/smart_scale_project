<?php

namespace App\Http\Controllers;

use App\Models\Sampah; // Menggunakan Model 'Sampah'
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Log; // Tambahkan ini untuk logging
use Illuminate\Support\Facades\Validator; // Tambahkan ini untuk validasi

class SampahController extends Controller
{
    /**
     * PERUBAHAN: Fungsi ini sekarang menangani pagination.
     * Ia akan mengambil parameter 'page' dan 'per_page' dari URL.
     */
    public function getData(Request $request)
    {
        // 1. Buat query dasar (SAMA)
        $query = Sampah::query();

        // 2. Terapkan filter (SAMA)
        $query->when($request->input('fakultas'), function ($q, $fakultas) {
            return $q->where('fakultas', $fakultas);
        });
        $query->when($request->input('start_date'), function ($q, $startDate) {
            return $q->whereDate('timestamp', '>=', $startDate);
        });
        $query->when($request->input('end_date'), function ($q, $endDate) {
            return $q->whereDate('timestamp', '<=', $endDate);
        });

        // 3. Ambil jumlah item per halaman dari request, default-nya 25
        $perPage = $request->input('per_page', 25);

        // 4. PERUBAHAN UTAMA:
        // Ganti ->get() menjadi ->paginate()
        // Ini akan secara otomatis mengembalikan JSON dengan
        // info 'current_page', 'last_page', 'total', 'data', dll.
        $data = $query->orderBy('timestamp', 'desc')->paginate($perPage);

        // 5. Kembalikan data JSON yang sudah dipaginasi
        return response()->json($data);
    }

    /**
     * FUNGSI BARU: Untuk rute /api/sampah-export.
     * Fungsi ini mengambil SEMUA data yang cocok (tanpa pagination)
     * untuk file Excel.
     */
    public function exportData(Request $request)
    {
        // 1. Buat query dasar (SAMA)
        $query = Sampah::query();

        // 2. Terapkan filter (SAMA)
        $query->when($request->input('fakultas'), function ($q, $fakultas) {
            return $q->where('fakultas', $fakultas);
        });
        $query->when($request->input('start_date'), function ($q, $startDate) {
            return $q->whereDate('timestamp', '>=', $startDate);
        });
        $query->when($request->input('end_date'), function ($q, $endDate) {
            return $q->whereDate('timestamp', '<=', $endDate);
        });

        // 3. PERBEDAAN UTAMA:
        // Kita tetap menggunakan ->get() untuk mengambil SEMUA data
        $data = $query->orderBy('timestamp', 'desc')->get();

        // 4. Kembalikan data JSON lengkap
        return response()->json($data);
    }
    public function receiveDataFromESP32(Request $request)
    {
        // 1. Definisikan API Key yang diharapkan (sama seperti di PHP Anda)
        $expectedApiKey = "210601"; //

        // 2. Cek API Key yang dikirim
        $receivedApiKey = $request->input('api_key'); // Ambil 'api_key' dari data POST

        if (!$receivedApiKey || $receivedApiKey !== $expectedApiKey) {
            Log::warning('Unauthorized API access attempt from ESP32.'); // Catat percobaan akses tidak sah
            return response()->json(['message' => 'Unauthorized'], 403); // Kirim respons error
        }

        // 3. Validasi Data yang Masuk
        // Ini memastikan data yang dikirim ESP32 sesuai format
        $validator = Validator::make($request->all(), [
            'berat'    => 'required|numeric', // 'berat' wajib ada dan harus angka
            'fakultas' => 'required|string|max:100', // 'fakultas' wajib, string, maks 100 char
            'jenis'    => 'required|string|max:50',  // 'jenis' wajib, string, maks 50 char
        ]);

        // Jika validasi gagal
        if ($validator->fails()) {
            Log::error('Invalid data received from ESP32:', $validator->errors()->toArray()); // Catat error validasi
            return response()->json(['message' => 'Data tidak valid.', 'errors' => $validator->errors()], 400); // Kirim respons error
        }

        // 4. Simpan Data ke Database menggunakan Model Eloquent
        try {
            $sampah = new Sampah(); // Buat instance model baru
            $sampah->berat = $request->input('berat');
            $sampah->fakultas = $request->input('fakultas');
            $sampah->jenis = $request->input('jenis');
            // 'timestamp' akan diisi otomatis oleh database (sesuai schema Anda)
            
            $sampah->save(); // Simpan ke tabel 'sampah'

            Log::info('Data received successfully from ESP32:', $request->all()); // Catat data yang berhasil disimpan
            return response()->json(['message' => 'Data berhasil disimpan!'], 201); // Kirim respons sukses (201 Created)

        } catch (\Exception $e) {
            // Tangani jika ada error saat menyimpan ke database
            Log::error('Failed to save data from ESP32:', ['error' => $e->getMessage()]); // Catat error database
            return response()->json(['message' => 'Gagal menyimpan data ke database.'], 500); // Kirim respons error server
        }
    }
}