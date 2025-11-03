// Nama class diubah agar lebih jelas
class GlobalMQTTConnector {
    constructor() {
        this.mqttClient = null;
        this.isConnected = false;
        this.config = {
            host: 'broker.hivemq.com',
            port: 8884,
            topic: 'undip/scale/new', // Topik trigger
            useSSL: true
        };
        
        this.init();
    }

    async init() {
        this.connectMQTT();
    }

    connectMQTT() {
        try {
            // Pastikan Paho library sudah di-load sebelum skrip ini
            if (typeof Paho === 'undefined' || typeof Paho.MQTT === 'undefined') {
                console.error("Paho MQTT Library tidak ditemukan. Pastikan sudah di-load di layout utama.");
                return;
            }

            const clientId = 'web_global_' + Math.random().toString(16).substr(2, 8);
            
            this.mqttClient = new Paho.MQTT.Client(
                this.config.host,
                Number(this.config.port),
                clientId
            );

            this.mqttClient.onConnectionLost = this.onConnectionLost.bind(this);
            this.mqttClient.onMessageArrived = this.onMessageArrived.bind(this);

            const connectOptions = {
                onSuccess: this.onConnect.bind(this),
                onFailure: this.onConnectFailure.bind(this),
                useSSL: this.config.useSSL,
                timeout: 10,
                keepAliveInterval: 60,
                cleanSession: true
            };

            // Fungsi ini sekarang HANYA update header
            this.updateConnectionStatus('connecting', 'MQTT: Connecting...');
            this.mqttClient.connect(connectOptions);

        } catch (error) {
            console.error('MQTT connection error:', error);
            this.updateConnectionStatus('error', 'MQTT: Connection failed');
        }
    }

    onConnect() {
        console.log('✅ MQTT Global Terhubung');
        this.isConnected = true;
        this.updateConnectionStatus('connected', 'MQTT: Connected');
        this.mqttClient.subscribe(this.config.topic);
    }

    onConnectFailure(error) {
        console.error('❌ MQTT Global Connection failed:', error.errorMessage);
        this.isConnected = false;
        this.updateConnectionStatus('error', 'MQTT: Connection failed');
        
        // Coba sambung ulang setelah 5 detik jika gagal
        setTimeout(() => {
            if (!this.isConnected) {
                this.connectMQTT();
            }
        }, 5000);
    }

    onConnectionLost(responseObject) {
        console.log('🔌 MQTT Global Connection lost');
        this.isConnected = false;
        this.updateConnectionStatus('disconnected', 'MQTT: Disconnected');
        
        // Logika reconnect tetap di sini
        if (responseObject.errorCode !== 0) {
            setTimeout(() => {
                if (!this.isConnected) {
                    this.connectMQTT();
                }
            }, 5000);
        }
    }

    onMessageArrived(message) {
        try {
            console.log('📨 MQTT Global Message received');
            
            // Menyebarkan event kustom ke 'window'
            const mqttEvent = new CustomEvent('mqtt:data-baru', {
                detail: { 
                    topic: message.destinationName, 
                    payload: message.payloadString 
                }
            });
            window.dispatchEvent(mqttEvent);

        } catch (error) {
            console.error('Error parsing MQTT message:', error);
        }
    }

    // Fungsi ini tetap ada karena header ada di tiap halaman
    updateConnectionStatus(status, text) {
        // Ganti 'connectionStatus' dan 'statusText' dengan ID
        // elemen indikator di header.blade.php Anda
        const statusElement = document.getElementById('connectionStatus');
        const statusText = document.getElementById('statusText');
        
        if (statusElement && statusText) {
            // Asumsi Anda punya class CSS 'connection-status' di dalam 'connectionStatus'
            const statusDot = statusElement.querySelector('.connection-status');
            if (statusDot) {
                statusDot.classList.remove('status-connected', 'status-connecting', 'status-disconnected', 'status-error');
                
                // Tambahkan class berdasarkan status
                if (status === 'connected') {
                    statusDot.classList.add('status-connected');
                } else if (status === 'connecting') {
                    statusDot.classList.add('status-connecting');
                } else if (status === 'disconnected') {
                    statusDot.classList.add('status-disconnected');
                } else {
                    statusDot.classList.add('status-error');
                }
            }
            statusText.textContent = text;
        }
    }
}

// Inisialisasi MQTT Global saat halaman dimuat
// Ini akan berjalan di SETIAP halaman
document.addEventListener('DOMContentLoaded', function () {
    // Simpan di window agar bisa di-debug jika perlu,
    window.globalMQTT = new GlobalMQTTConnector();
});