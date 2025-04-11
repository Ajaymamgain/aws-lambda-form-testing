const chromium = require('@sparticuz/chromium');
const puppeteer = require('puppeteer-core');
const AWS = require('aws-sdk');
const { v4: uuidv4 } = require('uuid');

const s3 = new AWS.S3();
const dynamoDB = new AWS.DynamoDB.DocumentClient();

const RESULTS_BUCKET = process.env.RESULTS_BUCKET;
const TESTS_TABLE = process.env.TESTS_TABLE;

async function initBrowser() {
  let browser;
  try {
    browser = await puppeteer.launch({
      args: chromium.args,
      defaultViewport: chromium.defaultViewport,
      executablePath: await chromium.executablePath(),
      headless: chromium.headless,
      ignoreHTTPSErrors: true,
    });
    return browser;
  } catch (error) {
    console.error('Failed to launch browser:', error);
    throw error;
  }
}

async function validateForm(page, config) {
  const results = {
    errors: [],
    warnings: [],
    validations: [],
  };

  try {
    // Wait for form to be visible
    await page.waitForSelector(config.formSelector || 'form', { timeout: 5000 });

    // Check form accessibility
    const accessibilityReport = await page.evaluate(() => {
      // Basic accessibility checks
      const form = document.querySelector('form');
      const results = [];

      if (!form) return results;

      // Check form elements
      const inputs = form.querySelectorAll('input, select, textarea');
      inputs.forEach(input => {
        // Check for labels
        const label = input.labels?.[0]?.textContent || input.getAttribute('aria-label');
        if (!label) {
          results.push({ type: 'error', message: `Input ${input.name || input.id} missing label` });
        }

        // Check for ARIA attributes
        if (input.getAttribute('aria-required') === 'true' && !input.hasAttribute('required')) {
          results.push({ type: 'warning', message: `Input ${input.name || input.id} marked as aria-required but missing required attribute` });
        }
      });

      return results;
    });

    results.validations.push(...accessibilityReport);

    // Fill form fields based on config
    for (const field of config.fields || []) {
      try {
        const element = await page.$(field.selector);
        if (!element) {
          results.errors.push({ message: `Field not found: ${field.selector}` });
          continue;
        }

        switch (field.type) {
          case 'text':
          case 'email':
          case 'password':
            await element.type(field.value);
            break;
          case 'select':
            await element.select(field.value);
            break;
          case 'checkbox':
          case 'radio':
            await element.click();
            break;
          default:
            await element.type(field.value);
        }

        // Validate field after filling
        const validation = await page.evaluate((selector) => {
          const element = document.querySelector(selector);
          if (!element) return null;
          
          // Check HTML5 validation
          const validity = element.validity;
          if (!validity.valid) {
            return {
              type: 'error',
              message: element.validationMessage,
            };
          }
          
          return null;
        }, field.selector);

        if (validation) {
          results.validations.push(validation);
        }
      } catch (error) {
        results.errors.push({
          field: field.selector,
          message: error.message,
        });
      }
    }

    // Submit form if specified
    if (config.submit) {
      try {
        // Click submit button
        await page.click(config.submitSelector || 'button[type="submit"]');
        
        // Wait for navigation or response
        await Promise.race([
          page.waitForNavigation({ timeout: 5000 }),
          page.waitForSelector(config.successSelector || '.success-message', { timeout: 5000 }),
        ]);

        // Check for error messages
        const errors = await page.evaluate((errorSelector) => {
          const elements = document.querySelectorAll(errorSelector || '.error-message');
          return Array.from(elements).map(el => el.textContent);
        }, config.errorSelector);

        if (errors.length > 0) {
          results.errors.push(...errors.map(message => ({ message })));
        }
      } catch (error) {
        results.errors.push({
          message: `Form submission failed: ${error.message}`,
        });
      }
    }

    return results;
  } catch (error) {
    console.error('Form validation failed:', error);
    results.errors.push({
      message: `Form validation failed: ${error.message}`,
    });
    return results;
  }
}

exports.handler = async (event) => {
  let browser;
  try {
    const testId = uuidv4();
    const { url, config } = JSON.parse(event.body);

    // Initialize browser
    browser = await initBrowser();
    const page = await browser.newPage();

    // Set viewport and user agent
    await page.setViewport({ width: 1280, height: 800 });
    await page.setUserAgent('Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36');

    // Navigate to page
    await page.goto(url, { waitUntil: 'networkidle0', timeout: 30000 });

    // Take screenshot
    const screenshot = await page.screenshot({ fullPage: true });

    // Run form validation
    const testResults = await validateForm(page, config);

    // Save screenshot to S3
    await s3.putObject({
      Bucket: RESULTS_BUCKET,
      Key: `${testId}/screenshot.png`,
      Body: screenshot,
      ContentType: 'image/png',
    }).promise();

    // Save test results to DynamoDB
    const timestamp = new Date().toISOString();
    await dynamoDB.put({
      TableName: TESTS_TABLE,
      Item: {
        testId,
        url,
        config,
        results: testResults,
        screenshotUrl: `${RESULTS_BUCKET}/${testId}/screenshot.png`,
        createdAt: timestamp,
        updatedAt: timestamp,
        status: testResults.errors.length > 0 ? 'failed' : 'success',
      },
    }).promise();

    return {
      statusCode: 200,
      headers: {
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*',
      },
      body: JSON.stringify({
        testId,
        results: testResults,
        screenshotUrl: `${RESULTS_BUCKET}/${testId}/screenshot.png`,
      }),
    };
  } catch (error) {
    console.error('Test execution failed:', error);
    return {
      statusCode: 500,
      headers: {
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*',
      },
      body: JSON.stringify({
        error: 'Test execution failed',
        message: error.message,
      }),
    };
  } finally {
    if (browser) {
      await browser.close();
    }
  }
};