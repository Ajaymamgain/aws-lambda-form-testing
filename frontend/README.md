# Form Testing Frontend

This is the frontend application for the AWS Lambda Form Testing platform, built with Next.js and Tailwind CSS.

## Development Setup

1. Install dependencies:
```bash
npm install
# or
yarn install
```

2. Configure environment variables:
Create a `.env.local` file with the following content:
```
# API Gateway URL from AWS Lambda deployment
NEXT_PUBLIC_API_URL=https://your-api-gateway-url.execute-api.region.amazonaws.com/stage
```

3. Start the development server:
```bash
npm run dev
# or
yarn dev
```

The application will be available at http://localhost:3001

## Building for Production

```bash
npm run build
npm start
# or
yarn build
yarn start
```

## Project Structure

- `src/app` - Next.js app router pages and layouts
- `src/components` - Reusable UI components
- `src/lib` - Utility functions and providers
- `src/types` - TypeScript type definitions

## Features

- Dashboard with analytics
- Form testing configuration
- Test result viewing
- Test scheduling
- Settings management

## Dependencies

- Next.js 14
- Tailwind CSS
- Tremor (for charts and UI components)
- React Hook Form (for form handling)
- React Hot Toast (for notifications)
- SWR (for data fetching)

## Troubleshooting

If you encounter any issues with the application:

1. Check that the API URL is correctly set in `.env.local`
2. Make sure all dependencies are installed with `npm install`
3. If charts are not rendering, try restarting the development server
4. Ensure Node.js version is 18 or higher

## License

This project is licensed under the MIT License - see the LICENSE file for details.
