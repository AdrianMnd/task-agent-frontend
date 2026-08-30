import { test, expect } from '@playwright/test';

test('muestra las tareas del usuario con su estado', async ({ page }) => {
  await page.route('**/api/auth/login', (route) =>
    route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify({ token: 't', user: { id: 1, email: 'a@b.com' } })
    })
  );
  await page.route('**/api/messages', (route) =>
    route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify({ messages: [] }) })
  );
  await page.route('**/api/reminders/last', (route) =>
    route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify({ lastCheck: null }) })
  );
  await page.route('**/api/tasks', (route) =>
    route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify({
        tasks: [
          {
            id: 1,
            title: 'Revisar PR',
            description: null,
            due_date: '2026-09-01',
            completed: false,
            source: 'manual'
          },
          {
            id: 2,
            title: 'Tarea completada',
            description: null,
            due_date: null,
            completed: true,
            source: 'manual'
          }
        ]
      })
    })
  );

  await page.goto('/');
  await page.getByPlaceholder('Email').fill('a@b.com');
  await page.getByPlaceholder(/Contraseña/).fill('password123');
  await page.getByRole('button', { name: 'Entrar' }).click();

  await expect(page.getByText('Revisar PR')).toBeVisible();
  await expect(page.getByText('Completadas')).toBeVisible();
  await expect(page.getByText('Tarea completada')).toBeVisible();
});
