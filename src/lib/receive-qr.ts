import * as Crypto from 'expo-crypto';

const QR_HASH_PREFIX = 'nearbypay:pay:v1:';
const TAG_PATTERN = /^[a-z0-9_]{1,30}$/;

export async function createReceiveQrPayload(tag: string): Promise<string> {
  const normalizedTag = tag.trim().replace(/^[@$]/, '').toLowerCase();
  if (!TAG_PATTERN.test(normalizedTag)) {
    throw new Error('A valid NearbyPay Cashtag is required to create a receive QR.');
  }
  const hash = await Crypto.digestStringAsync(
    Crypto.CryptoDigestAlgorithm.SHA256,
    `${QR_HASH_PREFIX}${normalizedTag}`,
  );
  const params = new URLSearchParams({ v: '1', tag: normalizedTag, hash });
  return `nearbypay://pay?${params.toString()}`;
}

export async function parseReceiveQrPayload(input: string): Promise<string> {
  const clean = input.trim();
  let tag = '';
  let version: string | null = null;
  let hash: string | null = null;

  try {
    const url = new URL(clean);
    if (url.protocol === 'nearbypay:' && url.hostname === 'pay') {
      tag = url.searchParams.get('tag') || '';
      version = url.searchParams.get('v');
      hash = url.searchParams.get('hash');
    } else if (url.protocol === 'https:' && url.hostname === 'nearbypay.me') {
      tag = url.pathname.match(/^\/@?([a-z0-9_]{1,30})\/?$/i)?.[1] || '';
    }
  } catch {
    tag = clean.replace(/^[@$]/, '');
  }

  tag = tag.toLowerCase();
  if (!TAG_PATTERN.test(tag)) {
    throw new Error('This is not a valid NearbyPay payment QR.');
  }
  if (version && version !== '1') {
    throw new Error('This payment QR version is not supported.');
  }
  if (hash) {
    const expectedHash = await Crypto.digestStringAsync(
      Crypto.CryptoDigestAlgorithm.SHA256,
      `${QR_HASH_PREFIX}${tag}`,
    );
    if (hash.toLowerCase() !== expectedHash.toLowerCase()) {
      throw new Error('The payment QR checksum is invalid. Scan it again.');
    }
  }

  return tag;
}