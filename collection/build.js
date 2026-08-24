const fs = require('fs');
const path = require('path');

const DIR = __dirname;
const data = JSON.parse(fs.readFileSync(path.join(DIR, 'data.json'), 'utf8'));
const works = data.works;

const authScript = `
(function() {
  if (sessionStorage.getItem('collection_auth') !== 'true') {
    window.location.href = '/collection/';
  }
})();
`;

const loginScript = `
(function() {
  var loginScreen = document.getElementById('login-screen');
  var app = document.getElementById('app');
  var form = document.getElementById('login-form');
  var input = document.getElementById('login-password');
  var error = document.getElementById('login-error');

  if (sessionStorage.getItem('collection_auth') === 'true') {
    loginScreen.style.display = 'none';
    app.style.display = 'block';
    return;
  }

  loginScreen.style.display = 'flex';
  app.style.display = 'none';

  form.addEventListener('submit', async function(e) {
    e.preventDefault();
    var pw = input.value;
    var encoder = new TextEncoder();
    var hashBuffer = await crypto.subtle.digest('SHA-256', encoder.encode(pw));
    var hashArray = Array.from(new Uint8Array(hashBuffer));
    var hash = hashArray.map(function(b) { return b.toString(16).padStart(2, '0'); }).join('');
    if (hash === '${data.password_hash}') {
      sessionStorage.setItem('collection_auth', 'true');
      loginScreen.style.display = 'none';
      app.style.display = 'block';
      error.style.display = 'none';
    } else {
      error.style.display = 'block';
      input.value = '';
      input.focus();
    }
  });
})();
`;

function esc(str) {
  if (!str) return '';
  return str.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
}

function buildIndex() {
  let cards = '';
  works.forEach(function(w) {
    const img = w.images && w.images.length
      ? `<img src="${esc(w.images[0].src)}" alt="${esc(w.images[0].alt)}" loading="lazy">`
      : '';
    const imgClass = w.images && w.images.length ? 'card-image' : 'card-image no-image';
    const imgContent = w.images && w.images.length ? img : 'Image pending';

    cards += `
      <a href="${esc(w.slug)}.html" class="work-card">
        <div class="${imgClass}">${imgContent}</div>
        <div class="card-info">
          <div class="card-category">${esc(w.category)}</div>
          <h2>${esc(w.title)}</h2>
          <div class="card-date">${esc(w.date)}</div>
        </div>
      </a>`;
  });

  const html = `<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<meta name="robots" content="noindex, nofollow">
<title>Collection</title>
<link rel="stylesheet" href="style.css">
</head>
<body>

<div class="login-screen" id="login-screen" style="display:none;">
  <div class="login-box">
    <h1>Private Collection</h1>
    <form id="login-form">
      <input type="password" id="login-password" placeholder="Password" autocomplete="off">
      <button type="submit">Enter</button>
    </form>
    <div class="login-error" id="login-error">Incorrect password</div>
  </div>
</div>

<div id="app" style="display:none;">

  <nav class="site-nav">
    <div class="nav-inner">
      <div>
        <a href="/" class="nav-parent">Squintum's</a>
        <a href="/collection/" class="site-title">Collection</a>
      </div>
    </div>
  </nav>

  <div class="page-container">
    <div class="hero-spacer"></div>

    <header class="collection-header">
      <h1>Collection</h1>
      <div class="subtitle">${works.length} works</div>
    </header>

    <div class="work-grid">
${cards}
    </div>
  </div>

  <footer>
    <div class="page-container">
      <p>Private Collection</p>
    </div>
  </footer>

</div>

<script>${loginScript}</script>
</body>
</html>`;

  fs.writeFileSync(path.join(DIR, 'index.html'), html);
  console.log('  index.html');
}

function buildDetail(work, index) {
  const prev = index > 0 ? works[index - 1] : null;
  const next = index < works.length - 1 ? works[index + 1] : null;

  const mainImg = work.images && work.images.length
    ? `<img src="${esc(work.images[0].src)}" alt="${esc(work.images[0].alt)}" id="main-image">`
    : '<p style="color: var(--mid-gray); padding: 4rem 0; text-align: center;">Image pending</p>';

  let thumbs = '';
  if (work.images && work.images.length > 1) {
    thumbs = '<div class="gallery-thumbs">';
    work.images.forEach(function(img, i) {
      thumbs += `<img src="${esc(img.src)}" alt="${esc(img.alt)}" onclick="setMainImage(this)" class="${i === 0 ? 'active' : ''}">`;
    });
    thumbs += '</div>';
  }

  let specsHtml = '';
  if (work.specs && work.specs.length) {
    specsHtml = '<div class="section-label">Specifications</div>\n<dl class="specs-table">';
    work.specs.forEach(function(s) {
      specsHtml += `\n  <div class="spec-row"><dt class="spec-label">${esc(s.label)}</dt><dd class="spec-value">${esc(s.value)}</dd></div>`;
    });
    specsHtml += '\n</dl>';
  }

  if (work.dimensions && !work.specs.some(function(s) { return s.label === 'Dimensions'; })) {
    specsHtml = specsHtml.replace('</dl>', `\n  <div class="spec-row"><dt class="spec-label">Dimensions</dt><dd class="spec-value">${esc(work.dimensions)}</dd></div>\n</dl>`);
  }

  let provHtml = '';
  if (work.provenance && work.provenance.length) {
    provHtml = '<div class="section-label">Provenance</div>\n<ol class="provenance-list">';
    work.provenance.forEach(function(p) {
      provHtml += `\n  <li>${esc(p)}</li>`;
    });
    provHtml += '\n</ol>';
  }

  let descHtml = '';
  if (work.description) {
    descHtml = '<div class="section-label">Description</div>\n<div class="detail-text">';
    work.description.split('\n\n').forEach(function(p) {
      if (p.trim()) descHtml += `\n  <p>${esc(p.trim())}</p>`;
    });
    descHtml += '\n</div>';
  }

  let condHtml = '';
  if (work.condition) {
    condHtml = '<div class="section-label">Condition</div>\n<div class="detail-text">\n  <p>' + esc(work.condition) + '</p>\n</div>';
  }

  let valueHtml = '';
  if (work.estimatedValue) {
    valueHtml = '<div class="section-label">Estimated Value</div>\n<div class="detail-text">\n  <p>' + esc(work.estimatedValue) + '</p>\n</div>';
  }

  let notesHtml = '';
  if (work.notes) {
    notesHtml = '<div class="section-label">Notes</div>\n<div class="detail-text">\n  <p>' + esc(work.notes) + '</p>\n</div>';
  }

  let navHtml = '';
  if (prev || next) {
    navHtml = '<nav class="detail-nav">';
    if (prev) {
      navHtml += `<a href="${esc(prev.slug)}.html"><span class="nav-label">&larr; Previous</span><span class="nav-title">${esc(prev.title)}</span></a>`;
    } else {
      navHtml += '<span></span>';
    }
    if (next) {
      navHtml += `<a href="${esc(next.slug)}.html" style="text-align:right;"><span class="nav-label">Next &rarr;</span><span class="nav-title">${esc(next.title)}</span></a>`;
    } else {
      navHtml += '<span></span>';
    }
    navHtml += '</nav>';
  }

  const artistLine = work.artist ? `<div class="detail-date">${esc(work.artist)}</div>` : '';

  const html = `<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<meta name="robots" content="noindex, nofollow">
<title>${esc(work.title)} - Collection</title>
<link rel="stylesheet" href="style.css">
</head>
<body>

<script>${authScript}</script>

<nav class="site-nav">
  <div class="nav-inner">
    <div>
      <a href="/" class="nav-parent">Squintum's</a>
      <a href="/collection/" class="site-title">Collection</a>
    </div>
  </div>
</nav>

<div class="page-container">
  <div class="hero-spacer"></div>

  <article>
    <header class="detail-hero">
      <div class="breadcrumb">
        <a href="/collection/">Collection</a> &rsaquo; ${esc(work.category)}
      </div>
      <h1>${esc(work.title)}</h1>
      <div class="detail-date">${esc(work.date)}</div>
      ${artistLine}
    </header>

    <div class="gallery">
      <div class="gallery-main${work.images && work.images.length ? ' zoomable' : ''}">
        ${mainImg}
      </div>
      ${thumbs}
    </div>

    <div class="detail-content">
      <div class="content-left">
        ${descHtml}
        ${condHtml}
        ${notesHtml}
      </div>
      <div class="content-right">
        ${specsHtml}
        ${provHtml}
        ${valueHtml}
      </div>
    </div>

    ${navHtml}
  </article>
</div>

<footer>
  <div class="page-container">
    <p>Private Collection</p>
  </div>
</footer>

<script src="zoom.js"></script>
<script>
function setMainImage(thumb) {
  var main = document.getElementById('main-image');
  if (main) {
    main.src = thumb.src;
    main.alt = thumb.alt;
  }
  document.querySelectorAll('.gallery-thumbs img').forEach(function(t) { t.classList.remove('active'); });
  thumb.classList.add('active');
}
</script>
</body>
</html>`;

  fs.writeFileSync(path.join(DIR, work.slug + '.html'), html);
  console.log('  ' + work.slug + '.html');
}

console.log('Building collection...');
buildIndex();
works.forEach(function(w, i) { buildDetail(w, i); });
console.log('Done. ' + (works.length + 1) + ' pages generated.');
