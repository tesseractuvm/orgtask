import { describe, it, expect, beforeEach } from 'vitest';
import {
  setProfilePassword,
  startImpersonation,
  signInWithPassword,
  getSession,
  setProfileActive,
} from '../authService';
import { resetState, readState } from '../localStore';

const admin = { id: 'u-admin', isAdmin: true, role: 'colaborador', areaCode: 'CPYG' };
const noAdmin = { id: 'u-colab-cpyg', isAdmin: false, role: 'colaborador', areaCode: 'CPYG' };

function algunaPersona(email) {
  return readState().profiles.find((p) => p.email === email);
}

describe('Asignar contraseña', () => {
  beforeEach(() => resetState());

  it('solo la puede asignar quien administra usuarios', async () => {
    const destino = readState().profiles.find((p) => p.id !== noAdmin.id);

    await expect(
      setProfilePassword({ profileId: destino.id, password: 'ClaveNueva123', actor: noAdmin })
    ).rejects.toThrow(/administra usuarios/i);
  });

  it('exige al menos 8 caracteres', async () => {
    const destino = readState().profiles[0];

    await expect(
      setProfilePassword({ profileId: destino.id, password: 'corta', actor: admin })
    ).rejects.toThrow(/8 caracteres/i);
  });

  it('deja a la persona iniciar sesión con la contraseña nueva', async () => {
    const destino = readState().profiles.find((p) => p.id !== admin.id);

    await setProfilePassword({ profileId: destino.id, password: 'ClaveNueva123', actor: admin });
    const perfil = await signInWithPassword({
      email: destino.email,
      password: 'ClaveNueva123',
    });

    expect(perfil.id).toBe(destino.id);
  });

  it('invalida la contraseña anterior', async () => {
    const destino = readState().profiles.find((p) => p.id !== admin.id);

    await setProfilePassword({ profileId: destino.id, password: 'ClaveNueva123', actor: admin });

    await expect(
      signInWithPassword({ email: destino.email, password: 'OrgTaskDemo2026' })
    ).rejects.toThrow(/contraseña/i);
  });
});

describe('Entrar como otra persona', () => {
  beforeEach(() => resetState());

  it('solo lo puede hacer quien administra usuarios', async () => {
    const destino = readState().profiles.find((p) => p.id !== noAdmin.id);

    await expect(
      startImpersonation({ profileId: destino.id, actor: noAdmin })
    ).rejects.toThrow(/administra usuarios/i);
  });

  it('deja la sesión abierta como esa persona', async () => {
    const destino = readState().profiles.find((p) => p.id !== admin.id);

    const perfil = await startImpersonation({ profileId: destino.id, actor: admin });

    expect(perfil.id).toBe(destino.id);
    expect((await getSession()).id).toBe(destino.id);
  });

  it('no permite entrar como una cuenta desactivada', async () => {
    const destino = readState().profiles.find((p) => p.id !== admin.id);
    await setProfileActive({ profileId: destino.id, isActive: false, actor: admin });

    await expect(
      startImpersonation({ profileId: destino.id, actor: admin })
    ).rejects.toThrow(/desactivada/i);
  });

  it('avisa si la persona no existe', async () => {
    await expect(
      startImpersonation({ profileId: 'u-que-no-existe', actor: admin })
    ).rejects.toThrow(/no tiene perfil/i);
  });
});
