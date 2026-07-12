export interface EmailJobData {
  to: string | string[];
  subject: string;
  html: string;
  text?: string;
  replyTo?: string;
}

export interface WhatsAppJobData {
  to: string;
  body: string;
  templateName?: string;
  templateParams?: string[];
}
