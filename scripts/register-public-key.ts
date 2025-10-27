#!/usr/bin/env tsx
/**
 * Register Public Key with Meta WhatsApp Business API
 *
 * Usage: npm run register-key
 *
 * Prerequisites:
 * - .env file configured with:
 *   - META_ACCESS_TOKEN
 *   - META_PHONE_NUMBER_ID
 *   - PUBLIC_KEY
 *
 * Ref: https://developers.facebook.com/docs/whatsapp/cloud-api/reference/whatsapp-business-encryption/
 */

import axios from 'axios';
import * as dotenv from 'dotenv';
import * as path from 'path';

// Load environment variables
dotenv.config({ path: path.join(process.cwd(), '.env') });

interface RegisterKeyResponse {
  success: boolean;
}

async function registerPublicKey() {
  console.log('🔐 Registering Public Key with Meta WhatsApp Business API\n');

  // Validate environment variables
  const accessToken = process.env.META_ACCESS_TOKEN;
  const phoneNumberId = process.env.META_PHONE_NUMBER_ID;
  const publicKey = process.env.PUBLIC_KEY;

  if (!accessToken) {
    console.error('❌ META_ACCESS_TOKEN not found in .env');
    process.exit(1);
  }

  if (!phoneNumberId) {
    console.error('❌ META_PHONE_NUMBER_ID not found in .env');
    process.exit(1);
  }

  if (!publicKey) {
    console.error('❌ PUBLIC_KEY not found in .env');
    process.exit(1);
  }

  // Remove escaped newlines and format properly
  const formattedPublicKey = publicKey.replace(/\\n/g, '\n');

  const url = `https://graph.facebook.com/v18.0/${phoneNumberId}/whatsapp_business_encryption`;

  const payload = {
    business_public_key: formattedPublicKey,
  };

  console.log('📤 Sending request to Meta API...');
  console.log(`URL: ${url}\n`);

  try {
    const response = await axios.post<RegisterKeyResponse>(url, payload, {
      headers: {
        'Authorization': `Bearer ${accessToken}`,
        'Content-Type': 'application/json',
      },
    });

    if (response.data.success) {
      console.log('✅ Public key registered successfully!\n');
      console.log('📌 Your WhatsApp Flow endpoint can now receive encrypted requests.');
      console.log('📌 Make sure to configure your Flow Data API endpoint URL in Meta Business Manager.\n');
    } else {
      console.error('❌ Registration failed:', response.data);
      process.exit(1);
    }
  } catch (error) {
    if (axios.isAxiosError(error)) {
      console.error('❌ API Error:');
      console.error('Status:', error.response?.status);
      console.error('Data:', JSON.stringify(error.response?.data, null, 2));

      if (error.response?.status === 400) {
        console.error('\n💡 Tip: Make sure your PUBLIC_KEY in .env is properly formatted.');
        console.error('It should start with "-----BEGIN PUBLIC KEY-----" and include \\n for newlines.');
      }
    } else {
      console.error('❌ Unexpected error:', error);
    }
    process.exit(1);
  }
}

registerPublicKey();
