// ===== 기본 상수 설정 =====
const USER_KEY       = "charityAuctionUser";    // 현재 로그인한 유저 정보
const USERS_LIST_KEY = "charityAuctionUsers";   // 전체 가입자 목록
const CATALOG_URL    = "catalog.html";          // 참여자용 페이지
const ADMIN_URL      = "admin.html";            // 관리자용 페이지

// ===== EmailJS 설정 (관리자에게 가입 메일 보내기 용도) =====
// EmailJS 가입 후 발급받은 값으로 교체해 주세요.
const EMAILJS_PUBLIC_KEY  = "YOUR_PUBLIC_KEY";
const EMAILJS_SERVICE_ID  = "YOUR_SERVICE_ID";
const EMAILJS_TEMPLATE_ID = "YOUR_TEMPLATE_ID";
// 템플릿 안에서 to_email(관리자 메일)은 고정으로 넣어두는 것을 추천드립니다.

// EmailJS 초기화 (스크립트 로드 여부 체크)
if (typeof emailjs !== "undefined") {
  try {
    emailjs.init(EMAILJS_PUBLIC_KEY);
  } catch (e) {
    console.warn("EmailJS init 실패:", e);
  }
} else {
  console.warn("EmailJS SDK가 로드되지 않았습니다. 가입 알림 메일은 전송되지 않습니다.");
}

// ===== 유틸 함수 =====

// 현재 로그인 유저 읽기
function loadCurrentUser() {
  const raw = localStorage.getItem(USER_KEY);
  if (!raw) return null;
  try {
    return JSON.parse(raw);
  } catch {
    return null;
  }
}

// 현재 로그인 유저 삭제 (로그아웃용)
// -> 정보 삭제가 아니라 isLoggedIn 플래그만 false로 전환
function clearCurrentUser() {
  const raw = localStorage.getItem(USER_KEY);
  if (!raw) return;
  try {
    const user = JSON.parse(raw) || {};
    user.isLoggedIn = false;
    localStorage.setItem(USER_KEY, JSON.stringify(user));
  } catch {
    // 파싱에 실패하면 어쩔 수 없이 삭제
    localStorage.removeItem(USER_KEY);
  }
}

// 전체 가입자 목록 읽기
function loadUsersList() {
  const raw = localStorage.getItem(USERS_LIST_KEY);
  if (!raw) return [];
  try {
    return JSON.parse(raw) || [];
  } catch {
    return [];
  }
}

// 전체 가입자 목록 저장
function saveUsersList(list) {
  localStorage.setItem(USERS_LIST_KEY, JSON.stringify(list));
}

// 관리자에게 "새 참여자 가입" 메일 보내기
// user: { email, password, role, joinedAt, nickname, ... }
function sendRegistrationEmailToAdmin(user) {
  // EmailJS가 없으면 그냥 통과
  if (typeof emailjs === "undefined") {
    console.warn("EmailJS 미구현 상태 - 관리자 알림 메일은 전송되지 않습니다.");
    return Promise.resolve();
  }

  // 템플릿에 맞게 필요한 값 전달 (변수명은 EmailJS 템플릿에서 사용하는 이름과 맞추셔야 합니다.)
  const templateParams = {
    user_email:    user.email,
    user_password: user.password || "",
    user_role:     user.role || "participant",
    joined_at:     user.joinedAt || new Date().toISOString(),
    user_nickname: user.nickname || ""
    // 필요하면 추가 정보도 넘길 수 있습니다.
  };

  return emailjs.send(EMAILJS_SERVICE_ID, EMAILJS_TEMPLATE_ID, templateParams);
}

// 역할에 따라 페이지 이동
function redirectAfterLogin(user) {
  if (!user || !user.role) {
    // 기본은 참여자 페이지로 이동
    window.location.href = CATALOG_URL;
    return;
  }

  if (user.role === "admin") {
    window.location.href = ADMIN_URL;
  } else {
    // 기본: participant, 혹은 기타
    window.location.href = CATALOG_URL;
  }
}

// ===== 핵심 함수: 사용자 저장 + 가입자 목록 관리 + 관리자 알림 =====
/**
 * user 예시:
 * {
 *   email: "aaa@hansae.co.kr",
 *   password: "123456",
 *   nickname: "홍길동",
 *   role: "participant" 또는 "admin",
 *   isLoggedIn: true / false (옵션)
 * }
 *
 * - 신규 가입 시: email, password, nickname, role, isLoggedIn:true 정도를 넘김
 * - 로그인 시:   email, password, role 정도만 넘겨도
 *                기존에 저장된 nickname / joinedAt / 기타정보를 함께 복원해 줌
 */
function saveCurrentUser(user) {
  if (!user || !user.email) {
    console.warn("saveCurrentUser 호출 시 user.email이 없습니다.", user);
    return;
  }

  let list = loadUsersList();
  const now = new Date().toISOString();
  let isNewUser = false;

  const idx = list.findIndex(u => u.email === user.email);
  const prevFromList = (idx === -1) ? null : list[idx];

  // 기존 가입 정보와 이번에 들어온 user 정보를 머지해서
  // USER_KEY에 저장할 최종 프로필 구성
  const mergedUser = {
    // 공통 필수
    email: user.email,

    // role: 새 값(user.role) > 이전 값(prevFromList.role) > 기본값 "participant"
    role:
      user.role ||
      (prevFromList && prevFromList.role) ||
      "participant",

    // password: 새 값(user.password) > 이전 값(prevFromList.password) > ""
    password:
      (user.password !== undefined)
        ? user.password
        : ((prevFromList && prevFromList.password) || ""),

    // nickname: 새 값(user.nickname) > 이전 값(prevFromList.nickname) > ""
    nickname:
      (user.nickname !== undefined)
        ? user.nickname
        : ((prevFromList && prevFromList.nickname) || ""),

    // joinedAt: 이전에 있던 값 > 이번에 넘겨준 값 > 지금 시각
    joinedAt:
      (prevFromList && prevFromList.joinedAt) ||
      user.joinedAt ||
      now,

    // 로그인 상태: saveCurrentUser를 호출하면 기본적으로 로그인된 상태로 간주
    // (user.isLoggedIn이 false로 명시되면 false로도 설정 가능)
    isLoggedIn: (user.isLoggedIn === false) ? false : true
  };

  // 1) 현재 로그인 유저 정보(USER_KEY)에 저장
  localStorage.setItem(USER_KEY, JSON.stringify(mergedUser));

  // 2) 가입자 리스트(USERS_LIST_KEY) 업데이트용 엔트리 (isLoggedIn은 저장하지 않음)
  const listEntry = {
    email:   mergedUser.email,
    password: mergedUser.password,
    nickname: mergedUser.nickname,
    role:    mergedUser.role,
    joinedAt: mergedUser.joinedAt
  };

  if (idx === -1) {
    // 새 가입자
    isNewUser = true;
    list.push(listEntry);
  } else {
    // 기존 가입자 정보 업데이트 (비밀번호/닉네임 변경 반영)
    list[idx] = {
      ...list[idx],
      ...listEntry
    };
  }

  saveUsersList(list);

  // 3) "새 참여자"가 가입한 경우에만 관리자에게 알림 메일 발송
  if (isNewUser && (mergedUser.role === "participant" || !mergedUser.role)) {
    const mailUser = {
      email:    mergedUser.email,
      password: mergedUser.password,
      role:     mergedUser.role,
      nickname: mergedUser.nickname,
      joinedAt: mergedUser.joinedAt
    };

    sendRegistrationEmailToAdmin(mailUser)
      .then(() => {
        console.log("관리자에게 신규 가입 알림 메일 전송 성공:", mailUser.email);
      })
      .catch(err => {
        console.error("관리자 알림 메일 전송 실패:", err);
      });
  }
}
