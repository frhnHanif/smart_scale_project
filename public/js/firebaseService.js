//JS File yang akan reusable ke halaman lain

//Import fungsi-fungsi penting dari Firebase
import {
    initializeApp
} from "https://www.gstatic.com/firebasejs/11.6.1/firebase-app.js";
import {
    getFirestore,
    collection,
    query,
    where,
    onSnapshot,
    Timestamp
} from "https://www.gstatic.com/firebasejs/11.6.1/firebase-firestore.js";

let app;
let db;

/** 
 * Konfigurasi Firebase
 * @param {object} config - Konfigurasi Firebase yang berisi apiKey, authDomain, projectId, storageBucket, messagingSenderId, appId
 * **/
export function initializeFirebase(config) {
    if (!app) { // Cek apakah Firebase sudah diinisialisasi
        app = initializeApp(config);
        db = getFirestore(app);
        console.log("Firebase initialized.");
    }
}

/**
 * Fungsi untuk mendapatkan data dari Firestore berdasarkan koleksi dan kondisi tertentu.
 * @param {string} elementId - ID elemen HTML untuk menampilkan data.
 */
export function updateCurrentDate(elementId) {
    const today = new Date();
    const dateElement = document.getElementById(elementId);
    if (dateElement) {
        dateElement.textContent = today.toLocaleDateString('id-ID', {
            weekday: 'long',
            year: 'numeric',
            month: 'long',
            day: 'numeric'
        });
    } else {
        console.warn(`Element with ID '${elementId}' not found for date update.`);
    }
}

/**
 * Fungsi untuk mengatur listener pada koleksi "sampah" di Firestore.
 * @param {object} cardElementIds - Objek yang berisi ID elemen HTML untuk menampilkan statistik.
 * Contoh: { totalSampah: 'total-sampah', totalOrganik: 'total-organik', totalAnorganik: 'total-anorganik', totalUmum: 'total-umum' }
 * @param {function} [onDataUpdate] - Callback yang akan dipanggil setiap kali data diperbarui.
 * Callback ini menerima objek dengan totalOrganik, totalAnorganik, totalUmum,
 */
export function setupStatisticCardListener(cardElementIds, onDataUpdate = null) {
    if (!db) {
        console.error("Firestore not initialized. Call initializeFirebase() first.");
        return;
    }

    const startOfToday = new Date();
    startOfToday.setHours(0, 0, 0, 0);
    const firebaseStartOfToday = Timestamp.fromDate(startOfToday);

    const startOfWeek = new Date(); // Digunakan untuk filtering, walaupun cards hanya menampilkan data hari ini
    const day = startOfWeek.getDay();
    const diff = startOfWeek.getDate() - day + (day === 0 ? -6 : 1); // Adjust saat hari Minggu
    startOfWeek.setDate(diff);
    startOfWeek.setHours(0, 0, 0, 0);
    const firebaseStartOfWeek = Timestamp.fromDate(startOfWeek);

    // Query untuk data awalan dari awal minggu (untuk men-support tren mingguan)
    // Untuk cards, mem-filter data 'today's' pada loop.
    const q = query(collection(db, "sampah"), where("timestamp", ">=", firebaseStartOfWeek));

    onSnapshot(q, (querySnapshot) => {
        let totalOrganik = 0;
        let totalAnorganik = 0;
        let totalUmum = 0;
        let weeklyData = [0, 0, 0, 0, 0, 0, 0]; // Berpotensi diperlukan dalam dashboard

        querySnapshot.forEach((doc) => {
            const data = doc.data();
            const docDate = data.timestamp.toDate();

            // Perhitungan cards statistics (Hanya untuk hari ini)
            if (docDate >= startOfToday) { // Membandingkan dengan JS Date object untuk kemudahan perbandingan
                if (data.jenis === 'Organik') totalOrganik += data.berat;
                else if (data.jenis === 'Anorganik') totalAnorganik += data.berat;
                else if (data.jenis === 'Umum') totalUmum += data.berat;
            }

            // Perhitungan untuk statistic cards (Mingguan) jika diperlukan
            const dayOfWeek = docDate.getDay(); // Sunday=0, Monday=1, ...
            const index = dayOfWeek === 0 ? 6 : dayOfWeek - 1; // Adjust array index for Mon=0
            weeklyData[index] += data.berat;
        });

        const totalSampah = totalOrganik + totalAnorganik + totalUmum;

        // Update Display (Statistic Cards)
        document.getElementById(cardElementIds.totalSampah).textContent = totalSampah.toFixed(1);
        document.getElementById(cardElementIds.totalOrganik).textContent = totalOrganik.toFixed(1);
        document.getElementById(cardElementIds.totalAnorganik).textContent = totalAnorganik.toFixed(1);
        document.getElementById(cardElementIds.totalUmum).textContent = totalUmum.toFixed(1);

        // Jika callback disediakan, panggil dengan data yang diperbarui
        if (onDataUpdate && typeof onDataUpdate === 'function') {
            onDataUpdate({
                totalOrganik,
                totalAnorganik,
                totalUmum,
                weeklyData
            });
        }
    }, (error) => {
        console.error("Error fetching Firestore data: ", error);
    });
}