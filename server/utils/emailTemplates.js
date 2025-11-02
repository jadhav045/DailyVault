export function generateOTPHtml(otp) {
	return `
		<div style="font-family: sans-serif; line-height:1.5">
			<h2>Your verification code</h2>
			<p>Use the following code to verify your email:</p>
			<p style="font-size: 20px; font-weight: bold;">${otp}</p>
			<p>This code expires in 5 minutes.</p>
		</div>
	`;
}
