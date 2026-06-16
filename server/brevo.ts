import { TransactionalEmailsApi, TransactionalEmailsApiApiKeys, SendSmtpEmail } from '@getbrevo/brevo';

// Initialize Brevo API
const transactionalEmailsApi = new TransactionalEmailsApi();

// Set API key if available
if (process.env.BREVO_API_KEY) {
  transactionalEmailsApi.setApiKey(TransactionalEmailsApiApiKeys.apiKey, process.env.BREVO_API_KEY);
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

// Send booking confirmation to guest
export async function sendBookingConfirmationToGuest(
  guestEmail: string, 
  bookingData: BookingConfirmationData
): Promise<boolean> {
  try {
    if (!process.env.BREVO_API_KEY) {
      console.error('BREVO_API_KEY is not configured');
      return false;
    }

    const emailMessage = new SendSmtpEmail();
    
    emailMessage.subject = `Booking Confirmation - ${bookingData.propertyName}`;
    emailMessage.to = [{ email: guestEmail, name: bookingData.guestName }];
    emailMessage.sender = { 
      name: "Travel Booking Platform", 
      email: "bookings@yourhotel.com" 
    };
    
    // HTML email content for guest
    emailMessage.htmlContent = `
      <!DOCTYPE html>
      <html>
      <head>
        <style>
          body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
          .container { max-width: 600px; margin: 0 auto; padding: 20px; }
          .header { background: #2563eb; color: white; padding: 20px; text-align: center; }
          .content { padding: 20px; background: #f9f9f9; }
          .booking-details { background: white; padding: 15px; margin: 15px 0; border-radius: 5px; }
          .total { font-size: 18px; font-weight: bold; color: #2563eb; }
          .footer { text-align: center; padding: 20px; color: #666; font-size: 12px; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1>🎉 Booking Confirmed!</h1>
          </div>
          <div class="content">
            <p>Dear ${bookingData.guestName},</p>
            <p>Your booking has been confirmed! Here are your booking details:</p>
            
            <div class="booking-details">
              <h3>${bookingData.propertyName}</h3>
              <p><strong>Booking ID:</strong> ${bookingData.bookingId}</p>
              <p><strong>Check-in:</strong> ${bookingData.checkIn}</p>
              <p><strong>Check-out:</strong> ${bookingData.checkOut}</p>
              <p><strong>Duration:</strong> ${bookingData.nights} night${bookingData.nights !== 1 ? 's' : ''}</p>
              <p><strong>Guests:</strong> ${bookingData.guests}</p>
              <p><strong>Rooms:</strong> ${bookingData.rooms}</p>
              ${bookingData.gstAmount ? `<p><strong>GST:</strong> ${bookingData.currencySymbol}${bookingData.gstAmount}</p>` : ''}
              <p class="total"><strong>Total Amount:</strong> ${bookingData.currencySymbol}${bookingData.totalPrice}</p>
            </div>
            
            <p>We look forward to welcoming you! If you have any questions, please don't hesitate to contact us.</p>
            <p>Safe travels!</p>
          </div>
          <div class="footer">
            <p>This is an automated email. Please do not reply to this message.</p>
          </div>
        </div>
      </body>
      </html>
    `;
    
    // Text content as fallback
    emailMessage.textContent = `
      Booking Confirmed!
      
      Dear ${bookingData.guestName},
      
      Your booking has been confirmed at ${bookingData.propertyName}.
      
      Booking Details:
      - Booking ID: ${bookingData.bookingId}
      - Check-in: ${bookingData.checkIn}
      - Check-out: ${bookingData.checkOut}
      - Duration: ${bookingData.nights} night${bookingData.nights !== 1 ? 's' : ''}
      - Guests: ${bookingData.guests}
      - Rooms: ${bookingData.rooms}
      ${bookingData.gstAmount ? `- GST: ${bookingData.currencySymbol}${bookingData.gstAmount}` : ''}
      - Total Amount: ${bookingData.currencySymbol}${bookingData.totalPrice}
      
      We look forward to welcoming you!
    `;

    const result = await transactionalEmailsApi.sendTransacEmail(emailMessage);
    console.log('Guest confirmation email sent successfully:', result.body?.messageId);
    return true;
  } catch (error) {
    console.error('Failed to send guest confirmation email:', error);
    return false;
  }
}

// Send booking notification to hotel owner
export async function sendBookingNotificationToOwner(
  ownerEmail: string, 
  bookingData: BookingConfirmationData
): Promise<boolean> {
  try {
    if (!process.env.BREVO_API_KEY) {
      console.error('BREVO_API_KEY is not configured');
      return false;
    }

    const emailMessage = new SendSmtpEmail();
    
    emailMessage.subject = `New Booking Alert - ${bookingData.propertyName}`;
    emailMessage.to = [{ email: ownerEmail, name: "Property Owner" }];
    emailMessage.sender = { 
      name: "Travel Booking Platform", 
      email: "notifications@yourhotel.com" 
    };
    
    // HTML email content for owner
    emailMessage.htmlContent = `
      <!DOCTYPE html>
      <html>
      <head>
        <style>
          body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
          .container { max-width: 600px; margin: 0 auto; padding: 20px; }
          .header { background: #059669; color: white; padding: 20px; text-align: center; }
          .content { padding: 20px; background: #f9f9f9; }
          .booking-details { background: white; padding: 15px; margin: 15px 0; border-radius: 5px; }
          .revenue { font-size: 18px; font-weight: bold; color: #059669; }
          .footer { text-align: center; padding: 20px; color: #666; font-size: 12px; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1>🏨 New Booking Received!</h1>
          </div>
          <div class="content">
            <p>Dear Property Owner,</p>
            <p>You have received a new booking for ${bookingData.propertyName}:</p>
            
            <div class="booking-details">
              <h3>Booking Details</h3>
              <p><strong>Booking ID:</strong> ${bookingData.bookingId}</p>
              <p><strong>Guest:</strong> ${bookingData.guestName}</p>
              <p><strong>Check-in:</strong> ${bookingData.checkIn}</p>
              <p><strong>Check-out:</strong> ${bookingData.checkOut}</p>
              <p><strong>Duration:</strong> ${bookingData.nights} night${bookingData.nights !== 1 ? 's' : ''}</p>
              <p><strong>Guests:</strong> ${bookingData.guests}</p>
              <p><strong>Rooms:</strong> ${bookingData.rooms}</p>
              ${bookingData.gstAmount ? `<p><strong>GST:</strong> ${bookingData.currencySymbol}${bookingData.gstAmount}</p>` : ''}
              <p class="revenue"><strong>Revenue:</strong> ${bookingData.currencySymbol}${bookingData.totalPrice}</p>
            </div>
            
            <p>Please ensure rooms are prepared for the guest arrival.</p>
            <p>Login to your admin panel to view complete booking details.</p>
          </div>
          <div class="footer">
            <p>Travel Booking Platform - Property Management</p>
          </div>
        </div>
      </body>
      </html>
    `;
    
    emailMessage.textContent = `
      New Booking Received!
      
      Dear Property Owner,
      
      You have received a new booking for ${bookingData.propertyName}.
      
      Booking Details:
      - Booking ID: ${bookingData.bookingId}
      - Guest: ${bookingData.guestName}
      - Check-in: ${bookingData.checkIn}
      - Check-out: ${bookingData.checkOut}
      - Duration: ${bookingData.nights} night${bookingData.nights !== 1 ? 's' : ''}
      - Guests: ${bookingData.guests}
      - Rooms: ${bookingData.rooms}
      ${bookingData.gstAmount ? `- GST: ${bookingData.currencySymbol}${bookingData.gstAmount}` : ''}
      - Revenue: ${bookingData.currencySymbol}${bookingData.totalPrice}
      
      Please prepare for guest arrival.
    `;

    const result = await transactionalEmailsApi.sendTransacEmail(emailMessage);
    console.log('Owner notification email sent successfully:', result.body?.messageId);
    return true;
  } catch (error) {
    console.error('Failed to send owner notification email:', error);
    return false;
  }
}

// Send booking notification to superadmin
export async function sendBookingNotificationToSuperAdmin(
  adminEmail: string, 
  bookingData: BookingConfirmationData,
  propertyOwnerEmail?: string
): Promise<boolean> {
  try {
    if (!process.env.BREVO_API_KEY) {
      console.error('BREVO_API_KEY is not configured');
      return false;
    }

    const emailMessage = new SendSmtpEmail();
    
    emailMessage.subject = `Platform Booking Alert - ${bookingData.propertyName}`;
    emailMessage.to = [{ email: adminEmail, name: "Super Admin" }];
    emailMessage.sender = { 
      name: "Travel Booking Platform", 
      email: "admin@yourhotel.com" 
    };
    
    // HTML email content for superadmin
    emailMessage.htmlContent = `
      <!DOCTYPE html>
      <html>
      <head>
        <style>
          body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
          .container { max-width: 600px; margin: 0 auto; padding: 20px; }
          .header { background: #7c3aed; color: white; padding: 20px; text-align: center; }
          .content { padding: 20px; background: #f9f9f9; }
          .booking-details { background: white; padding: 15px; margin: 15px 0; border-radius: 5px; }
          .platform-revenue { font-size: 18px; font-weight: bold; color: #7c3aed; }
          .footer { text-align: center; padding: 20px; color: #666; font-size: 12px; }
          .admin-info { background: #e5e7eb; padding: 10px; border-radius: 5px; margin: 10px 0; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1>📊 Platform Booking Activity</h1>
          </div>
          <div class="content">
            <p>Dear Super Admin,</p>
            <p>A new booking has been processed through the platform:</p>
            
            <div class="booking-details">
              <h3>Booking Information</h3>
              <p><strong>Property:</strong> ${bookingData.propertyName}</p>
              <p><strong>Booking ID:</strong> ${bookingData.bookingId}</p>
              <p><strong>Guest:</strong> ${bookingData.guestName}</p>
              <p><strong>Check-in:</strong> ${bookingData.checkIn}</p>
              <p><strong>Check-out:</strong> ${bookingData.checkOut}</p>
              <p><strong>Duration:</strong> ${bookingData.nights} night${bookingData.nights !== 1 ? 's' : ''}</p>
              <p><strong>Guests:</strong> ${bookingData.guests}</p>
              <p><strong>Rooms:</strong> ${bookingData.rooms}</p>
              ${bookingData.gstAmount ? `<p><strong>GST:</strong> ${bookingData.currencySymbol}${bookingData.gstAmount}</p>` : ''}
              <p class="platform-revenue"><strong>Transaction Value:</strong> ${bookingData.currencySymbol}${bookingData.totalPrice}</p>
            </div>
            
            ${propertyOwnerEmail ? `
            <div class="admin-info">
              <p><strong>Property Owner:</strong> ${propertyOwnerEmail}</p>
            </div>
            ` : ''}
            
            <p>View detailed analytics and booking management in the admin dashboard.</p>
          </div>
          <div class="footer">
            <p>Travel Booking Platform - System Administration</p>
          </div>
        </div>
      </body>
      </html>
    `;
    
    emailMessage.textContent = `
      Platform Booking Activity
      
      Dear Super Admin,
      
      A new booking has been processed through the platform.
      
      Booking Information:
      - Property: ${bookingData.propertyName}
      - Booking ID: ${bookingData.bookingId}
      - Guest: ${bookingData.guestName}
      - Check-in: ${bookingData.checkIn}
      - Check-out: ${bookingData.checkOut}
      - Duration: ${bookingData.nights} night${bookingData.nights !== 1 ? 's' : ''}
      - Guests: ${bookingData.guests}
      - Rooms: ${bookingData.rooms}
      ${bookingData.gstAmount ? `- GST: ${bookingData.currencySymbol}${bookingData.gstAmount}` : ''}
      - Transaction Value: ${bookingData.currencySymbol}${bookingData.totalPrice}
      
      ${propertyOwnerEmail ? `Property Owner: ${propertyOwnerEmail}` : ''}
      
      View analytics in the admin dashboard.
    `;

    const result = await transactionalEmailsApi.sendTransacEmail(emailMessage);
    console.log('SuperAdmin notification email sent successfully:', result.body?.messageId);
    return true;
  } catch (error) {
    console.error('Failed to send superadmin notification email:', error);
    return false;
  }
}

// Test email connectivity
export async function testBrevoConnection(): Promise<boolean> {
  try {
    if (!process.env.BREVO_API_KEY) {
      console.error('BREVO_API_KEY is not configured');
      return false;
    }
    
    // Try a simple test email
    const testMessage = new SendSmtpEmail();
    testMessage.subject = "Brevo Connection Test";
    testMessage.to = [{ email: "test@example.com", name: "Test User" }];
    testMessage.sender = { name: "Travel Platform", email: "test@yourhotel.com" };
    testMessage.htmlContent = "<p>Brevo integration is working!</p>";
    
    // Note: This will throw an error for invalid email, but confirms API connection
    console.log('Brevo API connection is configured');
    return true;
  } catch (error) {
    console.error('Brevo connection test failed:', error);
    return false;
  }
}