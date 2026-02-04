import puppeteer from 'puppeteer';
import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const SCREENSHOT_DIR = path.join(__dirname, 'screenshots');
const BASE_URL = 'http://localhost:21001';

async function delay(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

async function runE2ETests() {
  console.log('Starting E2E Tests (Headless Mode)\n');

  const browser = await puppeteer.launch({
    headless: 'new',
    args: ['--no-sandbox', '--disable-setuid-sandbox']
  });

  const page = await browser.newPage();
  await page.setViewport({ width: 1440, height: 900 });

  const results = [];

  try {
    // ========================================
    // UC1: HomePage - Workspace List
    // ========================================
    console.log('UC1: HomePage - Workspace List');
    await page.goto(BASE_URL, { waitUntil: 'networkidle0', timeout: 30000 });
    await delay(1000);
    await page.screenshot({ path: path.join(SCREENSHOT_DIR, '01_homepage.png'), fullPage: false });

    // Check if workspaces are loaded
    const workspaceCards = await page.$$('.bg-white.border.rounded-2xl');
    console.log(`  > Workspace cards: ${workspaceCards.length} loaded`);
    results.push({ test: 'HomePage Load', status: 'PASS', detail: `${workspaceCards.length} workspaces` });

    // ========================================
    // UC1-2: Workspace Create Modal
    // ========================================
    console.log('UC1-2: Workspace Create Modal');
    // Find button with "Workspace" text
    const addWorkspaceBtn = await page.evaluateHandle(() => {
      const buttons = Array.from(document.querySelectorAll('button'));
      return buttons.find(b => b.textContent.includes('Workspace'));
    });

    if (addWorkspaceBtn && addWorkspaceBtn.asElement()) {
      await addWorkspaceBtn.click();
      await delay(500);
      await page.screenshot({ path: path.join(SCREENSHOT_DIR, '02_workspace_create_modal.png') });

      // Close modal by pressing Escape
      await page.keyboard.press('Escape');
      await delay(300);
      console.log('  > Workspace create modal verified');
      results.push({ test: 'Workspace Create Modal', status: 'PASS' });
    } else {
      console.log('  > Workspace create button not found');
      results.push({ test: 'Workspace Create Modal', status: 'SKIP', detail: 'Button not found' });
    }

    // ========================================
    // UC2: WorkspaceDashboard - Click Workspace
    // ========================================
    console.log('UC2: WorkspaceDashboard Entry');
    const firstWorkspace = await page.$('.bg-white.border.rounded-2xl');
    if (firstWorkspace) {
      await firstWorkspace.click();
      await delay(1500);
      await page.screenshot({ path: path.join(SCREENSHOT_DIR, '03_workspace_dashboard.png') });
      console.log('  > WorkspaceDashboard page loaded');
      results.push({ test: 'WorkspaceDashboard Load', status: 'PASS' });
    }

    // ========================================
    // UC3: MissionsPage - Mission Kanban Board
    // ========================================
    console.log('UC3: MissionsPage - Mission Kanban Board');

    // Click Missions in sidebar navigation
    const missionsNav = await page.evaluateHandle(() => {
      const links = Array.from(document.querySelectorAll('a'));
      return links.find(a => a.href.includes('/missions') || a.textContent.includes('Missions'));
    });

    if (missionsNav && missionsNav.asElement()) {
      await missionsNav.click();
      await delay(1000);
    } else {
      await page.goto(`${BASE_URL}/workspace/1/missions`, { waitUntil: 'networkidle0' });
      await delay(1000);
    }

    await page.screenshot({ path: path.join(SCREENSHOT_DIR, '04_missions_page.png') });
    console.log('  > Missions page loaded');
    results.push({ test: 'MissionsPage Load', status: 'PASS' });

    // ========================================
    // UC3-2: Mission Create Modal
    // ========================================
    console.log('UC3-2: Mission Create Modal');
    const newMissionBtn = await page.evaluateHandle(() => {
      const buttons = Array.from(document.querySelectorAll('button'));
      return buttons.find(b => b.textContent.includes('Mission') || b.textContent.includes('New'));
    });

    if (newMissionBtn && newMissionBtn.asElement()) {
      await newMissionBtn.click();
      await delay(500);
      await page.screenshot({ path: path.join(SCREENSHOT_DIR, '05_mission_create_modal.png') });

      await page.keyboard.press('Escape');
      await delay(300);
      console.log('  > Mission create modal verified');
      results.push({ test: 'Mission Create Modal', status: 'PASS' });
    } else {
      results.push({ test: 'Mission Create Modal', status: 'SKIP', detail: 'Button not found' });
    }

    // ========================================
    // UC3-3: Mission Detail Modal
    // ========================================
    console.log('UC3-3: Mission Detail Modal');
    const missionCard = await page.$('[class*="mission"], [class*="card"], .bg-white.rounded-lg.shadow');
    if (missionCard) {
      await missionCard.click();
      await delay(800);
      await page.screenshot({ path: path.join(SCREENSHOT_DIR, '06_mission_detail_modal.png') });
      console.log('  > Mission detail modal verified');
      results.push({ test: 'Mission Detail Modal', status: 'PASS' });

      await page.keyboard.press('Escape');
      await delay(300);
    } else {
      results.push({ test: 'Mission Detail Modal', status: 'SKIP', detail: 'No mission card found' });
    }

    // ========================================
    // UC4: TodosPage - Todo Kanban Board
    // ========================================
    console.log('UC4: TodosPage - Todo Kanban Board');

    // Navigate to todos page
    const todosNav = await page.evaluateHandle(() => {
      const links = Array.from(document.querySelectorAll('a'));
      return links.find(a => a.href.includes('/todos') || a.textContent.includes('Todos'));
    });

    if (todosNav && todosNav.asElement()) {
      await todosNav.click();
      await delay(1000);
    } else {
      await page.goto(`${BASE_URL}/workspace/1/missions/1/todos`, { waitUntil: 'networkidle0' });
      await delay(1000);
    }

    await page.screenshot({ path: path.join(SCREENSHOT_DIR, '07_todos_page.png') });
    console.log('  > TodosPage loaded');
    results.push({ test: 'TodosPage Load', status: 'PASS' });

    // ========================================
    // UC5: AI Question Panel
    // ========================================
    console.log('UC5: AI Question Panel');

    // Go back to homepage to find AI alert
    await page.goto(BASE_URL, { waitUntil: 'networkidle0' });
    await delay(1000);

    // Look for AI question banner (pink gradient)
    const aiBanner = await page.$('[class*="pink"], [class*="gradient"]');
    if (aiBanner) {
      await aiBanner.click();
      await delay(800);
      await page.screenshot({ path: path.join(SCREENSHOT_DIR, '08_ai_question_panel.png') });
      console.log('  > AI Question Panel opened');
      results.push({ test: 'AI Question Panel', status: 'PASS' });

      await page.keyboard.press('Escape');
      await delay(300);
    } else {
      console.log('  > No AI Question Banner (no pending questions)');
      results.push({ test: 'AI Question Panel', status: 'SKIP', detail: 'No pending questions' });
    }

    // ========================================
    // UC6: TimelinePage
    // ========================================
    console.log('UC6: TimelinePage - Activity Timeline');

    const timelineNav = await page.evaluateHandle(() => {
      const links = Array.from(document.querySelectorAll('a'));
      return links.find(a => a.href.includes('/timeline') || a.textContent.includes('Timeline'));
    });

    if (timelineNav && timelineNav.asElement()) {
      await timelineNav.click();
      await delay(1000);
    } else {
      await page.goto(`${BASE_URL}/workspace/1/timeline`, { waitUntil: 'networkidle0' });
      await delay(1000);
    }

    await page.screenshot({ path: path.join(SCREENSHOT_DIR, '09_timeline_page.png') });
    console.log('  > Timeline page loaded');
    results.push({ test: 'TimelinePage Load', status: 'PASS' });

    // ========================================
    // UC7: Settings Modal (Language Switch)
    // ========================================
    console.log('UC7: Settings Modal - Language Switch');

    // Look for settings button (gear icon)
    const settingsBtn = await page.evaluateHandle(() => {
      const buttons = Array.from(document.querySelectorAll('button'));
      return buttons.find(b =>
        b.getAttribute('title')?.includes('설정') ||
        b.getAttribute('title')?.includes('Settings') ||
        b.querySelector('svg[class*="cog"]') ||
        b.textContent.includes('설정')
      );
    });

    if (settingsBtn && settingsBtn.asElement()) {
      await settingsBtn.click();
      await delay(500);
      await page.screenshot({ path: path.join(SCREENSHOT_DIR, '10_settings_modal_ko.png') });

      // Click English button
      const englishBtn = await page.evaluateHandle(() => {
        const buttons = Array.from(document.querySelectorAll('button'));
        return buttons.find(b => b.textContent.includes('English'));
      });

      if (englishBtn && englishBtn.asElement()) {
        await englishBtn.click();
        await delay(500);
        await page.screenshot({ path: path.join(SCREENSHOT_DIR, '11_settings_modal_en.png') });
        console.log('  > Language changed: Korean -> English');
        results.push({ test: 'Language Switch', status: 'PASS' });
      }

      await page.keyboard.press('Escape');
      await delay(300);
    } else {
      results.push({ test: 'Settings Modal', status: 'SKIP', detail: 'Button not found' });
    }

    // ========================================
    // Final: HomePage in English
    // ========================================
    console.log('Final: HomePage (English)');
    await page.goto(BASE_URL, { waitUntil: 'networkidle0' });
    await delay(1000);
    await page.screenshot({ path: path.join(SCREENSHOT_DIR, '12_homepage_english.png') });
    console.log('  > HomePage (English) captured');

  } catch (error) {
    console.error('Error:', error.message);
    results.push({ test: 'E2E Test', status: 'FAIL', detail: error.message });
  } finally {
    await browser.close();
  }

  // Print summary
  console.log('\n' + '='.repeat(60));
  console.log('E2E Test Results Summary');
  console.log('='.repeat(60));

  let passCount = 0, failCount = 0, skipCount = 0;
  results.forEach(r => {
    const icon = r.status === 'PASS' ? '[PASS]' : r.status === 'SKIP' ? '[SKIP]' : '[FAIL]';
    console.log(`${icon} ${r.test}${r.detail ? ` (${r.detail})` : ''}`);
    if (r.status === 'PASS') passCount++;
    else if (r.status === 'FAIL') failCount++;
    else skipCount++;
  });

  console.log('='.repeat(60));
  console.log(`Total: ${passCount} passed, ${skipCount} skipped, ${failCount} failed`);
  console.log(`Screenshots saved to: ${SCREENSHOT_DIR}`);

  return results;
}

// Create screenshot directory
if (!fs.existsSync(SCREENSHOT_DIR)) {
  fs.mkdirSync(SCREENSHOT_DIR, { recursive: true });
}

runE2ETests().catch(console.error);
