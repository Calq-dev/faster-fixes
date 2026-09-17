import "server-only";

import { SendEmailCommand, SESv2Client } from "@aws-sdk/client-sesv2";

import {
  Contact,
  EmailError,
  EmailResponse,
  Mailer,
  MailOptions,
} from "./types";

// Amazon SES mailer for self-hosted instances. Credentials come from the default
// AWS provider chain (AWS_ACCESS_KEY_ID / AWS_SECRET_ACCESS_KEY). SES has no
// contact list, so the contact methods are unsupported; the only caller skips
// them when RESEND_SEGMENT_ID is unset.
export class SesMailer implements Mailer {
  private client: SESv2Client;

  constructor(region: string) {
    this.client = new SESv2Client({ region });
  }

  public emails = {
    send: async (options: MailOptions): Promise<EmailResponse> => {
      if (!options.body) {
        throw new EmailError("Email body is required", "MISSING_BODY");
      }

      if (options.attachments?.length) {
        throw new EmailError(
          "Attachments are not supported by the SES mailer",
          "UNSUPPORTED"
        );
      }

      try {
        const result = await this.client.send(
          new SendEmailCommand({
            FromEmailAddress: options.from,
            Destination: { ToAddresses: [options.to] },
            Content: {
              Simple: {
                Subject: { Data: options.subject, Charset: "UTF-8" },
                Body: { Html: { Data: options.body, Charset: "UTF-8" } },
              },
            },
          })
        );

        return {
          success: true,
          message: "Email sent successfully",
          data: { messageId: result.MessageId },
        };
      } catch (error) {
        const err = error as Error;
        throw new EmailError(err.message, err.name);
      }
    },
  };

  public contacts = {
    list: async (): Promise<Contact[]> => unsupported(),
    create: async (): Promise<Contact> => unsupported(),
    get: async (): Promise<Contact> => unsupported(),
    update: async (): Promise<Contact> => unsupported(),
    delete: async (): Promise<Contact> => unsupported(),
    addToSegment: async (): Promise<void> => unsupported(),
  };
}

function unsupported(): never {
  throw new EmailError(
    "Contacts are not supported by the SES mailer",
    "UNSUPPORTED"
  );
}
