import { Builder } from 'selenium-webdriver';
import chrome from 'selenium-webdriver/chrome.js'; // Nota el .js al final

async function runTest() {
  // Configuración para Chrome/Brave
  const options = new chrome.Options();
  
  let driver = await new Builder()
    .forBrowser('chrome')
    .setChromeOptions(options)
    .build();

  try {
    await driver.get('https://www.google.com');
    const title = await driver.getTitle();
    console.log("¡Éxito! El título es: " + title);
  } catch (error) {
    console.error("Error:", error);
  } finally {
    await driver.quit();
  }
}

runTest();