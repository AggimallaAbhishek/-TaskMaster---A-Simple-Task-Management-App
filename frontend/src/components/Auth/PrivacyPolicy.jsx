import React from 'react';

export function PrivacyPolicy() {
    return (
        <div style={{
            maxWidth: '800px',
            margin: '0 auto',
            padding: '40px 20px',
            fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
        }}>
            <h1>Privacy Policy</h1>
            <p><strong>Last updated: 2024</strong></p>

            <h2>1. Introduction</h2>
            <p>TaskMaster ("we," "us," or "our") operates the TaskMaster website. This page informs you of our policies regarding the collection, use, and disclosure of personal data when you use our service.</p>

            <h2>2. Information Collection and Use</h2>
            <p>We collect various types of information in connection with the services we provide, including:</p>
            <ul>
                <li><strong>Account Information:</strong> When you create an account, we collect your name and email address</li>
                <li><strong>Task Data:</strong> The tasks, notes, and preferences you save in TaskMaster</li>
                <li><strong>Usage Data:</strong> Information about how you interact with our service</li>
                <li><strong>Device Information:</strong> Technical information about the device you use to access TaskMaster</li>
            </ul>

            <h2>3. Google OAuth</h2>
            <p>TaskMaster uses Google OAuth for authentication. When you sign in with Google, we receive your Google profile information as permitted by Google's OAuth scope settings. We do not store your Google password.</p>

            <h2>4. Data Security</h2>
            <p>The security of your data is important to us but remember that no method of transmission over the Internet or method of electronic storage is 100% secure. While we strive to use commercially acceptable means to protect your personal data, we cannot guarantee its absolute security.</p>

            <h2>5. Data Retention</h2>
            <p>We retain your data for as long as your account is active. You may request deletion of your account and associated data at any time through your account settings.</p>

            <h2>6. Changes to This Privacy Policy</h2>
            <p>We may update our Privacy Policy from time to time. We will notify you of any changes by posting the new Privacy Policy on this page.</p>

            <h2>7. Contact Us</h2>
            <p>If you have any questions about this Privacy Policy, please contact us at support@taskmaster.app</p>
        </div>
    );
}
