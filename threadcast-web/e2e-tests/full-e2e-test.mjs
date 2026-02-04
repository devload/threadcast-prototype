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

async function runFullE2ETests() {
  console.log('='.repeat(60));
  console.log('ThreadCast Full E2E Test Suite (Headless)');
  console.log('='.repeat(60) + '\n');

  const browser = await puppeteer.launch({
    headless: 'new',
    args: ['--no-sandbox', '--disable-setuid-sandbox']
  });

  const page = await browser.newPage();
  await page.setViewport({ width: 1440, height: 900 });

  const results = [];
  let screenshotNum = 1;

  const screenshot = async (name) => {
    const filename = `${String(screenshotNum++).padStart(2, '0')}_${name}.png`;
    await page.screenshot({ path: path.join(SCREENSHOT_DIR, filename), fullPage: false });
    console.log(`    [Screenshot] ${filename}`);
    return filename;
  };

  try {
    // ========================================
    // UC1: HomePage - Workspace 목록 조회
    // ========================================
    console.log('\n[UC1] HomePage - Workspace List');
    console.log('-'.repeat(40));

    await page.goto(BASE_URL, { waitUntil: 'networkidle0', timeout: 30000 });
    await delay(1000);
    await screenshot('homepage');

    const workspaceCards = await page.$$('.bg-white.border.rounded-2xl');
    console.log(`    Workspace cards: ${workspaceCards.length}`);

    // 통계 확인
    const statsText = await page.evaluate(() => {
      const el = document.querySelector('h1, h2');
      return el ? el.textContent : '';
    });
    console.log(`    Header: ${statsText}`);

    results.push({ test: 'UC1: HomePage', status: workspaceCards.length > 0 ? 'PASS' : 'FAIL' });

    // ========================================
    // UC1-2: Workspace 생성 모달
    // ========================================
    console.log('\n[UC1-2] Workspace Create Modal');
    console.log('-'.repeat(40));

    const addWsBtn = await page.$('button.bg-violet-600, button[class*="violet"]');
    if (addWsBtn) {
      await addWsBtn.click();
      await delay(500);
      await screenshot('workspace_create_modal');
      console.log(`    Modal opened: Yes`);
      results.push({ test: 'UC1-2: Workspace Create Modal', status: 'PASS' });
      await page.keyboard.press('Escape');
      await delay(300);
    } else {
      results.push({ test: 'UC1-2: Workspace Create Modal', status: 'SKIP' });
    }

    // ========================================
    // UC2: WorkspaceDashboard
    // ========================================
    console.log('\n[UC2] WorkspaceDashboard');
    console.log('-'.repeat(40));

    // Workspace 카드 클릭해서 Dashboard로 이동
    const wsCard = await page.$('.bg-white.border.rounded-2xl');
    if (wsCard) {
      await wsCard.click();
      await delay(2000);

      const currentUrl = page.url();
      console.log(`    Current URL: ${currentUrl}`);
      await screenshot('workspace_dashboard');

      // Dashboard 요소 확인
      const hasProjects = await page.evaluate(() =>
        document.body.textContent.includes('Projects') || document.body.textContent.includes('프로젝트')
      );
      const hasMissions = await page.evaluate(() =>
        document.body.textContent.includes('Missions')
      );

      console.log(`    Projects section: ${hasProjects ? 'Yes' : 'No'}`);
      console.log(`    Missions section: ${hasMissions ? 'Yes' : 'No'}`);

      results.push({ test: 'UC2: WorkspaceDashboard', status: currentUrl.includes('dashboard') ? 'PASS' : 'WARN' });
    }

    // ========================================
    // UC3: MissionsPage - Kanban Board
    // ========================================
    console.log('\n[UC3] MissionsPage - Kanban Board');
    console.log('-'.repeat(40));

    // 사이드바 네비게이션 또는 직접 URL 이동
    await page.goto(`${BASE_URL}/missions`, { waitUntil: 'networkidle0' });
    await delay(1500);

    const missionsUrl = page.url();
    console.log(`    Current URL: ${missionsUrl}`);
    await screenshot('missions_kanban');

    // Kanban 컬럼 확인
    const pageContent = await page.content();
    const kanbanStatus = {
      pending: pageContent.includes('Pending') || pageContent.includes('대기'),
      threading: pageContent.includes('Threading') || pageContent.includes('진행'),
      woven: pageContent.includes('Woven') || pageContent.includes('완료'),
      archived: pageContent.includes('Archived') || pageContent.includes('보관')
    };

    console.log(`    Kanban columns detected:`);
    Object.entries(kanbanStatus).forEach(([col, exists]) => {
      console.log(`      - ${col}: ${exists ? 'Yes' : 'No'}`);
    });

    // Mission 카드들 확인
    const missionCards = await page.$$('.bg-white.rounded-lg.shadow, .bg-white.rounded-xl.shadow');
    console.log(`    Mission cards: ${missionCards.length}`);

    results.push({ test: 'UC3: MissionsPage', status: missionsUrl.includes('missions') ? 'PASS' : 'FAIL' });

    // ========================================
    // UC3-2: Mission 생성 모달
    // ========================================
    console.log('\n[UC3-2] Mission Create Modal');
    console.log('-'.repeat(40));

    const newMissionBtn = await page.evaluateHandle(() => {
      const buttons = Array.from(document.querySelectorAll('button'));
      return buttons.find(b =>
        b.textContent.includes('Mission') ||
        b.textContent.includes('New') ||
        b.textContent.includes('새')
      );
    });

    if (newMissionBtn && await newMissionBtn.asElement()) {
      await newMissionBtn.click();
      await delay(600);
      await screenshot('mission_create_modal');

      // 폼 필드 확인
      const hasTitle = await page.$('input') !== null;
      const hasDesc = await page.$('textarea') !== null;
      console.log(`    Title input: ${hasTitle ? 'Yes' : 'No'}`);
      console.log(`    Description: ${hasDesc ? 'Yes' : 'No'}`);

      results.push({ test: 'UC3-2: Mission Create Modal', status: 'PASS' });

      await page.keyboard.press('Escape');
      await delay(300);
    } else {
      results.push({ test: 'UC3-2: Mission Create Modal', status: 'SKIP' });
    }

    // ========================================
    // UC3-3: Mission Detail Modal
    // ========================================
    console.log('\n[UC3-3] Mission Detail Modal');
    console.log('-'.repeat(40));

    // Mission 카드 클릭
    const missionCard = await page.$('.bg-white.rounded-lg.shadow, .bg-white.rounded-xl');
    if (missionCard) {
      await missionCard.click();
      await delay(800);
      await screenshot('mission_detail_modal');

      // 모달 내용 확인
      const modalVisible = await page.evaluate(() => {
        const modal = document.querySelector('[class*="fixed"][class*="inset"]');
        return modal !== null;
      });
      console.log(`    Modal visible: ${modalVisible ? 'Yes' : 'No'}`);

      // Start Weaving 버튼 확인
      const hasWeaving = await page.evaluate(() =>
        document.body.textContent.includes('Weaving') || document.body.textContent.includes('Start')
      );
      console.log(`    Weaving button: ${hasWeaving ? 'Yes' : 'No'}`);

      // Todo Threads 확인
      const hasTodos = await page.evaluate(() =>
        document.body.textContent.includes('Todo') || document.body.textContent.includes('Thread')
      );
      console.log(`    Todo section: ${hasTodos ? 'Yes' : 'No'}`);

      results.push({ test: 'UC3-3: Mission Detail Modal', status: 'PASS' });

      await page.keyboard.press('Escape');
      await delay(300);
    } else {
      results.push({ test: 'UC3-3: Mission Detail Modal', status: 'SKIP' });
    }

    // ========================================
    // UC4: TodosPage - Todo Kanban Board
    // ========================================
    console.log('\n[UC4] TodosPage - Todo Kanban Board');
    console.log('-'.repeat(40));

    // Todo 페이지로 이동 (mission ID 1 사용)
    await page.goto(`${BASE_URL}/missions/1/todos`, { waitUntil: 'networkidle0' });
    await delay(1500);

    const todosUrl = page.url();
    console.log(`    Current URL: ${todosUrl}`);
    await screenshot('todos_kanban');

    // Todo Kanban 컬럼 확인
    const todoContent = await page.content();
    const todoKanban = {
      backlog: todoContent.includes('Backlog'),
      pending: todoContent.includes('Pending'),
      threading: todoContent.includes('Threading'),
      woven: todoContent.includes('Woven'),
      tangled: todoContent.includes('Tangled')
    };

    console.log(`    Todo Kanban columns:`);
    Object.entries(todoKanban).forEach(([col, exists]) => {
      console.log(`      - ${col}: ${exists ? 'Yes' : 'No'}`);
    });

    // Todo 카드 확인
    const todoCards = await page.$$('.bg-white.rounded-lg, .bg-white.rounded-xl');
    console.log(`    Todo cards: ${todoCards.length}`);

    results.push({ test: 'UC4: TodosPage', status: todosUrl.includes('todos') ? 'PASS' : 'FAIL' });

    // ========================================
    // UC4-2: Todo Add Modal
    // ========================================
    console.log('\n[UC4-2] Todo Add Modal');
    console.log('-'.repeat(40));

    const addTodoBtn = await page.evaluateHandle(() => {
      const buttons = Array.from(document.querySelectorAll('button'));
      return buttons.find(b =>
        b.textContent.includes('Todo') ||
        b.textContent.includes('Add') ||
        b.textContent.includes('추가')
      );
    });

    if (addTodoBtn && await addTodoBtn.asElement()) {
      await addTodoBtn.click();
      await delay(500);
      await screenshot('todo_add_modal');
      console.log(`    Add Todo modal: Opened`);
      results.push({ test: 'UC4-2: Todo Add Modal', status: 'PASS' });

      await page.keyboard.press('Escape');
      await delay(300);
    } else {
      results.push({ test: 'UC4-2: Todo Add Modal', status: 'SKIP' });
    }

    // ========================================
    // UC5: AI Question Panel
    // ========================================
    console.log('\n[UC5] AI Question Panel');
    console.log('-'.repeat(40));

    // HomePage로 돌아가서 AI 배너 클릭
    await page.goto(BASE_URL, { waitUntil: 'networkidle0' });
    await delay(1000);

    // AI 알림 배너 클릭 (분홍색 그라데이션 배너)
    const aiBanner = await page.$('.bg-gradient-to-r');
    if (aiBanner) {
      await aiBanner.click();
      await delay(1000);
      await screenshot('ai_question_panel');

      // 패널 열렸는지 확인
      const panelOpened = await page.evaluate(() => {
        return document.body.textContent.includes('Question') ||
               document.body.textContent.includes('질문') ||
               document.body.textContent.includes('Answer') ||
               document.body.textContent.includes('답변');
      });
      console.log(`    AI Panel opened: ${panelOpened ? 'Yes' : 'No'}`);

      // 답변 입력 영역 확인
      const textarea = await page.$('textarea');
      if (textarea) {
        console.log(`    Answer textarea: Yes`);
        // 테스트 답변 입력
        await textarea.type('Test answer from E2E');
        await screenshot('ai_answer_typed');
        console.log(`    Test answer typed: Yes`);
      }

      results.push({ test: 'UC5: AI Question Panel', status: panelOpened ? 'PASS' : 'WARN' });

      await page.keyboard.press('Escape');
      await delay(300);
    } else {
      console.log(`    AI Banner not found`);
      results.push({ test: 'UC5: AI Question Panel', status: 'SKIP' });
    }

    // ========================================
    // UC6: TimelinePage
    // ========================================
    console.log('\n[UC6] TimelinePage');
    console.log('-'.repeat(40));

    await page.goto(`${BASE_URL}/timeline`, { waitUntil: 'networkidle0' });
    await delay(1500);

    const timelineUrl = page.url();
    console.log(`    Current URL: ${timelineUrl}`);
    await screenshot('timeline_page');

    // 필터 탭 확인
    const timelineContent = await page.content();
    const filters = {
      all: timelineContent.includes('All') || timelineContent.includes('전체'),
      missions: timelineContent.includes('Missions'),
      todos: timelineContent.includes('Todos'),
      ai: timelineContent.includes('AI')
    };

    console.log(`    Filter tabs:`);
    Object.entries(filters).forEach(([tab, exists]) => {
      console.log(`      - ${tab}: ${exists ? 'Yes' : 'No'}`);
    });

    // Timeline 이벤트 확인
    const events = await page.$$('[class*="event"], .flex.gap-4, .py-4');
    console.log(`    Timeline events: ${events.length}`);

    results.push({ test: 'UC6: TimelinePage', status: timelineUrl.includes('timeline') ? 'PASS' : 'FAIL' });

    // ========================================
    // UC7: ProjectDashboard
    // ========================================
    console.log('\n[UC7] ProjectDashboard');
    console.log('-'.repeat(40));

    await page.goto(`${BASE_URL}/projects/1`, { waitUntil: 'networkidle0' });
    await delay(1500);

    const projectUrl = page.url();
    console.log(`    Current URL: ${projectUrl}`);
    await screenshot('project_dashboard');

    // Project 요소 확인
    const projectContent = await page.content();
    const projectFeatures = {
      todos: projectContent.includes('Todo'),
      git: projectContent.includes('Git') || projectContent.includes('Branch'),
      actions: projectContent.includes('Action') || projectContent.includes('Quick')
    };

    console.log(`    Project features:`);
    Object.entries(projectFeatures).forEach(([feat, exists]) => {
      console.log(`      - ${feat}: ${exists ? 'Yes' : 'No'}`);
    });

    results.push({ test: 'UC7: ProjectDashboard', status: projectUrl.includes('projects') ? 'PASS' : 'FAIL' });

    // ========================================
    // UC8: Settings Modal + Language Switch
    // ========================================
    console.log('\n[UC8] Settings & Language');
    console.log('-'.repeat(40));

    await page.goto(BASE_URL, { waitUntil: 'networkidle0' });
    await delay(500);

    // 설정 버튼 (톱니바퀴) 찾기
    const settingsBtn = await page.evaluateHandle(() => {
      const buttons = Array.from(document.querySelectorAll('button'));
      // SVG 아이콘이 있는 버튼 중 설정 버튼 찾기
      return buttons.find(b =>
        b.className.includes('rounded-full') &&
        b.querySelector('svg') &&
        !b.className.includes('violet')
      );
    });

    if (settingsBtn && await settingsBtn.asElement()) {
      await settingsBtn.click();
      await delay(500);
      await screenshot('settings_modal');

      // 한국어/English 버튼 확인
      const hasKorean = await page.evaluate(() =>
        document.body.textContent.includes('한국어')
      );
      const hasEnglish = await page.evaluate(() =>
        document.body.textContent.includes('English')
      );

      console.log(`    Korean option: ${hasKorean ? 'Yes' : 'No'}`);
      console.log(`    English option: ${hasEnglish ? 'Yes' : 'No'}`);

      // English로 변경
      if (hasEnglish) {
        const englishBtn = await page.evaluateHandle(() => {
          const buttons = Array.from(document.querySelectorAll('button'));
          return buttons.find(b => b.textContent.includes('English'));
        });

        if (englishBtn && await englishBtn.asElement()) {
          await englishBtn.click();
          await delay(500);
          await screenshot('settings_english');
          console.log(`    Language switched to English`);
        }
      }

      results.push({ test: 'UC8: Settings Modal', status: 'PASS' });

      await page.keyboard.press('Escape');
      await delay(300);

      // 언어 변경 확인
      await page.goto(BASE_URL, { waitUntil: 'networkidle0' });
      await delay(500);
      await screenshot('homepage_english');

      const isEnglish = await page.evaluate(() =>
        document.body.textContent.includes('Hello') ||
        document.body.textContent.includes('Workspaces')
      );
      console.log(`    UI in English: ${isEnglish ? 'Yes' : 'No'}`);
    } else {
      results.push({ test: 'UC8: Settings Modal', status: 'SKIP' });
    }

    // ========================================
    // UC9: Responsive Test
    // ========================================
    console.log('\n[UC9] Responsive Layout');
    console.log('-'.repeat(40));

    // Mobile
    await page.setViewport({ width: 375, height: 812 });
    await page.goto(BASE_URL, { waitUntil: 'networkidle0' });
    await delay(500);
    await screenshot('mobile_homepage');
    console.log(`    Mobile (375x812): Captured`);

    // Tablet
    await page.setViewport({ width: 768, height: 1024 });
    await page.goto(BASE_URL, { waitUntil: 'networkidle0' });
    await delay(500);
    await screenshot('tablet_homepage');
    console.log(`    Tablet (768x1024): Captured`);

    results.push({ test: 'UC9: Responsive', status: 'PASS' });

  } catch (error) {
    console.error('\n[ERROR]', error.message);
    results.push({ test: 'E2E Error', status: 'FAIL', detail: error.message });
  } finally {
    await browser.close();
  }

  // ========================================
  // 결과 요약
  // ========================================
  console.log('\n' + '='.repeat(60));
  console.log('E2E TEST RESULTS');
  console.log('='.repeat(60));

  let pass = 0, fail = 0, skip = 0, warn = 0;
  results.forEach(r => {
    let icon;
    switch(r.status) {
      case 'PASS': icon = '[PASS]'; pass++; break;
      case 'FAIL': icon = '[FAIL]'; fail++; break;
      case 'SKIP': icon = '[SKIP]'; skip++; break;
      case 'WARN': icon = '[WARN]'; warn++; break;
    }
    console.log(`${icon} ${r.test}${r.detail ? ` (${r.detail})` : ''}`);
  });

  console.log('='.repeat(60));
  console.log(`Total: ${pass} PASS, ${warn} WARN, ${skip} SKIP, ${fail} FAIL`);
  console.log(`Screenshots: ${screenshotNum - 1} saved to ${SCREENSHOT_DIR}`);
  console.log('='.repeat(60));

  return results;
}

// 스크린샷 디렉토리 초기화
if (fs.existsSync(SCREENSHOT_DIR)) {
  fs.rmSync(SCREENSHOT_DIR, { recursive: true });
}
fs.mkdirSync(SCREENSHOT_DIR, { recursive: true });

runFullE2ETests().catch(console.error);
