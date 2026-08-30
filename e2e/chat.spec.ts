import { test, expect } from '@playwright/test';
import { login } from './helpers';

test('enviar un mensaje muestra la respuesta del agente', async ({ page }) => {
  await login(page);

  await page.route('**/api/chat', (route) =>
    route.fulfill({ status: 200, contentType: 'text/plain', body: 'Te he creado la tarea correctamente.' })
  );

  await page.getByPlaceholder('Escribe una tarea o pregunta...').fill('crea una tarea de prueba');
  await page.getByRole('button', { name: 'Enviar' }).click();

  await expect(page.getByText('crea una tarea de prueba')).toBeVisible();
  await expect(page.getByText('Te he creado la tarea correctamente.')).toBeVisible();
});

test('limpiar conversacion la vacia', async ({ page }) => {
  await login(page);
  await page.route('**/api/chat', (route) =>
    route.fulfill({ status: 200, contentType: 'text/plain', body: 'Hecho.' })
  );

  await page.getByPlaceholder('Escribe una tarea o pregunta...').fill('hola');
  await page.getByRole('button', { name: 'Enviar' }).click();
  await expect(page.getByText('Hecho.')).toBeVisible();

  await page.getByRole('button', { name: 'Limpiar' }).click();
  await expect(page.getByText('hola')).not.toBeVisible();
});
