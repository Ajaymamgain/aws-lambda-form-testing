# AWS Lambda Form Testing

Automated form testing system using AWS Lambda with Playwright headless browser and Next.js frontend.

## Features

- Automated form testing using Playwright in AWS Lambda
- Next.js frontend for test configuration and monitoring
- Support for multiple target URLs
- Test scheduling (hourly, daily, weekly, monthly, or custom cron)
- Detailed reporting and analytics
- Customizable user input data

## Project Structure

- `/lambda` - AWS Lambda function for browser automation
- `/frontend` - Next.js frontend application

## Getting Started

### Prerequisites

- Node.js 18+
- AWS CLI configured with appropriate credentials
- Serverless Framework installed globally (`npm install -g serverless`)

### Deploying the Lambda Functions

1. Navigate to the lambda directory:

```bash
cd lambda
```

2. Install dependencies:

```bash
npm install
```

3. Deploy the AWS resources:

```bash
npm run deploy
```

4. Take note of the API Gateway endpoint URL from the deployment output. You will need to configure this in the frontend.

### Setting up the Frontend

1. Navigate to the frontend directory:

```bash
cd frontend
```

2. Install dependencies:

```bash
npm install
```

3. Create a `.env.local` file with the following content:

```
NEXT_PUBLIC_API_URL=<Your API Gateway URL from the Lambda deployment>
```

4. Start the development server:

```bash
npm run dev
```

5. For production, build and start the application:

```bash
npm run build
npm start
```

## Usage

### Creating a Form Test

1. Open the frontend application
2. Click on "Run Test" in the dashboard
3. Enter the target URL and form configuration
4. Click "Run Test" to execute the test immediately

### Scheduling Tests

1. Navigate to the "New Schedule" section
2. Configure the test details including URL, form fields, and schedule frequency
3. Save the schedule to activate it

### Viewing Test Results

1. From the dashboard, you can view recent test results
2. Click on any test to see detailed information including:
   - Screenshots (before, during, after)
   - Form field values
   - Success/failure status
   - Error logs if any issues occurred

## Advanced Configuration

### Customizing Form Selectors

The system supports various field types and selector strategies:

- Text inputs
- Select dropdowns
- Checkboxes
- Radio buttons

Provide CSS selectors for each field in the form configuration.

### Schedule Management

- Tests can be scheduled to run hourly, daily, weekly, monthly, or with custom cron expressions
- Schedules can be activated/deactivated at any time
- View past runs for each schedule

## Troubleshooting

### Common Issues

- **Lambda Timeout**: If your form testing is complex, you may need to increase the Lambda timeout in `serverless.yml`
- **Missing Screenshots**: Ensure the S3 bucket has proper permissions
- **Scheduling Issues**: Verify EventBridge rules are correctly configured

## Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

## License

This project is licensed under the MIT License - see the LICENSE file for details.
