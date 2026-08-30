import { test, expect } from '@playwright/test';
import { login } from './helpers';

test.describe('Autenticación', () => {
  test('muestra el formulario de login por defecto', async ({ page }) => {
    await page.goto('/');
    await expect(page.getByText('Inicia sesión')).toBeVisible();
  });

  test('login correcto lleva a la app', async ({ page }) => {
    await login(page);
    await expect(page.getByText('Conversación')).toBeVisible();
  });

  test('login con credenciales incorrectas muestra el error sin dejar la pantalla en blanco', async ({
    page
  }) => {
    await page.route('**/api/auth/login', (route) =>
      route.fulfill({
        status: 401,
        contentType: 'application/json',
        body: JSON.stringify({ error: 'Credenciales incorrectas' })
      })
    );
    await page.goto('/');
    await page.getByPlaceholder('Email').fill('a@b.com');
    await page.getByPlaceholder(/Contraseña/).fill('mala-password');
    await page.getByRole('button', { name: 'Entrar' }).click();

    await expect(page.getByText('Credenciales incorrectas')).toBeVisible();
    await expect(page.getByRole('button', { name: 'Entrar' })).toBeVisible();
  });

  test('registro con email ya existente muestra el error', async ({ page }) => {
    await page.route('**/api/auth/register', (route) =>
      route.fulfill({
        status: 409,
        contentType: 'application/json',
        body: JSON.stringify({ error: 'Ese email ya está registrado' })
      })
    );
    await page.goto('/');
    await page.getByText('¿No tienes cuenta? Regístrate').click();
    await page.getByPlaceholder('Email').fill('ya@existe.com');
    await page.getByPlaceholder(/Contraseña/).fill('password123');
    await page.getByRole('button', { name: 'Registrarme' }).click();

    await expect(page.getByText('Ese email ya está registrado')).toBeVisible();
  });

  test('solicitud de recuperar contraseña muestra el mensaje informativo', async ({ page }) => {
    await page.route('**/api/auth/request-reset', (route) =>
      route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({ requested: true })
      })
    );
    await page.goto('/');
    await page.getByText('¿Olvidaste tu contraseña?').click();
    await page.getByPlaceholder('Email').fill('a@b.com');
    await page.getByRole('button', { name: 'Enviar solicitud' }).click();

    await expect(page.getByText(/Te contactaremos con una nueva contraseña/)).toBeVisible();
  });

  test('cerrar sesion vuelve al login', async ({ page }) => {
    await login(page);
    await page.getByRole('button', { name: 'Cerrar sesión' }).click();
    await expect(page.getByText('Inicia sesión')).toBeVisible();
  });
});
