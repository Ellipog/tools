import { NextResponse } from "next/server";
import nodemailer from "nodemailer";

export async function POST(request: Request) {
  try {
    const { name, feature } = await request.json();

    const transporter = nodemailer.createTransport({
      host: "smtp.gmail.com",
      port: 587,
      secure: false,
      auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASS,
      },
    });

    const timestamp = new Date().toLocaleString("no-NO", {
      timeZone: "Europe/Oslo",
    });

    const mailOptions = {
      from: `"NODE_SYSTEM" <${process.env.EMAIL_USER}>`,
      to: process.env.EMAIL_USER,
      subject: `[FEATURE_REQ] :: ${name.toUpperCase()}`,
      // Plain text fallback for older clients
      text: `FEATURE REQUEST\n\nUser: ${name}\nDate: ${timestamp}\n\nDescription:\n${feature}`,
      // Styled HTML Email
      html: `
        <div style="background-color: #000000; color: #ffffff; font-family: 'Courier New', Courier, monospace; padding: 40px; border: 1px solid #333333; max-width: 600px;">
          <div style="border-bottom: 1px solid #333333; padding-bottom: 20px; margin-bottom: 20px;">
            <h2 style="color: #ffffff; text-transform: uppercase; letter-spacing: 5px; font-size: 14px; margin: 0;">System_Ingest :: Feature_Request</h2>
            <p style="color: #555555; font-size: 10px; margin: 5px 0 0 0;">TIMESTAMP: ${timestamp}</p>
          </div>
          
          <div style="margin-bottom: 30px;">
            <p style="color: #888888; text-transform: uppercase; font-size: 10px; letter-spacing: 2px; margin-bottom: 5px;">01. Identifier</p>
            <p style="color: #ffffff; font-size: 16px; margin: 0;">${name}</p>
          </div>

          <div style="margin-bottom: 30px;">
            <p style="color: #888888; text-transform: uppercase; font-size: 10px; letter-spacing: 2px; margin-bottom: 5px;">02. Description</p>
            <div style="background-color: #0a0a0a; border: 1px solid #1a1a1a; padding: 20px; color: #cccccc; line-height: 1.6; font-size: 14px;">
              ${feature.replace(/\n/g, "<br/>")}
            </div>
          </div>

          <div style="border-top: 1px solid #333333; padding-top: 20px; margin-top: 40px;">
            <p style="color: #333333; font-size: 9px; text-transform: uppercase; letter-spacing: 1px; margin: 0;">
              Node_Suite // Automated_Response_Daemon
            </p>
          </div>
        </div>
      `,
    };

    await transporter.sendMail(mailOptions);

    return NextResponse.json(
      { message: "Protocol success: Data transmitted" },
      { status: 200 },
    );
  } catch (error) {
    console.error("Mail_Daemon_Error:", error);
    return NextResponse.json(
      { error: "Transmission_Failure" },
      { status: 500 },
    );
  }
}
