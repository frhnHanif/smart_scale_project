// public/js/firebaseService.js

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

export function initializeFirebase(config) {
    if (!app) {
        app = initializeApp(config);
        db = getFirestore(app);
        console.log("Firebase initialized.");
    }
}

export function getFirestoreInstance() {
    if (!db) {
        console.error("Firestore not initialized. Call initializeFirebase() first.");
        return null;
    }
    return db;
}

/**
 * Memperbarui tanggal terkini pada elemen HTML.
 * @param {string} elementId - ID elemen HTML yang akan diperbarui.
 */
export function updateCurrentDate(elementId) {
    const today = new Date();
    const dateElement = document.getElementById(elementId);
    if (dateElement) {
        const options = {
            weekday: 'long',
            year: 'numeric',
            month: 'long',
            day: 'numeric'
        };
        const formattedDate = today.toLocaleDateString('id-ID', options);
        dateElement.textContent = formattedDate;
    } else {
        console.warn(`Element with ID '${elementId}' not found for date update.`);
    }
}

/**
 * Menyiapkan listener real-time untuk data koleksi "sampah".
 * Fungsi ini mengagregasi data untuk statistik global dan pembaruan UI spesifik halaman.
 * @param {function(object): void} [pageSpecificCallback] - Callback opsional untuk logika spesifik halaman.
 * @returns {function(): void} - Fungsi untuk berhenti mendengarkan (unsubscribe).
 */
export function setupGlobalSampahListener(pageSpecificCallback = null) {
    const firestoreDb = getFirestoreInstance();
    if (!firestoreDb) return () => {};


    // --- DEFINISI PERIODE WAKTU ---
    const now = new Date();
    const startOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const startOfThisMonth = new Date(now.getFullYear(), now.getMonth(), 1);
    const startOfLastMonth = new Date(now.getFullYear(), now.getMonth() - 1, 1);
    const startOfMonthBeforeLast = new Date(now.getFullYear(), now.getMonth() - 2, 1);
    
    // Untuk tren mingguan, atur ke hari Senin di minggu ini
    const startOfWeek = new Date(now);
    const day = startOfWeek.getDay(); // Minggu = 0, Senin = 1, ...
    const diff = startOfWeek.getDate() - day + (day === 0 ? -6 : 1); // Penyesuaian untuk Minggu
    startOfWeek.setDate(diff);
    startOfWeek.setHours(0, 0, 0, 0);

    // Query data mulai dari dua bulan yang lalu untuk mencakup semua perhitungan
    const firebaseQueryStartDate = Timestamp.fromDate(startOfMonthBeforeLast);
    const q = query(collection(firestoreDb, "sampah"), where("timestamp", ">=", firebaseQueryStartDate));

    return onSnapshot(q, (querySnapshot) => {
        // --- VARIABEL AGREGASI ---
        let totalBeratToday = 0;
        let activeFacultiesThisMonthSet = new Set();
        let totalBeratBulanIni = 0;
        let totalBeratBulanLalu = 0;
        let totalBeratBulanSebelumnyaLagi = 0;
        let weeklyTotalData = [0, 0, 0, 0, 0, 0, 0]; // [Senin, Selasa, ..., Minggu]
        let overviewOrganikToday = 0;
        let overviewAnorganikToday = 0;
        let overviewResiduToday = 0;
        const facultyDataAggregates = {};


        querySnapshot.forEach((doc) => {
            const data = doc.data();
            
            // ✅ PERBAIKAN: Memastikan dokumen memiliki timestamp untuk mencegah error
            if (!data.timestamp) {
                return; // Lewati dokumen jika tidak ada timestamp
            }

            const berat = data.berat || 0;
            const docDate = data.timestamp.toDate();
            const jenis = data.jenis;
            const fakultas = data.fakultas;

            // --- LOGIKA AGREGASI DATA ---

            // 1. Total bulanan untuk kalkulasi reduksi & fakultas aktif bulan ini
            if (docDate >= startOfThisMonth) {
                totalBeratBulanIni += berat;
                if (fakultas) activeFacultiesThisMonthSet.add(fakultas);
            } else if (docDate >= startOfLastMonth) {
                totalBeratBulanLalu += berat;
            } else if (docDate >= startOfMonthBeforeLast) {
                totalBeratBulanSebelumnyaLagi += berat;
            }

            // 2. Total harian untuk kartu statistik dan rincian dashboard
            if (docDate >= startOfToday) {
                totalBeratToday += berat;
                if (jenis === 'Organik') overviewOrganikToday += berat;
                else if (jenis === 'Anorganik') overviewAnorganikToday += berat;
                else if (jenis === 'Residu') overviewResiduToday += berat;
            }

            // 3. Data tren mingguan untuk grafik dashboard
            if (docDate >= startOfWeek) {
                const dayOfWeek = docDate.getDay();
                // Sesuaikan indeks agar Senin = 0, Selasa = 1, ..., Minggu = 6
                const index = dayOfWeek === 0 ? 6 : dayOfWeek - 1;
                weeklyTotalData[index] += berat;
            }

            // 4. Data performa fakultas harian untuk halaman analitik
            if (fakultas && docDate >= startOfToday) {
                if (!facultyDataAggregates[fakultas]) {
                    facultyDataAggregates[fakultas] = { totalBerat: 0, reduction: 0, target: 0 };
                }
                facultyDataAggregates[fakultas].totalBerat += berat;
            }
        });

        // --- KALKULASI SETELAH AGREGASI ---
        let avgReduction = 0;
        if (totalBeratBulanLalu > 0) {
            avgReduction = ((totalBeratBulanLalu - totalBeratBulanIni) / totalBeratBulanLalu) * 100;
        }

        let targetReductionFromLastMonth = 0;
        if (totalBeratBulanSebelumnyaLagi > 0) {
            targetReductionFromLastMonth = ((totalBeratBulanSebelumnyaLagi - totalBeratBulanLalu) / totalBeratBulanSebelumnyaLagi) * 100;
        }

        // --- PEMBARUAN KARTU STATISTIK GLOBAL ---
        const globalTotalSampahElem = document.getElementById('total-sampah-today');
        if (globalTotalSampahElem) globalTotalSampahElem.textContent = totalBeratToday.toFixed(1);

        const globalActiveFacultiesElem = document.getElementById('active-faculties');
        if (globalActiveFacultiesElem) globalActiveFacultiesElem.textContent = activeFacultiesThisMonthSet.size;

        const globalAvgReductionElem = document.getElementById('avg-reduction');
        if (globalAvgReductionElem) globalAvgReductionElem.textContent = avgReduction.toFixed(1);
        
        // Logika untuk kartu Status Lingkungan
        const globalEnvStatusElem = document.getElementById('env-status');
        const globalEnvStatusSubtitleElem = document.getElementById('env-status-subtitle');
        const envStatusBorderElem = document.getElementById('env-status-border');
        const envStatusTextElem = document.getElementById('env-status-text');

        if (globalEnvStatusElem && globalEnvStatusSubtitleElem && envStatusBorderElem && envStatusTextElem) {
            const TARGET_AVG_REDUCTION = targetReductionFromLastMonth;
            let achievementPercentage = 0;

            if (TARGET_AVG_REDUCTION > 0) {
                achievementPercentage = (Math.max(0, avgReduction) / TARGET_AVG_REDUCTION) * 100;
            } else if (avgReduction > 0) {
                achievementPercentage = 100; // Jika tidak ada target tapi ada reduksi, anggap 100%
            }

            let envStatusText = 'Kurang';
            let envStatusSubtitleText = 'Capaian reduksi < 60%';
            let borderColor = 'bg-red-500';
            let textColor = 'text-red-600';

            if (achievementPercentage >= 85) {
                envStatusText = 'Baik';
                envStatusSubtitleText = 'Capaian Reduksi > 85%';
                borderColor = 'bg-green-500';
                textColor = 'text-green-600';
            } else if (achievementPercentage >= 60) {
                envStatusText = 'Cukup';
                envStatusSubtitleText = 'Capaian Reduksi 60-85%';
                borderColor = 'bg-yellow-500';
                textColor = 'text-yellow-600';
            }

            globalEnvStatusElem.textContent = envStatusText;
            globalEnvStatusSubtitleElem.textContent = envStatusSubtitleText;
            envStatusBorderElem.className = `absolute top-0 left-0 h-full w-1.5 ${borderColor} rounded-l-xl`;
            envStatusTextElem.className = `text-3xl font-bold ${textColor}`;
        }

        // --- PERSIAPAN DATA UNTUK DIKIRIM KE HALAMAN LAIN ---
        const aggregatedDataForPage = {
            overviewOrganikToday,
            overviewAnorganikToday,
            overviewResiduToday,
            weeklyTotalData,
            facultyDataAggregates
        };

        if (pageSpecificCallback && typeof pageSpecificCallback === 'function') {
            pageSpecificCallback(aggregatedDataForPage);
        }

    }, (error) => {
        console.error("Error listening to Firestore data in firebaseService: ", error);
    });
}