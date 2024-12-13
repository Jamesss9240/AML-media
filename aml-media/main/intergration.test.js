const puppeteer = require('puppeteer');
const { spawn } = require('child_process');

jest.setTimeout(60000); // bigger timeout, due to slower hardware with some devices

describe('AML Media Website Integration Tests', () => {
  let browser;
  let page;
  let server;
  let consoleMessages = [];

  // setup server/browser
  beforeAll(async () => {
    console.log('Starting backend server...');
    server = spawn('node', ['proxy.js'], {
      stdio: 'inherit',
      shell: true
    });

    // wait for server
    await new Promise(resolve => setTimeout(resolve, 5000));
    console.log('Backend server started.');

    console.log('Launching browser...');
    browser = await puppeteer.launch({
      //opens browser, note for tasnim/ethan/harvey: you will need to change this path to use your preferred browser
      executablePath: 'C:/Program Files/BraveSoftware/Brave-Browser/Application/brave.exe', 
      headless: false,
      args: ['--no-sandbox', '--disable-setuid-sandbox', '--ignore-certificate-errors']
    });
    console.log('Browser launched.');

    page = await browser.newPage();

    // reads console messages
    page.on('console', msg => {
      consoleMessages.push(msg.text());
    });

    // makes temp email setup work, so testing can still be carried out
    page.on('dialog', async (dialog) => {
      console.log('Dialog message:', dialog.message());
      await new Promise(resolve => setTimeout(resolve, 1000)); // Wait for 1 second before accepting the dialog
      await dialog.accept('TestJames@email.com');
    });
  });

  // close server/browser
  afterAll(async () => {
    if (browser) {
      console.log('Closing browser...');
      await browser.close();
      console.log('Browser closed.');
    }

    if (server) {
      console.log('Stopping backend server...');
      server.kill();
      console.log('Backend server stopped.');
    }
  });

  // reset page
  beforeEach(async () => {
    consoleMessages = []; // clear console, incase success message gets confused with previous test
    if (!page || page.isClosed()) {
      page = await browser.newPage();
    }
  });

  test('should load the homepage', async () => {
    console.log('Loading homepage...');
    await page.goto('https://127.0.0.1:8080/', { waitUntil: 'networkidle0' });
    const title = await page.title();
    console.log('Homepage loaded with title:', title);
    expect(title).toBe('AML Library');
  });

  test('should navigate to the login page', async () => {
    console.log('Navigating to login page...');
    await page.goto('https://127.0.0.1:8080/login.html', { waitUntil: 'networkidle0' });
    const url = await page.url();
    console.log('Navigated to login page with URL:', url);
    expect(url).toBe('https://127.0.0.1:8080/login.html');
  });

  test('should filter media', async () => {
    console.log('Filtering media...');
    await page.goto('https://127.0.0.1:8080/');
    await page.select('#view-select', 'novels');
    await page.waitForSelector('.media-item');
    const results = await page.$$('.media-item');
    console.log('Filtered results found:', results.length);
    expect(results.length).toBeGreaterThan(0);
  });

  test('should borrow media', async () => {
    console.log('Borrowing media...');
    await page.goto('https://127.0.0.1:8080/', {
      waitUntil: 'networkidle0',
      timeout: 30000
    });

    //delay, makes tests consistent 
    await page.waitForSelector('.borrow-button', { timeout: 10000 });

 
    await page.click('.borrow-button');

    // wait for success console message
    await new Promise(resolve => setTimeout(resolve, 2000)); 
    const successMessage = consoleMessages.find(msg => msg.includes('Borrow success'));
    console.log('Borrow success message:', successMessage);
    expect(successMessage).toContain('Borrow success');
  });

  test('should return media', async () => {
    console.log('Returning media...');
    await page.goto('https://127.0.0.1:8080/', {
      waitUntil: 'networkidle0',
      timeout: 30000
    });

 
    await page.click('#user-media-btn');

   
    await page.waitForSelector('.return-button', { timeout: 10000 });

   
    await page.evaluate(() => {
      const returnButton = document.querySelector('.return-button');
      if (returnButton) returnButton.click();
    });

    // check for console success message
    await new Promise(resolve => setTimeout(resolve, 2000)); 
    const successMessage = consoleMessages.find(msg => msg.includes('Return success'));
    console.log('Return success message:', successMessage);
    expect(successMessage).toContain('Return success');
  });
});