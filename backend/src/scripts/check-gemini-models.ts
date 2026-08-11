import dotenv from 'dotenv';
import path from 'path';

dotenv.config({ path: path.resolve(__dirname, '../../../.env') });
dotenv.config({ path: path.resolve(__dirname, '../../.env') });
dotenv.config();

async function checkGeminiModels() {
  const keysSet = new Set<string>();

  if (process.env.GEMINI_API_KEYS) {
    process.env.GEMINI_API_KEYS.split(',')
      .map(k => k.trim())
      .filter(k => k.length > 0)
      .forEach(k => keysSet.add(k));
  }

  if (process.env.GEMINI_API_KEY && process.env.GEMINI_API_KEY.trim()) {
    process.env.GEMINI_API_KEY.split(',')
      .map(k => k.trim())
      .filter(k => k.length > 0)
      .forEach(k => keysSet.add(k));
  }

  for (let i = 1; i <= 5; i++) {
    const key = process.env[`GEMINI_API_KEY_${i}`];
    if (key && key.trim()) {
      keysSet.add(key.trim());
    }
  }

  const keys = Array.from(keysSet);

  if (keys.length === 0) {
    console.error('❌ Error: No GEMINI_API_KEY found in .env file!');
    process.exit(1);
  }

  console.log(`\n🔍 Found ${keys.length} API key(s) in environment. Fetching available models...\n`);

  for (let idx = 0; idx < keys.length; idx++) {
    const apiKey = keys[idx];
    const maskedKey = `${apiKey.slice(0, 6)}...${apiKey.slice(-4)}`;
    console.log(`=== [Key #${idx + 1}: ${maskedKey}] ===`);

    const url = `https://generativelanguage.googleapis.com/v1beta/models?key=${apiKey}`;

    try {
      const response = await fetch(url);
      const data = await response.json();

      if (!response.ok) {
        console.error(`❌ Error fetching models (${response.status}):`, data.error?.message || response.statusText);
        continue;
      }

      if (!data.models || !Array.isArray(data.models)) {
        console.warn('⚠️ No models returned in API payload.');
        continue;
      }

      console.log(`✅ ${data.models.length} Available Models:\n`);
      for (const model of data.models) {
        const methods = model.supportedGenerationMethods ? model.supportedGenerationMethods.join(', ') : 'N/A';
        console.log(`  • ${model.name}`);
        console.log(`    - Display Name: ${model.displayName || 'N/A'}`);
        console.log(`    - Supported Methods: ${methods}`);
        console.log(`    - Input Token Limit: ${model.inputTokenLimit || 'N/A'}\n`);
      }
    } catch (err: any) {
      console.error(`❌ Request failed for Key #${idx + 1}:`, err.message);
    }
  }
}

checkGeminiModels();
