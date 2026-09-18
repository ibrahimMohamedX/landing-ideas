/* =========================================================
   YOUR BRAND — LANDING PAGE
   Vanilla JS + Firebase Firestore
   ========================================================= */

import { initializeApp } from "https://www.gstatic.com/firebasejs/11.10.0/firebase-app.js";

import {
  getFirestore,
  collection,
  addDoc,
  serverTimestamp,
} from "https://www.gstatic.com/firebasejs/11.10.0/firebase-firestore.js";

/* =========================================================
   1. FIREBASE CONFIG
   =========================================================
   Replace the values below with your Firebase project config.
   ========================================================= */

const firebaseConfig = {
  apiKey: "AIzaSyDGwJUOhj0SaPDY9p3a2SNtsp98yvjLorg",

  authDomain: "landing-ideas.firebaseapp.com",

  projectId: "landing-ideas",

  storageBucket: "landing-ideas.firebasestorage.app",

  messagingSenderId: "330248839293",

  appId: "1:330248839293:web:5907fc1c74557f225a1114",

  measurementId: "G-51CNHH1RM3",
};

/* =========================================================
   2. FIREBASE INITIALIZATION
   ========================================================= */

let db = null;

try {
  const app = initializeApp(firebaseConfig);

  db = getFirestore(app);
} catch (error) {
  console.error("Firebase initialization failed:", error);
}

/* =========================================================
   3. DOM
   ========================================================= */

const body = document.body;

const navbar = document.getElementById("navbar");

const themeToggle = document.getElementById("themeToggle");

const cursorGlow = document.getElementById("cursorGlow");

const pageLoader = document.getElementById("pageLoader");

const form = document.getElementById("ideaForm");

const progressBar = document.getElementById("progressBar");

const progressCurrent = document.getElementById("progressCurrent");

const progressTotal = document.getElementById("progressTotal");

const submitBtn = document.getElementById("submitBtn");

const formError = document.getElementById("formError");

const successSection = document.getElementById("successSection");

const whatsappBtn = document.getElementById("whatsappBtn");

const year = document.getElementById("year");

/* =========================================================
   4. GLOBAL STATE
   ========================================================= */

const TOTAL_STEPS = 8;

let currentStep = 1;

let submittedLead = null;

const ideaData = {
  projectType: "",

  audience: "",

  problem: "",

  goals: [],

  reference: "",

  platform: "",

  budget: "",

  name: "",

  phone: "",

  email: "",
};

/* =========================================================
   5. INITIALIZATION
   ========================================================= */

document.addEventListener("DOMContentLoaded", () => {
  setTimeout(() => {
    pageLoader.classList.add("loaded");
  }, 650);

  initializeTheme();

  initializeScroll();

  initializeRevealAnimations();

  initializeCursorGlow();

  initializeForm();

  initializeYear();
});

/* =========================================================
   6. THEME
   ========================================================= */

function initializeTheme() {
  const savedTheme = localStorage.getItem("landing-theme");

  const preferredTheme =
    savedTheme ||
    (window.matchMedia &&
    window.matchMedia("(prefers-color-scheme: light)").matches
      ? "light"
      : "dark");

  setTheme(preferredTheme);

  themeToggle.addEventListener("click", () => {
    const current = body.dataset.theme || "dark";

    const next = current === "dark" ? "light" : "dark";

    setTheme(next);
  });
}

function setTheme(theme) {
  body.dataset.theme = theme;

  localStorage.setItem("landing-theme", theme);

  const icon = themeToggle.querySelector(".theme-icon");

  if (icon) {
    icon.textContent = theme === "dark" ? "☀" : "☾";
  }
}

/* =========================================================
   7. NAVBAR / SCROLL
   ========================================================= */

function initializeScroll() {
  window.addEventListener(
    "scroll",
    () => {
      navbar.classList.toggle("scrolled", window.scrollY > 30);
    },
    { passive: true },
  );

  document.querySelectorAll("[data-scroll-to]").forEach((button) => {
    button.addEventListener("click", () => {
      const targetId = button.dataset.scrollTo;

      const target = document.getElementById(targetId);

      if (!target) return;

      target.scrollIntoView({
        behavior: "smooth",
        block: "start",
      });
    });
  });
}

/* =========================================================
   8. REVEAL ANIMATIONS
   ========================================================= */

function initializeRevealAnimations() {
  const elements = document.querySelectorAll(".reveal");

  if (!("IntersectionObserver" in window)) {
    elements.forEach((element) => element.classList.add("visible"));

    return;
  }

  const observer = new IntersectionObserver(
    (entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          entry.target.classList.add("visible");

          observer.unobserve(entry.target);
        }
      });
    },
    {
      threshold: 0.12,
      rootMargin: "0px 0px -50px 0px",
    },
  );

  elements.forEach((element) => observer.observe(element));
}

/* =========================================================
   9. CURSOR GLOW
   ========================================================= */

function initializeCursorGlow() {
  if (window.matchMedia("(pointer: coarse)").matches) {
    cursorGlow.style.display = "none";

    return;
  }

  window.addEventListener("pointermove", (event) => {
    cursorGlow.animate(
      {
        left: `${event.clientX}px`,
        top: `${event.clientY}px`,
      },
      {
        duration: 500,
        fill: "forwards",
      },
    );
  });
}

/* =========================================================
   10. FORM
   ========================================================= */

function initializeForm() {
  progressTotal.textContent = TOTAL_STEPS;

  /* Single-selection options */

  document.querySelectorAll(".option:not(.multi)").forEach((option) => {
    option.addEventListener("click", () => {
      const field = option.dataset.field;

      const value = option.dataset.value;

      if (!field) return;

      document
        .querySelectorAll(`.option[data-field="${field}"]`)
        .forEach((item) => {
          item.classList.remove("selected");
        });

      option.classList.add("selected");

      ideaData[field] = value;

      /*
            Automatically advance
            for quick choice questions.
          */

      if (currentStep === 1 || currentStep === 2 || currentStep === 6) {
        setTimeout(nextStep, 220);
      }
    });
  });

  /* Multi-selection */

  document.querySelectorAll(".option.multi").forEach((option) => {
    option.addEventListener("click", () => {
      const value = option.dataset.value;

      option.classList.toggle("selected");

      if (option.classList.contains("selected")) {
        if (!ideaData.goals.includes(value)) {
          ideaData.goals.push(value);
        }
      } else {
        ideaData.goals = ideaData.goals.filter((item) => item !== value);
      }
    });
  });

  /* Next buttons */

  document.querySelectorAll(".next-btn").forEach((button) => {
    button.addEventListener("click", () => {
      if (validateCurrentStep()) {
        saveCurrentStep();

        nextStep();
      }
    });
  });

  /* Back buttons */

  document.querySelectorAll(".back-btn").forEach((button) => {
    button.addEventListener("click", previousStep);
  });

  /* Form submit */

  form.addEventListener("submit", handleSubmit);
}

/* =========================================================
   11. STEP NAVIGATION
   ========================================================= */

function nextStep() {
  if (currentStep >= TOTAL_STEPS) {
    return;
  }

  currentStep++;

  showStep(currentStep);
}

function previousStep() {
  if (currentStep <= 1) {
    return;
  }

  currentStep--;

  showStep(currentStep);
}

function showStep(step) {
  document.querySelectorAll(".form-step").forEach((formStep) => {
    formStep.classList.toggle("active", Number(formStep.dataset.step) === step);
  });

  progressCurrent.textContent = step;

  progressBar.style.width = `${(step / TOTAL_STEPS) * 100}%`;

  const brief = document.querySelector(".brief-wrapper");

  if (brief) {
    brief.scrollIntoView({
      behavior: "smooth",
      block: "start",
    });
  }

  formError.textContent = "";
}

/* =========================================================
   12. VALIDATION
   ========================================================= */

function validateCurrentStep() {
  formError.textContent = "";

  if (currentStep === 1) {
    if (!ideaData.projectType) {
      showError("اختار أقرب حاجة لفكرتك الأول 👀");

      return false;
    }
  }

  if (currentStep === 2) {
    if (!ideaData.audience) {
      showError("اختار مين المفروض يستخدم الفكرة.");

      return false;
    }
  }

  if (currentStep === 3) {
    const problem = document.getElementById("problem").value.trim();

    if (problem.length < 10) {
      showError("احكيلنا عنها شوية أكتر... حتى لو بطريقتك 😄");

      return false;
    }
  }

  if (currentStep === 4) {
    if (ideaData.goals.length === 0) {
      showError("اختار حاجة واحدة على الأقل.");

      return false;
    }
  }

  if (currentStep === 6) {
    if (!ideaData.platform) {
      showError("اختار أي حاجة أقرب لتصورك.");

      return false;
    }
  }

  if (currentStep === 8) {
    const name = document.getElementById("name").value.trim();

    const phone = document.getElementById("phone").value.trim();

    if (name.length < 2) {
      showError("اكتب اسمك عشان نعرف نناديك بيه ❤️");

      return false;
    }

    if (!isValidEgyptianPhone(phone)) {
      showError("اكتب رقم موبايل مصري صحيح.");

      return false;
    }
  }

  return true;
}

function showError(message) {
  formError.textContent = message;

  formError.animate(
    [
      {
        transform: "translateX(0)",
      },
      {
        transform: "translateX(-6px)",
      },
      {
        transform: "translateX(6px)",
      },
      {
        transform: "translateX(0)",
      },
    ],
    {
      duration: 280,
    },
  );
}

function isValidEgyptianPhone(phone) {
  const normalized = phone.replace(/[\s-]/g, "");

  return /^(01)[0-25][0-9]{8}$/.test(normalized);
}

/* =========================================================
   13. SAVE CURRENT STEP
   ========================================================= */

function saveCurrentStep() {
  if (currentStep === 3) {
    ideaData.problem = document.getElementById("problem").value.trim();
  }

  if (currentStep === 5) {
    ideaData.reference = document.getElementById("reference").value.trim();
  }

  if (currentStep === 8) {
    ideaData.name = document.getElementById("name").value.trim();

    ideaData.phone = document.getElementById("phone").value.trim();

    ideaData.email = document.getElementById("email").value.trim();
  }
}

/* =========================================================
   14. SUBMIT
   ========================================================= */

async function handleSubmit(event) {
  event.preventDefault();

  if (!validateCurrentStep()) {
    return;
  }

  saveCurrentStep();

  setSubmitLoading(true);

  try {
    if (!db) {
      throw new Error("Firebase is not configured.");
    }

    const lead = {
      projectType: ideaData.projectType,

      audience: ideaData.audience,

      problem: ideaData.problem,

      goals: ideaData.goals,

      reference: ideaData.reference || null,

      platform: ideaData.platform,

      budget: ideaData.budget || null,

      name: ideaData.name,

      phone: ideaData.phone,

      email: ideaData.email || null,

      source: "landing_page",

      createdAt: serverTimestamp(),

      userAgent: navigator.userAgent,

      language: navigator.language,
    };

    const docRef = await addDoc(collection(db, "leads"), lead);

    submittedLead = {
      ...ideaData,

      id: docRef.id,
    };

    showSuccess();
  } catch (error) {
    console.error("Lead submission error:", error);

    showError("حصلت مشكلة بسيطة وإحنا بنبعت البيانات. جرّب تاني.");
  } finally {
    setSubmitLoading(false);
  }
}

/* =========================================================
   15. LOADING
   ========================================================= */

function setSubmitLoading(loading) {
  submitBtn.classList.toggle("loading", loading);

  submitBtn.disabled = loading;
}

/* =========================================================
   16. SUCCESS
   ========================================================= */

function showSuccess() {
  const brief = document.querySelector(".brief-section");

  brief.style.display = "none";

  successSection.classList.add("visible");

  successSection.scrollIntoView({
    behavior: "smooth",
    block: "center",
  });
}

/* =========================================================
   17. WHATSAPP
   ========================================================= */

whatsappBtn.addEventListener("click", () => {
  if (!submittedLead) {
    return;
  }

  const name = submittedLead.name;

  const phone = submittedLead.phone;

  const email = submittedLead.email;

  let message = `مساء الخير معاك: ${name}\n` + `ده رقمي: ${phone}\n`;

  if (email) {
    message += `وده الايميل بتاعي: ${email}\n`;
  }

  message += `أنا بعتلكوا التصور ومستني النتيجة`;

  const whatsappNumber = "201555686164";

  const url = `https://wa.me/${whatsappNumber}?text=${encodeURIComponent(message)}`;

  window.open(url, "_blank", "noopener,noreferrer");
});

/* =========================================================
   18. YEAR
   ========================================================= */

function initializeYear() {
  year.textContent = new Date().getFullYear();
}

/* =========================================================
   END
   ========================================================= */
