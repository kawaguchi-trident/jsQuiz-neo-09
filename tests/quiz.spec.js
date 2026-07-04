const { test, expect } = require('@playwright/test');
const path = require('path');

const STUDENT_FILE = process.env.STUDENT_FILE;

test.beforeAll(() => {
  if (!STUDENT_FILE) throw new Error('STUDENT_FILE 環境変数が設定されていません');
});

function resolveFileUrl() {
  return `file://${path.resolve(__dirname, '..', STUDENT_FILE)}`;
}

// 空白のゆらぎ（余分なスペース等）だけは許容して比較する
function normalize(text) {
  return text.replace(/\s+/g, ' ').trim();
}

const EXPECTED_MENU = [
  '☕ カフェラテ：480円',
  '🍵 抹茶ラテ：520円',
  '🍹 ゆずソーダ：450円',
  '🍰 ショートケーキ：550円',
  '🍮 プリン：400円',
  '🥪 タマゴサンド：380円',
];

// 表示されている <li> のテキストを順に返す
async function listTexts(page) {
  const texts = await page.$$eval('.menu-list li', (els) =>
    els.map((e) => e.textContent)
  );
  return texts.map(normalize);
}

test('初期状態ではメニューは空', async ({ page }) => {
  await page.goto(resolveFileUrl());
  expect(await page.locator('.menu-list li').count()).toBe(0);
});

test('ボタンをクリックすると全6品が順番どおり表示される', async ({ page }) => {
  await page.goto(resolveFileUrl());
  await page.click('.menu-toggle-btn');
  expect(await listTexts(page)).toEqual(EXPECTED_MENU);
});

test('renderMenu は受け取った配列を map で変換し join("") で1つの文字列にする', async ({ page }) => {
  await page.goto(resolveFileUrl());
  // menu に無いテスト用データを渡す → 分割代入した変数を使っていないと通らない
  const result = await page.evaluate(() =>
    renderMenu([
      ['テストコーヒー', 100, '🅰'],
      ['テストティー', 200, '🅱'],
    ])
  );
  // 配列のまま return（join 忘れ）だと string にならない
  expect(typeof result).toBe('string');
  // join() や join(',') だとカンマが混ざる
  expect(result).not.toContain('</li>,');
  expect(normalize(result)).toBe(
    '<li>🅰 テストコーヒー：100円</li><li>🅱 テストティー：200円</li>'
  );
});

test('トグル動作：2回目のクリックで閉じ、3回目で再表示される', async ({ page }) => {
  await page.goto(resolveFileUrl());
  await page.click('.menu-toggle-btn');
  expect(await page.locator('.menu-list li').count()).toBe(6);
  await page.click('.menu-toggle-btn');
  expect(await page.locator('.menu-list li').count()).toBe(0);
  await page.click('.menu-toggle-btn');
  expect(await listTexts(page)).toEqual(EXPECTED_MENU);
});
