import nodemailer from 'nodemailer';
import transporter, { emailConfigs } from '../config/email';
import { SendEmailRequest, EmailResponse, OrderConfirmationData, NewOrderNotificationData } from '../types/email';
import logger from '../utils/logger';

export class EmailService {
  private transporter: nodemailer.Transporter;

  constructor() {
    this.transporter = transporter;
  }

  async sendEmail(request: SendEmailRequest): Promise<EmailResponse> {
    try {
      const mailOptions = {
        from: emailConfigs.from,
        to: request.to,
        subject: request.subject,
        html: request.html,
        text: request.text,
      };

      const result = await this.transporter.sendMail(mailOptions);
      
      logger.info('Email sent successfully', {
        messageId: result.messageId,
        to: request.to,
        subject: request.subject,
      });

      return {
        success: true,
        messageId: result.messageId,
      };
    } catch (error) {
      logger.error('Failed to send email', {
        error: error instanceof Error ? error.message : 'Unknown error',
        to: request.to,
        subject: request.subject,
      });

      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
      };
    }
  }

  async sendOrderConfirmation(data: OrderConfirmationData): Promise<EmailResponse> {
    const subject = `Order Confirmation - ${data.orderNumber}`;
    
    const html = this.generateOrderConfirmationHTML(data);
    const text = this.generateOrderConfirmationText(data);

    return this.sendEmail({
      to: data.customerEmail,
      subject,
      html,
      text,
    });
  }

  async sendNewOrderNotification(data: NewOrderNotificationData): Promise<EmailResponse> {
    const subject = `New Order Received - ${data.orderNumber}`;
    
    const html = this.generateNewOrderNotificationHTML(data);
    const text = this.generateNewOrderNotificationText(data);

    return this.sendEmail({
      to: emailConfigs.managerEmail,
      subject,
      html,
      text,
    });
  }

  private generateOrderConfirmationHTML(data: OrderConfirmationData): string {
    const itemsHTML = data.items.map(item => `
      <tr>
        <td style="padding: 10px; border-bottom: 1px solid #eee;">${item.name}</td>
        <td style="padding: 10px; border-bottom: 1px solid #eee; text-align: center;">${item.quantity}</td>
        <td style="padding: 10px; border-bottom: 1px solid #eee; text-align: right;">$${item.unitPrice.toFixed(2)}</td>
        <td style="padding: 10px; border-bottom: 1px solid #eee; text-align: right;">$${(item.unitPrice * item.quantity).toFixed(2)}</td>
      </tr>
    `).join('');

    return `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8">
        <title>Order Confirmation</title>
        <style>
          body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
          .container { max-width: 600px; margin: 0 auto; padding: 20px; }
          .header { background-color: #f8f9fa; padding: 20px; text-align: center; border-radius: 5px; }
          .content { padding: 20px 0; }
          .order-details { background-color: #f8f9fa; padding: 15px; border-radius: 5px; margin: 20px 0; }
          table { width: 100%; border-collapse: collapse; margin: 20px 0; }
          th { background-color: #007bff; color: white; padding: 10px; text-align: left; }
          .total { font-size: 18px; font-weight: bold; text-align: right; margin-top: 20px; }
          .footer { margin-top: 30px; padding-top: 20px; border-top: 1px solid #eee; font-size: 14px; color: #666; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1>Order Confirmation</h1>
            <p>Thank you for your order!</p>
          </div>
          
          <div class="content">
            <p>Dear ${data.customerName},</p>
            
            <p>We have received your order and will contact you shortly to arrange payment via Sinpe Movil.</p>
            
            <div class="order-details">
              <h3>Order Details</h3>
              <p><strong>Order Number:</strong> ${data.orderNumber}</p>
              <p><strong>Customer:</strong> ${data.customerName}</p>
              <p><strong>Email:</strong> ${data.customerEmail}</p>
            </div>
            
            <h3>Order Items</h3>
            <table>
              <thead>
                <tr>
                  <th>Product</th>
                  <th>Quantity</th>
                  <th>Unit Price</th>
                  <th>Total</th>
                </tr>
              </thead>
              <tbody>
                ${itemsHTML}
              </tbody>
            </table>
            
            <div class="total">
              <strong>Total Amount: $${data.totalAmount.toFixed(2)}</strong>
            </div>
            
            <p><strong>Next Steps:</strong></p>
            <ul>
              <li>Our manager will contact you via phone or WhatsApp</li>
              <li>Payment will be arranged via Sinpe Movil</li>
              <li>Once payment is confirmed, your order will be prepared for delivery</li>
            </ul>
          </div>
          
          <div class="footer">
            <p>If you have any questions, please contact us.</p>
            <p>Thank you for choosing SimpleShop!</p>
          </div>
        </div>
      </body>
      </html>
    `;
  }

  private generateOrderConfirmationText(data: OrderConfirmationData): string {
    const itemsText = data.items.map(item => 
      `${item.name} - Quantity: ${item.quantity} - Unit Price: $${item.unitPrice.toFixed(2)} - Total: $${(item.unitPrice * item.quantity).toFixed(2)}`
    ).join('\n');

    return `
Order Confirmation

Dear ${data.customerName},

We have received your order and will contact you shortly to arrange payment via Sinpe Movil.

Order Details:
- Order Number: ${data.orderNumber}
- Customer: ${data.customerName}
- Email: ${data.customerEmail}

Order Items:
${itemsText}

Total Amount: $${data.totalAmount.toFixed(2)}

Next Steps:
- Our manager will contact you via phone or WhatsApp
- Payment will be arranged via Sinpe Movil
- Once payment is confirmed, your order will be prepared for delivery

If you have any questions, please contact us.

Thank you for choosing SimpleShop!
    `.trim();
  }

  private generateNewOrderNotificationHTML(data: NewOrderNotificationData): string {
    return `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8">
        <title>New Order Notification</title>
        <style>
          body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
          .container { max-width: 600px; margin: 0 auto; padding: 20px; }
          .header { background-color: #dc3545; color: white; padding: 20px; text-align: center; border-radius: 5px; }
          .content { padding: 20px 0; }
          .order-details { background-color: #f8f9fa; padding: 15px; border-radius: 5px; margin: 20px 0; }
          .contact-info { background-color: #d4edda; padding: 15px; border-radius: 5px; margin: 20px 0; }
          .footer { margin-top: 30px; padding-top: 20px; border-top: 1px solid #eee; font-size: 14px; color: #666; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1>New Order Received!</h1>
            <p>Action Required</p>
          </div>
          
          <div class="content">
            <p>A new order has been placed and requires your attention.</p>
            
            <div class="order-details">
              <h3>Order Information</h3>
              <p><strong>Order Number:</strong> ${data.orderNumber}</p>
              <p><strong>Total Amount:</strong> $${data.totalAmount.toFixed(2)}</p>
              <p><strong>Number of Items:</strong> ${data.itemCount}</p>
            </div>
            
            <div class="contact-info">
              <h3>Customer Contact Information</h3>
              <p><strong>Name:</strong> ${data.customerName}</p>
              <p><strong>Phone:</strong> ${data.customerPhone}</p>
              <p><strong>Email:</strong> ${data.customerEmail}</p>
            </div>
            
            <p><strong>Action Required:</strong></p>
            <ul>
              <li>Contact the customer via phone or WhatsApp</li>
              <li>Arrange payment via Sinpe Movil</li>
              <li>Update order status once payment is confirmed</li>
            </ul>
          </div>
          
          <div class="footer">
            <p>Please process this order as soon as possible.</p>
          </div>
        </div>
      </body>
      </html>
    `;
  }

  private generateNewOrderNotificationText(data: NewOrderNotificationData): string {
    return `
New Order Notification

A new order has been placed and requires your attention.

Order Information:
- Order Number: ${data.orderNumber}
- Total Amount: $${data.totalAmount.toFixed(2)}
- Number of Items: ${data.itemCount}

Customer Contact Information:
- Name: ${data.customerName}
- Phone: ${data.customerPhone}
- Email: ${data.customerEmail}

Action Required:
- Contact the customer via phone or WhatsApp
- Arrange payment via Sinpe Movil
- Update order status once payment is confirmed

Please process this order as soon as possible.
    `.trim();
  }
}

export const emailService = new EmailService();
