"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const client_1 = require("@prisma/client");
const prisma = new client_1.PrismaClient();
const CROP_BASE_PRICES = {
    Tomato: 1800, Potato: 1200, Onion: 1500, Brinjal: 1100,
    'Green Chilli': 3500, Wheat: 2200, Rice: 2800, Maize: 1600,
    Soybean: 4800, Mustard: 5200, Garlic: 6000, Ginger: 7500,
    Coriander: 8000, Cumin: 22000, Turmeric: 9500, Chickpea: 5800,
    'Pigeon Pea': 6500, 'Green Gram': 7200, Groundnut: 5500, Cauliflower: 900,
    Spinach: 1200, Bhindi: 1800, Banana: 2200, Pomegranate: 8500,
    'Red Chilli': 12000, Jowar: 2600, Bajra: 2400,
    'Tomato (Hybrid)': 2200,
};
function generatePrice(base, dayOffset) {
    const seasonal = Math.sin((dayOffset / 90) * Math.PI * 2) * 0.15;
    const noise = (Math.random() - 0.5) * 0.2;
    const factor = 1 + seasonal + noise;
    const modal = Math.round(base * factor);
    const spread = modal * 0.12;
    return {
        min: Math.round(modal - spread),
        max: Math.round(modal + spread),
        modal,
    };
}
async function main() {
    const crops = await prisma.crop.findMany({ select: { id: true, name: true } });
    const mandis = await prisma.mandi.findMany({ select: { id: true, name: true } });
    console.log(`Seeding prices for ${crops.length} crops × ${mandis.length} mandis × 90 days…`);
    let total = 0;
    const today = new Date();
    for (const crop of crops) {
        const baseName = Object.keys(CROP_BASE_PRICES).find((k) => crop.name.toLowerCase().includes(k.toLowerCase()) || k.toLowerCase().includes(crop.name.toLowerCase()));
        const base = baseName ? CROP_BASE_PRICES[baseName] : 2000;
        for (const mandi of mandis) {
            const records = [];
            for (let d = 89; d >= 0; d--) {
                const date = new Date(today);
                date.setDate(date.getDate() - d);
                date.setHours(0, 0, 0, 0);
                const { min, max, modal } = generatePrice(base, 90 - d);
                records.push({
                    mandiId: mandi.id,
                    cropId: crop.id,
                    priceDate: date,
                    variety: '',
                    grade: '',
                    minPrice: min,
                    maxPrice: max,
                    modalPrice: modal,
                    minPriceKg: parseFloat((min / 100).toFixed(2)),
                    maxPriceKg: parseFloat((max / 100).toFixed(2)),
                    modalPriceKg: parseFloat((modal / 100).toFixed(2)),
                    source: 'SYNTHETIC',
                });
            }
            for (const r of records) {
                await prisma.mandiPrice.upsert({
                    where: {
                        mandiId_cropId_priceDate_variety_grade: {
                            mandiId: r.mandiId,
                            cropId: r.cropId,
                            priceDate: r.priceDate,
                            variety: r.variety,
                            grade: r.grade,
                        },
                    },
                    update: { minPrice: r.minPrice, maxPrice: r.maxPrice, modalPrice: r.modalPrice, minPriceKg: r.minPriceKg, maxPriceKg: r.maxPriceKg, modalPriceKg: r.modalPriceKg },
                    create: r,
                });
                total++;
            }
        }
        process.stdout.write(`  ${crop.name} ✓\n`);
    }
    console.log(`\nDone — inserted/updated ${total} price records.`);
}
main()
    .catch(console.error)
    .finally(() => prisma.$disconnect());
//# sourceMappingURL=seed-prices.js.map