// src/lib/2fa.ts
import { OTP } from 'otplib/class';
import { crypto } from '@otplib/plugin-crypto-noble';
import { base32 } from '@otplib/plugin-base32-scure';
import qrcode from 'qrcode';

const otplib = new OTP({
  crypto,
  base32
});

export async function generateTwoFactorSecret(username: string) {
  const secret = otplib.generateSecret();
  const otpauth = otplib.generateURI({ secret, label: username, issuer: 'RapTM' });
  const qrCodeUrl = await qrcode.toDataURL(otpauth);
  
  return { secret, qrCodeUrl };
}

export function verifyTwoFactorToken(token: string, secret: string) {
  return otplib.verifySync({ token, secret });
}