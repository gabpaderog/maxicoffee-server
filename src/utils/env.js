import { config } from "dotenv";

config();

export default {
  dbUri: process.env.MONGODB_URI,
  mailDomain: process.env.MAILER_DOMAIN,
  mailPassword: process.env.MAILER_PASSWORD,
  mailPort: process.env.MAILER_PORT,
  mailService: process.env.MAILER_SERVICE,
  tokenSecretKey: process.env.TOKEN_SECRETKEY
}