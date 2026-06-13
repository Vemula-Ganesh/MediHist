const { OpenAI } = require('openai');

let openai = null;
let isOpenAIConfigured = false;

if (process.env.OPENAI_API_KEY) {
  openai = new OpenAI({
    apiKey: process.env.OPENAI_API_KEY
  });
  isOpenAIConfigured = true;
  console.log('✅ OpenAI API service configured.');
} else {
  console.log('ℹ_ OpenAI API key not configured. Running with local Medical AI simulator.');
}

// Highly realistic mock AI generation for medical analysis
const simulateMedicalReportAnalysis = (title = '', description = '') => {
  const content = `${title} ${description}`.toLowerCase();
  
  let summary = 'The document represents a clinical evaluation. Patient is advised to monitor symptoms.';
  let keyFindings = '• Standard baseline measurements within normal physiological thresholds.';
  let followUpRecommendations = '• Standard clinical review in 6 months.\n• Routine blood panels.';

  if (content.includes('blood') || content.includes('cbc') || content.includes('hemoglobin')) {
    summary = 'Routine Complete Blood Count (CBC) analysis tracking essential cellular metrics, overall indicating standard oxygen-carrying capacity and immune markers.';
    keyFindings = '• Hemoglobin level: 14.2 g/dL (Optimal)\n• White Blood Cell count: 6,800/mcL (Normal range, no signs of acute infection)\n• Platelet count: 245,000/mcL (Adequate clotting factor)';
    followUpRecommendations = '• Maintain well-balanced iron intake.\n• Retest in 12 months for routine wellness tracking.';
  } else if (content.includes('cholesterol') || content.includes('lipid') || content.includes('ldl') || content.includes('hdl')) {
    summary = 'Lipid profile screening showing borderline elevated Low-Density Lipoprotein (LDL) levels with strong High-Density Lipoprotein (HDL) markers.';
    keyFindings = '• Total Cholesterol: 215 mg/dL (Borderline High)\n• LDL ("Bad") Cholesterol: 135 mg/dL (Elevated)\n• HDL ("Good") Cholesterol: 58 mg/dL (Healthy, protective range)\n• Triglycerides: 110 mg/dL (Optimal)';
    followUpRecommendations = '• Introduce daily cardiovascular exercise (30 mins walk/run).\n• Reduce intake of trans fats and high-sodium meals.\n• Check lipid panel again in 3 months.';
  } else if (content.includes('diabetes') || content.includes('sugar') || content.includes('hba1c') || content.includes('glucose')) {
    summary = 'Glycemic index evaluation indicating stable baseline glucose parameters, but with HbA1c testing suggesting pre-diabetic monitoring requirements.';
    keyFindings = '• Fasting Blood Glucose: 104 mg/dL (Impaired fasting glucose)\n• HbA1c Level: 5.9% (Indicative of Pre-diabetes range, 5.7% - 6.4%)\n• Insulin sensitivity indicators are moderately compromised.';
    followUpRecommendations = '• Establish a low-glycemic dietary plan with reduced processed carbohydrates.\n• Engage in active muscle-building workouts to support glucose uptake.\n• Recheck HbA1c status in 90 days.';
  } else if (content.includes('vaccin') || content.includes('covid') || content.includes('flu') || content.includes('hepatitis')) {
    summary = 'Immunization certification confirming successful administration of preventative vaccine dosage for immunological reinforcement.';
    keyFindings = '• Active immunization against target pathogen.\n• No severe immediate adverse reactions reported.\n• Standard anti-body titers expected to peak in 2 weeks.';
    followUpRecommendations = '• Follow-up for next booster doses as per national immunization calendar.\n• Retain certification copies for travel or institutional clearances.';
  } else if (content.includes('x-ray') || content.includes('imaging') || content.includes('mri') || content.includes('fracture')) {
    summary = 'Diagnostic imaging summary reviewing anatomical structures. Minimal localized signs of wear, with bones showing standard alignment.';
    keyFindings = '• No visible acute fractures or joint dislocations.\n• Soft tissue contours appear standard.\n• Minimal degenerative changes in lumbar spine noted, consistent with age.';
    followUpRecommendations = '• Consider physical therapy or core strengthening exercises.\n• Avoid heavy weight lifting without supervision.\n• Clinical correlation recommended if pain persists.';
  } else if (content.includes('allergy') || content.includes('rashes') || content.includes('asthma')) {
    summary = 'Allergen testing and clinical evaluation of hypersensitivity triggers.';
    keyFindings = '• Elevated IgE levels associated with seasonal pollen allergens.\n• Mild respiratory sensitivity triggered by dust mites.\n• No acute severe anaphylactic markers.';
    followUpRecommendations = '• Avoid prolonged outdoor exposure during high pollen count mornings.\n• Keep antihistamine (e.g., Cetirizine) on hand for flare-ups.\n• Use air purifiers equipped with HEPA filters in bedrooms.';
  }

  return { summary, keyFindings, followUpRecommendations };
};

const simulateTimelineInsights = (records = [], medications = []) => {
  let healthTrends = 'All clinical parameters are stable based on historical reports. Keep tracking your wellness checks.';
  let riskIndicators = 'Low risk. Baseline metrics do not indicate critical warnings.';
  let medicationAdherence = 'Ensure medications are taken as scheduled. Standard monitoring active.';

  const hasHighCholesterol = records.some(r => r.title.toLowerCase().includes('cholesterol') || (r.description && r.description.toLowerCase().includes('cholesterol')));
  const hasDiabetes = records.some(r => r.title.toLowerCase().includes('diabetes') || r.title.toLowerCase().includes('hba1c') || (r.description && r.description.toLowerCase().includes('glucose')));
  
  if (hasHighCholesterol && medications.some(m => m.name.toLowerCase().includes('statin') || m.name.toLowerCase().includes('atorvastatin'))) {
    healthTrends = 'Lipid profile trends show active medication management. Continue monitoring diet.';
    riskIndicators = 'Moderate cardiovascular risk due to borderline lipid values. Controlled with active therapy.';
    medicationAdherence = 'Atorvastatin tracking indicates regular dose compliance is critical to stabilize LDL targets.';
  } else if (hasDiabetes) {
    healthTrends = 'HbA1c curves suggest early metabolic shifts. Daily monitoring is advised.';
    riskIndicators = 'Risk of diabetic progression if glycemic indexes remain unmanaged.';
    medicationAdherence = 'Regular checkups for Metformin or related daily regulators show that missing doses increases morning glucose surges by 15%.';
  } else if (medications.length > 0) {
    medicationAdherence = `You currently have ${medications.length} active prescriptions. Adherence is estimated at 85%. Make sure to refill on time.`;
  }

  return { healthTrends, riskIndicators, medicationAdherence };
};

const simulateSmartSearch = (query = '') => {
  const q = query.toLowerCase();
  
  if (q.includes('diabetes') || q.includes('sugar') || q.includes('hba1c')) {
    return { categorySlug: 'lab-report', keywords: ['diabetes', 'sugar', 'hba1c', 'glucose'], yearFilter: null };
  }
  if (q.includes('cholesterol') || q.includes('lipid') || q.includes('cardio') || q.includes('heart')) {
    return { categorySlug: 'lab-report', keywords: ['cholesterol', 'lipid', 'ldl', 'hdl'], yearFilter: null };
  }
  if (q.includes('prescription') || q.includes('medication') || q.includes('doctor') || q.includes('visit')) {
    return { categorySlug: 'prescription', keywords: [], yearFilter: null };
  }
  if (q.includes('vaccin') || q.includes('immun') || q.includes('dose') || q.includes('booster')) {
    return { categorySlug: 'vaccine-certificate', keywords: ['vaccin', 'covid', 'flu'], yearFilter: null };
  }
  
  // Extract year if any matches
  const matchYear = q.match(/\b(20\d{2})\b/);
  const yearFilter = matchYear ? parseInt(matchYear[1]) : null;

  return { categorySlug: null, keywords: q.split(' ').filter(w => w.length > 3), yearFilter };
};

module.exports = {
  openai,
  isConfigured: () => isOpenAIConfigured,
  simulateMedicalReportAnalysis,
  simulateTimelineInsights,
  simulateSmartSearch
};
