import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import { useExitOnDoubleBack } from './useExitOnDoubleBack';

function pressBack() {
  window.dispatchEvent(new PopStateEvent('popstate'));
}

beforeEach(() => {
  vi.useFakeTimers();
});

describe('useExitOnDoubleBack', () => {
  it('no muestra el aviso hasta el primer "atras"', () => {
    const { result } = renderHook(() => useExitOnDoubleBack());
    expect(result.current).toBe(false);
  });

  it('el primer "atras" muestra el aviso', () => {
    const { result } = renderHook(() => useExitOnDoubleBack());
    act(() => pressBack());
    expect(result.current).toBe(true);
  });

  it('el aviso desaparece solo pasados 2 segundos', () => {
    const { result } = renderHook(() => useExitOnDoubleBack());
    act(() => pressBack());
    expect(result.current).toBe(true);

    act(() => {
      vi.advanceTimersByTime(2000);
    });
    expect(result.current).toBe(false);
  });

  it('vuelve a empujar una entrada al historial tras el primer "atras" (para poder interceptar el segundo)', () => {
    const pushStateSpy = vi.spyOn(window.history, 'pushState');
    renderHook(() => useExitOnDoubleBack());
    const callsAfterMount = pushStateSpy.mock.calls.length;

    act(() => pressBack());

    expect(pushStateSpy.mock.calls.length).toBe(callsAfterMount + 1);
    pushStateSpy.mockRestore();
  });

  it('un segundo "atras" dentro de la ventana de 2s NO vuelve a empujar historial (deja salir)', () => {
    renderHook(() => useExitOnDoubleBack());
    act(() => pressBack()); // primer atras: consumido, aviso mostrado

    const pushStateSpy = vi.spyOn(window.history, 'pushState');
    act(() => pressBack()); // segundo atras, inmediato

    expect(pushStateSpy).not.toHaveBeenCalled();
    pushStateSpy.mockRestore();
  });

  it('un "atras" que llega DESPUES de la ventana de 2s se trata como un primer atras nuevo', () => {
    const { result } = renderHook(() => useExitOnDoubleBack());
    act(() => pressBack());
    act(() => {
      vi.advanceTimersByTime(2500);
    });
    expect(result.current).toBe(false);

    act(() => pressBack());
    expect(result.current).toBe(true);
  });
});