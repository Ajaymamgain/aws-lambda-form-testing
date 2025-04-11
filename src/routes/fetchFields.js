const puppeteer = require('puppeteer');

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

async function fetchFieldsFromUrl(url) {
  const browser = await puppeteer.launch({
    headless: true,
    args: ['--no-sandbox', '--disable-setuid-sandbox']
  });

  try {
    const page = await browser.newPage();
    await page.goto(url, { waitUntil: 'networkidle0' });
    
    const fields = await getFormFields(page);
    
    return {
      success: true,
      fields: fields
    };
  } catch (error) {
    console.error('Failed to fetch fields:', error);
    return {
      success: false,
      error: error.message
    };
  } finally {
    await browser.close();
  }
}

module.exports = function(app) {
  app.post('/api/fetch-fields', async (req, res) => {
    const { url } = req.body;
    
    if (!url) {
      return res.status(400).json({
        success: false,
        error: 'URL is required'
      });
    }

    try {
      const result = await fetchFieldsFromUrl(url);
      
      if (result.success) {
        res.json({
          success: true,
          fields: result.fields
        });
      } else {
        res.status(500).json({
          success: false,
          error: result.error
        });
      }
    } catch (error) {
      res.status(500).json({
        success: false,
        error: error.message
      });
    }
  });
};