import nodemailer from "nodemailer";

// Using Ethereal Email for testing purposes (provides a catch-all fake SMTP service)
// In a real application, you would use SendGrid, AWS SES, or a real SMTP server.
let transporter: nodemailer.Transporter;

async function setupTransporter() {
  if (transporter) return transporter;
  
  // Creates a test account on the fly. You can visit ethereal.email to see messages.
  const testAccount = await nodemailer.createTestAccount();
  
  transporter = nodemailer.createTransport({
    host: "smtp.ethereal.email",
    port: 587,
    secure: false, // true for 465, false for other ports
    auth: {
      user: testAccount.user, // generated ethereal user
      pass: testAccount.pass, // generated ethereal password
    },
  });
  
  console.log(`[Email Service] initialized with Ethereal Email account: ${testAccount.user}`);
  return transporter;
}

export async function sendOTPEmail(toEmail: string, studentName: string, instructorName: string, otp: string, location: string | null) {
  try {
    const tp = await setupTransporter();
    
    const info = await tp.sendMail({
      from: '"SkillSpark Bookings" <noreply@skillspark.local>', 
      to: toEmail, // Using the student's email as the recipient
      subject: "Your Offline Session OTP Code - SkillSpark", 
      text: `Hello ${studentName},\n\nYour offline session with ${instructorName} has been booked.\nLocation: ${location || "TBD"}\n\nYour Security OTP is: ${otp}\n\nPlease provide this OTP to the instructor upon arrival to verify and start your session.\n\nThank you,\nThe SkillSpark Team`, 
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; border: 1px solid #e2e8f0; border-radius: 8px; overflow: hidden;">
          <div style="background-color: #f8fafc; padding: 20px; text-align: center; border-bottom: 1px solid #e2e8f0;">
            <h1 style="color: #0f172a; margin: 0; font-size: 24px;">SkillSpark</h1>
          </div>
          <div style="padding: 30px;">
            <p style="color: #334155; font-size: 16px;">Hello <strong>${studentName}</strong>,</p>
            <p style="color: #334155; font-size: 16px;">Your offline session with <strong>${instructorName}</strong> has been booked successfully.</p>
            
            <div style="background-color: #f1f5f9; padding: 15px; border-radius: 6px; margin: 20px 0;">
              <p style="margin: 0; color: #475569; font-size: 14px;"><strong>Location:</strong> ${location || "TBD"}</p>
            </div>
            
            <p style="color: #334155; font-size: 16px;">To securely start your session, please provide the following One-Time Password (OTP) to your instructor upon arrival:</p>
            
            <div style="text-align: center; margin: 30px 0;">
              <span style="background-color: #0f172a; color: white; padding: 15px 30px; font-size: 28px; font-weight: bold; letter-spacing: 5px; border-radius: 8px;">${otp}</span>
            </div>
            
            <p style="color: #64748b; font-size: 14px; text-align: center;">Do not share this OTP with anyone other than your instructor.</p>
          </div>
          <div style="background-color: #f8fafc; padding: 15px; text-align: center; border-top: 1px solid #e2e8f0;">
            <p style="margin: 0; color: #94a3b8; font-size: 12px;">© ${new Date().getFullYear()} SkillSpark. All rights reserved.</p>
          </div>
        </div>
      `,
    });

    console.log("Message sent: %s", info.messageId);
    // Preview URL is output since we are using ethereal email
    console.log("Preview URL: %s", nodemailer.getTestMessageUrl(info));
    return nodemailer.getTestMessageUrl(info);
  } catch (error) {
    console.error("Error sending OTP email:", error);
    return null;
  }
}
