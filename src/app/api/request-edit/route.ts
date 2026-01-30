import { NextRequest, NextResponse } from 'next/server';
import { Resend } from 'resend';
import crypto from 'crypto';
import { setEditToken } from '@/lib/supabase';
import { logger } from '@/lib/logger';
import { logAuditEvent, getRecentEditRequestForResident } from '@/lib/audit';

const resend = new Resend(process.env.RESEND_API_KEY);

function generateEditToken(): string {
  return crypto.randomUUID();
}

export async function POST(request: NextRequest) {
  try {
    const { memberId, memberName, memberEmail } = await request.json();

    if (!memberEmail || !memberId) {
      logger.warn('Edit request failed - missing required fields', {
        endpoint: 'request-edit',
        hasMemberId: !!memberId,
        hasMemberEmail: !!memberEmail
      });
      return NextResponse.json(
        { success: false, error: 'Member ID and email address are required' },
        { status: 400 }
      );
    }

    // Check if an edit request was already sent recently
    const recentRequest = await getRecentEditRequestForResident(memberId, 24);
    if (recentRequest.exists) {
      logger.info('Edit request blocked - email already sent recently', {
        endpoint: 'request-edit',
        residentId: memberId,
        lastSentAt: recentRequest.sentAt?.toISOString()
      });
      return NextResponse.json({
        success: false,
        alreadySent: true,
        message: "We've already sent an edit link to this email address in the last 24 hours. Please check your inbox (and spam folder) for the previous email - that link is still valid!"
      });
    }

    const editToken = generateEditToken();
    const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || 'https://alumni.k9coliving.com';
    const editUrl = `${baseUrl}/thek9family?edit=${memberId}&token=${editToken}`;

    // Store token in database (expires in 3 days)
    await setEditToken(memberId, editToken, 72);

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
      logger.error('Edit request email failed to send', {
        endpoint: 'request-edit',
        residentId: memberId,
        error: error.message
      });
      return NextResponse.json(
        { success: false, error: error.message },
        { status: 500 }
      );
    }

    logger.info('Edit request email sent successfully', {
      endpoint: 'request-edit',
      residentId: memberId,
      residentName: memberName,
      messageId: data?.id
    });

    // Log to audit trail for spam prevention tracking
    const forwarded = request.headers.get('x-forwarded-for');
    const ip = forwarded ? forwarded.split(',')[0] :
               request.headers.get('x-real-ip') ||
               'unknown';
    const userAgent = request.headers.get('user-agent') || 'unknown';

    await logAuditEvent({
      event_type: 'edit_request_sent',
      ip_address: ip,
      user_agent: userAgent,
      details: {
        resident_id: memberId,
        resident_name: memberName,
        resident_email: memberEmail,
        message_id: data?.id
      }
    });

    return NextResponse.json({
      success: true,
      messageId: data?.id
    });

  } catch (error) {
    logger.error('Edit request failed with exception', {
      endpoint: 'request-edit',
      error: error instanceof Error ? error.message : 'Unknown error',
      stack: error instanceof Error ? error.stack : undefined
    });

    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}
