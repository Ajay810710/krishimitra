import { Injectable, OnModuleInit } from '@nestjs/common';
import { PrismaService } from '../database/prisma.service.js';

const CENTRAL_SCHEMES = [
  {
    name: 'PM Fasal Bima Yojana (PMFBY)',
    nameHindi: 'प्रधानमंत्री फसल बीमा योजना',
    category: 'INSURANCE' as const,
    description: 'Crop insurance scheme providing financial support to farmers suffering crop loss due to natural calamities, pests, and diseases.',
    descriptionHindi: 'प्राकृतिक आपदाओं, कीट और बीमारियों से फसल नुकसान होने पर किसानों को वित्तीय सहायता।',
    eligibility: 'All farmers growing notified crops in notified areas',
    benefit: 'Insurance coverage up to full sum insured; premium only 1.5-5% for farmers',
    deadline: 'Seasonal (Kharif: July 31, Rabi: December 31)',
    applyUrl: 'https://pmfby.gov.in',
  },
  {
    name: 'PM Kisan Samman Nidhi (PM-KISAN)',
    nameHindi: 'पीएम किसान सम्मान निधि',
    category: 'SUBSIDY' as const,
    description: 'Direct income support of ₹6,000 per year in three equal installments to small and marginal farmers.',
    descriptionHindi: 'छोटे और सीमांत किसानों को प्रति वर्ष ₹6,000 की प्रत्यक्ष आय सहायता।',
    eligibility: 'Farmer families with cultivable land; excludes institutional landholders',
    benefit: '₹6,000/year in 3 installments of ₹2,000 directly to bank account',
    deadline: 'Ongoing — register anytime',
    applyUrl: 'https://pmkisan.gov.in',
  },
  {
    name: 'Soil Health Card Scheme',
    nameHindi: 'मृदा स्वास्थ्य कार्ड योजना',
    category: 'SUBSIDY' as const,
    description: 'Free soil testing and health card with NPK status and fertilizer recommendations for every farmer.',
    descriptionHindi: 'हर किसान के लिए मुफ्त मिट्टी परीक्षण और NPK स्थिति के साथ उर्वरक अनुशंसा।',
    eligibility: 'All farmers with agricultural land',
    benefit: 'Free soil testing every 2 years; personalized fertilizer schedule',
    deadline: 'Ongoing',
    applyUrl: 'https://soilhealth.dac.gov.in',
  },
  {
    name: 'Kisan Credit Card (KCC)',
    nameHindi: 'किसान क्रेडिट कार्ड',
    category: 'LOAN' as const,
    description: 'Flexible credit facility for farmers to meet agricultural needs at subsidized interest rates.',
    descriptionHindi: 'किसानों को कृषि जरूरतों के लिए रियायती ब्याज दरों पर लचीली ऋण सुविधा।',
    eligibility: 'Farmers, tenant farmers, sharecroppers, and SHG members',
    benefit: 'Credit up to ₹3 lakh at 4% interest (with interest subvention); higher limits available',
    deadline: 'Ongoing — apply at any bank branch',
    applyUrl: 'https://www.nabard.org/content1.aspx?id=593',
  },
  {
    name: 'PM Krishi Sinchayee Yojana (PMKSY)',
    nameHindi: 'प्रधानमंत्री कृषि सिंचाई योजना',
    category: 'INFRASTRUCTURE' as const,
    description: 'Scheme for irrigation infrastructure development and water use efficiency (Har Khet Ko Pani, More Crop Per Drop).',
    descriptionHindi: 'सिंचाई बुनियादी ढांचे और जल उपयोग दक्षता के लिए योजना।',
    eligibility: 'All farmers; individual farmers get subsidy on drip/sprinkler systems',
    benefit: 'Up to 55% subsidy on micro-irrigation (drip/sprinkler) for small/marginal farmers',
    deadline: 'Ongoing',
    applyUrl: 'https://pmksy.gov.in',
  },
  {
    name: 'National Food Security Mission (NFSM)',
    nameHindi: 'राष्ट्रीय खाद्य सुरक्षा मिशन',
    category: 'SUBSIDY' as const,
    description: 'Subsidy on certified seeds, micro-nutrients, and improved farm equipment to boost rice, wheat, and pulse production.',
    descriptionHindi: 'चावल, गेहूं और दालों का उत्पादन बढ़ाने के लिए प्रमाणित बीज, सूक्ष्म पोषक तत्व और उपकरणों पर सब्सिडी।',
    eligibility: 'Farmers in notified districts growing rice, wheat, pulses, coarse cereals',
    benefit: 'Seed subsidy up to 50%; micro-nutrient subsidy up to 50%; equipment up to 40%',
    deadline: 'Annual (apply at block agriculture office)',
    applyUrl: 'https://nfsm.gov.in',
  },
  {
    name: 'Rashtriya Krishi Vikas Yojana (RKVY)',
    nameHindi: 'राष्ट्रीय कृषि विकास योजना',
    category: 'INFRASTRUCTURE' as const,
    description: 'Grants for agricultural infrastructure, horticulture, animal husbandry, fishery and agri-processing projects.',
    descriptionHindi: 'कृषि बुनियादी ढांचे, बागवानी, पशुपालन और कृषि प्रसंस्करण परियोजनाओं के लिए अनुदान।',
    eligibility: 'Farmer groups, FPOs, cooperatives; individual farmers via state schemes',
    benefit: 'Project-based grants up to ₹25 lakh for agri-entrepreneurs',
    deadline: 'Apply through state agriculture department',
    applyUrl: 'https://rkvy.nic.in',
  },
  {
    name: 'e-NAM (National Agriculture Market)',
    nameHindi: 'ई-नाम (राष्ट्रीय कृषि बाजार)',
    category: 'MARKET_SUPPORT' as const,
    description: 'Online trading platform connecting farmers directly to buyers across India, eliminating multiple middlemen.',
    descriptionHindi: 'बिचौलियों को हटाकर किसानों को सीधे खरीदारों से जोड़ने वाला ऑनलाइन व्यापार मंच।',
    eligibility: 'All farmers registered in any connected APMC mandi',
    benefit: 'Better price discovery; online payment directly to bank; reduced transport costs',
    deadline: 'Ongoing — register at nearest e-NAM mandi',
    applyUrl: 'https://enam.gov.in',
  },
  {
    name: 'Paramparagat Krishi Vikas Yojana (PKVY)',
    nameHindi: 'परंपरागत कृषि विकास योजना',
    category: 'SUBSIDY' as const,
    description: 'Promotion of organic farming with financial assistance for certification, inputs, and market linkage.',
    descriptionHindi: 'जैविक खेती को बढ़ावा देने के लिए प्रमाणन, इनपुट और बाजार लिंकेज के लिए वित्तीय सहायता।',
    eligibility: 'Farmers willing to adopt organic farming; cluster of minimum 50 acres',
    benefit: '₹50,000/hectare over 3 years for certification, inputs, and marketing',
    deadline: 'Apply through state agriculture department',
    applyUrl: 'https://pgsindia-ncof.gov.in',
  },
  {
    name: 'Agri Clinics and Agri Business Centres (ACABC)',
    nameHindi: 'कृषि क्लीनिक और कृषि व्यापार केंद्र',
    category: 'TRAINING' as const,
    description: 'Training and loan support for agricultural graduates to set up agri-clinics and advisory services for farmers.',
    descriptionHindi: 'कृषि स्नातकों को कृषि क्लीनिक और किसान सलाह सेवाएं स्थापित करने के लिए प्रशिक्षण और ऋण सहायता।',
    eligibility: 'Agriculture/related graduates seeking self-employment; farmers seeking expert advice',
    benefit: 'Free expert advisory via ACABC centres; 44-52% loan subsidy for agripreneurs',
    deadline: 'Ongoing',
    applyUrl: 'https://www.agriclinics.net',
  },
];

@Injectable()
export class SchemesService implements OnModuleInit {
  constructor(private readonly prisma: PrismaService) {}

  async onModuleInit() {
    const count = await this.prisma.scheme.count();
    if (count === 0) {
      await this.prisma.scheme.createMany({
        data: CENTRAL_SCHEMES.map((s) => ({
          name: s.name, nameHindi: s.nameHindi,
          category: s.category, description: s.description,
          descriptionHindi: s.descriptionHindi,
          eligibility: s.eligibility, benefit: s.benefit,
          deadline: s.deadline, applyUrl: s.applyUrl,
        })),
        skipDuplicates: true,
      });
    }
  }

  async getAll() {
    const schemes = await this.prisma.scheme.findMany({
      where: { isActive: true },
      orderBy: { category: 'asc' },
    });
    return { data: schemes };
  }

  async getEligible(farmerId: string) {
    const farmer = await this.prisma.farmer.findUnique({
      where: { id: farmerId },
      include: { _count: { select: { predictions: true } } },
    });

    const allSchemes = await this.prisma.scheme.findMany({ where: { isActive: true } });

    // Basic eligibility tagging (expandable as farmer profile grows)
    const tagged = allSchemes.map((scheme) => {
      let eligible = true;
      let reason = '';

      // e-NAM requires mandi connection
      if (scheme.name.includes('e-NAM') && !farmer?.mandiId) {
        eligible = false;
        reason = 'Connect to a mandi first';
      }

      return { ...scheme, eligible, reason };
    });

    return {
      data: {
        eligible: tagged.filter((s) => s.eligible),
        others:   tagged.filter((s) => !s.eligible),
        total: allSchemes.length,
      },
    };
  }
}
