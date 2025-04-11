const puppeteer = require('puppeteer');
const faker = require('faker');

async function getFormFields(page) {
  return await page.evaluate(() => {
    const inputs = Array.from(document.querySelectorAll('input, select, textarea'));
    return inputs.map(input => ({
      name: input.name || input.id,
      type: input.type || input.tagName.toLowerCase(),
      tagName: input.tagName.toLowerCase(),
      required: input.required,
      pattern: input.pattern,
      maxLength: input.maxLength,
      minLength: input.minLength,
      placeholder: input.placeholder
    }));
  });
}

function generateDummyValue(field) {
  switch(field.type) {
    case 'email':
      return faker.internet.email();
    case 'tel':
    case 'phone':
      return faker.phone.phoneNumber();
    case 'number':
      return faker.random.number({ min: 1, max: 100 });
    case 'date':
      return faker.date.past().toISOString().split('T')[0];
    case 'password':
      return faker.internet.password();
    case 'url':
      return faker.internet.url();
    case 'textarea':
      return faker.lorem.paragraph();
    case 'select':
      return ''; // Will be handled separately
    default:
      if (field.name.toLowerCase().includes('name')) {
        return faker.name.findName();
      }
      if (field.name.toLowerCase().includes('address')) {
        return faker.address.streetAddress();
      }
      return faker.random.words(2);
  }
}

async function runTest(url) {
  const browser = await puppeteer.launch({
    headless: true,
    args: ['--no-sandbox', '--disable-setuid-sandbox']
  });

  try {
    const page = await browser.newPage();
    
    // Set viewport for consistent results
    await page.setViewport({ width: 1366, height: 768 });

    // Navigate to the form page
    await page.goto(url, { waitUntil: 'networkidle0' });

    // Get all form fields
    const formFields = await getFormFields(page);
    console.log('Detected form fields:', formFields);

    // Fill each field with appropriate dummy data
    for (const field of formFields) {
      const dummyValue = generateDummyValue(field);
      
      if (field.tagName === 'select') {
        // Handle select elements by choosing a random option
        await page.evaluate((fieldName) => {
          const select = document.querySelector(`select[name="${fieldName}"]`);
          if (select && select.options.length) {
            const randomIndex = Math.floor(Math.random() * select.options.length);
            select.selectedIndex = randomIndex;
          }
        }, field.name);
      } else {
        // Fill other input types
        await page.evaluate((fieldName, value) => {
          const element = document.querySelector(`[name="${fieldName}"]`) || document.querySelector(`#${fieldName}`);
          if (element) {
            element.value = value;
            // Trigger change event
            const event = new Event('change', { bubbles: true });
            element.dispatchEvent(event);
          }
        }, field.name, dummyValue);
      }
    }

    // Take screenshot of filled form
    await page.screenshot({ path: 'form-filled.png' });

    // Submit the form (if there's a submit button)
    const submitButton = await page.$('button[type="submit"], input[type="submit"]');
    if (submitButton) {
      await submitButton.click();
      await page.waitForNavigation({ waitUntil: 'networkidle0' }).catch(() => {});
    }

    // Take screenshot after submission
    await page.screenshot({ path: 'form-submitted.png' });

    return {
      success: true,
      message: 'Form test completed successfully',
      fieldsDetected: formFields.length
    };

  } catch (error) {
    console.error('Test failed:', error);
    return {
      success: false,
      message: error.message,
      error: error
    };
  } finally {
    await browser.close();
  }
}

module.exports = { runTest };
