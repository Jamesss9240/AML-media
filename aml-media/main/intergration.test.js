const puppeteer = require('puppeteer'); 
const { spawn } = require('child_process');  

jest.setTimeout(30000); 

describe('AML Media Website Integration Tests', () => {   
  let browser;   
  let page;   
  let server;    

  beforeAll(async () => {     
    console.log('Starting backend server...');     
    server = spawn('node', ['proxy.js'], {       
      stdio: 'inherit',       
      shell: true     
    });      

    await new Promise(resolve => setTimeout(resolve, 5000));     
    console.log('Backend server started.');      

    console.log('Launching browser...');     
    browser = await puppeteer.launch({       
      executablePath: 'C:/Program Files/BraveSoftware/Brave-Browser/Application/brave.exe', 
      headless: false,       
      args: ['--no-sandbox', '--disable-setuid-sandbox', '--ignore-certificate-errors']     
    });     
    console.log('Browser launched.');      

    page = await browser.newPage();   
  });    

  afterAll(async () => {     
    if (browser) {       
      await browser.close();       
      console.log('Browser closed.');     
    }      

    if (server) {       
      console.log('Stopping backend server...');       
      server.kill();       
      console.log('Backend server stopped.');     
    }   
  });    

  beforeEach(async () => {     
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
    await page.goto('https://127.0.0.1:8080/');     
    await page.evaluate(() => {
      const borrowButton = document.querySelector('.borrow-button');
      if (borrowButton) {
        window.prompt = () => 'TestJames@email.com';
        borrowButton.click();
      }
    });
    await page.on('dialog', async (dialog) => {
      console.log('Dialog message:', dialog.message());
      await dialog.accept();
    });
    await page.waitForFunction(() => window.confirm);
  });    
});
