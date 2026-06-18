const els = {
  score: document.getElementById('score'),
  level: document.getElementById('level'),
  form: document.getElementById('add-form'),
  title: document.getElementById('title'),
  description: document.getElementById('description'),
  points: document.getElementById('points'),
  formError: document.getElementById('form-error'),
  todoList: document.getElementById('todo-list'),
  doneList: document.getElementById('done-list'),
  todoCount: document.getElementById('todo-count'),
  doneCount: document.getElementById('done-count'),
  todoEmpty: document.getElementById('todo-empty'),
  doneEmpty: document.getElementById('done-empty'),
};

// Milestones derived from the cumulative Success Score.
const LEVELS = [
  { min: 50, name: 'Champion' },
  { min: 25, name: 'Committed' },
  { min: 10, name: 'On a Roll' },
  { min: 0, name: 'Getting Started' },
];

function levelFor(score) {
  return LEVELS.find((l) => score >= l.min).name;
}

async function api(method, url, body) {
  const opts = { method, headers: {} };
  if (body !== undefined) {
    opts.headers['Content-Type'] = 'application/json';
    opts.body = JSON.stringify(body);
  }
  const res = await fetch(url, opts);
  const data = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(data.error || 'Request failed.');
  return data;
}

function updateScore(score) {
  els.score.textContent = score;
  els.level.textContent = levelFor(score);
}

function makeDeedNode(deed) {
  const li = document.createElement('li');
  li.className = 'deed' + (deed.completed ? ' done' : '');

  const check = document.createElement('input');
  check.type = 'checkbox';
  check.className = 'deed-check';
  check.checked = !!deed.completed;
  check.addEventListener('change', () => toggleDeed(deed.id));

  const body = document.createElement('div');
  body.className = 'deed-body';
  const title = document.createElement('div');
  title.className = 'deed-title';
  title.textContent = deed.title;
  body.appendChild(title);
  if (deed.description) {
    const desc = document.createElement('div');
    desc.className = 'deed-desc';
    desc.textContent = deed.description;
    body.appendChild(desc);
  }

  const points = document.createElement('div');
  points.className = 'deed-points';
  points.textContent = `+${deed.points}`;

  const del = document.createElement('button');
  del.className = 'deed-delete';
  del.type = 'button';
  del.setAttribute('aria-label', 'Delete deed');
  del.textContent = '✕';
  del.addEventListener('click', () => deleteDeed(deed.id));

  li.append(check, body, points, del);
  return li;
}

function render(deeds, score) {
  els.todoList.innerHTML = '';
  els.doneList.innerHTML = '';

  const todo = deeds.filter((d) => !d.completed);
  const done = deeds.filter((d) => d.completed);

  todo.forEach((d) => els.todoList.appendChild(makeDeedNode(d)));
  done.forEach((d) => els.doneList.appendChild(makeDeedNode(d)));

  els.todoCount.textContent = todo.length;
  els.doneCount.textContent = done.length;
  els.todoEmpty.hidden = todo.length > 0;
  els.doneEmpty.hidden = done.length > 0;

  updateScore(score);
}

async function load() {
  const { deeds, score } = await api('GET', '/api/deeds');
  render(deeds, score);
}

async function toggleDeed(id) {
  await api('PATCH', `/api/deeds/${id}`);
  await load();
}

async function deleteDeed(id) {
  await api('DELETE', `/api/deeds/${id}`);
  await load();
}

els.form.addEventListener('submit', async (e) => {
  e.preventDefault();
  els.formError.hidden = true;
  const title = els.title.value.trim();
  if (!title) return;
  try {
    await api('POST', '/api/deeds', {
      title,
      description: els.description.value.trim(),
      points: Number(els.points.value),
    });
    els.form.reset();
    els.title.focus();
    await load();
  } catch (err) {
    els.formError.textContent = err.message;
    els.formError.hidden = false;
  }
});

load().catch((err) => {
  els.formError.textContent = 'Could not load your deeds: ' + err.message;
  els.formError.hidden = false;
});
