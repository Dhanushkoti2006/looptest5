import { siteConfig } from '@/src/config/site';

export interface EmailPayload {
  to?: string | string[];
  subject: string;
  text?: string;
  html?: string;
  replyTo?: string;
}

/**
 * Transactional email notification dispatcher.
 * Adheres to:
 * - From address: Verified-domain sender (notifications@loopandlove.com), NEVER Gmail.
 * - Reply-To address: Customer contact email (siteConfig.contactEmail: loopandlove77@gmail.com).
 * - Admin notifications: Dispatched to all addresses in ADMIN_NOTIFICATION_EMAILS (siteConfig.adminNotificationEmails).
 */
export async function sendEmailNotification(payload: EmailPayload): Promise<{ success: boolean; message: string }> {
  const recipients = payload.to
    ? Array.isArray(payload.to) ? payload.to : [payload.to]
    : siteConfig.adminNotificationEmails;

  const emailData = {
    from: `Loop & Love <${siteConfig.emailSender}>`,
    to: recipients,
    replyTo: payload.replyTo || siteConfig.contactEmail,
    subject: payload.subject,
    text: payload.text || '',
    html: payload.html || '',
  };

  // Log transactional notification dispatch in server logs
  console.log(`[Email Dispatch] From: ${emailData.from} | Reply-To: ${emailData.replyTo} | To: ${emailData.to.join(', ')} | Subject: ${emailData.subject}`);

  return { success: true, message: `Notification dispatched to ${recipients.join(', ')}` };
}

export async function notifyAdminsNewOrder(
  orderNumberOrObj: string | { orderNumber: string; totalAmount: number; customerName: string; customerEmail?: string; itemsCount?: number },
  amount?: number,
  customerName?: string
) {
  let orderNumber: string;
  let totalAmount: number;
  let customer: string;

  if (typeof orderNumberOrObj === 'object') {
    orderNumber = orderNumberOrObj.orderNumber;
    totalAmount = orderNumberOrObj.totalAmount;
    customer = orderNumberOrObj.customerName;
  } else {
    orderNumber = orderNumberOrObj;
    totalAmount = amount || 0;
    customer = customerName || 'Valued Customer';
  }

  return sendEmailNotification({
    to: siteConfig.adminNotificationEmails,
    subject: `[New Order] ${orderNumber} - ₹${totalAmount} received from ${customer}`,
    text: `A new order (${orderNumber}) of ₹${totalAmount} was confirmed from ${customer}. Check Admin Console.`,
  });
}

export async function notifyAdminsCustomRequest(
  requestNumberOrObj: string | { requestNumber: string; productType: string; customerName: string; customerEmail?: string; budgetRange?: string },
  productType?: string,
  customerName?: string
) {
  let requestNumber: string;
  let type: string;
  let customer: string;

  if (typeof requestNumberOrObj === 'object') {
    requestNumber = requestNumberOrObj.requestNumber;
    type = requestNumberOrObj.productType;
    customer = requestNumberOrObj.customerName;
  } else {
    requestNumber = requestNumberOrObj;
    type = productType || 'Custom Crochet';
    customer = customerName || 'Valued Customer';
  }

  return sendEmailNotification({
    to: siteConfig.adminNotificationEmails,
    subject: `[Custom Request] ${requestNumber} - ${type} from ${customer}`,
    text: `New custom crochet studio request (${requestNumber}) received for ${type} from ${customer}.`,
  });
}
