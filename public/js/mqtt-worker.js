// public/js/mqtt-worker.js
importScripts('https://unpkg.com/mqtt/dist/mqtt.min.js');

let client = null;
let connected = false;
let ports = []; // semua tab yang terhubung

onconnect = function(event) {
    const port = event.ports[0];
    ports.push(port);

    port.onmessage = function(msgEvent) {
        const data = msgEvent.data;

        // Connect hanya sekali (saat tab pertama kali aktif)
        if (data.type === 'connect' && !connected) {
            client = mqtt.connect('wss://broker.hivemq.com:8884/mqtt');

            client.on('connect', () => {
                connected = true;
                broadcast({ type: 'status', status: 'connected' });
            });

            client.on('reconnect', () => {
                broadcast({ type: 'status', status: 'reconnecting' });
            });

            client.on('close', () => {
                connected = false;
                broadcast({ type: 'status', status: 'disconnected' });
            });

            client.on('message', (topic, message) => {
                broadcast({
                    type: 'message',
                    topic,
                    payload: message.toString(),
                });
            });
        }

        // Subscribe topic
        if (data.type === 'subscribe' && client) {
            client.subscribe(data.topic);
        }

        // Publish message
        if (data.type === 'publish' && client) {
            client.publish(data.topic, data.message);
        }
    };

    port.start();

    // Kirim status terkini ke tab baru
    port.postMessage({
        type: 'status',
        status: connected ? 'connected' : 'disconnected',
    });
};

// Broadcast ke semua tab yang terhubung
function broadcast(message) {
    ports.forEach((p) => p.postMessage(message));
}
