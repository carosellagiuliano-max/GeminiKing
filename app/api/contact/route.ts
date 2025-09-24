import { NextResponse } from 'next/server';
import { contactSchema } from '@/lib/validation/contact';
import { rateLimit, rateLimitHeaders } from '@/lib/rate-limit';
import { sendContactRequest } from '@/lib/mail';

export async function POST(req: Request) {
  const ip = req.headers.get('x-forwarded-for')?.split(',')[0]?.trim() ?? 'anonymous';
  const { allowed, remaining, reset, window } = await rateLimit(`contact:${ip}`, 3, 60 * 60 * 6);
  const headers = rateLimitHeaders(3, remaining, reset, window);

  if (!allowed) {
    return new NextResponse(JSON.stringify({ message: 'Zu viele Anfragen. Bitte versuche es später erneut.' }), {
      status: 429,
      headers,
    });
  }

  let payload;
  try {
    payload = contactSchema.parse(await req.json());
  } catch (error) {
    return new NextResponse(JSON.stringify({ message: 'Ungültige Eingaben', error: String(error) }), {
      status: 400,
      headers,
    });
  }

  await sendContactRequest({
    name: payload.name,
    email: payload.email,
    message: payload.message,
    source: ip,
  });

  return new NextResponse(JSON.stringify({ success: true }), {
    status: 200,
    headers,
  });
}
