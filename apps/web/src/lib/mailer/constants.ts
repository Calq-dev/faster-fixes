// MAIL_DOMAIN lets a self-hosted instance send from a domain other than the one it runs on.
const MAIL_DOMAIN = process.env.MAIL_DOMAIN ?? process.env.DOMAIN_NAME;

export const NO_REPLY_EMAIL = `noreply@${MAIL_DOMAIN}`;
export const SENDER_EMAIL = `contact@${MAIL_DOMAIN}`;
