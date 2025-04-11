# Form Testing System

A comprehensive automated form testing system using AWS Lambda with headless browser and Next.js frontend.

## Features

- ✅ Automated form testing using Puppeteer in AWS Lambda
- 📊 Real-time analytics dashboard
- ⏰ Scheduled tests with configurable intervals
- 🔍 Detailed test reports with screenshots
- 🚨 Error tracking and notifications
- 🔐 Secure and scalable architecture

## Architecture

The system consists of two main components:

1. **Frontend (Next.js)**
   - Modern React-based dashboard
   - Real-time analytics
   - Test configuration interface
   - Responsive design using Tailwind CSS

2. **Backend (AWS Lambda)**
   - Serverless architecture
   - Puppeteer for form testing
   - DynamoDB for test results storage
   - S3 for screenshot storage
   - CloudWatch for monitoring

## Prerequisites

- Node.js 18 or later
- AWS Account with appropriate permissions
- Serverless Framework CLI
- Git

## Installation

### Frontend Setup

1. Navigate to the frontend directory:
   ```bash
   cd frontend
   ```

2. Install dependencies:
   ```bash
   npm install
   ```

3. Create a .env.local file:
   ```env
   NEXT_PUBLIC_API_URL=your_api_url
   ```

4. Run the development server:
   ```bash
   npm run dev
   ```

### Backend Setup

1. Navigate to the lambda directory:
   ```bash
   cd lambda
   ```

2. Install dependencies:
   ```bash
   npm install
   ```

3. Deploy to AWS:
   ```bash
   npm run deploy
   ```

## Configuration

### Frontend Configuration

The frontend can be configured through environment variables:

- `NEXT_PUBLIC_API_URL`: API Gateway URL
- `NEXT_PUBLIC_REGION`: AWS Region
- `NEXT_PUBLIC_USER_POOL_ID`: Cognito User Pool ID (if using authentication)
- `NEXT_PUBLIC_USER_POOL_CLIENT_ID`: Cognito Client ID (if using authentication)

### Backend Configuration

The backend is configured through the `serverless.yml` file:

- `provider.region`: AWS Region
- `provider.stage`: Deployment stage (dev, prod, etc.)
- `provider.environment`: Environment variables for Lambda functions
- `custom.resultsBucket`: S3 bucket for storing test results

## Usage

### Running Tests

1. Navigate to the dashboard
2. Click "Run Test" button
3. Enter the form URL and configuration
4. Submit and wait for results

### Scheduling Tests

1. Go to "Schedules" section
2. Click "New Schedule"
3. Configure test parameters and schedule
4. Save the schedule

### Viewing Results

1. Visit the dashboard for overview
2. Click on individual tests for detailed reports
3. View screenshots and error details
4. Export results as needed

## Development

### Running Locally

Frontend:
```bash
cd frontend
npm run dev
```

Backend (local invoke):
```bash
cd lambda
npm run invoke:local -- -f runTest -p test-event.json
```

### Testing

Run frontend tests:
```bash
cd frontend
npm test
```

Run backend tests:
```bash
cd lambda
npm test
```

### Deployment

Deploy frontend to Vercel:
```bash
cd frontend
vercel deploy
```

Deploy backend to AWS:
```bash
cd lambda
npm run deploy:prod
```

## Security

- All API endpoints are protected with CORS
- Secure storage of test results
- Request validation and sanitization
- Rate limiting on API endpoints
- AWS IAM roles with least privilege

## Monitoring

- CloudWatch metrics and logs
- Error tracking and alerting
- Performance monitoring
- Cost monitoring and optimization

## Troubleshooting

Common issues and solutions:

1. **Lambda Timeout**: Increase the timeout in serverless.yml
2. **Memory Issues**: Increase Lambda memory allocation
3. **API Errors**: Check CloudWatch logs for details
4. **Deployment Failures**: Verify AWS credentials and permissions

## Contributing

1. Fork the repository
2. Create a feature branch
3. Commit your changes
4. Push to the branch
5. Create a Pull Request

## License

This project is licensed under the MIT License - see the LICENSE file for details.

## Support

For support, please create an issue in the GitHub repository or contact the maintainers.