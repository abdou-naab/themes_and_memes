function activateSelect(b) {
  const btn = document.querySelector("#avatars-show .bb.save");
  if (b) {
    btn.disabled = false;
    btn.ariaDisabled = false;
    btn.style.cssText = "";
  } else {
    btn.disabled = true;
    btn.ariaDisabled = true;
    btn.style.cssText = "border: 3px solid var(--shadow); color:var(--shadow)";
  }
}
const attachAutoDirection = (elm) => {
  // for the p elements
  var rtl = /[\u0591-\u07FF\uFB1D-\uFDFD\uFE70-\uFEFC]/;
  if (rtl.test(elm.textContent)) {
    elm.style.direction = "rtl";
  } else {
    elm.style.direction = "ltr";
  }
  elm.addEventListener("keyup", function () {
    if (rtl.test(this.value)) {
      this.style.direction = "rtl";
    } else {
      this.style.direction = "ltr";
    }
  });
};

try {
  const allMessageSubjects = document.querySelectorAll(
    ".messages .message p.subject"
  );
  const allMessageContent = document.querySelectorAll(
    ".messages .message p.content"
  );
  allMessageSubjects.forEach((s) => attachAutoDirection(s));
  allMessageContent.forEach((c) => attachAutoDirection(c));
} catch ({ name, message }) {
  console.info("");
}

try {
  const sub = document.querySelector(
    ".message.add-msg form input[name='subject']"
  );
  const ta = document.querySelector(
    ".message.add-msg form textarea[name='content']"
  );
  attachAutoDirection(sub);
  attachAutoDirection(ta);
} catch ({ name, message }) {
  console.info("");
}

try {
  document.addEventListener("click", (e) => {
    const dropdown = document.getElementById("user-acc-dropdown");
    if (!dropdown.contains(e.target)) {
      dropdown.classList.remove("shown");
    }
  });
  document
    .querySelector("nav .acc-in-header")
    .addEventListener("click", (e) => {
      document.getElementById("user-acc-dropdown").classList.toggle("shown");
      e.stopPropagation();
    });
} catch ({ name, message }) {
  console.info("do you have a profile");
}
try {
  document.getElementById("choose_avatar").addEventListener("click", (e) => {
    e.preventDefault();
    document.getElementById("avatars-show").style.display = "block";
    const images = document.querySelectorAll("#avatars-show img");
    activateSelect(false);
    images.forEach((img) => {
      img.addEventListener("click", () => {
        activateSelect(true);
        img.style.filter = "";
        images.forEach((other_img) => {
          if (other_img != img) {
            other_img.style.filter = "grayscale(1) blur(1px) contrast(0.5)";
            other_img.classList.remove("selected");
          } else other_img.classList.add("selected");
        });
      });
    });
  });
  document
    .querySelector("#avatars-show .bb.save")
    .addEventListener("click", () => {
      const selectedImg = document.querySelector("#avatars-show img.selected");
      const signup_form_field = document.getElementById("avatar_id_in");
      if (selectedImg) {
        if (signup_form_field) {
          signup_form_field.value = selectedImg.dataset.avatar_id;
          document.getElementById("avatars-show").style.display = "none";
        } else {
          fetch("/update-avatar", {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
            },
            body: JSON.stringify({ avatar_id: selectedImg.dataset.avatar_id }),
          }).then(() => {
            location.reload();
          });
        }
      }
    });
  document
    .querySelector("#avatars-show .bb.skip")
    .addEventListener("click", () => {
      const images = document.querySelectorAll("#avatars-show img");
      images.forEach((img) => {
        img.style.filter = "";
      });
      document.getElementById("avatars-show").style.display = "none";
    });
} catch ({ name, message }) {
  console.info("you have to signup/login.");
}
