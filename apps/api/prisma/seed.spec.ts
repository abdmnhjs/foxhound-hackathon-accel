import { verifyPassword } from 'better-auth/crypto';

const mocks = vi.hoisted(() => {
  const tx = {
    user: {
      upsert: vi.fn(async ({ create }: { create: { name: string } }) => ({
        id: create.name,
      })),
    },
    account: {
      findFirst: vi.fn(),
      create: vi.fn(),
      update: vi.fn(),
    },
    session: { deleteMany: vi.fn() },
  };
  return { tx, disconnect: vi.fn() };
});

vi.mock('../src/prisma/prisma.js', () => ({
  prisma: {
    $transaction: async (callback: (tx: typeof mocks.tx) => unknown) =>
      callback(mocks.tx),
    $disconnect: mocks.disconnect,
  },
}));

it('creates both credential accounts with valid hashes and updates them on a second run', async () => {
  mocks.tx.account.findFirst
    .mockResolvedValueOnce(null)
    .mockResolvedValueOnce(null)
    .mockResolvedValueOnce({ id: 'user-account' })
    .mockResolvedValueOnce({ id: 'founder-account' });
  await import('./seed.js');
  expect(mocks.tx.account.create).toHaveBeenCalledTimes(2);
  for (const [index, name] of ['user', 'founder'].entries()) {
    const data = mocks.tx.account.create.mock.calls[index]![0].data;
    expect(data.providerId).toBe('credential');
    expect(data.accountId).toBe(name);
    expect(data.password).not.toBe(name);
    expect(await verifyPassword({ hash: data.password, password: name })).toBe(
      true,
    );
    expect(
      await verifyPassword({ hash: data.password, password: 'incorrect' }),
    ).toBe(false);
  }
  vi.resetModules();
  await import('./seed.js');
  expect(mocks.tx.account.create).toHaveBeenCalledTimes(2);
  expect(mocks.tx.account.update).toHaveBeenCalledTimes(2);
  expect(mocks.tx.session.deleteMany).toHaveBeenCalledTimes(4);
  expect(mocks.disconnect).toHaveBeenCalledTimes(2);
});
