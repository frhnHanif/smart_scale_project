<?php

namespace App\Services;

use Illuminate\Support\Facades\Http;
use Illuminate\Support\Facades\Log;

class MQTTService
{
    protected $config;

    public function __construct()
    {
        $this->config = [
            'host' => env('MQTT_HOST', 'broker.hivemq.com'),
            'port' => env('MQTT_PORT', 8884),
            'username' => env('MQTT_USERNAME', ''),
            'password' => env('MQTT_PASSWORD', ''),
            'client_id' => 'laravel_' . uniqid(),
        ];
    }

    /**
     * Publish message to MQTT broker via HTTP API (jika broker support)
     * Atau menggunakan library PHP MQTT yang compatible dengan shared hosting
     */
    public function publish($topic, $message)
    {
        try {
            // Method 1: HTTP API (jika broker menyediakan)
            // Contoh untuk HiveMQ Cloud atau EMQX
            $apiUrl = "https://" . $this->config['host'] . "/api/v1/mqtt/publish";
            
            $response = Http::timeout(10)->post($apiUrl, [
                'topic' => $topic,
                'payload' => $message,
                'qos' => 0,
                'retain' => false
            ]);

            if ($response->successful()) {
                Log::info("MQTT message published to {$topic}");
                return true;
            }

            // Fallback: Simpan notifikasi untuk dikirim nanti
            Log::warning("MQTT publish failed, using fallback");
            return $this->fallbackPublish($topic, $message);

        } catch (\Exception $e) {
            Log::error("MQTT publish error: " . $e->getMessage());
            return false;
        }
    }

    /**
     * Fallback method jika MQTT tidak available
     */
    private function fallbackPublish($topic, $message)
    {
        // Simpan di cache atau database untuk nanti di-process
        // Atau trigger webhook alternative
        cache()->put('mqtt_queue_' . uniqid(), [
            'topic' => $topic,
            'message' => $message,
            'timestamp' => now()
        ], 3600); // Simpan 1 jam

        return true;
    }

    /**
     * Get MQTT configuration for frontend
     */
    public function getFrontendConfig()
    {
        return [
            'host' => $this->config['host'],
            'port' => $this->config['port'],
            'topic' => 'undip/scale/new',
            'useSSL' => true
        ];
    }
}