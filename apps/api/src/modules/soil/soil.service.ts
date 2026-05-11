import { Injectable } from '@nestjs/common';
import { PrismaService } from '../database/prisma.service.js';

@Injectable()
export class SoilService {
  constructor(private readonly prisma: PrismaService) {}

  async getHistory(farmerId: string) {
    const tests = await this.prisma.soilTest.findMany({
      where: { farmerId },
      orderBy: { testDate: 'desc' },
      include: { landParcel: { select: { name: true } } },
    });
    return { data: tests };
  }

  async addTest(farmerId: string, dto: {
    testDate: string; landParcelId?: string; labName?: string;
    nitrogen?: number; phosphorus?: number; potassium?: number;
    ph?: number; organicMatter?: number; notes?: string;
  }) {
    const test = await this.prisma.soilTest.create({
      data: {
        farmerId,
        testDate: new Date(dto.testDate),
        landParcelId:  dto.landParcelId,
        labName:       dto.labName,
        nitrogen:      dto.nitrogen,
        phosphorus:    dto.phosphorus,
        potassium:     dto.potassium,
        ph:            dto.ph,
        organicMatter: dto.organicMatter,
        notes:         dto.notes,
      },
    });
    return { data: test };
  }

  async getHealthReport(farmerId: string) {
    const latest = await this.prisma.soilTest.findFirst({
      where: { farmerId },
      orderBy: { testDate: 'desc' },
    });

    if (!latest) {
      return {
        data: {
          hasData: false,
          message: 'No soil test recorded yet. Add your first test result.',
          messageHi: 'अभी तक कोई मिट्टी परीक्षण दर्ज नहीं है। पहला परिणाम जोड़ें।',
        },
      };
    }

    const recommendations: { nutrient: string; status: string; statusHi: string; advice: string; adviceHi: string }[] = [];

    // Nitrogen (kg/ha): Low <280, Medium 280-560, High >560
    if (latest.nitrogen !== null) {
      if (latest.nitrogen < 280) {
        recommendations.push({
          nutrient: 'Nitrogen (N)', status: 'Low', statusHi: 'कम',
          advice: 'Apply 60-80 kg/acre urea or use green manure crops (dhaincha, sunhemp)',
          adviceHi: 'यूरिया 60-80 kg/एकड़ डालें या हरी खाद की फसल (ढैंचा, सनई) उगाएं',
        });
      } else if (latest.nitrogen > 560) {
        recommendations.push({
          nutrient: 'Nitrogen (N)', status: 'High', statusHi: 'अधिक',
          advice: 'Reduce N fertilizer input — avoid leaching into groundwater',
          adviceHi: 'नाइट्रोजन उर्वरक कम करें — भूजल प्रदूषण से बचें',
        });
      }
    }

    // Phosphorus (kg/ha): Low <11, Medium 11-22, High >22
    if (latest.phosphorus !== null) {
      if (latest.phosphorus < 11) {
        recommendations.push({
          nutrient: 'Phosphorus (P)', status: 'Low', statusHi: 'कम',
          advice: 'Apply 30-40 kg/acre DAP or single superphosphate',
          adviceHi: 'DAP 30-40 kg/एकड़ या सिंगल सुपरफॉस्फेट डालें',
        });
      }
    }

    // Potassium (kg/ha): Low <109, Medium 109-280, High >280
    if (latest.potassium !== null) {
      if (latest.potassium < 109) {
        recommendations.push({
          nutrient: 'Potassium (K)', status: 'Low', statusHi: 'कम',
          advice: 'Apply 20-25 kg/acre MOP (muriate of potash)',
          adviceHi: 'MOP 20-25 kg/एकड़ डालें',
        });
      }
    }

    // pH: Optimal 6.0–7.5
    if (latest.ph !== null) {
      if (latest.ph < 5.5) {
        recommendations.push({
          nutrient: 'Soil pH', status: 'Acidic', statusHi: 'अम्लीय',
          advice: 'Apply lime (calcium carbonate) at 2-4 tons/acre to raise pH',
          adviceHi: 'pH बढ़ाने के लिए चूना 2-4 टन/एकड़ डालें',
        });
      } else if (latest.ph > 8.5) {
        recommendations.push({
          nutrient: 'Soil pH', status: 'Alkaline', statusHi: 'क्षारीय',
          advice: 'Apply gypsum or sulfur to lower pH; use acidifying fertilizers',
          adviceHi: 'pH कम करने के लिए जिप्सम या सल्फर डालें',
        });
      }
    }

    // Organic matter: Low <0.5%, Medium 0.5-0.75%, High >0.75%
    if (latest.organicMatter !== null && latest.organicMatter < 0.5) {
      recommendations.push({
        nutrient: 'Organic Matter', status: 'Low', statusHi: 'कम',
        advice: 'Add compost (FYM) at 4-5 tons/acre, practice crop rotation with legumes',
        adviceHi: 'FYM 4-5 टन/एकड़ डालें, दलहनी फसलों के साथ फसल चक्र अपनाएं',
      });
    }

    // Overall score 0–100
    let score = 70; // base
    if (recommendations.some((r) => r.status === 'Low' || r.status === 'Acidic' || r.status === 'Alkaline')) {
      score -= recommendations.length * 8;
    }
    score = Math.max(20, Math.min(100, score));

    const scoreLabel =
      score >= 75 ? { label: 'Good', labelHi: 'अच्छी', color: 'green' }
      : score >= 50 ? { label: 'Average', labelHi: 'औसत', color: 'amber' }
      : { label: 'Poor', labelHi: 'खराब', color: 'red' };

    return {
      data: {
        hasData: true,
        latestTest: latest,
        score,
        ...scoreLabel,
        recommendations,
        totalTests: await this.prisma.soilTest.count({ where: { farmerId } }),
      },
    };
  }
}
