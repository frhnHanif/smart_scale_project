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
        // 1. MATIKAN AUTH (Supaya dashboard bisa diakses publik tanpa login)
        // $this->middleware('auth:sanctum');
        
        $this->mqttService = new MQTTService();
    }

    public function getData(Request $request)
    {
        // Buat query dasar
        $query = Sampah::query();

        // 2. HAPUS/KOMENTARI BARIS INI (Penyebab Error 500)
        // $query = Sampah::forCurrentUser(); 

        // Terapkan filter
        $query->when($request->input('fakultas'), function ($q, $fakultas) {
            return $q->where('fakultas', $fakultas);
        });
        $query->when($request->input('start_date'), function ($q, $startDate) {
            return $q->whereDate('timestamp', '>=', $startDate);
        });
        $query->when($request->input('end_date'), function ($q, $endDate) {
            return $q->whereDate('timestamp', '<=', $endDate);
        });

        $perPage = $request->input('per_page', 25);
        
        // Ambil data
        $data = $query->orderBy('timestamp', 'desc')->paginate($perPage);

        return response()->json($data);
    }

    public function exportData(Request $request)
    {
        $query = Sampah::query();

        // 3. HAPUS/KOMENTARI BARIS INI JUGA (Penyebab Error 500)
        // $query = Sampah::forCurrentUser();

        $query->when($request->input('fakultas'), function ($q, $fakultas) {
            return $q->where('fakultas', $fakultas);
        });
        $query->when($request->input('start_date'), function ($q, $startDate) {
            return $q->whereDate('timestamp', '>=', $startDate);
        });
        $query->when($request->input('end_date'), function ($q, $endDate) {
            return $q->whereDate('timestamp', '<=', $endDate);
        });

        $data = $query->orderBy('timestamp', 'desc')->get();

        return response()->json($data);
    }

    // ... Biarkan fungsi getLatestData, getDashboardStats, dan receiveDataFromESP32 seperti semula ...
    
    public function getLatestData() 
    {
        // ... kode lama ...
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
            // ...
             return response()->json(['success' => false], 500);
        }
    }

    public function getDashboardStats()
    {
        // ... kode lama ...
         try {
            $stats = [
                'total_berat' => Sampah::sum('berat'),
                'total_records' => Sampah::count(),
                'fakultas_count' => Sampah::distinct('fakultas')->count('fakultas'),
                'jenis_count' => Sampah::distinct('jenis')->count('jenis'),
                'latest_timestamp' => Sampah::max('timestamp')
            ];
            return response()->json(['success' => true, 'stats' => $stats]);
        } catch (\Exception $e) {
             return response()->json(['success' => false], 500);
        }
    }
    
    public function receiveDataFromESP32(Request $request)
    {
        // ... kode lama ...
        // Kode ini sudah benar karena tidak pakai forCurrentUser
        // Dan middleware sudah dimatikan di __construct
        
         $expectedApiKey = "210601";
         // ... dst (kode sama persis) ...
         $receivedApiKey = $request->input('api_key');
         if (!$receivedApiKey || $receivedApiKey !== $expectedApiKey) {
            return response()->json(['message' => 'Unauthorized'], 403);
         }
         
         // ... Simpan data ...
         $sampah = Sampah::create([
                'berat' => $request->input('berat'),
                'fakultas' => $request->input('fakultas'),
                'jenis' => $request->input('jenis'),
                'timestamp' => now()
         ]);
         
         // ... MQTT ...
         $mqttData = [
             'type' => 'new_data',
             'id' => $sampah->id,
             'berat' => $sampah->berat,
             'fakultas' => $sampah->fakultas,
             'jenis' => $sampah->jenis,
             'timestamp' => $sampah->timestamp->toISOString()
         ];
         $this->mqttService->publish('undip/scale/new', json_encode($mqttData));
         
         return response()->json(['message' => 'Data berhasil disimpan!', 'id' => $sampah->id], 201);
    }

    public function getMqttConfig()
    {
        try {
            $config = $this->mqttService->getFrontendConfig();
            return response()->json(['success' => true, 'config' => $config]);
        } catch (\Exception $e) {
            return response()->json(['success' => false, 'config' => []]);
        }
    }
}