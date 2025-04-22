import nodemailer from "nodemailer";
import asyncHandler from "./asyncHandler.js";
import env from "./env.js";

export const sendEmail = async({to, subject, html}) => {
  try {
    const transporter = nodemailer.createTransport({
      service: env.mailService,
      port: env.mailPort,
      auth:{
        user: env.mailDomain,
        pass: env.mailPassword
      }
    });
  
    const mailOptions = {
      from: "no-reply@maxicoffee.com",
      to,
      subject,
      html
    };
  
    transporter.sendMail(mailOptions, (error, info) => {
      if(error) {
        console.error(`Email failed to ${to}:`, error)
      }else{
        console.log(`Email sent to ${to}`, info.response)
      }
    });
  
    // debug
    console.log(`email sent to ${to}`)
  } catch (error) {
    console.error(`Email transport failed:`, error)
  }
};
