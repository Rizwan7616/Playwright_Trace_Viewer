const loginPanel = document.querySelector('#login-panel');
const appPanel = document.querySelector('#app-panel');
const tokenKey = 'taskboard-token';
const request = async (url, options = {}) => {
  const headers = { 'Content-Type': 'application/json', ...(options.headers || {}) };
  const token = sessionStorage.getItem(tokenKey);
  if (token) headers.Authorization = `Bearer ${token}`;
  const response = await fetch(url, { ...options, headers });
  if (!response.ok) {
    const body = response.status === 204 ? {} : await response.json().catch(() => ({}));
    throw new Error(body.error || `Request failed (${response.status})`);
  }
  return response.status === 204 ? null : response.json();
};
function showApp(user) {
  loginPanel.hidden = true; appPanel.hidden = false;
  document.querySelector('#welcome').textContent = `Signed in as ${user.name}`;
  loadTasks();
}
async function loadTasks() {
  try {
    const data = await request('/api/tasks');
    const list = document.querySelector('#task-list'); list.replaceChildren();
    data.items.forEach((task) => {
      const li = document.createElement('li'); if (task.completed) li.classList.add('done');
      const checkbox = document.createElement('input'); checkbox.type = 'checkbox'; checkbox.className = 'toggle';
      checkbox.checked = task.completed; checkbox.setAttribute('aria-label', `Complete ${task.title}`);
      checkbox.addEventListener('change', async () => { await request(`/api/tasks/${task.id}`, { method:'PATCH', body:JSON.stringify({completed:checkbox.checked}) }); loadTasks(); });
      const span = document.createElement('span'); span.textContent = task.title;
      const del = document.createElement('button'); del.className='delete'; del.textContent='Delete';
      del.addEventListener('click', async () => { await request(`/api/tasks/${task.id}`, {method:'DELETE'}); loadTasks(); });
      li.append(checkbox, span, del); list.append(li);
    });
  } catch (error) { document.querySelector('#task-error').textContent = error.message; }
}
document.querySelector('#login-form').addEventListener('submit', async (event) => {
  event.preventDefault(); document.querySelector('#login-error').textContent = '';
  try {
    const data = await request('/api/auth/login', {method:'POST', body:JSON.stringify({email:document.querySelector('#email').value,password:document.querySelector('#password').value})});
    sessionStorage.setItem(tokenKey, data.accessToken); showApp(data.user);
  } catch (error) { document.querySelector('#login-error').textContent = error.message; }
});
document.querySelector('#task-form').addEventListener('submit', async (event) => {
  event.preventDefault(); document.querySelector('#task-error').textContent = '';
  const input = document.querySelector('#task-title');
  try { await request('/api/tasks', {method:'POST',body:JSON.stringify({title:input.value})}); input.value=''; loadTasks(); }
  catch (error) { document.querySelector('#task-error').textContent = error.message; }
});
document.querySelector('#logout').addEventListener('click', () => { sessionStorage.removeItem(tokenKey); appPanel.hidden=true; loginPanel.hidden=false; });

// Restore an existing session (e.g. after a page reload).
(async function restoreSession() {
  if (!sessionStorage.getItem(tokenKey)) return;
  try { showApp(await request('/api/me')); }
  catch { sessionStorage.removeItem(tokenKey); }
})();
