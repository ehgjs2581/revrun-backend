// ====== 로그인 동작 ======
const LOGIN_OK = {
  id: "admin",
  pw: "1234",
};

// 로그인 성공 시 이동할 페이지 (report 폴더 안)
const DASHBOARD_URL = "./dashboard.html";

document.addEventListener("DOMContentLoaded", () => {
  const form = document.getElementById("loginForm");
  if (!form) return;

  form.addEventListener("submit", (e) => {
    e.preventDefault();

    const id = document.getElementById("username")?.value?.trim() ?? "";
    const pw = document.getElementById("password")?.value ?? "";

    if (id === LOGIN_OK.id && pw === LOGIN_OK.pw) {
      window.location.href = DASHBOARD_URL;
      return;
    }

    alert("아이디 또는 비밀번호가 올바르지 않습니다.");
  });
});
