// utils/sendEmail.js
import nodemailer from "nodemailer";
import dotenv from "dotenv";
dotenv.config();

export const sendEmail = async (to, subject, htmlContent) => {
    try {
        const user = process.env.user;
        const pass = process.env.pass;
        const service = process.env.EMAIL_SERVICE || "gmail";
        const fromAddr = process.env.EMAIL_FROM || user;

        if (!user || !pass) {
            console.error(
                "Email credentials not set. Please configure EMAIL_USER and EMAIL_PASS in your environment."
            );
            return;
        }

        const transporter = nodemailer.createTransport({
            service,
            auth: {
                user,
                pass,
            },
        });

        const mailOptions = {
            from: `"BuddyBudget" <${fromAddr}>`,
            to,
            subject,
            html: htmlContent,
        };

        await transporter.sendMail(mailOptions);
        console.log(`📧 Email sent to ${to}`);
    } catch (error) {
        console.error("Email Error:", error);
    }
};
