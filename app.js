// 입찰 기능 (로컬 연습용)
const currentPriceEl = document.getElementById("current-price");
const bidAmountInput = document.getElementById("bid-amount");
const bidButton = document.getElementById("bid-button");

bidButton.addEventListener("click", () => {
  const currentPrice = Number(currentPriceEl.textContent.replace(/,/g, ""));
  const bidAmount = Number(bidAmountInput.value);

  if (!bidAmount) {
    alert("입찰가를 입력해 주세요.");
    return;
  }

  if (bidAmount <= currentPrice) {
    alert("현재 가격보다 높은 금액을 입력해야 합니다.");
    return;
  }

  currentPriceEl.textContent = bidAmount.toLocaleString();
  alert(`입찰이 반영되었습니다. (연습용, 새로고침 시 초기화)`);
  bidAmountInput.value = "";
});

// 댓글 기능 (로컬 연습용)
const commentListEl = document.getElementById("comment-list");
const commentNicknameInput = document.getElementById("comment-nickname");
const commentTextInput = document.getElementById("comment-text");
const commentButton = document.getElementById("comment-button");

commentButton.addEventListener("click", () => {
  const nickname = commentNicknameInput.value.trim() || "익명";
  const text = commentTextInput.value.trim();

  if (!text) {
    alert("댓글 내용을 입력해 주세요.");
    return;
  }

  const commentEl = document.createElement("div");
  commentEl.className = "comment";
  commentEl.innerHTML = `
    <span class="nickname">${nickname}</span>
    <span class="text">${text}</span>
  `;
  commentListEl.appendChild(commentEl);

  commentTextInput.value = "";
});
