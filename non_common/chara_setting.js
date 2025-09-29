
// 氣泡彈窗動態定位
function adjustPopupPosition(e) {
    var popup = e.currentTarget;
    var before = popup;
    // 觸發 :before 的顯示
    popup.classList.add('js-popup-hover');
    setTimeout(function () {
        // 取得生成的 ::before
        var pseudo = window.getComputedStyle(popup, '::before');
        // 用 JS 取得 .content-box
        var contentBox = popup.closest('.content-box') || document.body;
        var popupRect = popup.getBoundingClientRect();
        var boxRect = contentBox.getBoundingClientRect();
        // 嘗試定位
        var beforeEl = document.createElement('div');
        beforeEl.style.width = '180px';
        beforeEl.style.maxWidth = '220px';
        beforeEl.textContent = popup.getAttribute('data-popup-content');
        document.body.appendChild(beforeEl);
        // 重新量測，確保換行後高度正確
        var beforeRect = beforeEl.getBoundingClientRect();
        // 預設右側
        var left = popupRect.right;
        var top = popupRect.top;
        // 先判斷右側空間
        var rightSpace = boxRect.right - popupRect.right;
        var leftSpace = popupRect.left - boxRect.left;
        var canShowRight = beforeRect.width <= rightSpace;
        var canShowLeft = beforeRect.width <= leftSpace;
        // 若下方超出
        if (top + beforeRect.height > boxRect.bottom) {
            // 若右側足夠，僅調整top
            if (canShowRight) {
                top = boxRect.bottom - beforeRect.height;
            } else if (canShowLeft) {
                // 否則左側有空間則顯示左側
                left = popupRect.left - beforeRect.width;
                top = boxRect.bottom - beforeRect.height;
            } else {
                // 兩側都不夠，盡量貼齊box
                left = boxRect.left;
                top = boxRect.bottom - beforeRect.height;
            }
        } else {
            // 下方沒超出，若右側不夠則考慮左側
            if (!canShowRight && canShowLeft) {
                left = popupRect.left - beforeRect.width;
            } else if (!canShowRight && !canShowLeft) {
                left = boxRect.left;
            }
        }
        // 邊界修正
        if (top < boxRect.top) top = boxRect.top;
        if (left < boxRect.left) left = boxRect.left;
        beforeEl.remove();
        // 設定 CSS 變數
        popup.style.setProperty('--popup-left', (left - popupRect.left) + 'px');
        popup.style.setProperty('--popup-top', (top - popupRect.top) + 'px');
    }, 10);
}

function resetPopupPosition(e) {
    var popup = e.currentTarget;
    popup.classList.remove('js-popup-hover');
    popup.style.removeProperty('--popup-left');
    popup.style.removeProperty('--popup-top');
}
document.querySelectorAll('.popup').forEach(function (el) {
    // 將原本的內容移到 data-popup-content
    if (el.classList.contains('popup1')) {
        el.setAttribute('data-popup-content', '指的是自己的老婆和女兒。\n當時他的老婆即將分娩，他托付玄真找人接生與照顧自己的女兒，並且不希望他人知道她的身份，以免被自己連累。\n最後女兒被福爾摩斯收養，取名為愛麗絲．華生。');
    } else if (el.classList.contains('popup2')) {
        el.setAttribute('data-popup-content', '除了思考的意思，也指需要轉動刀的頭腦（指刀柄的頂端），該處藏有克里姆特的遺書。');
    } else if (el.classList.contains('popup3')) {
        el.setAttribute('data-popup-content', '這句的英譯文本為「願你在每次吞嚥時，都能感受到野獸的尖牙扺在你的喉嚨上」。\n個人覺得更符合克里姆特。');
    } else if (el.classList.contains('popup4')) {
        el.setAttribute('data-popup-content', '這句的英譯文本增加了一句「那是一份我不值得擁有的榮譽」。');
    }
    el.addEventListener('mouseenter', adjustPopupPosition);
    el.addEventListener('mouseleave', resetPopupPosition);
    el.addEventListener('touchstart', adjustPopupPosition);
    el.addEventListener('touchend', resetPopupPosition);
});


// 收合區塊
document.addEventListener('DOMContentLoaded', function () {
    document.querySelectorAll('.collapse-box').forEach(function (box) {
        var btn = box.querySelector('.collapse-header');
        btn.addEventListener('click', function () {
            box.classList.toggle('open');
        });
    });
});
