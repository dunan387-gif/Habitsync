const express = require('express');
const cors = require('cors');
const bodyParser = require('body-parser');
const nodemailer = require('nodemailer');
const fs = require('fs');
const path = require('path');

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(cors());
app.use(bodyParser.json());

// Store feedback in memory (in production, use a database)
let feedbackStorage = [];

// Email configuration (you can use Gmail, SendGrid, etc.)
const transporter = nodemailer.createTransporter({
  service: 'gmail', // or 'sendgrid', 'mailgun', etc.
  auth: {
    user: 'your-email@gmail.com',
    pass: 'your-app-password' // Use app password for Gmail
  }
});

// Feedback endpoint
app.post('/api/feedback', async (req, res) => {
  try {
    const feedback = req.body;
    
    // Validate required fields
    if (!feedback.type || !feedback.subject || !feedback.message) {
      return res.status(400).json({ 
        error: 'Missing required fields' 
      });
    }

    // Add timestamp and ID
    feedback.id = Date.now().toString();
    feedback.receivedAt = new Date().toISOString();
    
    // Store feedback
    feedbackStorage.push(feedback);
    
    // Save to file (in production, save to database)
    saveFeedbackToFile(feedback);
    
    // Send email notification
    await sendFeedbackEmail(feedback);
    
    // Log feedback
    console.log('New feedback received:', {
      id: feedback.id,
      type: feedback.type,
      subject: feedback.subject,
      userId: feedback.userId,
      timestamp: feedback.timestamp
    });
    
    res.status(200).json({ 
      success: true, 
      message: 'Feedback received successfully',
      feedbackId: feedback.id
    });
    
  } catch (error) {
    console.error('Error processing feedback:', error);
    res.status(500).json({ 
      error: 'Internal server error' 
    });
  }
});

// Get all feedback (for admin dashboard)
app.get('/api/feedback', (req, res) => {
  try {
    res.json({
      success: true,
      feedback: feedbackStorage,
      total: feedbackStorage.length
    });
  } catch (error) {
    res.status(500).json({ error: 'Failed to retrieve feedback' });
  }
});

// Get feedback by ID
app.get('/api/feedback/:id', (req, res) => {
  try {
    const feedback = feedbackStorage.find(f => f.id === req.params.id);
    if (!feedback) {
      return res.status(404).json({ error: 'Feedback not found' });
    }
    res.json({ success: true, feedback });
  } catch (error) {
    res.status(500).json({ error: 'Failed to retrieve feedback' });
  }
});

// Helper function to save feedback to file
function saveFeedbackToFile(feedback) {
  try {
    const feedbackDir = path.join(__dirname, 'feedback');
    if (!fs.existsSync(feedbackDir)) {
      fs.mkdirSync(feedbackDir);
    }
    
    const filename = `feedback-${feedback.id}.json`;
    const filepath = path.join(feedbackDir, filename);
    
    fs.writeFileSync(filepath, JSON.stringify(feedback, null, 2));
    console.log(`Feedback saved to: ${filepath}`);
  } catch (error) {
    console.error('Error saving feedback to file:', error);
  }
}

// Helper function to send email notification
async function sendFeedbackEmail(feedback) {
  try {
    const emailContent = `
New Feedback Received

Type: ${feedback.type}
Subject: ${feedback.subject}
Message: ${feedback.message}
User ID: ${feedback.userId}
User Email: ${feedback.userEmail}
Timestamp: ${feedback.timestamp}
App Version: ${feedback.appVersion}
Platform: ${feedback.platform}

Received at: ${feedback.receivedAt}
Feedback ID: ${feedback.id}
    `;

    const mailOptions = {
      from: 'your-email@gmail.com',
      to: 'your-email@gmail.com', // Where you want to receive feedback
      subject: `[App Feedback] ${feedback.type} - ${feedback.subject}`,
      text: emailContent,
      html: emailContent.replace(/\n/g, '<br>')
    };

    await transporter.sendMail(mailOptions);
    console.log('Feedback email sent successfully');
  } catch (error) {
    console.error('Error sending feedback email:', error);
  }
}

// Simple admin dashboard endpoint
app.get('/admin/feedback', (req, res) => {
  const html = `
    <!DOCTYPE html>
    <html>
    <head>
      <title>Feedback Dashboard</title>
      <style>
        body { font-family: Arial, sans-serif; margin: 20px; }
        .feedback-item { border: 1px solid #ddd; margin: 10px 0; padding: 15px; border-radius: 5px; }
        .feedback-type { font-weight: bold; color: #333; }
        .feedback-subject { color: #666; margin: 5px 0; }
        .feedback-message { background: #f9f9f9; padding: 10px; margin: 10px 0; }
        .feedback-meta { font-size: 12px; color: #999; }
      </style>
    </head>
    <body>
      <h1>Feedback Dashboard</h1>
      <p>Total feedback: ${feedbackStorage.length}</p>
      ${feedbackStorage.map(f => `
        <div class="feedback-item">
          <div class="feedback-type">${f.type}</div>
          <div class="feedback-subject">${f.subject}</div>
          <div class="feedback-message">${f.message}</div>
          <div class="feedback-meta">
            User: ${f.userId} | Email: ${f.userEmail} | Time: ${new Date(f.timestamp).toLocaleString()}
          </div>
        </div>
      `).join('')}
    </body>
    </html>
  `;
  res.send(html);
});

app.listen(PORT, () => {
  console.log(`Feedback API server running on port ${PORT}`);
  console.log(`Admin dashboard: http://localhost:${PORT}/admin/feedback`);
});

module.exports = app;
