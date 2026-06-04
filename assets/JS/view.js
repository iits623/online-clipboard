const SUPABASE_URL = "https://kuqmmwpwnekyqjgxuwof.supabase.co";
const SUPABASE_ANON_KEY = "sb_publishable_zVQdcxaM-HKHQ10kqx4Myw_j9C-TiwI";
const sb = window.supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

const linkInput = document.getElementById("linkInput");
const fetchBtn = document.getElementById("fetchBtn");
const viewCard = document.getElementById("viewCard");
const errorCard = document.getElementById("errorCard");
const textDisplay = document.getElementById("textDisplay");
const loadingSpinner = document.getElementById("loadingSpinner");
const copyViewBtn = document.getElementById("copyViewBtn");
const errorMessage = document.getElementById("errorMessage");

let currentContent = "";
let currentId = "";

function extractIdFromLink(link) {
  if (link.includes("?id=")) {
    const urlParams = new URLSearchParams(link.split("?")[1]);
    return urlParams.get("id");
  }
  return link.trim();
}

async function loadPasteById(id) {
  const { data, error } = await sb
    .from("online-clipboard")
    .select("paste_id, content, expires_at, max_views, views")
    .eq("paste_id", id)
    .single();
  if (error) return null;
  return data;
}

async function updateViews(id, currentViews) {
  const { error } = await sb
    .from("online-clipboard")
    .update({ views: currentViews + 1 })
    .eq("paste_id", id);
  if (error) console.error("خطا در بروزرسانی بازدید:", error);
}

function displayPaste(paste) {
  currentContent = paste.content;
  textDisplay.textContent = currentContent;
  viewCard.style.display = "block";
  errorCard.style.display = "none";
}

function showLoading() {
  loadingSpinner.style.display = "block";
  viewCard.style.display = "none";
  errorCard.style.display = "none";
}

async function fetchAndDisplay() {
  const inputValue = linkInput.value.trim();

  if (!inputValue) {
    fetchBtn.innerHTML = `
      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
        <circle cx="12" cy="12" r="10"/>
        <line x1="12" y1="8" x2="12" y2="12"/>
        <line x1="12" y1="16" x2="12.01" y2="16"/>
      </svg>
      لطفا لینک خود را وارد کنید!
    `;
    return;
  }

  fetchBtn.innerHTML = `
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" class="btn-spinner">
      <circle cx="12" cy="12" r="10"/>
      <path d="M12 2a10 10 0 1 0 10 10"/>
    </svg>
    در حال دریافت...
  `;
  fetchBtn.disabled = true;
  showLoading();

  const id = extractIdFromLink(inputValue);

  if (!id) {
    loadingSpinner.style.display = "none";
    fetchBtn.innerHTML = `
      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
        <circle cx="12" cy="12" r="10"/>
        <line x1="12" y1="8" x2="12" y2="12"/>
        <line x1="12" y1="16" x2="12.01" y2="16"/>
      </svg>
      لینک نامعتبر است!
    `;
    fetchBtn.disabled = false;
    errorMessage.innerHTML = "لینک وارد شده معتبر نیست.";
    errorCard.style.display = "block";
    return;
  }

  const paste = await loadPasteById(id);
  loadingSpinner.style.display = "none";

  if (!paste) {
    fetchBtn.innerHTML = `
      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
        <circle cx="12" cy="12" r="10"/>
        <line x1="12" y1="8" x2="12" y2="12"/>
        <line x1="12" y1="16" x2="12.01" y2="16"/>
      </svg>
      پیست پیدا نشد!
    `;
    fetchBtn.disabled = false;
    errorMessage.innerHTML = "پیست مورد نظر یافت نشد.";
    errorCard.style.display = "block";
    return;
  }

  if (paste.expires_at && new Date(paste.expires_at) < new Date()) {
    fetchBtn.innerHTML = `
      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
        <circle cx="12" cy="12" r="10"/>
        <line x1="12" y1="8" x2="12" y2="12"/>
        <line x1="12" y1="16" x2="12.01" y2="16"/>
      </svg>
      پیست منقضی شده است!
    `;
    fetchBtn.disabled = false;
    errorMessage.innerHTML = "این پیست منقضی شده است.";
    errorCard.style.display = "block";
    return;
  }

  if (paste.max_views && paste.views >= paste.max_views) {
    fetchBtn.innerHTML = `
      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
        <circle cx="12" cy="12" r="10"/>
        <line x1="12" y1="8" x2="12" y2="12"/>
        <line x1="12" y1="16" x2="12.01" y2="16"/>
      </svg>
      محدودیت بازدید رد شده است!
    `;
    fetchBtn.disabled = false;
    errorMessage.innerHTML = "این پیست به حداکثر بازدید مجاز رسیده است.";
    errorCard.style.display = "block";
    return;
  }

  await updateViews(id, paste.views);

  fetchBtn.innerHTML = `
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
      <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"/>
      <polyline points="22 4 12 14.01 9 11.01"/>
    </svg>
    دریافت شد!
  `;
  fetchBtn.disabled = false;
  displayPaste(paste);
  linkInput.value = "";

  setTimeout(() => {
    fetchBtn.innerHTML = `
      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
        <polyline points="20 6 9 17 4 12"/>
      </svg>
      دریافت متن
    `;
  }, 3000);
}

copyViewBtn.addEventListener("click", async () => {
  if (!currentContent) {
    copyViewBtn.innerHTML = `
      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
        <circle cx="12" cy="12" r="10"/>
        <line x1="12" y1="8" x2="12" y2="12"/>
        <line x1="12" y1="16" x2="12.01" y2="16"/>
      </svg>
      متنی برای کپی نیست!
    `;
    return;
  }

  try {
    await navigator.clipboard.writeText(currentContent);
    copyViewBtn.innerHTML = `
      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
        <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"/>
        <polyline points="22 4 12 14.01 9 11.01"/>
      </svg>
      کپی شد!
    `;
    setTimeout(() => {
      copyViewBtn.innerHTML = `
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
          <rect x="9" y="9" width="13" height="13" rx="2" ry="2"/>
          <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"/>
        </svg>
        کپی متن
      `;
    }, 3000);
  } catch (err) {
    copyViewBtn.innerHTML = `
      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
        <circle cx="12" cy="12" r="10"/>
        <line x1="12" y1="8" x2="12" y2="12"/>
        <line x1="12" y1="16" x2="12.01" y2="16"/>
      </svg>
      کپی نشد
    `;
  }
});

fetchBtn.addEventListener("click", fetchAndDisplay);

linkInput.addEventListener("keypress", (e) => {
  if (e.key === "Enter") fetchAndDisplay();
});