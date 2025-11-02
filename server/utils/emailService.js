import nodemailer from "nodemailer";

export const sendEmail = async (to, subject, html) => {
  const transporter = nodemailer.createTransport({
    service: "gmail",
    auth: {
      user: "youremail@gmail.com",
      pass: "yourapppassword",
    },
  });

  await transporter.sendMail({
    from: '"TaskApp" <youremail@gmail.com>',
    to,
    subject,
    html,
  });
};
