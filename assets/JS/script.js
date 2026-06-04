const SUPABASE_URL = "https://kuqmmwpwnekyqjgxuwof.supabase.co";
const SUPABASE_ANON_KEY = "sb_publishable_zVQdcxaM-HKHQ10kqx4Myw_j9C-TiwI";
const sb = window.supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

const textarea = document.getElementById("pasteContent");
const saveBtn = document.getElementById("saveBtn");
const clearBtn = document.getElementById("clearBtn");
const copyLinkBtn = document.getElementById("copyLinkBtn");
const resultArea = document.getElementById("resultArea");
const shareLinkInput = document.getElementById("shareLink");
const expireDateInput = document.getElementById("expireDate");
const expireTimeInput = document.getElementById("expireTime");

clearBtn.addEventListener("click", () => {
  textarea.value = "";
  textarea.focus();
  resultArea.style.display = "none";
});

function generateShortId() {
  const chars =
    "abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789";
  let result = "";
  for (let i = 0; i < 6; i++) {
    result += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return result;
}

function generateUniqueId() {
  return generateShortId();
}

async function saveToSupabase(id, content, expiresAt, maxViews) {
  const { error } = await sb.from("online-clipboard").insert([
    {
      paste_id: id,
      content: content,
      expires_at: expiresAt,
      max_views: maxViews,
      views: 0,
    },
  ]);
  if (error) return false;
  return true;
}

function showShareLink(id) {
  const viewUrl = `${window.location.origin}/view.html?id=${id}`;
  shareLinkInput.value = viewUrl;
  resultArea.style.display = "block";
  resultArea.scrollIntoView({ behavior: "smooth" });
}

function persianDateTimeToGregorian(persianDate, persianTime) {
  if (!persianDate || persianDate.trim() === "") return null;

  const dateParts = persianDate.split("/");
  if (dateParts.length !== 3) return null;

  const year = parseInt(dateParts[0]);
  const month = parseInt(dateParts[1]);
  const day = parseInt(dateParts[2]);

  let hour = 23;
  let minute = 59;
  let second = 59;

  if (persianTime && persianTime.trim() !== "") {
    const timeParts = persianTime.split(":");
    if (timeParts.length >= 2) {
      hour = parseInt(timeParts[0]);
      minute = parseInt(timeParts[1]);
      second = timeParts[2] ? parseInt(timeParts[2]) : 0;
    }
  }

  let gregorianDate = new Date();
  gregorianDate.setFullYear(year, month - 1, day);
  gregorianDate.setHours(hour, minute, second, 999);

  return gregorianDate.toISOString();
}

if (expireTimeInput && !expireTimeInput.value) {
  expireTimeInput.value = "23:59";
}

if (expireDateInput) {
  $(document).ready(function () {
    $(expireDateInput).persianDatepicker({
      observer: true,
      format: "YYYY/MM/DD",
      autoClose: true,
      initialValue: false,
      toolbox: {
        calendarSwitch: {
          enabled: false,
        },
        todayButton: {
          enabled: true,
          text: "امروز",
        },
      },
      persianDigits: true,
      zIndex: 10000,
      onSelect: function () {
        setTimeout(() => {
          if (expireTimeInput) expireTimeInput.focus();
        }, 100);
      },
    });
  });
}

saveBtn.addEventListener("click", async () => {
  const content = textarea.value;

  if (!content || content.trim() === "") {
    saveBtn.innerHTML = `
      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
        <circle cx="12" cy="12" r="10"/>
        <line x1="12" y1="8" x2="12" y2="12"/>
        <line x1="12" y1="16" x2="12.01" y2="16"/>
      </svg>
      لطفاً متنی بنویسید!
    `;
    return;
  }

  let expiresAt = null;
  const expireDateValue = expireDateInput?.value;
  const expireTimeValue = expireTimeInput?.value;

  if (expireDateValue && expireDateValue.trim() !== "") {
    expiresAt = persianDateTimeToGregorian(expireDateValue, expireTimeValue);
  }

  const maxViews = document.getElementById("maxViews").value;
  const finalMaxViews = maxViews ? parseInt(maxViews) : null;

  saveBtn.innerHTML = `
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" class="btn-spinner">
      <circle cx="12" cy="12" r="10"/>
      <path d="M12 2a10 10 0 1 0 10 10"/>
    </svg>
    در حال ذخیره سازی...
  `;
  saveBtn.disabled = true;

  const id = generateUniqueId();
  const saved = await saveToSupabase(id, content, expiresAt, finalMaxViews);

  if (saved) {
    showShareLink(id);
    saveBtn.innerHTML = `
      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
        <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"/>
        <polyline points="22 4 12 14.01 9 11.01"/>
      </svg>
      پیست شما با موفقیت ساخته شد!
    `;
  } else {
    saveBtn.innerHTML = `
      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
        <circle cx="12" cy="12" r="10"/>
        <line x1="12" y1="8" x2="12" y2="12"/>
        <line x1="12" y1="16" x2="12.01" y2="16"/>
      </svg>
      خطا در ذخیره سازی!
    `;
  }

  saveBtn.disabled = false;

  setTimeout(() => {
    saveBtn.innerHTML = `
      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
        <path d="M19 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11l5 5v11a2 2 0 0 1-2 2z"/>
        <polyline points="17 21 17 13 7 13 7 21"/>
        <polyline points="7 3 7 8 15 8"/>
      </svg>
      ایجاد پیست
    `;
  }, 3000);
});

copyLinkBtn.addEventListener("click", async () => {
  if (!shareLinkInput.value) {
    copyLinkBtn.innerHTML = `
      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
        <circle cx="12" cy="12" r="10"/>
        <line x1="12" y1="8" x2="12" y2="12"/>
        <line x1="12" y1="16" x2="12.01" y2="16"/>
      </svg>
      لینکی برای کپی وجود ندارد!
    `;
    return;
  }

  try {
    await navigator.clipboard.writeText(shareLinkInput.value);
    copyLinkBtn.innerHTML = `
      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
        <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"/>
        <polyline points="22 4 12 14.01 9 11.01"/>
      </svg>
      لینک با موفقیت کپی شد!
    `;
    setTimeout(() => {
      copyLinkBtn.innerHTML = `
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
          <rect x="9" y="9" width="13" height="13" rx="2" ry="2"/>
          <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"/>
        </svg>
        کپی لینک
      `;
    }, 3000);
  } catch (err) {
    copyLinkBtn.innerHTML = `
      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
        <circle cx="12" cy="12" r="10"/>
        <line x1="12" y1="8" x2="12" y2="12"/>
        <line x1="12" y1="16" x2="12.01" y2="16"/>
      </svg>
      کپی نشد. دستی کپی کنید.
    `;
  }
});
