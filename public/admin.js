import { initializeApp } from "https://www.gstatic.com/firebasejs/11.10.0/firebase-app.js";

import {
  getAuth,
  signInWithEmailAndPassword,
  onAuthStateChanged,
  signOut,
} from "https://www.gstatic.com/firebasejs/11.10.0/firebase-auth.js";

import {
  getFirestore,
  collection,
  getDocs,
  query,
  orderBy,
} from "https://www.gstatic.com/firebasejs/11.10.0/firebase-firestore.js";

// ======================================================
// FIREBASE
// ======================================================

const firebaseConfig = {
  apiKey: "AIzaSyDGwJUOhj0SaPDY9p3a2SNtsp98yvjLorg",

  authDomain: "landing-ideas.firebaseapp.com",

  projectId: "landing-ideas",

  storageBucket: "landing-ideas.firebasestorage.app",

  messagingSenderId: "330248839293",

  appId: "1:330248839293:web:5907fc1c74557f225a1114",

  measurementId: "G-51CNHH1RM3",
};

const app = initializeApp(firebaseConfig);

const auth = getAuth(app);

const db = getFirestore(app);

// ======================================================
// ADMIN
// ======================================================

const ADMIN_EMAIL = "admin@gmail.com";

let allLeads = [];

// ======================================================
// DOM
// ======================================================

const loginPage = document.getElementById("loginPage");

const dashboardPage = document.getElementById("dashboardPage");

const loginForm = document.getElementById("loginForm");

const loginError = document.getElementById("loginError");

const logoutBtn = document.getElementById("logoutBtn");

const searchInput = document.getElementById("searchInput");

const refreshBtn = document.getElementById("refreshBtn");

const leadsContainer = document.getElementById("leadsContainer");

const emptyState = document.getElementById("emptyState");

const totalLeads = document.getElementById("totalLeads");

const latestLead = document.getElementById("latestLead");

const leadModal = document.getElementById("leadModal");

const leadDetails = document.getElementById("leadDetails");

const closeModal = document.getElementById("closeModal");

const modalOverlay = document.getElementById("modalOverlay");

// ======================================================
// AUTH STATE
// ======================================================

onAuthStateChanged(auth, async (user) => {
  if (!user) {
    showLogin();

    return;
  }

  //   if (user.email !== ADMIN_EMAIL) {
  //     await signOut(auth);

  //     showLogin();

  //     showLoginError("الحساب ده مش مسموح له يدخل الـ Dashboard.");

  //     return;
  //   }

  showDashboard();

  await loadLeads();
});

// ======================================================
// LOGIN
// ======================================================

loginForm.addEventListener("submit", async (event) => {
  event.preventDefault();

  loginError.textContent = "";

  const email = document.getElementById("adminEmail").value.trim();

  const password = document.getElementById("adminPassword").value;

  try {
    await signInWithEmailAndPassword(auth, email, password);
  } catch (error) {
    console.error(error);

    showLoginError("الإيميل أو الباسورد غير صحيح.");
  }
});

// ======================================================
// LOGOUT
// ======================================================

logoutBtn.addEventListener("click", async () => {
  await signOut(auth);
});

// ======================================================
// LOAD LEADS
// ======================================================

async function loadLeads() {
  leadsContainer.innerHTML = `
        <div class="admin-loading">
            <div class="loading-spinner"></div>
            <span>بنجيب بيانات العملاء...</span>
        </div>
    `;

  try {
    const leadsQuery = query(
      collection(db, "leads"),
      orderBy("createdAt", "desc"),
    );

    const snapshot = await getDocs(leadsQuery);

    allLeads = snapshot.docs.map((doc) => ({
      id: doc.id,
      ...doc.data(),
    }));

    updateStats();

    renderLeads(allLeads);
  } catch (error) {
    console.error("Loading leads failed:", error);

    leadsContainer.innerHTML = `
            <div class="admin-error-box">
                حصلت مشكلة وإحنا بنجيب البيانات.
                <br>
                تأكد من Firestore Rules.
            </div>
        `;
  }
}

// ======================================================
// STATS
// ======================================================

function updateStats() {
  totalLeads.textContent = allLeads.length;

  if (allLeads.length === 0) {
    latestLead.textContent = "—";

    return;
  }

  latestLead.textContent = allLeads[0].name || "عميل";
}

// ======================================================
// SEARCH
// ======================================================

searchInput.addEventListener("input", () => {
  const search = searchInput.value.trim().toLowerCase();

  if (!search) {
    renderLeads(allLeads);

    return;
  }

  const filtered = allLeads.filter((lead) => {
    const name = String(lead.name || "").toLowerCase();

    const phone = String(lead.phone || "").toLowerCase();

    const email = String(lead.email || "").toLowerCase();

    return (
      name.includes(search) || phone.includes(search) || email.includes(search)
    );
  });

  renderLeads(filtered);
});

// ======================================================
// REFRESH
// ======================================================

refreshBtn.addEventListener("click", loadLeads);

// ======================================================
// RENDER
// ======================================================

function renderLeads(leads) {
  leadsContainer.innerHTML = "";

  emptyState.style.display = leads.length === 0 ? "block" : "none";

  leads.forEach((lead) => {
    const card = document.createElement("article");

    card.className = "lead-card";

    card.innerHTML = `

            <div class="lead-card-top">

                <div class="lead-avatar">
                    ${escapeHtml(getInitials(lead.name))}
                </div>

                <div class="lead-main-info">

                    <h3>
                        ${escapeHtml(lead.name || "بدون اسم")}
                    </h3>

                    <span>
                        ${escapeHtml(lead.phone || "بدون رقم")}
                    </span>

                </div>

                <span class="lead-date">
                    ${formatDate(lead.createdAt)}
                </span>

            </div>


            <div class="lead-card-info">

                <div>
                    <span>الإيميل</span>
                    <strong>
                        ${escapeHtml(lead.email || "—")}
                    </strong>
                </div>

                <div>
                    <span>نوع المشروع</span>
                    <strong>
                        ${escapeHtml(lead.projectType || "—")}
                    </strong>
                </div>

                <div>
                    <span>المنصة</span>
                    <strong>
                        ${escapeHtml(lead.platform || "—")}
                    </strong>
                </div>

            </div>


            <div class="lead-card-footer">

                <span>
                    ${lead.goals?.length || 0}
                    أهداف
                </span>

                <button
                    class="view-lead-btn"
                    data-id="${lead.id}">

                    عرض التفاصيل
                    <span>←</span>

                </button>

            </div>

        `;

    leadsContainer.appendChild(card);
  });

  document.querySelectorAll(".view-lead-btn").forEach((button) => {
    button.addEventListener("click", () => {
      const lead = allLeads.find((item) => item.id === button.dataset.id);

      if (lead) {
        openLeadModal(lead);
      }
    });
  });
}

// ======================================================
// MODAL
// ======================================================

function openLeadModal(lead) {
  leadDetails.innerHTML = `

        <div class="modal-heading">

            <span class="admin-label">
                CLIENT DETAILS
            </span>

            <h2>
                ${escapeHtml(lead.name || "بدون اسم")}
            </h2>

            <p>
                ${formatDateLong(lead.createdAt)}
            </p>

        </div>


        <div class="detail-section">

            <h3>
                بيانات التواصل
            </h3>

            <div class="detail-grid">

                ${detailItem("الاسم", lead.name)}

                ${detailItem("رقم الهاتف", lead.phone)}

                ${detailItem("الإيميل", lead.email)}

            </div>

        </div>


        <div class="detail-section">

            <h3>
                تفاصيل الفكرة
            </h3>

            <div class="detail-grid">

                ${detailItem("نوع المشروع", lead.projectType)}

                ${detailItem("الجمهور المستهدف", lead.audience)}

                ${detailItem("المنصة", lead.platform)}

                ${detailItem("الميزانية", lead.budget)}

            </div>

        </div>


        <div class="detail-section">

            <h3>
                المشكلة
            </h3>

            <div class="detail-long">
                ${escapeHtml(lead.problem || "—")}
            </div>

        </div>


        <div class="detail-section">

            <h3>
                الأهداف
            </h3>

            <div class="goals-list">

                ${
                  Array.isArray(lead.goals)
                    ? lead.goals
                        .map(
                          (goal) => `
                                <span>
                                    ${escapeHtml(goal)}
                                </span>
                            `,
                        )
                        .join("")
                    : "—"
                }

            </div>

        </div>


        <div class="detail-section">

            <h3>
                المرجع / مثال
            </h3>

            <div class="detail-long">

                ${lead.reference ? escapeHtml(lead.reference) : "مفيش"}

            </div>

        </div>

    `;

  leadModal.classList.add("active");

  document.body.style.overflow = "hidden";
}

function detailItem(label, value) {
  return `

        <div class="detail-item">

            <span>
                ${label}
            </span>

            <strong>
                ${escapeHtml(value || "—")}
            </strong>

        </div>

    `;
}

function closeLeadModal() {
  leadModal.classList.remove("active");

  document.body.style.overflow = "";
}

closeModal.addEventListener("click", closeLeadModal);

modalOverlay.addEventListener("click", closeLeadModal);

document.addEventListener("keydown", (event) => {
  if (event.key === "Escape") {
    closeLeadModal();
  }
});

// ======================================================
// LOGIN / DASHBOARD UI
// ======================================================

function showLogin() {
  loginPage.style.display = "flex";

  dashboardPage.style.display = "none";
}

function showDashboard() {
  loginPage.style.display = "none";

  dashboardPage.style.display = "block";
}

function showLoginError(message) {
  loginError.textContent = message;
}

// ======================================================
// DATE
// ======================================================

function formatDate(timestamp) {
  if (!timestamp) {
    return "غير معروف";
  }

  const date = timestamp.toDate ? timestamp.toDate() : new Date(timestamp);

  return date.toLocaleDateString("ar-EG", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
}

function formatDateLong(timestamp) {
  if (!timestamp) {
    return "التاريخ غير متوفر";
  }

  const date = timestamp.toDate ? timestamp.toDate() : new Date(timestamp);

  return date.toLocaleString("ar-EG", {
    dateStyle: "full",
    timeStyle: "short",
  });
}

// ======================================================
// HELPERS
// ======================================================

function getInitials(name) {
  if (!name) {
    return "؟";
  }

  return name
    .trim()
    .split(/\s+/)
    .slice(0, 2)
    .map((word) => word.charAt(0))
    .join("");
}

function escapeHtml(value) {
  return String(value)
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}
const themeToggle = document.getElementById("themeToggle");

themeToggle.addEventListener("click", () => {
  document.body.classList.toggle("light-theme");

  const isLight = document.body.classList.contains("light-theme");

  localStorage.setItem("admin-theme", isLight ? "light" : "dark");
});
const savedTheme = localStorage.getItem("admin-theme");

if (savedTheme === "light") {
  document.body.classList.add("light-theme");
}
