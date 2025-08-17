# Feedback API Setup Guide

## Overview
This setup allows users to send feedback directly to your backend API instead of opening their email app. The feedback is stored in your system and you can view it through an admin dashboard.

## Features
- ✅ Direct feedback submission to your API
- ✅ Email notifications when feedback is received
- ✅ Admin dashboard to view all feedback
- ✅ Fallback to email if API fails
- ✅ Feedback storage and retrieval
- ✅ User identification and tracking

## Setup Instructions

### 1. Backend API Setup

#### Option A: Use the provided Express.js server

1. **Create a new directory for the API:**
   ```bash
   mkdir habit-tracker-feedback-api
   cd habit-tracker-feedback-api
   ```

2. **Copy the files:**
   - Copy `feedback-api-example.js` to your API directory
   - Copy `feedback-api-package.json` to `package.json`

3. **Install dependencies:**
   ```bash
   npm install
   ```

4. **Configure email settings:**
   Edit `feedback-api-example.js` and update:
   ```javascript
   const transporter = nodemailer.createTransporter({
     service: 'gmail',
     auth: {
       user: 'your-email@gmail.com',
       pass: 'your-app-password' // Use Gmail app password
     }
   });
   ```

5. **Start the server:**
   ```bash
   npm start
   ```

#### Option B: Use Firebase Functions

1. **Create a Firebase project**
2. **Set up Firebase Functions**
3. **Deploy the feedback function**

#### Option C: Use Supabase

1. **Create a Supabase project**
2. **Create a feedback table**
3. **Set up Edge Functions for feedback processing**

### 2. Update App Configuration

#### Update API URL in your app:

1. **In `components/FeedbackModal.tsx`:**
   ```javascript
   const response = await fetch('https://your-api-domain.com/api/feedback', {
   ```

2. **In `components/LibraryFeedbackModal.tsx`:**
   ```javascript
   const response = await fetch('https://your-api-domain.com/api/feedback', {
   ```

3. **Replace `your-api-domain.com` with your actual API domain**

### 3. Environment Variables (Recommended)

Create a `.env` file in your app root:
```env
FEEDBACK_API_URL=https://your-api-domain.com/api/feedback
```

Then update the fetch calls to use:
```javascript
const response = await fetch(process.env.FEEDBACK_API_URL, {
```

### 4. Admin Dashboard Access

Once your API is running, you can access the admin dashboard at:
```
http://your-api-domain.com/admin/feedback
```

## API Endpoints

### POST /api/feedback
Submit new feedback

**Request Body:**
```json
{
  "type": "general|bug|feature|praise|library_feedback",
  "subject": "Feedback subject",
  "message": "Feedback message",
  "userId": "user_id",
  "userEmail": "user@email.com",
  "timestamp": "2024-01-01T00:00:00.000Z",
  "appVersion": "1.0.0",
  "platform": "mobile"
}
```

**Response:**
```json
{
  "success": true,
  "message": "Feedback received successfully",
  "feedbackId": "1234567890"
}
```

### GET /api/feedback
Get all feedback (for admin use)

### GET /api/feedback/:id
Get specific feedback by ID

## Production Considerations

### 1. Database Storage
Replace the in-memory storage with a proper database:
- **MongoDB**: For flexible document storage
- **PostgreSQL**: For structured data
- **Firebase Firestore**: For real-time updates
- **Supabase**: For PostgreSQL with real-time features

### 2. Authentication
Add authentication to protect your API:
```javascript
// Add middleware to verify API keys or JWT tokens
app.use('/api/feedback', authenticateRequest);
```

### 3. Rate Limiting
Prevent spam by adding rate limiting:
```javascript
const rateLimit = require('express-rate-limit');

const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 5 // limit each IP to 5 requests per windowMs
});

app.use('/api/feedback', limiter);
```

### 4. Email Service
Use a reliable email service:
- **SendGrid**: Professional email delivery
- **Mailgun**: Developer-friendly email API
- **AWS SES**: Cost-effective for high volume

### 5. Monitoring
Add logging and monitoring:
- **Winston**: For logging
- **Sentry**: For error tracking
- **Google Analytics**: For usage tracking

## Testing

### Test the API locally:
```bash
curl -X POST http://localhost:3000/api/feedback \
  -H "Content-Type: application/json" \
  -d '{
    "type": "bug",
    "subject": "Test feedback",
    "message": "This is a test feedback message",
    "userId": "test-user",
    "userEmail": "test@example.com"
  }'
```

### Test the admin dashboard:
Visit `http://localhost:3000/admin/feedback` in your browser

## Security Best Practices

1. **Validate input data** on the server
2. **Sanitize user input** to prevent XSS
3. **Use HTTPS** in production
4. **Implement rate limiting** to prevent abuse
5. **Add authentication** for admin endpoints
6. **Log all requests** for monitoring
7. **Use environment variables** for sensitive data

## Troubleshooting

### Common Issues:

1. **CORS errors**: Make sure your API allows requests from your app domain
2. **Email not sending**: Check your email service credentials
3. **API not responding**: Verify the API URL in your app
4. **Feedback not saving**: Check database connection and permissions

### Debug Mode:
Add this to your API for debugging:
```javascript
app.use((req, res, next) => {
  console.log(`${req.method} ${req.path}`, req.body);
  next();
});
```

## Next Steps

1. **Deploy your API** to a cloud service (Heroku, Vercel, AWS, etc.)
2. **Set up monitoring** and alerts
3. **Create a more sophisticated admin dashboard**
4. **Add feedback analytics** and reporting
5. **Implement feedback categorization** and auto-routing
6. **Add user notification** when feedback is responded to
