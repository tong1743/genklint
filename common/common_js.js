// 隨機說話
function getRandomWord() {
    const wordList = [
        "請大家支持克里姆特切腹因為這是日本版的榮譽的死亡",
        "說是決鬥但其實更像介錯",
        "賀！玄克里終於要出官方週邊了！",
        "我的同人女潔癖是只有玄真能殺死克里姆特",
        "我喜歡玄真的遺書中講他自己一生從沒有後悔二字",
        "亞雙義玄真的臉很常跳嚇到我和我朋友",
        "玄真唯二是有在笑的圖是跟他兒子的合照",
        "我在排版時看到玄真的立繪就想笑",
        "玄真的英文名叫Genshin（真的）",
        "圖設定中有玄真衝擊",
        "背頭男跟有兩根的背頭男落入大部分人的不舒適圈了",
    ];
    return wordList[Math.floor(Math.random() * wordList.length)];
}
var randomWord = document.querySelector('.random-word');
randomWord.textContent = getRandomWord();



// 返回頂部按鈕顯示/隱藏
var backToTopBtn = document.getElementById('backToTopBtn');
window.addEventListener('scroll', function () {
    if (window.scrollY > 150) {
        backToTopBtn.classList.add('visible');
    } else {
        backToTopBtn.classList.remove('visible');
    }
});
backToTopBtn.addEventListener('click', function () {
    window.scrollTo({
        top: 0,
        behavior: 'smooth'
    });
});

// 晚間模式切換
var darkModeBtn = document.getElementById('toggleDarkModeBtn');

function setDarkMode(on) {
    document.body.classList.toggle('dark-mode', on);
    darkModeBtn.textContent = on ? '☀  日間模式' : '☽  晚間模式';
}
darkModeBtn.addEventListener('click', function () {
    var isDark = document.body.classList.toggle('dark-mode');
    darkModeBtn.textContent = isDark ? '☀  日間模式' : '☽  晚間模式';
    try {
        localStorage.setItem('darkMode', isDark ? '1' : '0');
    } catch (e) { }
});
// 自動載入上次選擇
(function () {
    try {
        var saved = localStorage.getItem('darkMode');
        if (saved === '1') setDarkMode(true);
    } catch (e) { }
})();
// 側邊導覽列開關
var navMenuBtn = document.getElementById('navMenuBtn');
var sideNav = document.getElementById('sideNav');
var sideNavMask = document.querySelector('.side-nav-mask');

function setSideNavOpen(open) {
    if (open) {
        sideNav.classList.add('open');
    } else {
        sideNav.classList.remove('open');
    }
}
navMenuBtn.addEventListener('click', function () {
    var isOpen = sideNav.classList.contains('open');
    setSideNavOpen(!isOpen);
});
sideNavMask.addEventListener('click', function () {
    setSideNavOpen(false);
});
sideNav.querySelectorAll('a').forEach(function (link) {
    link.addEventListener('click', function () {
        setSideNavOpen(false);
    });
});

//點擊顯示劇透內容
var spoilerContent = document.querySelectorAll('.spoiler_content');
spoilerContent.forEach(spoiler_content => {
    spoiler_content.addEventListener("click", function () {
        spoiler_content.classList.add('clicked');
    });
});

