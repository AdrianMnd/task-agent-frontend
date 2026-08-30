import type { Page } from '@playwright/test';

export async function mockCommonRoutes(page: Page) {
  await page.route('**/api/messages', (route) => {
    if (route.request().method() === 'DELETE') {
      return route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({ cleared: true })
      });
    }
    return route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify({ messages: [] })
    });
  });

  await page.route('**/api/tasks', (route) =>
    route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify({ tasks: [] }) })
  );

  await page.route('**/api/reminders/last', (route) =>
    route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify({ lastCheck: null }) })
  );
}

export async function login(page: Page, email = 'adrian@example.com') {
  await page.route('**/api/auth/login', (route) =>
    route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify({ token: 'fake-token', user: { id: 1, email } })
    })
  );
  await mockCommonRoutes(page);

  await page.goto('/');
  await page.getByPlaceholder('Email').fill(email);
  await page.getByPlaceholder(/Contraseña/).fill('password123');
  await page.getByRole('button', { name: 'Entrar' }).click();
  await page.getByText('Conversación', { exact: true }).waitFor();
}
