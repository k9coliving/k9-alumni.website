import { NextResponse } from 'next/server';
import { Resend } from 'resend';
import crypto from 'crypto';
import { setEditToken } from '@/lib/supabase';

const resend = new Resend(process.env.RESEND_API_KEY);

function generateEditToken(): string {
  return crypto.randomUUID();
}

export async function POST(request: Request) {
  try {
    const { memberId, memberName, memberEmail } = await request.json();

    if (!memberEmail || !memberId) {
      return NextResponse.json(
        { success: false, error: 'Member ID and email address are required' },
        { status: 400 }
      );
    }

    const editToken = generateEditToken();
    const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || 'https://alumni.k9coliving.com';
    const editUrl = `${baseUrl}/thek9family?edit=${memberId}&token=${editToken}`;

    // Store token in database (expires in 24 hours)
    await setEditToken(memberId, editToken, 24);

    const { data, error } = await resend.emails.send({
      from: 'K9 Alumni <noreply@mail.k9coliving.com>',
      to: memberEmail,
      subject: 'Edit Your K9 Alumni Profile',
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <h2 style="color: #1f2937;">Hi ${memberName}!</h2>
          <p>Someone requested to edit your profile on the K9 Alumni website.</p>
          <p style="margin: 24px 0;">
            <a href="${editUrl}" style="display: inline-block; background-color: #2563eb; color: white; padding: 12px 24px; text-decoration: none; border-radius: 8px; font-weight: 500;">Click here to edit your profile</a>
          </p>
          <p style="color: #6b7280; font-size: 14px;">
            If you didn't request this, you can safely ignore this email.
          </p>
        </div>
      `
    });

    if (error) {
      console.error('Resend error:', error);
      return NextResponse.json(
        { success: false, error: error.message },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      messageId: data?.id
    });

  } catch (error) {
    console.error('Email request error:', error);

    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}
