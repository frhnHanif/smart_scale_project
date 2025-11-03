<?php

namespace App\Http\Controllers;

use App\Models\Sampah;
use App\Services\MQTTService;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Facades\Validator;

class SampahController extends Controller
{
    protected $mqttService;

    public function __construct()
    {
        $this->mqttService = new MQTTService();
    }

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


    public function getLatestData()
    {
        try {
            $latestData = Sampah::with([])
                ->latest('timestamp')
                ->first();

            return response()->json([
                'success' => true,
                'data' => $latestData,
                'timestamp' => now()->toISOString()
            ]);

        } catch (\Exception $e) {
            Log::error('Error getting latest data: ' . $e->getMessage());
            return response()->json([
                'success' => false,
                'message' => 'Failed to fetch latest data'
            ], 500);
        }
    }

    /**
     * REAL-TIME: Get dashboard statistics
     */
    public function getDashboardStats()
    {
        try {
            $stats = [
                'total_berat' => Sampah::sum('berat'),
                'total_records' => Sampah::count(),
                'fakultas_count' => Sampah::distinct('fakultas')->count('fakultas'),
                'jenis_count' => Sampah::distinct('jenis')->count('jenis'),
                'latest_timestamp' => Sampah::max('timestamp')
            ];

            return response()->json([
                'success' => true,
                'stats' => $stats
            ]);

        } catch (\Exception $e) {
            Log::error('Error getting dashboard stats: ' . $e->getMessage());
            return response()->json([
                'success' => false,
                'message' => 'Failed to fetch dashboard statistics'
            ], 500);
        }
    }

    /**
     * MODIFIED: Receive data from ESP32 with MQTT notification
     */
    public function receiveDataFromESP32(Request $request)
    {
        $expectedApiKey = "210601";
        $receivedApiKey = $request->input('api_key');

        if (!$receivedApiKey || $receivedApiKey !== $expectedApiKey) {
            Log::warning('Unauthorized API access attempt from ESP32.');
            return response()->json(['message' => 'Unauthorized'], 403);
        }

        $validator = Validator::make($request->all(), [
            'berat'    => 'required|numeric',
            'fakultas' => 'required|string|max:100',
            'jenis'    => 'required|string|max:50',
        ]);

        if ($validator->fails()) {
            Log::error('Invalid data received from ESP32:', $validator->errors()->toArray());
            return response()->json([
                'message' => 'Data tidak valid.', 
                'errors' => $validator->errors()
            ], 400);
        }

        try {
            // Save to database
            $sampah = Sampah::create([
                'berat' => $request->input('berat'),
                'fakultas' => $request->input('fakultas'),
                'jenis' => $request->input('jenis'),
                'timestamp' => now()
            ]);

            Log::info('Data received successfully from ESP32:', $request->all());

            // ========== MQTT NOTIFICATION ==========
            $mqttData = [
                'type' => 'new_data',
                'id' => $sampah->id,
                'berat' => $sampah->berat,
                'fakultas' => $sampah->fakultas,
                'jenis' => $sampah->jenis,
                'timestamp' => $sampah->timestamp->toISOString()
            ];

            $this->mqttService->publish('undip/scale/new', json_encode($mqttData));
            // ========== END MQTT ==========

            return response()->json([
                'message' => 'Data berhasil disimpan!',
                'id' => $sampah->id
            ], 201);

        } catch (\Exception $e) {
            Log::error('Failed to save data from ESP32: ' . $e->getMessage());
            return response()->json([
                'message' => 'Gagal menyimpan data ke database.'
            ], 500);
        }
    }

    /**
     * Get MQTT configuration for frontend
     */
    public function getMqttConfig()
    {
        try {
            $config = $this->mqttService->getFrontendConfig();
            return response()->json([
                'success' => true,
                'config' => $config
            ]);
        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'config' => []
            ]);
        }
    }
}