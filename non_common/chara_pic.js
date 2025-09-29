function sleep(ms) {
    return new Promise(resolve => setTimeout(resolve, ms))
}
// 服裝配置
const outfitConfig = {
    'genshin': {
        outfits: ['daily', 'paro', 'other'],
        names: ['日常服', 'PARO', '其他']
    },
    'klint': {
        outfits: ['daily', 'paro', 'other'],
        names: ['日常服', 'PARO', '其他']
    },
};

// 追蹤每個角色的當前服裝
let currentOutfits = {
    'genshin': 0,
    'klint': 0,
};

// 模態視窗變數
let slideIndex = 1;
let zoomLevel = 1;
let isZoomed = false;
let isDragging = false;
let startX, startY, translateX = 0,translateY = 0;
let currentImageElement = null; // 追蹤當前圖片元素
let currentOriginalSrc = ''; // 追蹤原始圖片來源
let downloadTooltipTimeout = null; // 提示計時器

// 服裝切換函數
function changeOutfit(characterId, direction) {
    const config = outfitConfig[characterId];
    const currentIndex = currentOutfits[characterId];
    const newIndex = (currentIndex + direction + config.outfits.length) % config.outfits.length;

    currentOutfits[characterId] = newIndex;

    // 更新指示器
    const indicator = document.getElementById(`outfit-indicator-${characterId.replace('character-', '')}`);
    indicator.textContent = config.names[newIndex];

    // 更新按鈕狀態
    updateOutfitButtons(characterId);

    // 切換圖片
    switchImages(characterId, config.outfits[newIndex]);
}

// 更新服裝按鈕狀態
function updateOutfitButtons(characterId) {
    const config = outfitConfig[characterId];
    const currentIndex = currentOutfits[characterId];

    const prevBtn = document.querySelector(`[data-character="${characterId}"] .outfit-prev`);
    const nextBtn = document.querySelector(`[data-character="${characterId}"] .outfit-next`);

    // 所有按鈕都可用（循環切換）
    prevBtn.disabled = false;
    nextBtn.disabled = false;
}

// 切換圖片顯示
function switchImages(characterId, outfitType) {
    const imagesContainer = document.getElementById(`${characterId}-images`);
    const imageItems = imagesContainer.querySelectorAll('.image-item');

    imageItems.forEach(item => {
        if (item.dataset.outfit === outfitType) {
            item.classList.remove('hidden');
        } else {
            item.classList.add('hidden');
        }
    });

    // 重新綁定事件
    bindImageClickEvents();
}

// 打開模態視窗
async function openModal(slideNumber) {
    document.getElementById('imageModal').style.display = 'block';
    document.body.style.overflow = 'hidden';

    var imageContainer = document.getElementById('modalImageContainer');
    if (imageContainer) imageContainer.classList.add('prepare');
    // 隱藏 navMenuBtn
    var navMenuBtn = document.getElementById('navMenuBtn');
    if (navMenuBtn) navMenuBtn.classList.add('hidden');
    // 隱藏 backToTopBtn
    var backToTopBtn = document.getElementById('backToTopBtn');
    if (backToTopBtn) backToTopBtn.classList.add('hidden');
    // 重置縮放和位置
    // 等待圖片載入完成
    slideIndex = slideNumber;
    showSlides(slideNumber);
    await sleep(500);
    resetZoom();
    imageContainer.classList.remove('prepare')
}

// 關閉模態視窗
function closeModal() {
    document.getElementById('imageModal').style.display = 'none';
    document.body.style.overflow = 'auto';
    // 顯示 navMenuBtn
    var navMenuBtn = document.getElementById('navMenuBtn');
    if (navMenuBtn) navMenuBtn.classList.remove('hidden');
    // 顯示 backToTopBtn
    var backToTopBtn = document.getElementById('backToTopBtn');
    if (backToTopBtn) backToTopBtn.classList.remove('hidden');
    slideIndex = 1;
    resetZoom();
    // 重置拖拽狀態
    isDragging = false;
    currentImageElement = null;
    currentOriginalSrc = ''; // 清除原始圖片來源
    updateDownloadButton(); // 禁用下載按鈕
}

// 顯示指定幻燈片
function currentSlide(n) {
    showSlides(slideIndex = n);
}

// 切換幻燈片
function plusSlides(n) {
    const totalSlides = document.querySelectorAll('.image-item[data-slide]').length;
    slideIndex = slideIndex + n;
    if (slideIndex > totalSlides) {
        slideIndex = 1
    }
    if (slideIndex < 1) {
        slideIndex = totalSlides
    }
    showSlides(slideIndex);
    resetZoom(); // 切換圖片時重置縮放
}

// 在 showSlides 函數中修改圖片創建部分
function showSlides(n) {
    const modalImg = document.getElementById('modalImg');
    const captionText = document.getElementById('caption');
    const imageContainer = document.getElementById('modalImageContainer');
    const prevBtn = document.querySelector('.modal-prev');
    const nextBtn = document.querySelector('.modal-next');

    // 找到對應的圖片元素
    const allImageItems = document.querySelectorAll('.image-item[data-slide]');
    const targetItem = Array.from(allImageItems).find(item => parseInt(item.dataset.slide) === n);

    if (targetItem) {
        const imgElement = targetItem.querySelector('img');

        // 清空容器
        imageContainer.innerHTML = '';

        if (imgElement && imgElement.src) {
            // 顯示真實圖片
            const img = document.createElement('img');
            img.src = imgElement.src;
            img.alt = imgElement.alt;
            img.dataset.caption = imgElement.dataset.caption;
            currentOriginalSrc = imgElement.getAttribute('data-original-src') // 儲存原始來源


            // 等待圖片載入完成
            img.onload = function () {
                updateDownloadButton(); // 圖片載入後啟用下載按鈕
            };
            img.onerror = function () {
                currentOriginalSrc = ''; // 載入失敗時清除來源
                updateDownloadButton();
            };

            imageContainer.appendChild(img);
            captionText.textContent = imgElement.dataset.caption || imgElement.alt;

            // 儲存當前圖片元素引用
            currentImageElement = img;

            // 綁定事件 - 使用新的拖拽邏輯
            bindImageEvents(img);
        }

        // 更新按鈕狀態
        prevBtn.disabled = n === 1;
        nextBtn.disabled = n === allImageItems.length;

        // 重置縮放狀態
        imageContainer.classList.remove('zoomed');
        isZoomed = false;
        zoomLevel = 1;
        translateX = 0;
        translateY = 0;
        imageContainer.style.transform = 'scale(1) translate(0px, 0px)';

        // 強制圖片自適應
        var img = imageContainer.querySelector('img');
        if (img) {
            img.style.maxWidth = '100%';
            img.style.maxHeight = '100%';
            img.style.width = 'auto';
            img.style.height = 'auto';
        }

        // 初始狀態更新下載按鈕
        updateDownloadButton();
    }
}

// 顯示下載提示
function showDownloadTooltip(message, duration = 2000) {
    const tooltip = document.getElementById('downloadTooltip');
    tooltip.textContent = message;

    // 清除之前的計時器
    if (downloadTooltipTimeout) {
        clearTimeout(downloadTooltipTimeout);
    }

    // 顯示提示
    tooltip.classList.add('show');

    // 計算位置（顯示在下載按鈕上方）
    const downloadBtn = document.getElementById('downloadOriginal');
    if (downloadBtn) {
        const rect = downloadBtn.getBoundingClientRect();
        tooltip.style.left = rect.left + (rect.width / 2) + 'px';
        tooltip.style.top = (rect.top - 10) + 'px';
        tooltip.style.transform = 'translateX(-50%)';
    }

    // 隱藏提示
    downloadTooltipTimeout = setTimeout(() => {
        tooltip.classList.remove('show');
    }, duration);
}

// 啟用/禁用下載按鈕
function updateDownloadButton() {
    const downloadBtn = document.getElementById('downloadOriginal');
    const currentImg = document.querySelector('#modalImageContainer img');

    if (currentImg && currentImg.src && currentImg.src !== '' && currentOriginalSrc) {
        downloadBtn.disabled = false;
        downloadBtn.title = `下載原始尺寸圖片 (${currentOriginalSrc.split('/').pop() || 'image.png'})`;
    } else {
        downloadBtn.disabled = true;
        downloadBtn.title = '下載原始尺寸圖片';
    }
}
// 下載原始尺寸圖片
function downloadOriginalImage() {
    if (!currentOriginalSrc) {
        showDownloadTooltip('無圖片可下載');
        return;
    }

    // 獲取圖片副檔名
    const urlParts = currentOriginalSrc.split('.');
    const extension = urlParts[urlParts.length - 1].split('?')[0] || 'png';
    const fileName = `image_${Date.now()}.${extension}`;

    const link = document.createElement('a');
    link.href = currentOriginalSrc;
    link.download = fileName;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);

    showDownloadTooltip(`"${fileName}" 下載完成`);
}

// 綁定圖片事件
function bindImageEvents(img) {
    // 雙擊縮放
    img.addEventListener('dblclick', function (e) {
        e.preventDefault();
        e.stopPropagation();
        if (zoomLevel > 1) {
            resetZoom();
        } else {
            zoomIn();
        }
    });

    // 滑鼠滾輪縮放
    img.addEventListener('wheel', function (e) {
        e.preventDefault();
        e.stopPropagation();
        if (e.deltaY < 0) {
            zoomIn();
        } else {
            zoomOut();
        }
    });

    // 開始拖拽
    img.addEventListener('mousedown', function (e) {
        e.preventDefault();
        startDrag(e);
    });

    // 觸控支持
    let initialDistance = 0;
    img.addEventListener('touchstart', function (e) {
        if (e.touches.length === 2) {
            e.preventDefault();
            initialDistance = Math.hypot(
                e.touches[0].clientX - e.touches[1].clientX,
                e.touches[0].clientY - e.touches[1].clientY
            );
        } else if (e.touches.length === 1) {
            e.preventDefault();
            startDrag(e);
        }
    });

    img.addEventListener('touchmove', function (e) {
        if (e.touches.length === 2 && initialDistance > 0) {
            e.preventDefault();
            const currentDistance = Math.hypot(
                e.touches[0].clientX - e.touches[1].clientX,
                e.touches[0].clientY - e.touches[1].clientY
            );
            const scaleChange = currentDistance / initialDistance;
            const oldZoom = zoomLevel;
            zoomLevel *= scaleChange;
            // clamp to minScale and max 3
            const minScale = getMinScaleToFillViewport();
            zoomLevel = Math.max(minScale, Math.min(3, zoomLevel));
            if (oldZoom !== zoomLevel) {
                updateZoom();
            }
            initialDistance = currentDistance;
        }
    });

    img.addEventListener('touchend', function (e) {
        initialDistance = 0;
    });
}

// 縮放功能
function zoomIn() {
    if (!isZoomed) {
        isZoomed = true;
        const imageContainer = document.getElementById('modalImageContainer');
        imageContainer.classList.add('zoomed');
    }
    const oldZoom = zoomLevel;
    zoomLevel = Math.min(zoomLevel + 0.2, 3);

    // 如果是第一次放大，保持當前位置
    if (oldZoom <= 1.01 && zoomLevel > 1.01) {
        translateX = 0;
        translateY = 0;
    }

    updateZoom();

    // 縮放後檢查邊界
    constrainDragBounds();
}

function zoomOut() {
    const imageContainer = document.getElementById('modalImageContainer');
    const img = imageContainer ? imageContainer.querySelector('img') : null;
    if (!img) return;

    const minScale = getMinScaleToFillViewport();
    const oldZoom = zoomLevel;
    zoomLevel = Math.max(zoomLevel * 0.8, minScale);

    updateZoom();

    // 如果縮放到最小，回到中心
    if (zoomLevel <= minScale + 0.01) {
        translateX = 0;
        translateY = 0;
        updateZoom();
    } else {
        // 縮放後檢查邊界
        constrainDragBounds();
    }
}

/**
 * 重置圖片縮放和位置到初始狀態（絕對定位置中）
 */
async function resetZoom() {
    const imageContainer = document.getElementById('modalImageContainer');
    const img = imageContainer ? imageContainer.querySelector('img') : null;

    imageContainer.classList.add('prepare');


    if (img.naturalWidth < 100 && img.naturalHeight < 100) {
        await sleep(100);
        resetZoom();
    } else {

        // 重置全域變數
        translateX = 0;
        translateY = 0;
        isZoomed = false;
        if (imageContainer) {
            imageContainer.classList.remove('zoomed');
        }

        if (img) {
            // 重置圖片樣式
            const resetStyles = {
                width: 'auto',
                height: 'auto',
                maxWidth: 'none',
                maxHeight: 'none',
                position: 'absolute',
                left: '0',
                top: '0',
                transform: 'none',
                display: 'block'
            };

            Object.assign(img.style, resetStyles);
            img.removeAttribute('width');
            img.removeAttribute('height');

            // 重置容器
            if (imageContainer) {
                imageContainer.style.position = 'relative';
                imageContainer.style.width = '100%';
                imageContainer.style.height = '100%';
                imageContainer.style.transform = 'none';
            }

            requestAnimationFrame(() => {
                if (imageContainer) imageContainer.offsetHeight;


                // 計算初始縮放
                const fillScale = getMinScaleToFillViewport();
                zoomLevel = fillScale;

                // 應用置中縮放
                updateZoom();
            });
        }
        imageContainer.classList.remove('prepare');
    }
}


/**
 * 應用縮放和平移變換，使用絕對定位實現精確置中
 */
function updateZoom() {
    const imageContainer = document.getElementById('modalImageContainer');
    const img = imageContainer ? imageContainer.querySelector('img') : null;
    const viewport = document.querySelector('.modal-viewport');

    imageContainer.classList.add('prepare');


    if (!img || !viewport || !imageContainer) {
        console.error('缺少必要元素');
        return;
    }

    const minScale = getMinScaleToFillViewport();
    if (zoomLevel < minScale) {
        zoomLevel = minScale;
    }


    sleep(1000);

    // 獲取視窗尺寸
    const viewportRect = viewport.getBoundingClientRect();
    const vw = viewportRect.width; // 1160
    const vh = viewportRect.height; // 760

    // 計算縮放後的圖片尺寸
    const scaledWidth = img.naturalWidth * zoomLevel; // 212
    const scaledHeight = img.naturalHeight * zoomLevel; // 760



    // 清除圖片的所有樣式
    img.style.width = 'auto';
    img.style.height = 'auto';
    img.style.maxWidth = 'none';
    img.style.maxHeight = 'none';
    img.style.transform = 'none';
    img.style.display = 'block';

    // 確保容器正確設置
    imageContainer.style.position = 'relative';
    imageContainer.style.width = '100%';
    imageContainer.style.height = '100%';
    imageContainer.style.overflow = 'visible';



    // 等待樣式更新完成
    requestAnimationFrame(() => {
        // 強制觸發重繪
        imageContainer.offsetHeight;

        // 關鍵：直接設置圖片的位置和尺寸，繞過 transform 置中問題
        // 1. 設置圖片絕對尺寸（不使用縮放）
        img.style.position = 'absolute';
        img.style.width = scaledWidth + 'px';
        img.style.height = scaledHeight + 'px';
        img.style.left = '0px';
        img.style.top = '0px';

        // 2. 計算置中位置
        const centerLeft = (vw - scaledWidth) / 2; // (1160 - 212) / 2 = 474px
        const centerTop = (vh - scaledHeight) / 2; // (760 - 760) / 2 = 0px

        // 3. 應用置中定位
        img.style.left = centerLeft + translateX + 'px';
        img.style.top = centerTop + translateY + 'px';



        // 4. 容器只處理手動縮放（如果需要）
        // 這裡我們不對容器應用 transform，讓圖片直接控制尺寸和位置
        imageContainer.style.transform = 'none';
        imageContainer.style.transformOrigin = '0 0';


        // 更新縮放狀態
        if (zoomLevel > minScale + 0.01) {
            imageContainer.classList.add('zoomed');
            isZoomed = true;
        } else {
            imageContainer.classList.remove('zoomed');
            isZoomed = false;
        }
        sleep(1000);
        imageContainer.classList.remove('prepare');

    });
}

// 拖拽功能
function startDrag(e) {
    const minScale = getMinScaleToFillViewport();
    if (!isZoomed || zoomLevel <= minScale + 0.01) return;

    isDragging = true;
    startX = e.clientX || (e.touches && e.touches[0] && e.touches[0].clientX);
    startY = e.clientY || (e.touches && e.touches[0] && e.touches[0].clientY);

    // 改變鼠標樣式
    const imageContainer = document.getElementById('modalImageContainer');
    imageContainer.style.cursor = 'grabbing';

    // 綁定拖拽事件
    document.addEventListener('mousemove', drag, {
        passive: false
    });
    document.addEventListener('touchmove', drag, {
        passive: false
    });
    document.addEventListener('mouseup', stopDrag, {
        passive: false
    });
    document.addEventListener('touchend', stopDrag, {
        passive: false
    });

    e.preventDefault();
    e.stopPropagation();
}

function drag(e) {
    if (!isDragging) return;

    e.preventDefault();
    e.stopPropagation();

    const clientX = e.clientX || (e.touches && e.touches[0] && e.touches[0].clientX);
    const clientY = e.clientY || (e.touches && e.touches[0] && e.touches[0].clientY);

    if (clientX !== undefined && clientY !== undefined) {
        // 計算移動距離
        const deltaX = clientX - startX;
        const deltaY = clientY - startY;

        // 直接更新位置
        translateX += deltaX;
        translateY += deltaY;

        // 更新起始點
        startX = clientX;
        startY = clientY;

        // 更新顯示
        updateZoom();
    }
}

function stopDrag(e) {
    if (!isDragging) return;

    isDragging = false;

    // 恢復鼠標樣式
    const imageContainer = document.getElementById('modalImageContainer');
    imageContainer.style.cursor = 'grab';

    // 拖拽結束時檢查邊界
    constrainDragBounds();

    // 移除拖拽事件
    document.removeEventListener('mousemove', drag);
    document.removeEventListener('touchmove', drag);
    document.removeEventListener('mouseup', stopDrag);
    document.removeEventListener('touchend', stopDrag);

    e.preventDefault();
    e.stopPropagation();
}

function constrainDragBounds() {
    const imageContainer = document.getElementById('modalImageContainer');
    const img = imageContainer ? imageContainer.querySelector('img') : null;
    const viewport = document.querySelector('.modal-viewport');

    if (!img || !viewport || !isZoomed) return;

    const minScale = getMinScaleToFillViewport();
    if (zoomLevel <= minScale + 0.01) {
        translateX = 0;
        translateY = 0;
        return;
    }

    // 獲取實際尺寸
    const viewportRect = viewport.getBoundingClientRect();
    const naturalW = img.naturalWidth;
    const naturalH = img.naturalHeight;

    // 計算縮放後的圖片尺寸
    const scaledWidth = naturalW * zoomLevel;
    const scaledHeight = naturalH * zoomLevel;

    // 計算最大拖拽距離（圖片中心可以移動的距離）
    const maxTranslateX = Math.max(0, (scaledWidth - viewportRect.width));
    const maxTranslateY = Math.max(0, (scaledHeight - viewportRect.height));

    // 限制在邊界內
    translateX = Math.max(-maxTranslateX, Math.min(maxTranslateX, translateX));
    translateY = Math.max(-maxTranslateY, Math.min(maxTranslateY, translateY));

    // 應用限制後的位置
    updateZoom();
}

// 計算讓圖片長邊完整顯示在 modal-viewport 的最小縮放比例
function getMinScaleToFillViewport() {
    const imageContainer = document.getElementById('modalImageContainer');
    const viewport = document.querySelector('.modal-viewport');
    const img = imageContainer ? imageContainer.querySelector('img') : null;
    if (!img || !viewport) return 1;


    // 等待圖片載入完成
    if (!img.naturalWidth || !img.naturalHeight) {
        // 如果圖片還沒載入完成，返回 1
        return 1;
    }

    const naturalW = img.naturalWidth;
    const naturalH = img.naturalHeight;
    const viewportRect = viewport.getBoundingClientRect();
    const vw = viewportRect.width;
    const vh = viewportRect.height;

    if (!naturalW || !naturalH || vw <= 0 || vh <= 0) return 1;

    // 判斷圖片是否需要縮小（任一邊超過視窗）
    const needsScalingDown = naturalW > vw || naturalH > vh;

    // 計算水平和垂直方向的縮放比例
    const scaleX = vw / naturalW; // 寬度填滿視窗的縮放比例
    const scaleY = vh / naturalH; // 高度填滿視窗的縮放比例

    // 計算圖片和容器的縱橫比
    const imageAspectRatio = naturalW / naturalH; // 圖片的寬高比
    const viewportAspectRatio = vw / vh; // 容器的寬高比

    // 關鍵邏輯：根據縱橫比決定使用哪個縮放比例
    // 讓長邊填滿容器，短邊絕對不溢出
    if (imageAspectRatio > viewportAspectRatio) {
        // 情況1：圖片「更寬」（寬度是限制因素）
        // - 使用 scaleX，讓寬度填滿容器
        // - 高度會按比例縮放，可能留白（但絕不溢出）
        return scaleX;
    } else {
        // 情況2：圖片「更高」或「等寬高」（高度是限制因素）
        // - 使用 scaleY，讓高度填滿容器
        // - 寬度會按比例縮放，可能留白（但絕不溢出）
        return scaleY;
    }
}
// 動態綁定點擊事件給所有可點擊元素
function bindImageClickEvents() {
    const allClickableElements = document.querySelectorAll('.image-item:not(.hidden) img, .image-item:not(.hidden)');
    allClickableElements.forEach(element => {
        element.removeEventListener('click', handleImageClick);
        element.addEventListener('click', handleImageClick);
    });
}

// 統一的圖片點擊處理函數
function handleImageClick(event) {
    const imageItem = event.currentTarget.closest('.image-item');
    const slideNumber = parseInt(imageItem.dataset.slide);

    if (slideNumber) {
        openModal(slideNumber);
    }
}

// 鍵盤事件處理
document.addEventListener('keydown', function (event) {
    if (document.getElementById('imageModal').style.display === 'block') {
        switch (event.key) {
            case 'Escape':
                closeModal();
                break;
            case 'ArrowLeft':
                plusSlides(-1);
                break;
            case 'ArrowRight':
                plusSlides(1);
                break;
            case 'ArrowUp':
                zoomIn();
                break;
            case 'ArrowDown':
                zoomOut();
                break;
            case '+':
            case '=':
                event.preventDefault();
                zoomIn();
                break;
            case '-':
                event.preventDefault();
                zoomOut();
                break;
            case '0':
                event.preventDefault();
                resetZoom();
                break;
        }
    }
});

// 滑鼠滾輪縮放
document.getElementById('modalImageContainer').addEventListener('wheel', function (e) {
    e.preventDefault();
    if (e.deltaY < 0) {
        zoomIn();
    } else {
        zoomOut();
    }
});

// 雙擊縮放
document.getElementById('modalImageContainer').addEventListener('dblclick', function (e) {
    e.preventDefault();
    if (zoomLevel > 1) {
        resetZoom();
    } else {
        zoomIn();
    }
});

// 觸控支持
let initialDistance = 0;
document.getElementById('modalImageContainer').addEventListener('touchstart', function (e) {
    if (e.touches.length === 2) {
        initialDistance = Math.hypot(
            e.touches[0].clientX - e.touches[1].clientX,
            e.touches[0].clientY - e.touches[1].clientY
        );
    } else if (e.touches.length === 1) {
        startDrag(e);
    }
});

document.getElementById('modalImageContainer').addEventListener('touchmove', function (e) {
    if (e.touches.length === 2 && initialDistance > 0) {
        const currentDistance = Math.hypot(
            e.touches[0].clientX - e.touches[1].clientX,
            e.touches[0].clientY - e.touches[1].clientY
        );
        const scaleChange = currentDistance / initialDistance;
        zoomLevel *= scaleChange;
        // clamp to minScale and max 3
        const minScale = getMinScaleToFillViewport();
        zoomLevel = Math.max(minScale, Math.min(3, zoomLevel));
        updateZoom();
        initialDistance = currentDistance;
        e.preventDefault();
    }
});

document.getElementById('modalImageContainer').addEventListener('touchend', function (e) {
    initialDistance = 0;
});

// 縮放按鈕事件
document.getElementById('zoomIn').addEventListener('click', zoomIn);
document.getElementById('zoomOut').addEventListener('click', zoomOut);
document.getElementById('zoomReset').addEventListener('click', resetZoom);

// 滑鼠拖拽
document.getElementById('modalImageContainer').addEventListener('mousedown', startDrag);

// 點擊模態背景關閉
document.getElementById('imageModal').addEventListener('click', function (event) {
    if (event.target === this) {
        closeModal();
    }
});

// 初始化
document.addEventListener('DOMContentLoaded', function () {
    // 初始化服裝顯示
    Object.keys(outfitConfig).forEach(characterId => {
        const config = outfitConfig[characterId];
        switchImages(characterId, config.outfits[0]);
    });

    // 綁定點擊事件
    bindImageClickEvents();
    // 新增：下載按鈕事件
    document.getElementById('downloadOriginal').addEventListener('click', function () {
        downloadOriginalImage();
    });

    // 初始狀態：禁用下載按鈕
    updateDownloadButton();
});