// public/js/fakultas.js

import { Timestamp, collection, query, where, onSnapshot } from "https://www.gstatic.com/firebasejs/11.6.1/firebase-firestore.js";
import { initializeFirebase, getFirestoreInstance, updateCurrentDate, setupGlobalSampahListener } from "./firebaseService.js";

let db;
let unsubscribe;

const facultyTargets = {
    'FT': 50, 'FK': 45, 'FEB': 55, 'FH': 35, 'FIB': 40, 'FPP': 60
};
const colors = ['#2dd4bf', '#38bdf8', '#a78bfa', '#facc15', '#fb923c'];

let reductionFilter = 'today';
let targetFilter = 'today';

let reductionLeaderboardContainer;
let targetLeaderboardContainer;
let reductionBtnToday, reductionBtnWeekly, reductionBtnMonthly;
let targetBtnToday, targetBtnWeekly, targetBtnMonthly;

const baseButtonClasses = "px-4 py-2 text-sm font-medium transition-colors duration-200";
const activeClasses = "bg-teal-600 text-white hover:bg-teal-700";
const inactiveClasses = "bg-white text-gray-900 hover:bg-gray-100 hover:text-teal-700";

let allAggregatedData = null;


function applyFilterButtonStyles(type) {
    if (type === 'reduction') {
        const structuralClasses = "border border-gray-200";
        reductionBtnToday.className = baseButtonClasses + " " + structuralClasses + " rounded-l-lg";
        reductionBtnWeekly.className = baseButtonClasses + " border-y border-r border-gray-200 -ml-px";
        reductionBtnMonthly.className = baseButtonClasses + " " + structuralClasses + " rounded-r-lg -ml-px";

        if (reductionFilter === 'today') reductionBtnToday.className += " " + activeClasses;
        else reductionBtnToday.className += " " + inactiveClasses;
        if (reductionFilter === 'weekly') reductionBtnWeekly.className += " " + activeClasses;
        else reductionBtnWeekly.className += " " + inactiveClasses;
        if (reductionFilter === 'monthly') reductionBtnMonthly.className += " " + activeClasses;
        else reductionBtnMonthly.className += " " + inactiveClasses;

    } else if (type === 'target') {
        const structuralClasses = "border border-gray-200";
        targetBtnToday.className = baseButtonClasses + " " + structuralClasses + " rounded-l-lg";
        targetBtnWeekly.className = baseButtonClasses + " border-y border-r border-gray-200 -ml-px";
        targetBtnMonthly.className = baseButtonClasses + " " + structuralClasses + " rounded-r-lg -ml-px";

        if (targetFilter === 'today') targetBtnToday.className += " " + activeClasses;
        else targetBtnToday.className += " " + inactiveClasses;
        if (targetFilter === 'weekly') targetBtnWeekly.className += " " + activeClasses;
        else targetBtnWeekly.className += " " + inactiveClasses;
        if (targetFilter === 'monthly') targetBtnMonthly.className += " " + activeClasses;
        else targetBtnMonthly.className += " " + inactiveClasses;
    }
}

function getPeriodDates(filter) {
    const now = new Date();
    let startDate, endDate, previousStartDate, previousEndDate;

    if (filter === 'today') {
        startDate = new Date(now.setHours(0, 0, 0, 0));
        endDate = new Date(now);
        endDate.setHours(23, 59, 59, 999);
        previousStartDate = new Date(startDate);
        previousStartDate.setDate(previousStartDate.getDate() - 1);
        previousEndDate = new Date(startDate.getTime() - 1);
    } else if (filter === 'weekly') {
        const day = now.getDay();
        const diff = now.getDate() - day + (day === 0 ? -6 : 1);
        startDate = new Date(new Date().setDate(diff));
        startDate.setHours(0, 0, 0, 0);
        endDate = new Date(startDate);
        endDate.setDate(endDate.getDate() + 6);
        endDate.setHours(23, 59, 59, 999);
        previousStartDate = new Date(startDate);
        previousStartDate.setDate(previousStartDate.getDate() - 7);
        previousEndDate = new Date(startDate.getTime() - 1);
    } else { // 'monthly'
        startDate = new Date(now.getFullYear(), now.getMonth(), 1);
        endDate = new Date(now.getFullYear(), now.getMonth() + 1, 0);
        endDate.setHours(23, 59, 59, 999);
        previousStartDate = new Date(now.getFullYear(), now.getMonth() - 1, 1);
        previousEndDate = new Date(now.getFullYear(), now.getMonth(), 0);
        previousEndDate.setHours(23, 59, 59, 999);
    }

    return { startDate, endDate, previousStartDate, previousEndDate };
}

function setupFakultasPageListener() {
    if (unsubscribe) unsubscribe();

    reductionLeaderboardContainer.innerHTML = '<p class="text-center text-gray-500">Memuat data...</p>';
    targetLeaderboardContainer.innerHTML = '<p class="text-center text-gray-500">Memuat data...</p>';
    
    if (!db) {
        db = getFirestoreInstance();
        if (!db) {
            console.error("Firestore DB is null. Cannot fetch data.");
            return;
        }
    }

    const monthlyDates = getPeriodDates('monthly');
    const queryStartDate = Timestamp.fromDate(monthlyDates.previousStartDate);
    const q = query(collection(db, "sampah"), where("timestamp", ">=", queryStartDate));

    unsubscribe = onSnapshot(q, (querySnapshot) => {
        const aggregatedData = {
            today: {}, previousDay: {},
            weekly: {}, previousWeek: {},
            monthly: {}, previousMonth: {}
        };
        const now = new Date();
        const todayStart = new Date(now.setHours(0, 0, 0, 0));
        const yesterdayStart = new Date(todayStart); yesterdayStart.setDate(todayStart.getDate() - 1);
        const weeklyStart = new Date(todayStart); weeklyStart.setDate(todayStart.getDate() - todayStart.getDay() + (todayStart.getDay() === 0 ? -6 : 1));
        const lastWeekStart = new Date(weeklyStart); lastWeekStart.setDate(weeklyStart.getDate() - 7);
        const monthlyStart = new Date(todayStart.getFullYear(), todayStart.getMonth(), 1);
        const lastMonthStart = new Date(monthlyStart); lastMonthStart.setMonth(monthlyStart.getMonth() - 1);

        querySnapshot.forEach(doc => {
            const data = doc.data();
            const docDate = data.timestamp?.toDate ? data.timestamp.toDate() : new Date();
            const fakultas = data.fakultas;
            const berat = parseFloat(data.berat) || 0;
            
            if (!fakultas) return;

            if (!aggregatedData.today[fakultas]) aggregatedData.today[fakultas] = 0;
            if (!aggregatedData.previousDay[fakultas]) aggregatedData.previousDay[fakultas] = 0;
            if (!aggregatedData.weekly[fakultas]) aggregatedData.weekly[fakultas] = 0;
            if (!aggregatedData.previousWeek[fakultas]) aggregatedData.previousWeek[fakultas] = 0;
            if (!aggregatedData.monthly[fakultas]) aggregatedData.monthly[fakultas] = 0;
            if (!aggregatedData.previousMonth[fakultas]) aggregatedData.previousMonth[fakultas] = 0;
            
            if (docDate >= todayStart) { aggregatedData.today[fakultas] += berat; }
            if (docDate >= yesterdayStart && docDate < todayStart) { aggregatedData.previousDay[fakultas] += berat; }
            if (docDate >= weeklyStart) { aggregatedData.weekly[fakultas] += berat; }
            if (docDate >= lastWeekStart && docDate < weeklyStart) { aggregatedData.previousWeek[fakultas] += berat; }
            if (docDate >= monthlyStart) { aggregatedData.monthly[fakultas] += berat; }
            if (docDate >= lastMonthStart && docDate < monthlyStart) { aggregatedData.previousMonth[fakultas] += berat; }
        });

        allAggregatedData = aggregatedData;
        
        renderAllLeaderboards();
    }, error => {
        console.error("Error fetching all data:", error);
        reductionLeaderboardContainer.innerHTML = '<p class="text-center text-red-500">Gagal memuat data.</p>';
        targetLeaderboardContainer.innerHTML = '<p class="text-center text-red-500">Gagal memuat data.</p>';
    });
}

function renderAllLeaderboards() {
    if (!allAggregatedData) {
        reductionLeaderboardContainer.innerHTML = '<p class="text-center text-gray-500">Menunggu data...</p>';
        targetLeaderboardContainer.innerHTML = '<p class="text-center text-gray-500">Menunggu data...</p>';
        return;
    }

    let reductionCurrentData, reductionPreviousData, targetData;

    if (reductionFilter === 'today') {
        reductionCurrentData = allAggregatedData.today;
        reductionPreviousData = allAggregatedData.previousDay;
    } else if (reductionFilter === 'weekly') {
        reductionCurrentData = allAggregatedData.weekly;
        reductionPreviousData = allAggregatedData.previousWeek;
    } else {
        reductionCurrentData = allAggregatedData.monthly;
        reductionPreviousData = allAggregatedData.previousMonth;
    }
    
    if (targetFilter === 'today') {
        targetData = allAggregatedData.today;
    } else if (targetFilter === 'weekly') {
        targetData = allAggregatedData.weekly;
    } else {
        targetData = allAggregatedData.monthly;
    }

    renderReductionLeaderboard(reductionCurrentData, reductionPreviousData);
    renderTargetLeaderboard(targetData);
}

function renderReductionLeaderboard(currentData, previousData) {
    const container = document.getElementById('reduction-leaderboard-container');
    container.innerHTML = '';
    const combinedData = {};
    Object.keys(facultyTargets).forEach(fakultas => {
        const currentTotal = currentData[fakultas] || 0;
        const previousTotal = previousData[fakultas] || 0;
        const reduction = previousTotal > 0 ? ((previousTotal - currentTotal) / previousTotal) * 100 : 0;
        combinedData[fakultas] = { total: currentTotal, reduction: reduction };
    });
    const sorted = Object.entries(combinedData).map(([name, values]) => ({ name, ...values })).sort((a, b) => b.reduction - a.reduction);

    if (sorted.every(f => f.reduction <= 0)) {
        container.innerHTML = '<p class="text-center text-gray-500">Belum ada pengurangan sampah untuk periode ini.</p>';
        return;
    }
    
    sorted.forEach((faculty, index) => {
        if (faculty.reduction > 0) {
            const color = colors[index % colors.length];
            const progress = Math.min(Math.max(faculty.reduction, 0), 100);
            const rankDisplay = (idx) => idx === 0 ? '🥇' : idx === 1 ? '🥈' : idx === 2 ? '🥉' : `<span class="text-gray-500">${idx + 1}</span>`;
            
            container.innerHTML += `
                <div class="bg-white p-6 rounded-xl shadow-md border-2" style="border-color:${color};">
                    <div class="flex items-center justify-between">
                        <div class="flex items-center">
                            <span class="w-3 h-3 rounded-full mr-4" style="background-color: ${color};"></span>
                            <span class="font-bold text-lg text-gray-800">${faculty.name}</span>
                        </div>
                        <div class="text-right">
                            <span class="font-semibold text-teal-600">${faculty.reduction.toFixed(1)} %</span>
                            <span class="ml-2">${rankDisplay(index)}</span>
                        </div>
                    </div>
                    <div class="mt-3">
                        <div class="w-full bg-gray-200 rounded-full h-2">
                            <div class="h-2 rounded-full" style="width: ${progress}%; background-color: #34495e;"></div>
                        </div>
                        <div class="flex justify-between text-sm text-gray-500 mt-1">
                            <span>Pengurangan: ${progress.toFixed(0)}%</span>
                        </div>
                    </div>
                </div>
            `;
        }
    });
}

function renderTargetLeaderboard(data) {
    const container = document.getElementById('target-leaderboard-container');
    container.innerHTML = '';
    const sorted = Object.entries(data).map(([name, values]) => ({ name, total: values, target: facultyTargets[name] || 55 })).sort((a, b) => a.total - b.total);

    if (sorted.every(f => f.total === 0)) {
        container.innerHTML = '<p class="text-center text-gray-500">Belum ada data timbunan untuk periode ini.</p>';
        return;
    }

    sorted.forEach((faculty, index) => {
        const color = colors[index % colors.length];
        const progress = Math.min((faculty.total / faculty.target) * 100, 100);
        const rankDisplay = (idx) => idx === 0 ? '🥇' : idx === 1 ? '🥈' : idx === 2 ? '🥉' : `<span class="text-gray-500">${idx + 1}</span>`;
        
        container.innerHTML += `
            <div class="bg-white p-6 rounded-xl shadow-md border-2" style="border-color:${color};">
                <div class="flex items-center justify-between">
                    <div class="flex items-center">
                        <span class="w-3 h-3 rounded-full mr-4" style="background-color: ${color};"></span>
                        <span class="font-bold text-lg text-gray-800">${faculty.name}</span>
                    </div>
                    <div class="text-right">
                        <span class="font-semibold text-teal-600">${faculty.total.toFixed(1)} / ${faculty.target} kg</span>
                        <span class="ml-2">${rankDisplay(index)}</span>
                    </div>
                </div>
                <div class="mt-3">
                    <div class="w-full bg-gray-200 rounded-full h-2">
                        <div class="h-2 rounded-full" style="width: ${progress}%; background-color: #34495e;"></div>
                    </div>
                    <div class="flex justify-between text-sm text-gray-500 mt-1">
                        <span>Pencapaian: ${progress.toFixed(0)}%</span>
                    </div>
                </div>
            </div>
        `;
    });
}

export function initFakultasPage(firebaseConfig) {
    initializeFirebase(firebaseConfig);
    db = getFirestoreInstance();
    if (!db) { console.error("Firestore DB is NOT available."); return; }
    
    reductionLeaderboardContainer = document.getElementById('reduction-leaderboard-container');
    targetLeaderboardContainer = document.getElementById('target-leaderboard-container');
    reductionBtnToday = document.getElementById('reduction-btn-today');
    reductionBtnWeekly = document.getElementById('reduction-btn-weekly');
    reductionBtnMonthly = document.getElementById('reduction-btn-monthly');
    targetBtnToday = document.getElementById('target-btn-today');
    targetBtnWeekly = document.getElementById('target-btn-weekly');
    targetBtnMonthly = document.getElementById('target-btn-monthly');

    if (!reductionLeaderboardContainer || !targetLeaderboardContainer || !reductionBtnToday || !targetBtnToday) {
        console.error("Missing required DOM elements for Fakultas page."); return;
    }

    updateCurrentDate('current-date');
    
    applyFilterButtonStyles('reduction');
    applyFilterButtonStyles('target');

    reductionBtnToday.addEventListener('click', () => { reductionFilter = 'today'; applyFilterButtonStyles('reduction'); renderAllLeaderboards(); });
    reductionBtnWeekly.addEventListener('click', () => { reductionFilter = 'weekly'; applyFilterButtonStyles('reduction'); renderAllLeaderboards(); });
    reductionBtnMonthly.addEventListener('click', () => { reductionFilter = 'monthly'; applyFilterButtonStyles('reduction'); renderAllLeaderboards(); });

    targetBtnToday.addEventListener('click', () => { targetFilter = 'today'; applyFilterButtonStyles('target'); renderAllLeaderboards(); });
    targetBtnWeekly.addEventListener('click', () => { targetFilter = 'weekly'; applyFilterButtonStyles('target'); renderAllLeaderboards(); });
    targetBtnMonthly.addEventListener('click', () => { targetFilter = 'monthly'; applyFilterButtonStyles('target'); renderAllLeaderboards(); });

    setupFakultasPageListener();
    setupGlobalSampahListener();
}