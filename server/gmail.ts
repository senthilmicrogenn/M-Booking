import nodemailer from 'nodemailer';

interface BookingConfirmationData {
  bookingId: string;
  propertyName: string;
  guestName: string;
  guestPhone?: string;
  guestAddress?: string;
  checkIn: string;
  checkOut: string;
  nights: number;
  rooms: number;
  guests: number;
  totalPrice: number;
  gstAmount?: number;
  currencySymbol: string;
  roomTypeName?: string;
  roomTypePrice?: number;
  couponCode?: string;
  couponType?: string;
  couponDiscountAmount?: number;
}

// Create transporter with Gmail SMTP
function createGmailTransporter() {
  if (!process.env.GMAIL_USER || !process.env.GMAIL_APP_PASSWORD) {
    throw new Error('Gmail credentials not configured. Please set GMAIL_USER and GMAIL_APP_PASSWORD environment variables.');
  }

  return nodemailer.createTransport({
    service: 'gmail',
    auth: {
      user: process.env.GMAIL_USER,
      pass: process.env.GMAIL_APP_PASSWORD, // App Password, not regular password
    },
  });
}

// Send booking confirmation to guest
export async function sendBookingConfirmationToGuest(
  guestEmail: string, 
  bookingData: BookingConfirmationData
): Promise<boolean> {
  try {
    const transporter = createGmailTransporter();

    const mailOptions = {
      from: `"Travel Booking Platform" <${process.env.GMAIL_USER}>`,
      to: guestEmail,
      subject: `Booking Confirmation - ${bookingData.propertyName}`,
      html: `
        <!DOCTYPE html>
        <html>
        <head>
          <style>
            body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
            .container { max-width: 700px; margin: 0 auto; padding: 20px; }
            .header { background: #2563eb; color: white; padding: 20px; text-align: center; }
            .content { padding: 20px; background: #f9f9f9; }
            .booking-table { width: 100%; border-collapse: collapse; margin: 20px 0; background: white; }
            .booking-table th, .booking-table td { border: 1px solid #ddd; padding: 10px; text-align: left; }
            .booking-table th { background-color: #f5f5f5; font-weight: bold; }
            .booking-table .label { background-color: #f9f9f9; font-weight: bold; width: 30%; }
            .room-details { width: 100%; border-collapse: collapse; margin: 20px 0; background: white; }
            .room-details th, .room-details td { border: 1px solid #ddd; padding: 8px; text-align: center; }
            .room-details th { background-color: #e3f2fd; font-weight: bold; }
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
              <p>Your booking has been confirmed at <strong>${bookingData.propertyName}</strong>! Here are your booking details:</p>
              
              <table class="booking-table">
                <tr>
                  <td class="label">Booking ID</td>
                  <td><strong>${bookingData.bookingId}</strong></td>
                </tr>
                <tr>
                  <td class="label">Check-in Date</td>
                  <td>${bookingData.checkIn} - Check-in Time</td>
                </tr>
                <tr>
                  <td class="label">Check-out Date</td>
                  <td>${bookingData.checkOut} - Check-out Time</td>
                </tr>
                <tr>
                  <td class="label">Guest Name</td>
                  <td>${bookingData.guestName}</td>
                </tr>
                ${bookingData.guestPhone ? `<tr><td class="label">Mobile Number</td><td>${bookingData.guestPhone}</td></tr>` : ''}
                ${bookingData.guestAddress ? `<tr><td class="label">Guest Address</td><td>${bookingData.guestAddress}</td></tr>` : ''}
                <tr>
                  <td class="label">City</td>
                  <td>-</td>
                </tr>
                ${bookingData.couponCode ? `<tr><td class="label">Coupon Applied</td><td>${bookingData.couponCode} (${bookingData.couponType === 'percentage' ? bookingData.couponDiscountAmount + '%' : bookingData.currencySymbol + bookingData.couponDiscountAmount} discount)</td></tr>` : ''}
              </table>

              <table class="room-details">
                <thead>
                  <tr>
                    <th>Room Type</th>
                    <th>Count</th>
                    <th>Nights</th>
                    <th>Room Rent</th>
                    <th>Discount</th>
                    <th>GST</th>
                    <th>Amount</th>
                  </tr>
                </thead>
                <tbody>
                  <tr>
                    <td>${bookingData.roomTypeName || 'Standard Room'}</td>
                    <td>${bookingData.rooms}</td>
                    <td>${bookingData.nights}</td>
                    <td>${bookingData.currencySymbol}${(bookingData.roomTypePrice || 0).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</td>
                    <td>${bookingData.currencySymbol}${(bookingData.couponDiscountAmount || 0).toFixed(2)}</td>
                    <td>${bookingData.currencySymbol}${(bookingData.gstAmount || 0).toFixed(2)}</td>
                    <td class="total">${bookingData.currencySymbol}${bookingData.totalPrice.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</td>
                  </tr>
                </tbody>
              </table>
              
              <p>We look forward to welcoming you! If you have any questions, please don't hesitate to contact us.</p>
              <p>Safe travels!</p>
            </div>
            <div class="footer">
              <p>This is an automated email. Please do not reply to this message.</p>
            </div>
          </div>
        </body>
        </html>
      `,
      text: `
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
        ${bookingData.roomTypeName ? `- Room Type: ${bookingData.roomTypeName}${bookingData.roomTypePrice ? ` @ ${bookingData.currencySymbol}${bookingData.roomTypePrice}/night` : ''}` : ''}
        ${bookingData.guestPhone ? `- Phone: ${bookingData.guestPhone}` : ''}
        ${bookingData.guestAddress ? `- Address: ${bookingData.guestAddress}` : ''}
        ${bookingData.couponCode ? `- Coupon Applied: ${bookingData.couponCode} (${bookingData.couponType === 'flat' ? bookingData.currencySymbol + bookingData.couponDiscountAmount : bookingData.couponDiscountAmount + '%'} discount)` : ''}
        ${bookingData.couponDiscountAmount ? `- Discount Amount: ${bookingData.currencySymbol}${bookingData.couponDiscountAmount}` : ''}
        ${bookingData.gstAmount ? `- GST: ${bookingData.currencySymbol}${bookingData.gstAmount.toFixed(2)}` : ''}
        - Transaction Value: ${bookingData.currencySymbol}${bookingData.totalPrice.toLocaleString()}
        
        We look forward to welcoming you!
      `,
    };

    const result = await transporter.sendMail(mailOptions);
    console.log('Guest confirmation email sent via Gmail:', result.messageId);
    return true;
  } catch (error) {
    console.error('Failed to send guest confirmation email via Gmail:', error);
    return false;
  }
}

// Send booking notification to hotel owner
export async function sendBookingNotificationToOwner(
  ownerEmail: string, 
  bookingData: BookingConfirmationData
): Promise<boolean> {
  try {
    const transporter = createGmailTransporter();

    const mailOptions = {
      from: `"Travel Booking Platform" <${process.env.GMAIL_USER}>`,
      to: ownerEmail,
      subject: `New Booking Alert - ${bookingData.propertyName}`,
      html: `
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
                <p class="revenue"><strong>Transaction Value:</strong> ${bookingData.currencySymbol}${bookingData.totalPrice}</p>
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
      `,
      text: `
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
        ${bookingData.gstAmount ? `- GST: ${bookingData.currencySymbol}${bookingData.gstAmount.toFixed(2)}` : ''}
        - Transaction Value: ${bookingData.currencySymbol}${bookingData.totalPrice.toLocaleString()}
        
        Please prepare for guest arrival.
      `,
    };

    const result = await transporter.sendMail(mailOptions);
    console.log('Owner notification email sent via Gmail:', result.messageId);
    return true;
  } catch (error) {
    console.error('Failed to send owner notification email via Gmail:', error);
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
    const transporter = createGmailTransporter();

    const mailOptions = {
      from: `"Travel Booking Platform" <${process.env.GMAIL_USER}>`,
      to: adminEmail,
      subject: `Platform Booking Alert - ${bookingData.propertyName}`,
      html: `
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
      `,
      text: `
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
        ${bookingData.gstAmount ? `- GST: ${bookingData.currencySymbol}${bookingData.gstAmount.toFixed(2)}` : ''}
        - Transaction Value: ${bookingData.currencySymbol}${bookingData.totalPrice.toLocaleString()}
        
        ${propertyOwnerEmail ? `Property Owner: ${propertyOwnerEmail}` : ''}
        
        View analytics in the admin dashboard.
      `,
    };

    const result = await transporter.sendMail(mailOptions);
    console.log('SuperAdmin notification email sent via Gmail:', result.messageId);
    return true;
  } catch (error) {
    console.error('Failed to send superadmin notification email via Gmail:', error);
    return false;
  }
}

// Test Gmail connection
export async function testGmailConnection(): Promise<boolean> {
  try {
    const transporter = createGmailTransporter();
    await transporter.verify();
    console.log('Gmail SMTP connection is working');
    return true;
  } catch (error) {
    console.error('Gmail SMTP connection test failed:', error);
    return false;
  }
}