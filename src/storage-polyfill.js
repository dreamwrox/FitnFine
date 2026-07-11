// Standalone deployments have no Claude-artifact storage backend, so this
// polyfills the same get/set/delete/list interface using the browser's
// localStorage. "shared" data (shared=true) is namespaced separately, but on
// a single device there's no cross-user sharing — it's just a separate bucket.

function ns(key, shared) {
  return `${shared ? "shared" : "personal"}:${key}`;
}

window.storage = {
  async get(key, shared = false) {
    const raw = localStorage.getItem(ns(key, shared));
    if (raw === null) return null;
    return { key, value: raw, shared };
  },
  async set(key, value, shared = false) {
    localStorage.setItem(ns(key, shared), value);
    return { key, value, shared };
  },
  async delete(key, shared = false) {
    localStorage.removeItem(ns(key, shared));
    return { key, deleted: true, shared };
  },
  async list(prefix = "", shared = false) {
    const p = ns(prefix, shared);
    const keys = [];
    for (let i = 0; i < localStorage.length; i++) {
      const k = localStorage.key(i);
      if (k && k.startsWith(p)) keys.push(k.slice(shared ? 7 : 9));
    }
    return { keys, prefix, shared };
  },
};
