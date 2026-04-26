"use strict";
/**
 * Prisma seed script — populates the database with initial data.
 * Run with: pnpm db:seed
 */
Object.defineProperty(exports, "__esModule", { value: true });
const client_1 = require("@prisma/client");
const prisma = new client_1.PrismaClient();
/** 50 crops with multilingual names */
const crops = [
    // Vegetables
    { name: 'Tomato', nameHindi: 'टमाटर', nameKannada: 'ಟೊಮೆಟೊ', nameTelugu: 'టమోటా', nameTamil: 'தக்காளி', category: client_1.CropCategory.VEGETABLE, typicalDaysToHarvest: 75 },
    { name: 'Potato', nameHindi: 'आलू', nameKannada: 'ಆಲೂಗಡ್ಡೆ', nameTelugu: 'బంగాళదుంప', nameTamil: 'உருளைக்கிழங்கு', category: client_1.CropCategory.VEGETABLE, typicalDaysToHarvest: 90 },
    { name: 'Onion', nameHindi: 'प्याज', nameKannada: 'ಈರುಳ್ಳಿ', nameTelugu: 'ఉల్లిపాయ', nameTamil: 'வெங்காயம்', category: client_1.CropCategory.VEGETABLE, typicalDaysToHarvest: 120 },
    { name: 'Brinjal', nameHindi: 'बैंगन', nameKannada: 'ಬದನೆಕಾಯಿ', nameTelugu: 'వంకాయ', nameTamil: 'கத்தரிக்காய்', category: client_1.CropCategory.VEGETABLE, typicalDaysToHarvest: 80 },
    { name: 'Green Chilli', nameHindi: 'हरी मिर्च', nameKannada: 'ಹಸಿ ಮೆಣಸಿನಕಾಯಿ', nameTelugu: 'పచ్చి మిర్చి', nameTamil: 'பச்சை மிளகாய்', category: client_1.CropCategory.VEGETABLE, typicalDaysToHarvest: 70 },
    { name: 'Bhindi', nameHindi: 'भिंडी', nameKannada: 'ಬೆಂಡೆಕಾಯಿ', nameTelugu: 'బెండకాయ', nameTamil: 'வெண்டைக்காய்', category: client_1.CropCategory.VEGETABLE, typicalDaysToHarvest: 60 },
    { name: 'Cabbage', nameHindi: 'पत्तागोभी', nameKannada: 'ಎಲೆಕೋಸು', nameTelugu: 'క్యాబేజీ', nameTamil: 'முட்டைக்கோஸ்', category: client_1.CropCategory.VEGETABLE, typicalDaysToHarvest: 90 },
    { name: 'Cauliflower', nameHindi: 'फूलगोभी', nameKannada: 'ಹೂಕೋಸು', nameTelugu: 'కాలీఫ్లవర్', nameTamil: 'காலிஃப்ளவர்', category: client_1.CropCategory.VEGETABLE, typicalDaysToHarvest: 85 },
    { name: 'Carrot', nameHindi: 'गाजर', nameKannada: 'ಕ್ಯಾರೆಟ್', nameTelugu: 'క్యారట్', nameTamil: 'கேரட்', category: client_1.CropCategory.VEGETABLE, typicalDaysToHarvest: 80 },
    { name: 'Beetroot', nameHindi: 'चुकंदर', nameKannada: 'ಬೀಟ್ರೂಟ್', nameTelugu: 'బీట్రూట్', nameTamil: 'பீட்ரூட்', category: client_1.CropCategory.VEGETABLE, typicalDaysToHarvest: 70 },
    { name: 'Radish', nameHindi: 'मूली', nameKannada: 'ಮೂಲಂಗಿ', nameTelugu: 'మూలంగి', nameTamil: 'முள்ளங்கி', category: client_1.CropCategory.VEGETABLE, typicalDaysToHarvest: 40 },
    { name: 'Spinach', nameHindi: 'पालक', nameKannada: 'ಪಾಲಕ್', nameTelugu: 'పాలకూర', nameTamil: 'பசலை கீரை', category: client_1.CropCategory.VEGETABLE, typicalDaysToHarvest: 40 },
    { name: 'Garlic', nameHindi: 'लहसुन', nameKannada: 'ಬೆಳ್ಳುಳ್ಳಿ', nameTelugu: 'వెల్లుల్లి', nameTamil: 'பூண்டு', category: client_1.CropCategory.VEGETABLE, typicalDaysToHarvest: 150 },
    { name: 'Ginger', nameHindi: 'अदरक', nameKannada: 'ಶುಂಠಿ', nameTelugu: 'అల్లం', nameTamil: 'இஞ்சி', category: client_1.CropCategory.VEGETABLE, typicalDaysToHarvest: 210 },
    { name: 'Bitter Gourd', nameHindi: 'करेला', nameKannada: 'ಹಾಗಲಕಾಯಿ', nameTelugu: 'కారేలా', nameTamil: 'பாவக்காய்', category: client_1.CropCategory.VEGETABLE, typicalDaysToHarvest: 65 },
    // Grains
    { name: 'Rice', nameHindi: 'चावल', nameKannada: 'ಅಕ್ಕಿ', nameTelugu: 'బియ్యం', nameTamil: 'அரிசி', category: client_1.CropCategory.GRAIN, typicalDaysToHarvest: 120 },
    { name: 'Wheat', nameHindi: 'गेहूं', nameKannada: 'ಗೋಧಿ', nameTelugu: 'గోధుమ', nameTamil: 'கோதுமை', category: client_1.CropCategory.GRAIN, typicalDaysToHarvest: 135 },
    { name: 'Maize', nameHindi: 'मक्का', nameKannada: 'ಮೆಕ್ಕೆಜೋಳ', nameTelugu: 'మొక్కజొన్న', nameTamil: 'மக்காச்சோளம்', category: client_1.CropCategory.GRAIN, typicalDaysToHarvest: 100 },
    { name: 'Jowar', nameHindi: 'ज्वार', nameKannada: 'ಜೋಳ', nameTelugu: 'జొన్న', nameTamil: 'சோளம்', category: client_1.CropCategory.GRAIN, typicalDaysToHarvest: 110 },
    { name: 'Bajra', nameHindi: 'बाजरा', nameKannada: 'ಸಜ್ಜೆ', nameTelugu: 'సజ్జ', nameTamil: 'கம்பு', category: client_1.CropCategory.GRAIN, typicalDaysToHarvest: 90 },
    { name: 'Ragi', nameHindi: 'रागी', nameKannada: 'ರಾಗಿ', nameTelugu: 'రాగి', nameTamil: 'கேழ்வரகு', category: client_1.CropCategory.GRAIN, typicalDaysToHarvest: 120 },
    // Fruits
    { name: 'Banana', nameHindi: 'केला', nameKannada: 'ಬಾಳೆಹಣ್ಣು', nameTelugu: 'అరటిపండు', nameTamil: 'வாழைப்பழம்', category: client_1.CropCategory.FRUIT, typicalDaysToHarvest: 300 },
    { name: 'Mango', nameHindi: 'आम', nameKannada: 'ಮಾವಿನಹಣ್ಣು', nameTelugu: 'మామిడిపండు', nameTamil: 'மாம்பழம்', category: client_1.CropCategory.FRUIT, typicalDaysToHarvest: 120 },
    { name: 'Pomegranate', nameHindi: 'अनार', nameKannada: 'ದಾಳಿಂಬೆ', nameTelugu: 'దానిమ్మ', nameTamil: 'மாதுளம்பழம்', category: client_1.CropCategory.FRUIT, typicalDaysToHarvest: 180 },
    { name: 'Grapes', nameHindi: 'अंगूर', nameKannada: 'ದ್ರಾಕ್ಷಿ', nameTelugu: 'ద్రాక్ష', nameTamil: 'திராட்சை', category: client_1.CropCategory.FRUIT, typicalDaysToHarvest: 150 },
    { name: 'Watermelon', nameHindi: 'तरबूज', nameKannada: 'ಕಲ್ಲಂಗಡಿ', nameTelugu: 'పుచ్చకాయ', nameTamil: 'தர்பூசணி', category: client_1.CropCategory.FRUIT, typicalDaysToHarvest: 80 },
    { name: 'Papaya', nameHindi: 'पपीता', nameKannada: 'ಪಪ್ಪಾಯಿ', nameTelugu: 'బొప్పాయి', nameTamil: 'பப்பாளி', category: client_1.CropCategory.FRUIT, typicalDaysToHarvest: 270 },
    // Spices
    { name: 'Turmeric', nameHindi: 'हल्दी', nameKannada: 'ಅರಿಶಿನ', nameTelugu: 'పసుపు', nameTamil: 'மஞ்சள்', category: client_1.CropCategory.SPICE, typicalDaysToHarvest: 240 },
    { name: 'Coriander', nameHindi: 'धनिया', nameKannada: 'ಕೊತ್ತಂಬರಿ', nameTelugu: 'కొత్తిమీర', nameTamil: 'கொத்தமல்லி', category: client_1.CropCategory.SPICE, typicalDaysToHarvest: 60 },
    { name: 'Cumin', nameHindi: 'जीरा', nameKannada: 'ಜೀರಿಗೆ', nameTelugu: 'జీలకర్ర', nameTamil: 'சீரகம்', category: client_1.CropCategory.SPICE, typicalDaysToHarvest: 120 },
    { name: 'Fenugreek', nameHindi: 'मेथी', nameKannada: 'ಮೆಂತ್ಯ', nameTelugu: 'మెంతి', nameTamil: 'வெந்தயம்', category: client_1.CropCategory.SPICE, typicalDaysToHarvest: 90 },
    { name: 'Red Chilli', nameHindi: 'लाल मिर्च', nameKannada: 'ಕೆಂಪು ಮೆಣಸಿನಕಾಯಿ', nameTelugu: 'ఎర్ర మిర్చి', nameTamil: 'சிவப்பு மிளகாய்', category: client_1.CropCategory.SPICE, typicalDaysToHarvest: 90 },
    { name: 'Pepper', nameHindi: 'काली मिर्च', nameKannada: 'ಕಾಳುಮೆಣಸು', nameTelugu: 'మిరియాలు', nameTamil: 'மிளகு', category: client_1.CropCategory.SPICE, typicalDaysToHarvest: 365 },
    // Pulses
    { name: 'Chickpea', nameHindi: 'चना', nameKannada: 'ಕಡಲೆ', nameTelugu: 'శనగలు', nameTamil: 'கொண்டைக்கடலை', category: client_1.CropCategory.PULSE, typicalDaysToHarvest: 100 },
    { name: 'Pigeon Pea', nameHindi: 'अरहर दाल', nameKannada: 'ತೊಗರಿ', nameTelugu: 'కంది', nameTamil: 'துவரை', category: client_1.CropCategory.PULSE, typicalDaysToHarvest: 180 },
    { name: 'Green Gram', nameHindi: 'मूंग दाल', nameKannada: 'ಹೆಸರುಬೇಳೆ', nameTelugu: 'పెసలు', nameTamil: 'பாசிப்பயறு', category: client_1.CropCategory.PULSE, typicalDaysToHarvest: 65 },
    { name: 'Black Gram', nameHindi: 'उड़द दाल', nameKannada: 'ಉದ್ದಿನಬೇಳೆ', nameTelugu: 'మినుములు', nameTamil: 'உளுந்து', category: client_1.CropCategory.PULSE, typicalDaysToHarvest: 70 },
    { name: 'Lentil', nameHindi: 'मसूर दाल', nameKannada: 'ಮಸೂರ', nameTelugu: 'మసూర్', nameTamil: 'மசூர் பருப்பு', category: client_1.CropCategory.PULSE, typicalDaysToHarvest: 110 },
    { name: 'Kidney Bean', nameHindi: 'राजमा', nameKannada: 'ರಾಜ್ಮಾ', nameTelugu: 'రాజ్మా', nameTamil: 'ராஜ்மா', category: client_1.CropCategory.PULSE, typicalDaysToHarvest: 100 },
    { name: 'Groundnut', nameHindi: 'मूंगफली', nameKannada: 'ಕಡಲೆಕಾಯಿ', nameTelugu: 'వేరుశనగ', nameTamil: 'வேர்க்கடலை', category: client_1.CropCategory.PULSE, typicalDaysToHarvest: 120 },
    // Oilseeds
    { name: 'Mustard', nameHindi: 'सरसों', nameKannada: 'ಸಾಸಿವೆ', nameTelugu: 'ఆవాలు', nameTamil: 'கடுகு', category: client_1.CropCategory.OILSEED, typicalDaysToHarvest: 110 },
    { name: 'Sunflower', nameHindi: 'सूरजमुखी', nameKannada: 'ಸೂರ್ಯಕಾಂತಿ', nameTelugu: 'పొద్దుతిరుగుడు', nameTamil: 'சூரியகாந்தி', category: client_1.CropCategory.OILSEED, typicalDaysToHarvest: 90 },
    { name: 'Sesame', nameHindi: 'तिल', nameKannada: 'ಎಳ್ಳು', nameTelugu: 'నువ్వులు', nameTamil: 'எள்', category: client_1.CropCategory.OILSEED, typicalDaysToHarvest: 90 },
    { name: 'Soybean', nameHindi: 'सोयाबीन', nameKannada: 'ಸೋಯಾಬೀನ್', nameTelugu: 'సోయాబీన్', nameTamil: 'சோயா பீன்', category: client_1.CropCategory.OILSEED, typicalDaysToHarvest: 100 },
    { name: 'Castor', nameHindi: 'अरंडी', nameKannada: 'ಹರಳು', nameTelugu: 'ఆముదం', nameTamil: 'ஆமணக்கு', category: client_1.CropCategory.OILSEED, typicalDaysToHarvest: 150 },
    { name: 'Linseed', nameHindi: 'अलसी', nameKannada: 'ಅಗಸೆ', nameTelugu: 'అవిసె', nameTamil: 'ஆளிவிதை', category: client_1.CropCategory.OILSEED, typicalDaysToHarvest: 120 },
    { name: 'Safflower', nameHindi: 'कुसुम', nameKannada: 'ಕುಸುಬೆ', nameTelugu: 'కుసుమ', nameTamil: 'குங்குமப்பூ விதை', category: client_1.CropCategory.OILSEED, typicalDaysToHarvest: 130 },
    { name: 'Cotton', nameHindi: 'कपास', nameKannada: 'ಹತ್ತಿ', nameTelugu: 'పత్తి', nameTamil: 'பருத்தி', category: client_1.CropCategory.OILSEED, typicalDaysToHarvest: 180 },
    { name: 'Sugarcane', nameHindi: 'गन्ना', nameKannada: 'ಕಬ್ಬು', nameTelugu: 'చెరకు', nameTamil: 'கரும்பு', category: client_1.CropCategory.GRAIN, typicalDaysToHarvest: 365 },
    { name: 'Sweet Potato', nameHindi: 'शकरकंद', nameKannada: 'ಸಿಹಿ ಗೆಣಸು', nameTelugu: 'చిలగడదుంప', nameTamil: 'சர்க்கரைவள்ளி', category: client_1.CropCategory.VEGETABLE, typicalDaysToHarvest: 120 },
];
/** 20 major mandis across 4 southern Indian states */
const mandis = [
    // Karnataka
    { name: 'Kolar APMC', district: 'Kolar', state: 'Karnataka', pincode: '563101', latitude: 13.1357, longitude: 78.1288 },
    { name: 'Belgaum APMC', district: 'Belagavi', state: 'Karnataka', pincode: '590001', latitude: 15.8497, longitude: 74.4977 },
    { name: 'Mysore APMC', district: 'Mysuru', state: 'Karnataka', pincode: '570001', latitude: 12.2958, longitude: 76.6394 },
    { name: 'Hubli APMC', district: 'Dharwad', state: 'Karnataka', pincode: '580020', latitude: 15.3647, longitude: 75.1240 },
    { name: 'Shimoga APMC', district: 'Shivamogga', state: 'Karnataka', pincode: '577201', latitude: 13.9299, longitude: 75.5681 },
    // Maharashtra
    { name: 'Pune APMC', district: 'Pune', state: 'Maharashtra', pincode: '411011', latitude: 18.5204, longitude: 73.8567 },
    { name: 'Nashik APMC', district: 'Nashik', state: 'Maharashtra', pincode: '422001', latitude: 19.9975, longitude: 73.7898 },
    { name: 'Nagpur APMC', district: 'Nagpur', state: 'Maharashtra', pincode: '440001', latitude: 21.1458, longitude: 79.0882 },
    { name: 'Solapur APMC', district: 'Solapur', state: 'Maharashtra', pincode: '413002', latitude: 17.6868, longitude: 75.9064 },
    { name: 'Kolhapur APMC', district: 'Kolhapur', state: 'Maharashtra', pincode: '416001', latitude: 16.7050, longitude: 74.2433 },
    // Telangana
    { name: 'Hyderabad APMC', district: 'Hyderabad', state: 'Telangana', pincode: '500001', latitude: 17.3850, longitude: 78.4867 },
    { name: 'Warangal APMC', district: 'Warangal', state: 'Telangana', pincode: '506002', latitude: 17.9689, longitude: 79.5941 },
    { name: 'Nizamabad APMC', district: 'Nizamabad', state: 'Telangana', pincode: '503001', latitude: 18.6725, longitude: 78.0942 },
    { name: 'Karimnagar APMC', district: 'Karimnagar', state: 'Telangana', pincode: '505001', latitude: 18.4386, longitude: 79.1288 },
    { name: 'Mahbubnagar APMC', district: 'Mahbubnagar', state: 'Telangana', pincode: '509001', latitude: 16.7488, longitude: 77.9875 },
    // Tamil Nadu
    { name: 'Chennai APMC', district: 'Chennai', state: 'Tamil Nadu', pincode: '600001', latitude: 13.0827, longitude: 80.2707 },
    { name: 'Coimbatore APMC', district: 'Coimbatore', state: 'Tamil Nadu', pincode: '641001', latitude: 11.0168, longitude: 76.9558 },
    { name: 'Madurai APMC', district: 'Madurai', state: 'Tamil Nadu', pincode: '625001', latitude: 9.9252, longitude: 78.1198 },
    { name: 'Salem APMC', district: 'Salem', state: 'Tamil Nadu', pincode: '636001', latitude: 11.6643, longitude: 78.1460 },
    { name: 'Trichy APMC', district: 'Tiruchirappalli', state: 'Tamil Nadu', pincode: '620001', latitude: 10.7905, longitude: 78.7047 },
];
async function main() {
    console.log('Seeding KrishiMitra database...');
    // ── Upsert crops ──────────────────────────────────────────────
    console.log(`Seeding ${crops.length} crops...`);
    for (const crop of crops) {
        await prisma.crop.upsert({
            where: { name: crop.name },
            update: crop,
            create: crop,
        });
    }
    // ── Upsert mandis ─────────────────────────────────────────────
    console.log(`Seeding ${mandis.length} mandis...`);
    for (const mandi of mandis) {
        await prisma.mandi.upsert({
            where: {
                // Create a composite identifier — name+district uniquely identifies a mandi
                id: (await prisma.mandi.findFirst({ where: { name: mandi.name, district: mandi.district } }))?.id ?? 'new',
            },
            update: mandi,
            create: mandi,
        });
    }
    // ── Create test farmer ────────────────────────────────────────
    const kolarMandi = await prisma.mandi.findFirst({ where: { name: 'Kolar APMC' } });
    console.log('Creating test farmer (phone: 9999999999)...');
    await prisma.farmer.upsert({
        where: { phone: '9999999999' },
        update: {},
        create: {
            phone: '9999999999',
            name: 'Test Farmer',
            isVerified: true,
            isActive: true,
            preferredLanguage: 'HINDI',
            village: 'Malur',
            district: 'Kolar',
            state: 'Karnataka',
            pincode: '563130',
            mandiId: kolarMandi?.id,
        },
    });
    console.log('Database seeded successfully!');
}
main()
    .catch((error) => {
    console.error('Seed failed:', error);
    process.exit(1);
})
    .finally(() => {
    void prisma.$disconnect();
});
//# sourceMappingURL=seed.js.map