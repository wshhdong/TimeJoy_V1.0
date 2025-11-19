
// Email Configuration
// In a real Django environment, these would be in settings.py
export const EMAIL_CONFIG = {
  EMAIL_HOST: 'smtp.qq.com',
  EMAIL_HOST_USER: '85396173@qq.com',
  EMAIL_HOST_PASSWORD: 'lspsrhvfturbbjbj', // NOTE: In production, never expose this in frontend code
  DEFAULT_FROM_EMAIL: 'TimeJoy <85396173@qq.com>',
};

export const sendWeeklyReport = async (email: string, reportHtml: string): Promise<boolean> => {
  console.log(`
    [SIMULATION] Sending Email via ${EMAIL_CONFIG.EMAIL_HOST}
    FROM: ${EMAIL_CONFIG.DEFAULT_FROM_EMAIL}
    TO: ${email}
    AUTH: ${EMAIL_CONFIG.EMAIL_HOST_USER} / ****
    CONTENT_LENGTH: ${reportHtml.length} chars
  `);
  
  // Simulating network delay for email sending
  return new Promise((resolve) => {
    setTimeout(() => {
      console.log("[SIMULATION] Email sent successfully.");
      resolve(true);
    }, 1500);
  });
};
