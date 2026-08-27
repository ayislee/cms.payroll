export const readSessionFilter = (key, fallback, normalize) => {
  if (typeof window === 'undefined') {
    return fallback;
  }

  try {
    const stored = window.sessionStorage.getItem(key);
    const parsed = stored ? JSON.parse(stored) : null;

    if (!parsed || typeof parsed !== 'object' || Array.isArray(parsed)) {
      return fallback;
    }

    const merged = {
      ...fallback,
      ...parsed
    };

    return typeof normalize === 'function' ? normalize(merged, fallback) : merged;
  } catch {
    return fallback;
  }
};

export const writeSessionFilter = (key, value) => {
  if (typeof window === 'undefined') {
    return;
  }

  try {
    window.sessionStorage.setItem(key, JSON.stringify(value));
  } catch {
    // Ignore storage failures so filter changes never block page usage.
  }
};

export const normalizePageSize = (value, fallback, options = []) => {
  const numericValue = Number(value);

  if (!Number.isFinite(numericValue) || numericValue <= 0) {
    return fallback;
  }

  if (Array.isArray(options) && options.length > 0 && !options.includes(numericValue)) {
    return fallback;
  }

  return numericValue;
};
