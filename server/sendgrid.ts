import { MailService } from '@sendgrid/mail';

// Initialize SendGrid only if API key is available
let mailService: MailService | null = null;
const isEmailEnabled = !!process.env.SENDGRID_API_KEY;

if (isEmailEnabled) {
  mailService = new MailService();
  mailService.setApiKey(process.env.SENDGRID_API_KEY!);
  console.log('📧 SendGrid email service initialized');
} else {
  console.log('⚠️  SendGrid API key not found - email functionality disabled');
}

interface EmailParams {
  to: string;
  from: string;
  subject: string;
  text?: string;
  html?: string;
}

interface BookingConfirmationData {
  bookingId: string;
  propertyName: string;
  guestName: string;
  checkIn: string;
  checkOut: string;
  nights: number;
  rooms: number;
  guests: number;
  totalPrice: number;
  gstAmount?: number;
  currencySymbol: string;
}

export async function sendEmail(params: EmailParams): Promise<boolean> {
  if (!isEmailEnabled || !mailService) {
    console.log(`📧 Email would be sent to ${params.to}: ${params.subject}`);
    console.log('⚠️  Email not sent - SendGrid not configured');
    return false; // Return false but don't crash
  }

  try {
    await mailService.send({
      to: params.to,
      from: params.from,
      subject: params.subject,
      text: params.text,
      html: params.html,
    });
    console.log(`📧 Email successfully sent to ${params.to}: ${params.subject}`);
    return true;
  } catch (error) {
    console.error('SendGrid email error:', error);
    return false;
  }
}

export async function sendBookingConfirmationToGuest(
  guestEmail: string,
  booking: BookingConfirmationData
): Promise<boolean> {
  const subject = `Booking Confirmed - ${booking.propertyName}`;
  const html = `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
      <h2 style="color: #10b981;">🎉 Booking Confirmed!</h2>
      
      <p>Dear ${booking.guestName},</p>
      
      <p>Your booking has been confirmed. Here are your booking details:</p>
      
      <div style="background: #f9fafb; padding: 20px; border-radius: 8px; margin: 20px 0;">
        <h3 style="margin-top: 0; color: #374151;">Booking Details</h3>
        <p><strong>Booking ID:</strong> ${booking.bookingId}</p>
        <p><strong>Property:</strong> ${booking.propertyName}</p>
        <p><strong>Check-in:</strong> ${booking.checkIn}</p>
        <p><strong>Check-out:</strong> ${booking.checkOut}</p>
        <p><strong>Duration:</strong> ${booking.nights} night${booking.nights !== 1 ? 's' : ''}</p>
        <p><strong>Rooms:</strong> ${booking.rooms}</p>
        <p><strong>Guests:</strong> ${booking.guests}</p>
        <p><strong>Total Amount:</strong> ${booking.currencySymbol}${booking.totalPrice.toLocaleString()}</p>
        ${booking.gstAmount ? `<p><strong>GST Included:</strong> ${booking.currencySymbol}${booking.gstAmount.toFixed(2)}</p>` : ''}
      </div>
      
      <p>We look forward to hosting you!</p>
      
      <p>Best regards,<br>Your Travel Booking Team</p>
    </div>
  `;

  return sendEmail({
    to: guestEmail,
    from: 'bookings@yourdomain.com', // You should configure this with your verified sender
    subject,
    html,
    text: `Booking Confirmed - ${booking.propertyName}\n\nBooking ID: ${booking.bookingId}\nProperty: ${booking.propertyName}\nCheck-in: ${booking.checkIn}\nCheck-out: ${booking.checkOut}\nTotal: ${booking.currencySymbol}${booking.totalPrice}`
  });
}

export async function sendBookingNotificationToOwner(
  ownerEmail: string,
  booking: BookingConfirmationData
): Promise<boolean> {
  const subject = `New Booking - ${booking.propertyName}`;
  const html = `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
      <h2 style="color: #059669;">🏨 New Booking Received</h2>
      
      <p>You have received a new booking for your property:</p>
      
      <div style="background: #f0fdf4; padding: 20px; border-radius: 8px; margin: 20px 0; border-left: 4px solid #10b981;">
        <h3 style="margin-top: 0; color: #374151;">Booking Details</h3>
        <p><strong>Booking ID:</strong> ${booking.bookingId}</p>
        <p><strong>Property:</strong> ${booking.propertyName}</p>
        <p><strong>Guest:</strong> ${booking.guestName}</p>
        <p><strong>Check-in:</strong> ${booking.checkIn}</p>
        <p><strong>Check-out:</strong> ${booking.checkOut}</p>
        <p><strong>Duration:</strong> ${booking.nights} night${booking.nights !== 1 ? 's' : ''}</p>
        <p><strong>Rooms:</strong> ${booking.rooms}</p>
        <p><strong>Guests:</strong> ${booking.guests}</p>
        <p><strong>Total Revenue:</strong> ${booking.currencySymbol}${booking.totalPrice.toLocaleString()}</p>
      </div>
      
      <p>Please prepare for the guest's arrival and ensure the rooms are ready.</p>
      
      <p>Best regards,<br>Property Management System</p>
    </div>
  `;

  return sendEmail({
    to: ownerEmail,
    from: 'bookings@yourdomain.com', // You should configure this with your verified sender
    subject,
    html,
    text: `New Booking - ${booking.propertyName}\n\nBooking ID: ${booking.bookingId}\nGuest: ${booking.guestName}\nCheck-in: ${booking.checkIn}\nCheck-out: ${booking.checkOut}\nTotal: ${booking.currencySymbol}${booking.totalPrice}`
  });
}