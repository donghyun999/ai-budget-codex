export async function api(path, options = {}) {
  const response = await fetch(`/api${path}`, {
    ...options,
    headers: { 'Content-Type': 'application/json', ...options.headers },
  });
  const data = await response.json().catch(() => ({}));
  if (!response.ok) {
    const error = new Error(data.message || '요청을 처리하지 못했습니다.');
    error.status = response.status;
    error.fields = data.fields || {};
    throw error;
  }
  return data;
}
