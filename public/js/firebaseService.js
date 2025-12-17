/**
 * =================================================================
 * PENGGANTI FIREBASE SERVICE
 * =================================================================
 */

/**
 * PERUBAHAN: Fungsi ini sekarang lebih fleksibel.
 * Bisa menerima endpoint yang berbeda (misal /api/sampah-data atau /api/sampah-export)
 * dan mengirim parameter pagination (page, per_page).
 *
 * @param {object} params - Objek berisi filter (e.g., fakultas, start_date, page, per_page).
 * @param {string} endpoint - (Opsional) URL API yang dituju. Default ke '/api/sampah-data'.
 *
 * @returns {Promise<any>} - Promise yang akan resolve dengan data dari API.
 * Bisa berupa objek pagination (jika dari /api/sampah-data)
 * atau array (jika dari /api/sampah-export).
 */
async function fetchData(params = {}, endpoint = "/api/sampah-data") {
    // 1. Ambil base URL dari argumen
    const baseUrl = endpoint;

    // 2. Buat URLSearchParams untuk semua filter
    const urlParams = new URLSearchParams();

    // Tambahkan semua parameter ke URL HANYA JIKA ada nilainya
    if (params.fakultas) {
        urlParams.append("fakultas", params.fakultas);
    }
    if (params.start_date) {
        urlParams.append("start_date", params.start_date);
    }
    if (params.end_date) {
        urlParams.append("end_date", params.end_date);
    }
    // TAMBAHAN BARU: Parameter untuk pagination
    if (params.page) {
        urlParams.append("page", params.page);
    }
    if (params.per_page) {
        urlParams.append("per_page", params.per_page);
    }

    // 3. Gabungkan URL
    const queryString = urlParams.toString();
    const fullUrl = queryString ? `${baseUrl}?${queryString}` : baseUrl;

    // 4. Lakukan request 'fetch'
    try {
        const response = await fetch(fullUrl);
        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }

        const data = await response.json();

        // 5. PERUBAHAN PENTING:
        // Cek apakah data yang diterima adalah objek pagination dari Laravel
        // (cirinya: punya properti 'data' yang merupakan array dan 'total')
        if (
            data &&
            typeof data === "object" &&
            Array.isArray(data.data) &&
            data.total !== undefined
        ) {
            // Jika ya, proses array 'data.data'
            data.data = data.data.map((item) => {
                item.timestamp = new Date(item.timestamp);
                item.berat = parseFloat(item.berat) || 0;
                return item;
            });
            // Kembalikan seluruh objek pagination (termasuk 'total', 'current_page', dll)
            return data;
        } else if (Array.isArray(data)) {
            // Jika tidak, ini mungkin data dari 'export' (array biasa)
            return data.map((item) => {
                item.timestamp = new Date(item.timestamp);
                item.berat = parseFloat(item.berat) || 0;
                return item;
            });
        }

        // Fallback jika format tidak dikenal
        console.warn("Format data API tidak dikenal:", data);
        return data;
    } catch (error) {
        console.error("Gagal mengambil data dari API:", error);
        // Kembalikan format yang sesuai agar tidak error
        if (endpoint.includes("export")) {
            return []; // Array kosong untuk export
        }
        // Objek pagination kosong untuk /api/sampah-data
        return { data: [], total: 0, current_page: 1, last_page: 1 };
    }
}

/**
 * =================================================================
 * FUNGSI STATISTIK GLOBAL (Diperbarui untuk menggunakan endpoint export)
 * =================================================================
 * Fungsi ini mengambil data dan memperbarui 4 kartu statistik
 * global yang ada di 'cards-stats.blade.php'.
 */
async function updateGlobalStatCards() {
    try {
        // PERUBAHAN: Panggil API Ekspor untuk mendapatkan SEMUA data
        // Kita tidak mau statistik global ini dipaginasi
        const allData = await fetchData({}, "/api/sampah-export");

        if (!allData || !Array.isArray(allData) || allData.length === 0) {
            console.warn(
                "Gagal memuat data statistik global atau data kosong."
            );
            return; // Tidak ada data, jangan lakukan apa-apa
        }

        const now = new Date();
        const todayStr = now.toDateString();
        const startOfThisMonth = new Date(now.getFullYear(), now.getMonth(), 1);
        const startOfLastMonth = new Date(
            now.getFullYear(),
            now.getMonth() - 1,
            1
        );
        const endOfLastMonth = new Date(startOfThisMonth.getTime() - 1); // Akhir bulan lalu

        let totalToday = 0;
        let totalThisMonth = 0;
        let totalLastMonth = 0;
        const facultySet = new Set();

        allData.forEach((item) => {
            // 'item.timestamp' dan 'item.berat' sudah diproses oleh fetchData

            // 1. Hitung total hari ini
            if (item.timestamp.toDateString() === todayStr) {
                totalToday += item.berat;
            }
            // 2. Hitung fakultas aktif bulan ini
            if (item.timestamp >= startOfThisMonth && item.fakultas) {
                facultySet.add(item.fakultas);
            }
            // 3. Hitung total bulan ini
            if (item.timestamp >= startOfThisMonth && item.timestamp <= now) {
                // Hanya sampai hari ini
                totalThisMonth += item.berat;
            }
            // 4. Hitung total bulan lalu
            if (
                item.timestamp >= startOfLastMonth &&
                item.timestamp <= endOfLastMonth
            ) {
                totalLastMonth += item.berat;
            }
        });

        // --- Update Kartu 1: Total Sampah Hari Ini ---
        const totalSampahElem = document.getElementById("total-sampah-today");
        if (totalSampahElem) {
            totalSampahElem.textContent = totalToday.toFixed(1);
        }

        // --- Update Kartu 2: Fakultas Aktif ---
        const activeFacultiesElem = document.getElementById("active-faculties");
        if (activeFacultiesElem) {
            activeFacultiesElem.textContent = facultySet.size;
        }

        // --- Update Kartu 3: Rata-rata Pengurangan ---
        let reductionPercent = 0;
        if (totalLastMonth > 0) {
            // Perbandingan (Bulan Lalu - Bulan Ini) / Bulan Lalu
            reductionPercent =
                ((totalLastMonth - totalThisMonth) / totalLastMonth) * 100;
        } else if (totalThisMonth > 0) {
            // Bulan lalu 0, bulan ini ada, berarti naik (pengurangan negatif)
            reductionPercent = -100;
        }
        // Jika keduanya 0, reductionPercent tetap 0 (tidak ada perubahan)

        const avgReductionElem = document.getElementById("avg-reduction");
        if (avgReductionElem) {
            avgReductionElem.textContent = reductionPercent.toFixed(0);
        }

        // --- Update Kartu 4: Status Lingkungan ---
        const envStatusElem = document.getElementById("env-status");
        const envStatusSubtitleElem = document.getElementById(
            "env-status-subtitle"
        );
        const envStatusBorderElem =
            document.getElementById("env-status-border");

        if (envStatusElem && envStatusSubtitleElem && envStatusBorderElem) {
            if (reductionPercent > 10) {
                envStatusElem.textContent = "Sangat Baik";
                envStatusSubtitleElem.textContent = "Pengurangan signifikan!";
                envStatusBorderElem.className =
                    envStatusBorderElem.className.replace(
                        /bg-\w+-\d+/,
                        "bg-green-500"
                    );
            } else if (reductionPercent > 0) {
                envStatusElem.textContent = "Baik";
                envStatusSubtitleElem.textContent = "Ada pengurangan sampah";
                envStatusBorderElem.className =
                    envStatusBorderElem.className.replace(
                        /bg-\w+-\d+/,
                        "bg-blue-500"
                    );
            } else if (reductionPercent === 0) {
                envStatusElem.textContent = "Stabil";
                envStatusSubtitleElem.textContent = "Jumlah sampah stabil";
                envStatusBorderElem.className =
                    envStatusBorderElem.className.replace(
                        /bg-\w+-\d+/,
                        "bg-yellow-500"
                    );
            } else {
                envStatusElem.textContent = "Buruk";
                envStatusSubtitleElem.textContent =
                    "Sampah bulan ini meningkat";
                envStatusBorderElem.className =
                    envStatusBorderElem.className.replace(
                        /bg-\w+-\d+/,
                        "bg-red-500"
                    );
            }
        }
    } catch (error) {
        console.error("Gagal memperbarui kartu statistik global:", error);
    }
}

/**
 * Export kedua fungsi
 */
export { fetchData, updateGlobalStatCards };
