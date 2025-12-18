const express = require("express");
const session = require("express-session");
const path = require("path");
const { createClient } = require("@supabase/supabase-js");

const app = express();
const PORT = process.env.PORT || 8080;

// =========================
// Supabase
// =========================
const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

// =========================
// 기본 설정
// =========================
app.set("trust proxy", 1);
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// =========================
// 세션
// =========================
app.use(
  session({
    secret: process.env.SESSION_SECRET || "revrun-secret",
    resave: false,
    saveUninitialized: false,
    cookie: {
      httpOnly: true,
      secure: false,
      sameSite: "lax",
      maxAge: 1000 * 60 * 60 * 6,
    },
  })
);

// =========================
// 정적 파일
// =========================
app.use(express.static(path.join(__dirname, "public")));

// =========================
// 계정 (테스트용)
// =========================
const USERS = [
  { username: "admin", password: "dnflwlq132", name: "관리자", role: "admin" },
  { username: "client1", password: "dnflwlq132", name: "김도헌", role: "client" },
  { username: "client2", password: "dnflwlq132", name: "문세음", role: "client" },
];

// =========================
// 가드
// =========================
app.use("/report", (req, res, next) => {
  if (req.path === "/login.html") return next();
  if (!req.session.user) return res.redirect("/report/login.html");
  next();
});

app.use("/admin", (req, res, next) => {
  if (!req.session.user || req.session.user.role !== "admin") {
    return res.redirect("/report/login.html");
  }
  next();
});

// =========================
// 로그인
// =========================
app.post("/api/login", (req, res) => {
  const { username, password } = req.body;

  const user = USERS.find(
    (u) => u.username === username && u.password === password
  );

  if (!user) {
    return res.status(401).json({
      ok: false,
      message: "아이디 또는 비밀번호가 일치하지 않습니다.",
    });
  }

  req.session.user = {
    username: user.username,
    name: user.name,
    role: user.role,
  };

  const redirect =
    user.role === "admin"
      ? "/admin/dashboard.html"
      : "/report/dashboard.html";

  res.json({ ok: true, redirect });
});

// =========================
// 로그인 정보
// =========================
app.get("/api/me", (req, res) => {
  if (!req.session.user) return res.status(401).json({ ok: false });
  res.json({ ok: true, user: req.session.user });
});

// =========================
// 리포트 (Supabase)
// =========================
app.get("/api/report", async (req, res) => {
  if (!req.session.user) return res.status(401).json({ ok: false });

  const { username, role, name } = req.session.user;

  if (role === "admin") {
    return res.json({
      ok: true,
      report: {
        clientName: "전체(샘플)",
        period: "최근 7일",
        kpis: [],
        highlights: ["관리자 샘플 화면"],
        actions: [],
      },
    });
  }

  const { data: user } = await supabase
    .from("users")
    .select("id, name")
    .eq("username", username)
    .single();

  if (!user) {
    return res.json({
      ok: true,
      report: {
        clientName: name,
        period: "-",
        kpis: [],
        highlights: ["유저 정보 없음"],
        actions: [],
      },
    });
  }

  const { data: report } = await supabase
    .from("reports")
    .select("period, kpis, highlights, actions")
    .eq("user_id", user.id)
    .order("created_at", { ascending: false })
    .limit(1)
    .single();

  if (!report) {
    return res.json({
      ok: true,
      report: {
        clientName: user.name,
        period: "-",
        kpis: [],
        highlights: ["리포트 데이터 없음"],
        actions: [],
      },
    });
  }

  res.json({
    ok: true,
    report: {
      clientName: user.name,
      period: report.period,
      kpis: report.kpis,
      highlights: report.highlights,
      actions: report.actions,
    },
  });
});

// =========================
// 로그아웃
// =========================
app.post("/api/logout", (req, res) => {
  req.session.destroy(() => {
    res.clearCookie("connect.sid");
    res.redirect("/report/login.html");
  });
});

// =========================
// 시작
// =========================
app.listen(PORT, () => {
  console.log("✅ Server running on port:", PORT);
});
