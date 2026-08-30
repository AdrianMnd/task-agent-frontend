import { test, expect } from '@playwright/test';
import { login } from './helpers';

test.use({ viewport: { width: 375, height: 800 } });

test('en movil, chat y tareas se muestran como pestañas independientes', async ({ page }) => {
  await login(page);

  await expect(page.getByRole('button', { name: 'Chat' })).toBeVisible();
  await expect(page.getByRole('button', { name: 'Tareas' })).toBeVisible();

  // La pestaña "Chat" esta activa por defecto.
  await expect(page.getByPlaceholder('Escribe una tarea o pregunta...')).toBeVisible();

  await page.getByRole('button', { name: 'Tareas' }).click();

  await expect(page.getByPlaceholder('Escribe una tarea o pregunta...')).not.toBeVisible();
});
