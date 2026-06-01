// ۱. مدیریت تم دارک / لایت
const themeToggle = document.getElementById('theme-toggle');
themeToggle.addEventListener('click', () => {
  const currentTheme = document.documentElement.getAttribute('data-theme');
  if (currentTheme === 'dark') {
    document.documentElement.removeAttribute('data-theme');
    themeToggle.innerText = 'Dark';
    localStorage.setItem('theme', 'light');
  } else {
    document.documentElement.setAttribute('data-theme', 'dark');
    themeToggle.innerText = 'Light';
    localStorage.setItem('theme', 'dark');
  }
});

if (localStorage.getItem('theme') === 'dark') {
  document.documentElement.setAttribute('data-theme', 'dark');
  themeToggle.innerText = 'Light';
}

// ۲. دیتابیس فرمول‌های رنگی ثابت مودها (V2)
const moodArchetypes = {
  luxury: ["#D4AF37", "#FDFBF7", "#1C1917", "#44403C", "#FAF9F6"],
  minimal: ["#09090B", "#71717A", "#27272A", "#09090B", "#FAFAFA"],
  cyberpunk: ["#A855F7", "#06B6D4", "#F43F5E", "#0F172A", "#020617"],
  persian: ["#0D9488", "#B45309", "#78350F", "#451A03", "#FEF3C7"],
  saas: ["#2563EB", "#64748B", "#38BDF8", "#0F172A", "#F8FAFC"]
};

let currentPalette = [];

// ۳. فعال‌سازی قطره‌چکان مرورگر
document.getElementById('pick-btn').addEventListener('click', async () => {
  if (!window.EyeDropper) {
    alert('EyeDropper API is not supported in this browser.');
    return;
  }

  const eyeDropper = new EyeDropper();
  try {
    const result = await eyeDropper.open();
    const hexColor = result.sRGBHex.toUpperCase();
    
    currentPalette = generatePaletteFormula(hexColor);
    updateUI(hexColor);
    saveToHistory(hexColor);
  } catch (err) {
    console.log("Picking cancelled");
  }
});

// ۴. مدیریت دکمه Generate مودها
document.getElementById('gen-mood-btn').addEventListener('click', () => {
  const selectedMood = document.getElementById('mood-select').value;
  if (!selectedMood) {
    alert("Please select a mood first!");
    return;
  }
  
  currentPalette = [...moodArchetypes[selectedMood]];
  updateUI(currentPalette[0]);
  saveToHistory(currentPalette[0]);
});

// ۵. الگوریتم تولید پالت هارمونیک بر اساس یک رنگ
function generatePaletteFormula(hex) {
  const r = parseInt(hex.slice(1, 3), 16);
  const g = parseInt(hex.slice(3, 5), 16);
  const b = parseInt(hex.slice(5, 7), 16);

  const adjust = (val, percent) => Math.max(0, Math.min(255, Math.round(val * percent)));
  const rgbToHex = (r, g, b) => "#" + [r, g, b].map(x => x.toString(16).padStart(2, '0')).join('').toUpperCase();

  return [
    hex,
    rgbToHex(adjust(r, 0.8), adjust(g, 0.8), adjust(b, 0.8)),
    rgbToHex(adjust(r, 1.2), adjust(g, 0.6), adjust(b, 1.4)),
    rgbToHex(adjust(r, 0.2), adjust(g, 0.2), adjust(b, 0.25)),
    rgbToHex(adjust(r, 1.8), adjust(g, 1.8), adjust(b, 1.8))
  ];
}

function hexToRgb(hex) {
  const r = parseInt(hex.slice(1, 3), 16);
  const g = parseInt(hex.slice(3, 5), 16);
  const b = parseInt(hex.slice(5, 7), 16);
  return `rgb(${r}, ${g}, ${b})`;
}

// ۶. تابع جامع به‌روزرسانی کلی رابط کاربری (UI)
function updateUI(hex) {
  document.getElementById('result-card').style.display = 'block';
  document.getElementById('contrast-card').style.display = 'block';
  document.getElementById('export-card').style.display = 'block';
  
  document.getElementById('color-preview').style.backgroundColor = hex;
  document.getElementById('hex-val').innerText = hex;
  document.getElementById('rgb-val').innerText = hexToRgb(hex);

  // کنتراست استاندارد WCAG نسبت به مشکی
  const ratio = checkContrast(hex);
  document.getElementById('contrast-ratio-badge').innerText = `${ratio}:1`;
  
  const aaStatus = document.getElementById('aa-status');
  const aaaStatus = document.getElementById('aaa-status');
  
  if (ratio >= 4.5) {
    aaStatus.innerHTML = '<span style="color: #22c55e;">Pass</span>';
    aaaStatus.innerHTML = ratio >= 7.0 ? '<span style="color: #22c55e;">Pass</span>' : '<span style="color: #ef4444;">Fail</span>';
  } else {
    aaStatus.innerHTML = '<span style="color: #ef4444;">Fail</span>';
    aaaStatus.innerHTML = '<span style="color: #ef4444;">Fail</span>';
  }

  document.getElementById('code-preview-box').innerText = "Click CSS or Tailwind to generate code...";
  
  // رندر پالت ۵ تایی
  const paletteGrid = document.getElementById('palette-grid');
  paletteGrid.innerHTML = '';

  currentPalette.forEach((color) => {
    const swatch = document.createElement('div');
    swatch.className = 'palette-swatch';
    swatch.style.backgroundColor = color;
    swatch.title = color;
    
    swatch.addEventListener('click', () => {
      navigator.clipboard.writeText(color);
      showToast(`Copied ${color}`);
    });
    paletteGrid.appendChild(swatch);
  });
}

function getLuminance(r, g, b) {
  const a = [r, g, b].map((v) => {
    v /= 255;
    return v <= 0.03928 ? v / 12.92 : Math.pow((v + 0.055) / 1.055, 2.4);
  });
  return a[0] * 0.2126 + a[1] * 0.7152 + a[2] * 0.0722;
}

function checkContrast(hexColor) {
  const r = parseInt(hexColor.slice(1, 3), 16);
  const g = parseInt(hexColor.slice(3, 5), 16);
  const b = parseInt(hexColor.slice(5, 7), 16);
  const colorLum = getLuminance(r, g, b);
  const textLum = 0; // Black Text
  return ((Math.max(colorLum, textLum) + 0.05) / (Math.min(colorLum, textLum) + 0.05)).toFixed(1);
}

// ۷. خروجی متغیرهای کدهای پروژه
document.getElementById('btn-export-css').addEventListener('click', () => {
  if (currentPalette.length === 0) return;
  const cssCode = `:root {\n  --primary: ${currentPalette[0]};\n  --secondary: ${currentPalette[1]};\n  --accent: ${currentPalette[2]};\n  --text: ${currentPalette[3]};\n  --bg: ${currentPalette[4]};\n}`;
  document.getElementById('code-preview-box').innerText = cssCode;
  navigator.clipboard.writeText(cssCode);
  showToast('CSS Variables Copied!');
});

document.getElementById('btn-export-tw').addEventListener('click', () => {
  if (currentPalette.length === 0) return;
  const twCode = `theme: {\n  extend: {\n    colors: {\n      primary: '${currentPalette[0]}',\n      secondary: '${currentPalette[1]}',\n      accent: '${currentPalette[2]}',\n      text: '${currentPalette[3]}',\n      bg: '${currentPalette[4]}'\n    }\n  }\n}`;
  document.getElementById('code-preview-box').innerText = twCode;
  navigator.clipboard.writeText(twCode);
  showToast('Tailwind Config Copied!');
});

document.getElementById('hex-row').addEventListener('click', () => {
  navigator.clipboard.writeText(document.getElementById('hex-val').innerText);
  showToast('HEX Copied!');
});

document.getElementById('rgb-row').addEventListener('click', () => {
  navigator.clipboard.writeText(document.getElementById('rgb-val').innerText);
  showToast('RGB Copied!');
});

document.getElementById('copy-all-btn').addEventListener('click', () => {
  if (currentPalette.length === 0) return;
  navigator.clipboard.writeText(currentPalette.join(', '));
  showToast('All colors copied!');
});

// ۸. مدیریت تاریخچه محلی (History)
function saveToHistory(hex) {
  let history = JSON.parse(localStorage.getItem('colorHistory')) || [];
  history = history.filter(c => c !== hex);
  history.unshift(hex);
  if (history.length > 14) history.pop();
  localStorage.setItem('colorHistory', JSON.stringify(history));
  renderHistory();
}

function renderHistory() {
  const grid = document.getElementById('history-grid');
  grid.innerHTML = '';
  const history = JSON.parse(localStorage.getItem('colorHistory')) || [];
  
  history.forEach(color => {
    const dot = document.createElement('div');
    dot.className = 'history-dot';
    dot.style.backgroundColor = color;
    dot.title = color;
    dot.addEventListener('click', () => {
      currentPalette = generatePaletteFormula(color);
      updateUI(color);
    });
    grid.appendChild(dot);
  });
}

function showToast(message) {
  const btn = document.getElementById('pick-btn');
  const originalText = btn.innerHTML;
  btn.innerHTML = `✅ ${message}`;
  setTimeout(() => { btn.innerHTML = originalText; }, 1200);
}

renderHistory();