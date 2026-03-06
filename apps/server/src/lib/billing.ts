import { env } from "@easypos/env/server";

/**
 * Paynow payment gateway client.
 *
 * Uses Paynow's Web-initiated Express Checkout flow:
 *  1. Create payment → get redirect URL + poll URL
 *  2. User pays via Paynow redirect page
 *  3. Server polls or receives webhook to confirm
 */

interface PaynowInitResponse {
  success: boolean;
  hasRedirect: boolean;
  redirectUrl?: string;
  pollUrl?: string;
  error?: string;
}

interface PaynowStatusResponse {
  paid: boolean;
  status: string;
  amount?: number;
  reference?: string;
}

/**
 * Initiate a Paynow payment (web-initiated).
 */
export async function initiatePaynowPayment(options: {
  reference: string;
  email: string;
  amount: number;
  description: string;
}): Promise<PaynowInitResponse> {
  const { reference, email, amount, description } = options;

  // Build the Paynow form data
  const values: Record<string, string> = {
    id: env.PAYNOW_INTEGRATION_ID,
    reference,
    amount: amount.toFixed(2),
    additionalinfo: description,
    // returnurl: HTTP endpoint on server that will redirect to deep link
    returnurl: `${env.PAYNOW_RETURN_URL}?reference=${reference}`,
    resulturl: env.PAYNOW_RESULT_URL,
    authemail: email,
    status: "Message",
  };

  // Generate hash
  const hashString =
    Object.values(values).join("") + env.PAYNOW_INTEGRATION_KEY;
  const hash = await generateHash(hashString);
  values.hash = hash;

  // POST to Paynow
  const body = new URLSearchParams(values);
  const res = await fetch("https://www.paynow.co.zw/interface/initiatetransaction", {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: body.toString(),
  });

  const text = await res.text();
  const parsed = parsePaynowResponse(text);

  if (parsed.status?.toLowerCase() === "ok") {
    return {
      success: true,
      hasRedirect: true,
      redirectUrl: parsed.browserurl,
      pollUrl: parsed.pollurl,
    };
  }

  return {
    success: false,
    hasRedirect: false,
    error: parsed.error || "Payment initiation failed",
  };
}

/**
 * Poll Paynow for the status of a transaction.
 */
export async function pollPaynowStatus(pollUrl: string): Promise<PaynowStatusResponse> {
  const res = await fetch(pollUrl);
  const text = await res.text();
  const parsed = parsePaynowResponse(text);

  const status = (parsed.status || "").toLowerCase();
  const paid = status === "paid" || status === "delivered";

  return {
    paid,
    status: parsed.status || "unknown",
    amount: parsed.amount ? parseFloat(parsed.amount) : undefined,
    reference: parsed.reference,
  };
}

/**
 * Parse Paynow's URL-encoded response text.
 */
function parsePaynowResponse(text: string): Record<string, string> {
  const result: Record<string, string> = {};
  for (const pair of text.split("&")) {
    const [key, ...rest] = pair.split("=");
    if (key) {
      result[decodeURIComponent(key).toLowerCase()] = decodeURIComponent(rest.join("="));
    }
  }
  return result;
}

/**
 * Generate SHA-512 hash for Paynow signature.
 */
async function generateHash(input: string): Promise<string> {
  const encoder = new TextEncoder();
  const data = encoder.encode(input);

  // Use Web Crypto API (available in Bun)
  const hashBuffer = await crypto.subtle.digest("SHA-512", data);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  return hashArray.map((b) => b.toString(16).padStart(2, "0")).join("").toUpperCase();
}
