(function () {
  'use strict';

  var MESSAGE = 'বাংলা ভিডিও গ্রুপ https://t.me/K_Drama_Seoul_hindi/359';
  var STORE_KEY = 'wa-links-v1';
  var MAX_ITEMS = 300;
  var ENG_KEY = 'wa-engine-v1';
  var BN_DIGITS = '০১২৩৪৫৬৭৮৯';

  function $(id) { return document.getElementById(id); }
  var input = $('number');
  var field = $('field');
  var hint = $('hint');
  var errorEl = $('error');
  var fatal = $('fatal');
  var list = $('list');
  var empty = $('empty');
  var clearAll = $('clearAll');
  var makeBtn = $('make');
  var toast = $('toast');
  var bulk = $('bulk');
  var speed = $('speed');
  var startBtn = $('startBtn');
  var pauseBtn = $('pauseBtn');
  var skipBtn = $('skipBtn');
  var resetBtn = $('resetBtn');
  var barFill = $('barFill');
  var engCount = $('engCount');
  var engState = $('engState');

  // If anything breaks, show it on screen instead of failing silently
  window.addEventListener('error', function (e) {
    fatal.textContent = 'সমস্যা হয়েছে: ' + (e.message || 'অজানা ত্রুটি');
    fatal.hidden = false;
  });

  $('bubble').textContent = MESSAGE;

  /* ---------- storage ---------- */
  var items = load();
  render();

  function load() {
    try {
      var v = JSON.parse(localStorage.getItem(STORE_KEY));
      if (!Array.isArray(v)) return [];
      return v.filter(function (x) { return /^8801[3-9]\d{8}$/.test(x); });
    } catch (e) {
      return [];
    }
  }
  function save() {
    try { localStorage.setItem(STORE_KEY, JSON.stringify(items)); } catch (e) {}
  }

  /* ---------- number helpers ---------- */
  // Bengali digits -> English, then keep digits only
  function toDigits(v) {
    return String(v)
      .replace(/[\u09E6-\u09EF]/g, function (d) { return String(BN_DIGITS.indexOf(d)); })
      .replace(/\D/g, '');
  }
  // 01XXXXXXXXX or 8801XXXXXXXXX (also +880...) -> 8801XXXXXXXXX
  function normalize(d) {
    d = d.replace(/^00/, '');
    if (/^01[3-9]\d{8}$/.test(d)) return '88' + d;
    if (/^8801[3-9]\d{8}$/.test(d)) return d;
    return null;
  }
  function waLink(n) { return 'https://wa.me/' + n + '?text=' + encodeURIComponent(MESSAGE); }
  function pretty(n) { return '+880 ' + n.slice(3, 7) + '-' + n.slice(7); }

  /* ---------- UI helpers ---------- */
  function el(tag, cls, text) {
    var node = document.createElement(tag);
    if (cls) node.className = cls;
    if (text) node.textContent = text;
    return node;
  }

  var currentError = '';
  function showError(msg) {
    msg = msg || '';
    if (msg === currentError) return;
    currentError = msg;
    errorEl.textContent = msg;
    errorEl.hidden = !msg;
    hint.hidden = !!msg;
    if (msg) field.setAttribute('data-invalid', ''); else field.removeAttribute('data-invalid');
  }

  var toastTimer;
  function say(msg) {
    toast.textContent = msg;
    toast.classList.add('show');
    clearTimeout(toastTimer);
    toastTimer = setTimeout(function () { toast.classList.remove('show'); }, 1800);
  }

  function fallbackCopy(text) {
    var t = document.createElement('textarea');
    t.value = text;
    t.style.cssText = 'position:fixed;opacity:0;top:0;left:0';
    document.body.appendChild(t);
    t.focus();
    t.select();
    try { document.execCommand('copy'); } catch (e) {}
    document.body.removeChild(t);
  }
  function copyText(text, btn) {
    function done() {
      btn.textContent = 'কপি হয়েছে ✓';
      setTimeout(function () { btn.textContent = 'লিংক কপি'; }, 1600);
    }
    if (navigator.clipboard && navigator.clipboard.writeText) {
      navigator.clipboard.writeText(text).then(done, function () { fallbackCopy(text); done(); });
    } else {
      fallbackCopy(text);
      done();
    }
  }

  /* ---------- list ---------- */
  function row(n, fresh) {
    var href = waLink(n);
    var li = el('li', 'item' + (fresh ? ' fresh' : ''));

    var link = el('a', 'link', 'wa.me/' + n);
    link.href = href;
    link.target = '_blank';
    link.rel = 'noopener noreferrer';

    var open = el('a', 'btn primary', 'WhatsApp খুলুন');
    open.href = href;
    open.target = '_blank';
    open.rel = 'noopener noreferrer';

    var copy = el('button', 'btn', 'লিংক কপি');
    copy.type = 'button';
    copy.addEventListener('click', function () { copyText(href, copy); });

    var del = el('button', 'btn quiet', 'মুছুন');
    del.type = 'button';
    del.setAttribute('aria-label', pretty(n) + ' মুছুন');
    del.addEventListener('click', function () {
      items = items.filter(function (x) { return x !== n; });
      save();
      render();
    });

    var actions = el('div', 'actions');
    actions.appendChild(open);
    actions.appendChild(copy);
    actions.appendChild(del);

    li.appendChild(el('div', 'num', pretty(n)));
    li.appendChild(link);
    li.appendChild(actions);
    return li;
  }

  function render(fresh) {
    list.textContent = '';
    items.forEach(function (n) { list.appendChild(row(n, n === fresh)); });
    empty.hidden = items.length > 0;
    clearAll.hidden = items.length === 0;
  }

  function add(n) {
    items = [n].concat(items.filter(function (x) { return x !== n; })).slice(0, MAX_ITEMS);
    save();
    render(n);
    say('লিংক তৈরি হয়েছে');
  }

  /* ---------- main check ---------- */
  var MSG_INVALID = 'নম্বরটি সঠিক নয়। ০১৩ থেকে ০১৯ দিয়ে শুরু হওয়া ১১ সংখ্যার নম্বর দিন।';
  var MSG_INCOMPLETE = 'নম্বরটি সম্পূর্ণ নয়। ১১ সংখ্যার নম্বর দিন, যেমন 01845752466।';
  var MSG_EMPTY = 'আগে একটি নম্বর লিখুন।';

  // force = true when the person pressed Enter or the button
  function check(force) {
    var raw = input.value;
    if (!raw) { showError(force ? MSG_EMPTY : ''); return; }

    var d = toDigits(raw);
    var n = normalize(d);
    if (n) {
      add(n);
      input.value = '';           // auto clear
      showError('');
      // some mobile keyboards put the text back; clear once more
      setTimeout(function () { if (toDigits(input.value) === d) input.value = ''; }, 80);
      return;
    }

    var looksFull = (d.indexOf('01') === 0 && d.length >= 11) || (d.indexOf('880') === 0 && d.length >= 13);
    if (looksFull) showError(MSG_INVALID);
    else showError(force ? MSG_INCOMPLETE : '');
  }

  /* ---------- auto engine (runs on a list the person pastes) ---------- */
  function bn(x) {
    return String(x).replace(/\d/g, function (d) { return BN_DIGITS.charAt(+d); });
  }
  function loadEng() {
    try {
      var v = JSON.parse(localStorage.getItem(ENG_KEY));
      if (v && Array.isArray(v.q)) {
        var q = v.q.filter(function (x) { return /^8801[3-9]\d{8}$/.test(x); });
        return { q: q, i: Math.min(v.i | 0, q.length), bad: v.bad | 0 };
      }
    } catch (e) {}
    return { q: [], i: 0, bad: 0 };
  }
  function saveEng() {
    try { localStorage.setItem(ENG_KEY, JSON.stringify(eng)); } catch (e) {}
  }

  var eng = loadEng();
  var running = false;
  var timer = null;

  function paintEngine() {
    var total = eng.q.length;
    var done = eng.i;
    var finished = total > 0 && done >= total;
    barFill.style.width = (total ? (done / total) * 100 : 0) + '%';
    engCount.textContent = total
      ? bn(done) + ' / ' + bn(total) + ' সম্পন্ন' + (eng.bad ? ' · ' + bn(eng.bad) + 'টি ভুল/ডুপ্লিকেট বাদ' : '')
      : 'এখনো তালিকা নেই';
    engState.textContent = running ? 'চলছে…' : finished ? 'শেষ হয়েছে ✓' : total ? 'বিরতিতে' : '';
    startBtn.hidden = running;
    pauseBtn.hidden = !running;
    startBtn.textContent = (total && done > 0 && !finished) ? 'চালিয়ে যান' : 'শুরু করুন';
    skipBtn.disabled = !total || finished;
    resetBtn.disabled = !total;
  }

  function loadList(text) {
    var seen = {};
    var q = [];
    var bad = 0;
    text.split(/[\n,;]+/).forEach(function (tok) {
      if (!tok.trim()) return;
      var n = normalize(toDigits(tok));
      if (!n || seen[n]) { bad++; return; }
      seen[n] = true;
      q.push(n);
    });
    eng = { q: q, i: 0, bad: bad };
    saveEng();
  }

  function tick() {
    if (!running) return;
    if (eng.i >= eng.q.length) {
      running = false;
      paintEngine();
      say('সব লিংক তৈরি হয়েছে');
      return;
    }
    input.value = '0' + eng.q[eng.i].slice(3);        // shows 01XXXXXXXXX in the box
    timer = setTimeout(function () {
      check(false);                                    // makes the link, clears the box
      eng.i++;
      saveEng();
      paintEngine();
      timer = setTimeout(tick, (parseInt(speed.value, 10) || 2) * 1000);
    }, 350);
  }

  function startEngine() {
    var text = bulk.value.trim();
    if (text) { loadList(text); bulk.value = ''; }
    if (!eng.q.length) { say('আগে নম্বরের তালিকা দিন'); paintEngine(); return; }
    if (eng.i >= eng.q.length) { paintEngine(); return; }
    running = true;
    paintEngine();
    tick();
  }
  function pauseEngine() {
    running = false;
    clearTimeout(timer);
    input.value = '';
    paintEngine();
  }
  startBtn.addEventListener('click', startEngine);
  pauseBtn.addEventListener('click', pauseEngine);
  skipBtn.addEventListener('click', function () {
    if (eng.i < eng.q.length) { eng.i++; saveEng(); }
    if (running) { clearTimeout(timer); input.value = ''; tick(); }
    paintEngine();
  });
  resetBtn.addEventListener('click', function () {
    running = false;
    clearTimeout(timer);
    input.value = '';
    eng = { q: [], i: 0, bad: 0 };
    saveEng();
    paintEngine();
  });
  paintEngine();

  /* ---------- events ---------- */
  ['input', 'keyup', 'change', 'compositionend'].forEach(function (evt) {
    input.addEventListener(evt, function (e) {
      if (e.key === 'Enter') return; // Enter is handled in keydown
      check(false);
    });
  });
  input.addEventListener('paste', function () { setTimeout(function () { check(false); }, 0); });
  input.addEventListener('keydown', function (e) {
    if (e.key === 'Enter') { e.preventDefault(); check(true); }
  });
  makeBtn.addEventListener('click', function () { check(true); input.focus(); });
  clearAll.addEventListener('click', function () {
    items = [];
    save();
    render();
  });

  // safety net: some keyboards skip events, so look at the box regularly
  setInterval(function () { if (input.value) check(false); }, 400);
})();
