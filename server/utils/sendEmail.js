// utils/sendEmail.js
import nodemailer from "nodemailer";

export const sendEmail = async (to, subject, htmlContent) => {
    try {
        const transporter = nodemailer.createTransport({
            service: "gmail",
            auth: {
                user: "mrshaktiman.01@gmail.com",
                pass: "rzcx uvde vqjg iuse"
            },
        });

        const mailOptions = {
            from: `"BuddyBudget" <${"mrshaktiman.01@gmail.com"}>`,
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
