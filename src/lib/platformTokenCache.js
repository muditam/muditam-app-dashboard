// Share one refresh across concurrent dashboard requests. Tokens stay in memory.
export function createPlatformTokenCache(load, now = Date.now) {
  let value = null;
  let pending = null;
  let generation = 0;
  return {
    clear(expectedToken) {
      if (expectedToken && value?.token !== expectedToken) return;
      generation += 1; value = null; pending = null;
    },
    get() {
      if (value && value.expiresAt > now() + 30_000) return Promise.resolve(value.token);
      if (!pending) {
        const version = generation;
        const request = Promise.resolve().then(load).then((result) => {
          if (version !== generation) throw new Error('Session changed. Please try again.');
          if (!result?.token || !Number.isFinite(result.expiresAt) || result.expiresAt <= now()) {
            throw new Error('Invalid dashboard session response.');
          }
          value = result;
          return result.token;
        }).finally(() => { if (pending === request) pending = null; });
        pending = request;
      }
      return pending;
    },
  };
}
