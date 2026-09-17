import "server-only";

import { PlunkMailer } from "./plunk";
import { ResendMailer } from "./resend";
import { SesMailer } from "./ses";
import { Mailer } from "./types";

type MailerProvider = "plunk" | "resend" | "ses";

export function createMailer(): Mailer {
  const provider = (process.env.MAIL_PROVIDER ?? "resend") as MailerProvider;

  switch (provider) {
    case "plunk":
      return new PlunkMailer(process.env.PLUNK_SECRET_KEY!);
    case "resend":
      return new ResendMailer(process.env.RESEND_API_KEY!);
    case "ses":
      return new SesMailer(process.env.SES_REGION ?? process.env.STORAGE_REGION!);
    default:
      throw new Error(`Unsupported mailer provider: ${provider}`);
  }
}
