export interface Email {
  id: string;
  subject: string;
  body: string;
  mimeType: string;
  unsubscribeLink?: string;
}
