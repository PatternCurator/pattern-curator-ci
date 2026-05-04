import { Resend } from "resend";

const resend = new Resend(process.env.RESEND_API_KEY);

export async function sendReportEmail({
  to,
  downloadUrl,
}: {
  to: string;
  downloadUrl: string;
}) {
  try {
    await resend.emails.send({
      from: "Pattern Curator <hello@patterncurator-ci.com>",
      to,
      subject: "Your SS27 Trend Report",
      html: `
        <p>Your Spring / Summer 27 Trend Report is ready.</p>

        <p>
          You can download your report below:
        </p>

        <p>
          <a href="${downloadUrl}">
            Download SS 27 Trend Report
          </a>
        </p>

        <p style="margin-top:12px;">
          As a thank you, use code <strong>REPORTCI</strong> for one month of Curatorial Intelligence.
        </p>

        <p style="margin-top:12px; font-size:11px; color:#777;">
          This link will expire in 1 hour.
        </p>
      `,
    });
  } catch (err) {
    console.error("email send error", err);
  }
}