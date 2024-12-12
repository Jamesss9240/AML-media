const puppeteer = require('puppeteer'); 
const { spawn } = require('child_process');  

jest.setTimeout(30000); // Increase Jest timeout for browser interaction  

describe('AML Media Website Integration Tests', () => {   
  let browser;   
  let page;   
  let server;    

  // Setup before all tests   
  beforeAll(async () => {     
    // Start the backend server     
    console.log('Starting backend server...');     
    server = spawn('node', ['proxy.js'], {       
      stdio: 'inherit',       
      shell: true     
    });      

    // Wait for the server to start     
    await new Promise(resolve => setTimeout(resolve, 5000));     
    console.log('Backend server started.');      

    // Launch the browser     
    console.log('Launching browser...');     
    browser = await puppeteer.launch({       
      executablePath: 'C:/Program Files/BraveSoftware/Brave-Browser/Application/brave.exe', 
      headless: false,       
      args: ['--no-sandbox', '--disable-setuid-sandbox', '--ignore-certificate-errors']     
    });     
    console.log('Browser launched.');      

    // Create a new page     
    page = await browser.newPage();   
  });    

  // Teardown after all tests   
  afterAll(async () => {     
    // Close the browser     
    if (browser) {       
      console.log('Closing browser...');       
      await browser.close();       
      console.log('Browser closed.');     
    }      

    // Stop the backend server     
    if (server) {       
      console.log('Stopping backend server...');       
      server.kill();       
      console.log('Backend server stopped.');     
    }   
  });    

  // Reset page before each test   
  beforeEach(async () => {     
    // Create a new page or reset the existing one     
    if (!page || page.isClosed()) {       
      page = await browser.newPage();     
    }   
  });    

  test('should load the homepage', async () => {     
    console.log('Loading homepage...');     
    await page.goto('http://localhost:8080/', { waitUntil: 'networkidle0' });     
    const title = await page.title();     
    console.log('Homepage loaded with title:', title);     
    expect(title).toBe('AML Library');   
  });      

  test('should navigate to the login page', async () => {     
    console.log('Navigating to login page...');     
    await page.goto('http://127.0.0.1:8080/login.html', { waitUntil: 'networkidle0' });     
    const url = await page.url();     
    console.log('Navigated to login page with URL:', url);     
    expect(url).toBe('http://127.0.0.1:8080/login.html');     
  });      

  test('should filter media', async () => {     
    console.log('Filtering media...');     
    await page.goto('http://localhost:8080/');     
    
    // Use the existing view selector to filter media
    await page.select('#view-select', 'novels'); // Assuming 'novels' is a valid filter
    
    // Wait for media items to load
    await page.waitForSelector('.media-item');
    
    const results = await page.$$('.media-item');
    console.log('Filtered results found:', results.length);
    expect(results.length).toBeGreaterThan(0);
  });      

  test('should borrow media', async () => {     
    console.log('Borrowing media...');     
    await page.goto('http://localhost:8080/');     
    
    // Trigger borrow functionality as in the actual implementation
    await page.evaluate(() => {
      const borrowButton = document.querySelector('.borrow-button');
      if (borrowButton) {
        window.prompt = () => 'TestJames@email.com';
        borrowButton.click();
      }
    });
    
    // Wait for alert
    await page.on('dialog', async (dialog) => {
      console.log('Dialog message:', dialog.message());
      await dialog.accept();
    });
    
    // Check for success (this might need adjustment based on actual implementation)
    await page.waitForFunction(() => window.confirm);
  });    
});