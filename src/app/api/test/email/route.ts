import { NextRequest, NextResponse } from 'next/server';
import {
  sendBookingConfirmation,
  sendOwnerNotification,
  sendPaymentFailureNotification,
} from '@/utils/email';

/**
 * Test endpoint for email system
 * GET /api/test/email?type=booking&email=test@example.com
 */
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const type = searchParams.get('type') || 'booking';
    const email = searchParams.get('email') || 'test@example.com';

    // Sample data for testing
    const sampleData = {
      customerEmail: email,
      customerName: 'João Silva (Teste)',
      hangarName: 'Hangar 15',
      hangarLocation: 'SBSP - Congonhas',
      checkIn: '2025-01-15',
      checkOut: '2025-01-20',
      nights: 5,
      totalPrice: 4500.0,
      confirmationNumber: `LTF-TEST-${Date.now()}`,
      paymentId: 'pi_test_1234567890',
    };

    let result;

    switch (type) {
      case 'booking':
        result = await sendBookingConfirmation(sampleData);
        break;

      case 'owner':
        result = await sendOwnerNotification({
          ownerEmail: email,
          ownerName: 'Maria Santos (Teste)',
          customerName: sampleData.customerName,
          hangarName: sampleData.hangarName,
          checkIn: sampleData.checkIn,
          checkOut: sampleData.checkOut,
          nights: sampleData.nights,
          totalPrice: sampleData.totalPrice,
          confirmationNumber: sampleData.confirmationNumber,
        });
        break;

      case 'failure':
        result = await sendPaymentFailureNotification({
          customerEmail: email,
          customerName: sampleData.customerName,
          hangarName: sampleData.hangarName,
          checkIn: sampleData.checkIn,
          checkOut: sampleData.checkOut,
          totalPrice: sampleData.totalPrice,
          failureReason: 'Cartão recusado pelo banco (TESTE)',
        });
        break;

      default:
        return NextResponse.json(
          { error: 'Invalid type. Use: booking, owner, or failure' },
          { status: 400 }
        );
    }

    if (result.success) {
      return NextResponse.json({
        success: true,
        message: `${type} email sent successfully to ${email}`,
        emailId: result.data?.id,
        data: sampleData,
      });
    } else {
      return NextResponse.json(
        {
          success: false,
          message: 'Email sending failed',
          error: result.error,
        },
        { status: 500 }
      );
    }
  } catch (error: any) {
    console.error('Test email error:', error);
    return NextResponse.json(
      { error: 'Server error', details: error?.message },
      { status: 500 }
    );
  }
}
