const nodemailer = require('nodemailer');

const transporter = nodemailer.createTransport({
  service: 'gmail',
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS,
  },
});

const sendCompletionEmail = async ({ toEmail, toName, complaintText, department, adminRemark }) => {
  const mailOptions = {
    from: `"RGUKT-RKValley Complaint Portal" <${process.env.EMAIL_USER}>`,
    to: toEmail,
    subject: `✅ Your Complaint Has Been Resolved – RGUKT-RKValley`,
    html: `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="UTF-8" />
        <style>
          body { margin: 0; padding: 0; font-family: 'Segoe UI', Arial, sans-serif; background: #f0f4fb; }
          .wrapper { max-width: 580px; margin: 32px auto; background: #ffffff; border-radius: 14px; overflow: hidden; box-shadow: 0 4px 24px rgba(0,0,0,0.08); }
          .header { background: linear-gradient(135deg, #0a1628 0%, #1e3a7a 100%); padding: 32px 36px; }
          .header-top { display: flex; align-items: center; gap: 12px; margin-bottom: 20px; }
          .logo-text { color: #4f8ef7; font-size: 20px; font-weight: 700; letter-spacing: 0.5px; }
          .logo-sep { width: 1px; height: 24px; background: rgba(255,255,255,0.2); display: inline-block; margin: 0 12px; vertical-align: middle; }
          .logo-sub { color: rgba(255,255,255,0.6); font-size: 12px; }
          .header h1 { color: #ffffff; font-size: 22px; margin: 0; font-weight: 600; }
          .header p { color: rgba(255,255,255,0.6); font-size: 13px; margin: 6px 0 0; }
          .body { padding: 32px 36px; }
          .greeting { font-size: 16px; color: #0f172a; font-weight: 500; margin-bottom: 8px; }
          .message { font-size: 14px; color: #475569; line-height: 1.7; margin-bottom: 24px; }
          .card { background: #f8fafc; border-radius: 10px; border: 1px solid #e2e8f4; padding: 20px 24px; margin-bottom: 20px; }
          .card-label { font-size: 11px; font-weight: 600; color: #94a3b8; text-transform: uppercase; letter-spacing: 0.8px; margin-bottom: 6px; }
          .card-value { font-size: 14px; color: #0f172a; line-height: 1.6; }
          .badge { display: inline-block; background: #f0fdf4; color: #16a34a; border: 1px solid #bbf7d0; border-radius: 99px; padding: 3px 12px; font-size: 12px; font-weight: 600; }
          .dept-badge { display: inline-block; background: #eff6ff; color: #1e3a7a; border: 1px solid #bfdbfe; border-radius: 99px; padding: 3px 12px; font-size: 12px; font-weight: 600; }
          .remark-box { background: #eff6ff; border-left: 3px solid #4f8ef7; border-radius: 0 8px 8px 0; padding: 12px 16px; margin-top: 8px; font-size: 14px; color: #1e3a7a; line-height: 1.6; }
          .footer { background: #f8fafc; border-top: 1px solid #e2e8f4; padding: 20px 36px; text-align: center; }
          .footer p { font-size: 12px; color: #94a3b8; margin: 0; line-height: 1.6; }
          .footer strong { color: #64748b; }
        </style>
      </head>
      <body>
        <div class="wrapper">
          <div class="header">
            <div class="header-top">
              <span class="logo-text">RGUKT-RKV</span>
              <span class="logo-sep"></span>
              <span class="logo-sub">Complaint Portal</span>
            </div>
            <h1>Your Complaint is Resolved ✅</h1>
            <p>The concerned department has addressed your complaint.</p>
          </div>

          <div class="body">
            <div class="greeting">Hello, ${toName} 👋</div>
            <div class="message">
              We're pleased to inform you that your complaint has been reviewed and marked as
              <strong> completed</strong> by the <strong>${department}</strong> department.
              Here are the details:
            </div>

            <div class="card">
              <div class="card-label">Your Complaint</div>
              <div class="card-value">${complaintText}</div>
            </div>

            <div style="display:flex; gap:10px; margin-bottom:20px; flex-wrap:wrap;">
              <div>
                <div class="card-label" style="margin-bottom:6px;">Department</div>
                <span class="dept-badge">${department}</span>
              </div>
              <div>
                <div class="card-label" style="margin-bottom:6px;">Status</div>
                <span class="badge">Completed</span>
              </div>
            </div>

            ${adminRemark ? `
            <div class="card">
              <div class="card-label">Admin Remark</div>
              <div class="remark-box">${adminRemark}</div>
            </div>` : ''}

            <div class="message" style="margin-top:20px; margin-bottom:0;">
              If you feel your issue has not been fully resolved, you may submit a new complaint
              through the portal. We're here to help.
            </div>
          </div>

          <div class="footer">
            <p><strong>RGUKT – RK Valley Campus</strong></p>
            <p>This is an automated message from the Smart Complaint Management System.<br/>Please do not reply to this email.</p>
          </div>
        </div>
      </body>
      </html>
    `,
  };

  await transporter.sendMail(mailOptions);
};

module.exports = { sendCompletionEmail };