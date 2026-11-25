// Instant show — no artificial delay
const loader = document.getElementById('loader');
if (loader) {
  loader.style.display = 'none';
}

const tg = window.Telegram?.WebApp;
if (tg) {
  try {
    tg.ready();
    tg.expand();
    document.documentElement.style.background = '#070f14';
    document.body.style.background = '#070f14';
    document.body.style.color = '#e6eef2';
    const user = tg.initDataUnsafe?.user;
    if (user) {
      const el = document.getElementById('user-info');
      if (el) el.textContent = `Привет, ${user.first_name || ''}!`;
    }
  } catch (e) { console.warn('TG init error', e); }
}

function switchTab(tabName) {
  document.querySelectorAll('.tab').forEach(t => t.classList.remove('active'));
  document.querySelectorAll('.tab-content').forEach(c => c.classList.remove('active'));
  const btn = document.querySelector(`.tab[data-tab="${tabName}"]`);
  const content = document.getElementById('tab-' + tabName);
  if (btn) btn.classList.add('active');
  if (content) content.classList.add('active');
}

document.querySelectorAll('.tab').forEach(btn => {
  btn.addEventListener('click', (e) => {
    e.preventDefault();
    switchTab(btn.dataset.tab);
  });
});

switchTab('animate');

const CYCLE_PROMPT = `Создайте циклическую анимацию на основе этого изображения. Персонаж должен слегка дышать, иметь реалистичное, плавное движение волос, моргать глазами, иметь неподвижный рот и не поворачивать голову или туловище. Последний кадр должен идеально совпадать с первым для плавного, бесконечного цикла. Фон остается неподвижным. запрещено менять: внешность, лица, прически, одежду, цвета любых объектов, освещение, фон, камеру. Любые «логичные», «эстетические» или «автоматические» правки. Добавь анимацию рамки и текста Rise.`;

document.getElementById('fill-prompt').addEventListener('click', () => {
  document.getElementById('animate-prompt').value = CYCLE_PROMPT;
});

const AI_LINKS = {
  kling: 'https://klingai.com/',
  pixverse: 'https://pixverse.ai/',
  flow: 'https://labs.google/fx/tools/flow',
  hailuo: 'https://hailuoai.video/',
  vidu: 'https://www.vidu.studio/',
  qwen: 'https://chat.qwen.ai/',
  grok: 'https://grok.x.ai/'
};

let animateImageBlob = null;

document.getElementById('animate-file').addEventListener('change', (e) => {
  const file = e.target.files[0];
  if (!file) return;
  animateImageBlob = file;
  const preview = document.getElementById('animate-preview');
  preview.innerHTML = '';
  const img = document.createElement('img');
  img.src = URL.createObjectURL(file);
  preview.appendChild(img);
});

document.getElementById('open-ai-btn').addEventListener('click', () => {
  const tool = document.getElementById('ai-tool').value;
  const prompt = document.getElementById('animate-prompt').value.trim();
  const status = document.getElementById('animate-status');

  if (!animateImageBlob) {
    status.textContent = 'Сначала загрузи изображение';
    return;
  }

  if (prompt) {
    navigator.clipboard.writeText(prompt).then(() => {
      status.textContent = 'Промпт скопирован в буфер. Открываю нейронку...';
    }).catch(() => {
      status.textContent = 'Открываю нейронку (скопируй промпт вручную)';
    });
  }

  const url = AI_LINKS[tool] || AI_LINKS.kling;
  if (tg) {
    tg.openLink(url);
  } else {
    window.open(url, '_blank');
  }

  const result = document.getElementById('animate-result');
  result.innerHTML = '';
  const a = document.createElement('a');
  a.href = URL.createObjectURL(animateImageBlob);
  a.download = 'image_to_animate.png';
  a.textContent = '⬇ Скачать изображение (загрузи его в нейронку)';
  a.className = 'result';
  result.appendChild(a);
});

document.getElementById('compress-file').addEventListener('change', (e) => {
  const file = e.target.files[0];
  if (!file) return;
  const preview = document.getElementById('compress-preview');
  preview.innerHTML = file.type.startsWith('image/') 
    ? `<img src="${URL.createObjectURL(file)}">` 
    : `<div>${file.name}<br>${(file.size/1024/1024).toFixed(2)} МБ</div>`;
});

document.getElementById('compress-btn').addEventListener('click', () => {
  document.getElementById('compress-status').textContent = 'Для сильного сжатия используй вкладку «Оживление» → скачай GIF, или онлайн-сервисы (ezgif.com).';
});

let cropImage = null;
document.getElementById('crop-file').addEventListener('change', (e) => {
  const file = e.target.files[0];
  if (!file) return;
  const img = new Image();
  img.onload = () => { cropImage = img; drawCrop(); };
  img.src = URL.createObjectURL(file);
});

function drawCrop() {
  if (!cropImage) return;
  const canvas = document.getElementById('crop-canvas');
  const ctx = canvas.getContext('2d');
  const maxW = 360;
  const scale = maxW / cropImage.width;
  canvas.width = maxW;
  canvas.height = cropImage.height * scale;
  ctx.drawImage(cropImage, 0, 0, canvas.width, canvas.height);
  const mainW = parseInt(document.getElementById('main-w').value) || 506;
  const sideW = parseInt(document.getElementById('side-w').value) || 100;
  const offY = parseInt(document.getElementById('off-y').value) || 0;
  const ratio = canvas.width / cropImage.width;
  ctx.strokeStyle = '#29b6f6';
  ctx.lineWidth = 2;
  ctx.strokeRect(0, offY * ratio, mainW * ratio, canvas.height);
  ctx.strokeRect((mainW + 4) * ratio, offY * ratio, sideW * ratio, canvas.height);
}

['main-w', 'side-w', 'off-y'].forEach(id => {
  document.getElementById(id).addEventListener('input', drawCrop);
});

document.getElementById('crop-btn').addEventListener('click', async () => {
  if (!cropImage) return alert('Выбери изображение');
  const mainW = parseInt(document.getElementById('main-w').value) || 506;
  const sideW = parseInt(document.getElementById('side-w').value) || 100;
  const offY = parseInt(document.getElementById('off-y').value) || 0;
  function crop(x, w) {
    const c = document.createElement('canvas');
    c.width = w;
    c.height = cropImage.height;
    const ctx = c.getContext('2d');
    ctx.drawImage(cropImage, x, offY, w, cropImage.height, 0, 0, w, cropImage.height);
    return new Promise(res => c.toBlob(res, 'image/png'));
  }
  const mainBlob = await crop(0, mainW);
  const sideBlob = await crop(mainW + 4, sideW);
  const result = document.getElementById('crop-result');
  result.innerHTML = '';
  [['main.png', mainBlob], ['side.png', sideBlob]].forEach(([name, blob]) => {
    const a = document.createElement('a');
    a.href = URL.createObjectURL(blob);
    a.download = name;
    a.textContent = `⬇ ${name}`;
    a.className = 'result';
    result.appendChild(a);
  });
});

const templateGrid = document.getElementById('template-grid');
if (templateGrid) {
  templateGrid.innerHTML = '';
  for (let i = 1; i <= 29; i++) {
    const item = document.createElement('div');
    item.className = 'template-item';
    item.innerHTML = `<img src="public-templates/t${i}.png" alt="Шаблон ${i}" loading="lazy" onerror="this.parentElement.style.display='none'"><a href="public-templates/t${i}.png" download>⬇ Скачать</a>`;
    templateGrid.appendChild(item);
  }
}

const BACKEND_INVOICE_URL = '/.netlify/functions/create-invoice';

document.querySelectorAll('.buy-btn').forEach(btn => {
  btn.addEventListener('click', async () => {
    const product = btn.dataset.product;
    const stars = btn.dataset.stars;
    const status = document.getElementById('premium-status');
    if (!tg) {
      status.textContent = 'Оплата работает только внутри Telegram';
      return;
    }
    status.textContent = 'Создаю счёт...';
    try {
      const res = await fetch(BACKEND_INVOICE_URL, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ product, stars: Number(stars), userId: tg.initDataUnsafe?.user?.id, initData: tg.initData })
      });
      if (!res.ok) throw new Error('error');
      const { invoice_url } = await res.json();
      tg.openInvoice(invoice_url, (statusCode) => {
        status.textContent = statusCode === 'paid' ? 'Оплата прошла!' : 'Отменено';
      });
    } catch (e) {
      status.textContent = 'Не удалось создать счёт';
    }
  });
});
