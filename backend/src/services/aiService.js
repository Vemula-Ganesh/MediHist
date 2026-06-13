const openaiWrapper = require('../config/openai');

/**
 * Summarizes raw medical record files or text.
 * @param {string} title Record title
 * @param {string} description Record description
 * @param {string} rawText Extracted text from record if OCR/PDF text is active
 */
const summarizeReport = async (title, description = '', rawText = '') => {
  if (!openaiWrapper.isConfigured()) {
    return openaiWrapper.simulateMedicalReportAnalysis(title, description || rawText);
  }

  try {
    const prompt = `Analyze this medical record document and extract a patient-friendly summary.
Title: ${title}
Description: ${description}
Raw OCR Text: ${rawText}

You must return a JSON object containing exactly the following keys:
- "summary": A 1-2 sentence plain English explanation of what the report is about.
- "keyFindings": A bulleted list highlighting critical values or important findings.
- "followUpRecommendations": Actionable recommendations or tests recommended for the patient.

Format output as JSON:`;

    const response = await openaiWrapper.openai.chat.completions.create({
      model: 'gpt-4o-mini',
      messages: [{ role: 'user', content: prompt }],
      response_format: { type: 'json_object' }
    });

    const parsedData = JSON.parse(response.choices[0].message.content);
    return {
      summary: parsedData.summary || 'Summary extracted successfully.',
      keyFindings: parsedData.keyFindings || 'Standard findings.',
      followUpRecommendations: parsedData.followUpRecommendations || 'Routine follow-up.'
    };
  } catch (error) {
    console.error('❌ OpenAI Report Summarization Failed, returning simulated report:', error.message);
    return openaiWrapper.simulateMedicalReportAnalysis(title, description || rawText);
  }
};

/**
 * Generates holistic healthcare timeline insights
 * @param {Array} records User's medical record documents
 * @param {Array} medications User's current medication regimens
 */
const generateTimelineInsights = async (records = [], medications = []) => {
  if (!openaiWrapper.isConfigured()) {
    return openaiWrapper.simulateTimelineInsights(records, medications);
  }

  try {
    const recordsText = records.map(r => `- Date: ${r.uploadDate.toISOString().split('T')[0]}, Title: ${r.title}, Summary: ${r.summary}`).join('\n');
    const medsText = medications.map(m => `- Med: ${m.name}, Dosage: ${m.dosage}, Schedule: ${m.frequency}`).join('\n');

    const prompt = `Review this patient's medical timeline data and generate health insights.
Medical Record History:
${recordsText}

Current Active Regimens:
${medsText}

Provide clinical insights in a JSON structure containing:
- "healthTrends": Long-term health progression trends observed.
- "riskIndicators": Warnings, alerts, or risk adjustments needed based on files.
- "medicationAdherence": Critical advice regarding medication routines and compliance.

Return JSON format:`;

    const response = await openaiWrapper.openai.chat.completions.create({
      model: 'gpt-4o-mini',
      messages: [{ role: 'user', content: prompt }],
      response_format: { type: 'json_object' }
    });

    return JSON.parse(response.choices[0].message.content);
  } catch (error) {
    console.error('❌ OpenAI Timeline Analysis Failed, returning simulated trends:', error.message);
    return openaiWrapper.simulateTimelineInsights(records, medications);
  }
};

/**
 * Standardizes raw natural language queries to database filters
 * @param {string} query Natural language query string (e.g., "Show all cholesterol tests from last year")
 */
const classifyQuery = async (query) => {
  if (!openaiWrapper.isConfigured()) {
    return openaiWrapper.simulateSmartSearch(query);
  }

  try {
    const prompt = `Analyze this patient search query: "${query}".
Categorize it into standard filters.
Possible category slugs are: "lab-report", "prescription", "imaging-report", "discharge-summary", "vaccine-certificate".
Identify key medical terms or names to use as keywords.
Identify if the query specifies a particular year (e.g. "from last year" means 2025/2026, or "in 2024").

Return a JSON object:
{
  "categorySlug": "slug-name-or-null",
  "keywords": ["array", "of", "relevant", "clinical", "search", "terms"],
  "yearFilter": integerYearOrNull
}

Return JSON format:`;

    const response = await openaiWrapper.openai.chat.completions.create({
      model: 'gpt-4o-mini',
      messages: [{ role: 'user', content: prompt }],
      response_format: { type: 'json_object' }
    });

    return JSON.parse(response.choices[0].message.content);
  } catch (error) {
    console.error('❌ OpenAI Query Classification Failed, returning simulated classification:', error.message);
    return openaiWrapper.simulateSmartSearch(query);
  }
};

module.exports = {
  summarizeReport,
  generateTimelineInsights,
  classifyQuery
};
