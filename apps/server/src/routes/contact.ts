import { Hono } from "hono";
import { sendEmail } from "../lib/email.js";
import { zBody } from "../lib/validate.js";
import { z } from "zod";

const contactSchema = z.object({
  name: z.string().min(1, "Name is required"),
  email: z.string().email("Invalid email address"),
  subject: z.string().min(1, "Subject is required"),
  message: z.string().min(1, "Message is required"),
});

type ContactForm = z.infer<typeof contactSchema>;

const app = new Hono();

/**
 * POST /api/contact
 * Send a contact form submission email
 */
app.post("/", zBody(contactSchema), async (c) => {
  try {
    const { name, email, subject, message } = c.req.valid("json") as ContactForm;

    // Send email to support inbox
    await sendEmail({
      to: "kinzinzombe07@gmail.com",
      subject: `New Contact Form Submission: ${subject}`,
      html: `
        <h2>New Contact Form Submission</h2>
        <p><strong>Name:</strong> ${escapeHtml(name)}</p>
        <p><strong>Email:</strong> ${escapeHtml(email)}</p>
        <p><strong>Subject:</strong> ${escapeHtml(subject)}</p>
        <hr />
        <h3>Message:</h3>
        <p>${escapeHtml(message).replace(/\n/g, "<br />")}</p>
      `,
    });

    // Optionally send a confirmation email to the user
    await sendEmail({
      to: email,
      subject: "We received your message",
      html: `
        <h2>Thank you for contacting us!</h2>
        <p>Hi ${escapeHtml(name)},</p>
        <p>We've received your message and will get back to you as soon as possible, typically within 24 hours.</p>
        <hr />
        <p><strong>Your message:</strong></p>
        <p><em>${escapeHtml(subject)}</em></p>
        <p>${escapeHtml(message).replace(/\n/g, "<br />")}</p>
        <hr />
        <p>Best regards,<br />The EasyPOS Team</p>
      `,
    });

    return c.json({ success: true, message: "Message sent successfully" }, 200);
  } catch (error) {
    console.error("Contact form error:", error);
    return c.json({ error: "Failed to send message" }, 500);
  }
});

/**
 * Escape HTML to prevent injection attacks
 */
function escapeHtml(text: string): string {
  const map: Record<string, string> = {
    "&": "&amp;",
    "<": "&lt;",
    ">": "&gt;",
    '"': "&quot;",
    "'": "&#039;",
  };
  return text.replace(/[&<>"']/g, (m) => map[m] ?? m);
}

export default app;
