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
const maxViewsInput = document.getElementById("maxViews");

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

function convertPersianToEnglishNumber(input) {
  const persianNumbers = ["۰", "۱", "۲", "۳", "۴", "۵", "۶", "۷", "۸", "۹"];
  const englishNumbers = ["0", "1", "2", "3", "4", "5", "6", "7", "8", "9"];
  let result = input;
  for (let i = 0; i < persianNumbers.length; i++) {
    result = result.split(persianNumbers[i]).join(englishNumbers[i]);
  }
  return result;
}

function convertPersianToGregorian(persianDateStr, timeStr) {
  if (!persianDateStr || !timeStr) return null;

  const englishDateStr = convertPersianToEnglishNumber(persianDateStr);

  try {
    const dateParts = englishDateStr.split("/");
    if (dateParts.length !== 3) return null;

    const year = parseInt(dateParts[0]);
    const month = parseInt(dateParts[1]);
    const day = parseInt(dateParts[2]);

    if (isNaN(year) || isNaN(month) || isNaN(day)) return null;

    const persianDateObj = new persianDate([year, month, day]);
    const gregorianDate = persianDateObj.toDate();

    if (isNaN(gregorianDate.getTime())) return null;

    const timeParts = timeStr.split(":");
    let hour = 23;
    let minute = 59;

    if (timeParts.length >= 2) {
      hour = parseInt(timeParts[0]);
      minute = parseInt(timeParts[1]);
    }

    if (isNaN(hour)) hour = 23;
    if (isNaN(minute)) minute = 59;

    gregorianDate.setHours(hour, minute, 0, 0);

    return gregorianDate.toISOString();
  } catch (error) {
    console.error("Error converting date:", error);
    return null;
  }
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
  if (error) {
    console.error("Supabase error:", error);
    return false;
  }
  return true;
}

function showShareLink(id) {
  const viewUrl = `${window.location.origin}${window.location.pathname.replace("index.html", "")}view.html?id=${id}`;
  shareLinkInput.value = viewUrl;
  resultArea.style.display = "block";
  resultArea.scrollIntoView({ behavior: "smooth" });
}

function resetSaveButton() {
  saveBtn.disabled = false;
  saveBtn.innerHTML = `
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
      <path d="M19 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11l5 5v11a2 2 0 0 1-2 2z"/>
      <polyline points="17 21 17 13 7 13 7 21"/>
      <polyline points="7 3 7 8 15 8"/>
    </svg>
    ایجاد پیست
  `;
}

function showError(message) {
  saveBtn.disabled = false;
  saveBtn.innerHTML = `
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
      <circle cx="12" cy="12" r="10"/>
      <line x1="12" y1="8" x2="12" y2="12"/>
      <line x1="12" y1="16" x2="12.01" y2="16"/>
    </svg>
    ${message}
  `;
  setTimeout(() => {
    if (
      saveBtn.innerHTML.includes("خطا") ||
      saveBtn.innerHTML.includes("لطفاً")
    ) {
      resetSaveButton();
    }
  }, 3000);
}

$(document).ready(function () {
  if (expireDateInput) {
    expireDateInput.value = "";

    $(expireDateInput).persianDatepicker({
      format: "YYYY/MM/DD",
      autoClose: true,
      toolbox: {
        todayButton: {
          enabled: true,
          text: "امروز",
        },
      },
      persianDigits: true,
      zIndex: 10000,
      initialValue: false,
    });

    $(expireDateInput).off("click");
    $(expireDateInput).on("click", function (e) {
      e.stopPropagation();
      $(this).persianDatepicker("show");
    });
  }
});

saveBtn.addEventListener("click", async () => {
  const content = textarea.value;

  if (!content || content.trim() === "") {
    showError("لطفاً متنی بنویسید!");
    return;
  }

  const expireDate = expireDateInput?.value;
  const expireTime = expireTimeInput?.value;
  const maxViews = maxViewsInput?.value;

  const hasDate = expireDate && expireDate.trim() !== "";
  const hasTime = expireTime && expireTime.trim() !== "";


  if ((hasDate && !hasTime) || (!hasDate && hasTime)) {
    if (hasDate && !hasTime) {
      showError("برای فعال کردن انقضا، ساعت را نیز وارد کنید!");
      expireTimeInput.focus();
    } else if (!hasDate && hasTime) {
      showError("برای فعال کردن انقضا، تاریخ را نیز انتخاب کنید!");
      expireDateInput.focus();
    }
    return;
  }

  let expiresAt = null;

  if (hasDate && hasTime) {
    expiresAt = convertPersianToGregorian(expireDate, expireTime);
    if (!expiresAt) {
      showError("تاریخ یا ساعت معتبر نیست!");
      return;
    }
  }


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
      پیست شما ساخته شد!
    `;
    setTimeout(() => {
      resetSaveButton();
    }, 3000);

    expireDateInput.value = "";
    expireTimeInput.value = "";
    maxViewsInput.value = "";
  } else {
    showError("خطا در ذخیره سازی!");
  }

  saveBtn.disabled = false;
});

copyLinkBtn.addEventListener("click", async () => {
  if (!shareLinkInput.value) {
    const original = copyLinkBtn.innerHTML;
    copyLinkBtn.innerHTML = `
      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
        <circle cx="12" cy="12" r="10"/>
        <line x1="12" y1="8" x2="12" y2="12"/>
        <line x1="12" y1="16" x2="12.01" y2="16"/>
      </svg>
      لینکی نیست!
    `;
    setTimeout(() => {
      copyLinkBtn.innerHTML = original;
    }, 2000);
    return;
  }

  try {
    await navigator.clipboard.writeText(shareLinkInput.value);
    const original = copyLinkBtn.innerHTML;
    copyLinkBtn.innerHTML = `
      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
        <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"/>
        <polyline points="22 4 12 14.01 9 11.01"/>
      </svg>
      کپی شد!
    `;
    setTimeout(() => {
      copyLinkBtn.innerHTML = original;
    }, 2000);
  } catch (err) {
    const original = copyLinkBtn.innerHTML;
    copyLinkBtn.innerHTML = `
      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
        <circle cx="12" cy="12" r="10"/>
        <line x1="12" y1="8" x2="12" y2="12"/>
        <line x1="12" y1="16" x2="12.01" y2="16"/>
      </svg>
      کپی نشد
    `;
    setTimeout(() => {
      copyLinkBtn.innerHTML = original;
    }, 2000);
  }
});
