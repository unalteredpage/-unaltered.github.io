//=============================================================================
// CustomItemMenu.js
//=============================================================================
/*:
 * @plugindesc X키 메뉴를 커스텀 창(액터정보 / ITEM / 아이템목록+USE·INFO 통합)으로 완전 교체
 * @author (custom)
 *
 * @help
 * ============================================================================
 *  개요
 * ============================================================================
 * 기존 Scene_Menu 를 완전히 교체합니다. 화면 구성:
 *
 *   윈도우1 : 액터 정보 (이름 / LV n / HP 20/20 고정문자열)
 *   윈도우2 : ITEM 버튼
 *   윈도우3 : [한 창] 위쪽 아이템 목록 8칸 + 아래쪽 USE / INFO 버튼
 *   설명창  : INFO 선택 시 아이템 설명(description) 표시
 *
 * 선택 커서는 기본 사각형 대신 img/picture/cursor.png 이미지를 사용하며,
 * 선택 항목 왼쪽에 표시되고 텍스트는 커서 자리만큼 오른쪽으로 밀립니다.
 *
 * 조작 흐름:
 *   메뉴 열기 → ITEM 에 커서
 *   ITEM 확정 → 아이템 목록 활성화
 *   아이템/USE/INFO 는 같은 창 안에서 상하로 커서 이동
 *   USE  → 아이템 사용
 *   INFO → 설명창 표시 (클릭/취소로 닫으면 목록 복귀)
 *   취소(X/ESC) → 한 단계 뒤로, 최상위에서 취소 시 맵 복귀
 *
 * ★ 모든 위치/크기/폰트/커서 값은 아래 CFG 상수에서 조정하세요.
 * ============================================================================
 */

(function() {
    'use strict';

    //=========================================================================
    //  ★★★ 설정 상수 ★★★
    //=========================================================================
    var CFG = {
        // ---- 윈도우1 : 액터 정보 창 (좌상단104,62 ~ 우하단286,202) ----------
        W1_X: 84,
        W1_Y: 62,
        W1_W: 182,
        W1_H: 140,

        // ---- 윈도우2 : ITEM 버튼 창 (좌상단104,210 ~ 우하단287,293) ---------
        W2_X: 84,
        W2_Y: 210,
        W2_W: 182,
        W2_H: 83,

        // ---- 윈도우3 : 아이템목록+USE/INFO 통합 창 (좌상단305,62 ~ 746,524) --
        W3_X: 285,
        W3_Y: 62,
        W3_W: 441,
        W3_H: 462,

        // ---- 폰트 크기 (px) -------------------------------------------------
        FONT_NAME: 35,   // 액터 이름
        FONT_LVHP: 12,   // LV / HP
        FONT_MENU: 35,   // ITEM / USE / INFO / 아이템 이름

        // ---- 윈도우3 내부 레이아웃 -----------------------------------------
        ITEM_ROWS: 8,     // 아이템 표시 칸 수
        W3_GAP_ROWS: 1,   // 아이템 줄칸과 USE/INFO 사이의 빈 줄 수(한 칸 여백)
        ITEM_TOP_MARGIN: 20,    // 아이템 줄 맨 위 여백(px) — 첫 아이템을 아래로 내림
        BTN_BOTTOM_MARGIN: 8,  // USE/INFO 줄을 창 바닥에서 위로 띄울 간격(px)

        // ---- 커서 이미지 ---------------------------------------------------
        CURSOR_IMG: 'cursor',  // img/picture/cursor.png (확장자 제외)
        CURSOR_GAP: 20,        // 커서와 텍스트 사이 간격(px) — 항목 왼쪽 여백
        CURSOR_SCALE: 0.65,     // 커서 크기 배율 (1.0 = 줄 높이에 맞춤, 0.7 = 70% 등)

        // ---- 배경 불투명도 --------------------------------------------------
        BACK_OPACITY: 255,     // 모든 커스텀 창 공통

        // ---- INFO 설명창 (좌상단104,414 ~ 우하단746,612) -------------------
        DESC_X: 104,
        DESC_Y: 414,
        DESC_W: 642,
        DESC_H: 198,
        DESC_LINE_SPACING: 0.5,
        DESC_BACK_OPACITY: 255
    };

    //=========================================================================
    //  공용 커서 믹스인
    //   - 기본 사각형 커서를 숨기고 cursor.png 스프라이트를 선택 항목 왼쪽에 배치
    //   - 이미지는 줄 높이(글자 크기)에 맞춰 리사이즈
    //   대상 창의 prototype 에 적용해서 재사용한다.
    //=========================================================================
    function installImageCursor(proto) {
        // 커서 자리(왼쪽 여백) 폭: 커서 이미지 폭 + 간격
        proto.cursorAreaWidth = function() {
            var h = this.lineHeight() * CFG.CURSOR_SCALE;  // 커서 높이 = 줄 높이 × 배율
            var bmp = ImageManager.loadPicture(CFG.CURSOR_IMG);
            var ratio = (bmp.height > 0) ? (bmp.width / bmp.height) : 1;
            var w = Math.floor(h * ratio);           // 비율 유지 리사이즈 폭
            return w + CFG.CURSOR_GAP;
        };

        // 커서 스프라이트 생성/부착
        proto.createCursorSprite = function() {
            if (this._imgCursor) { return; }
            this._imgCursor = new Sprite();
            this._imgCursor.bitmap = ImageManager.loadPicture(CFG.CURSOR_IMG);
            this._imgCursor.visible = false;
            this.addChild(this._imgCursor);
            // 이미지 로드 완료 시 텍스트 밀림 폭 반영 위해 다시 그림
            var self = this;
            this._imgCursor.bitmap.addLoadListener(function() {
                if (self.refresh) { self.refresh(); }
            });
        };

        // 기본 사각형 커서 완전히 숨김 (빈 비트맵 + 투명)
        proto._refreshCursor = function() {
            // 코어 커서 그리기를 건너뛰고 아무것도 안 그림
            if (this._windowCursorSprite) {
                this._windowCursorSprite.bitmap = null;
                this._windowCursorSprite.alpha = 0;
                this._windowCursorSprite.visible = false;
            }
        };
        proto._updateCursor = function() {
            Window.prototype._updateCursor.call(this);
            if (this._windowCursorSprite) { this._windowCursorSprite.visible = false; }
            this.updateImageCursor();
        };

        // cursor.png 스프라이트를 현재 선택 항목 왼쪽에 위치
        proto.updateImageCursor = function() {
            if (!this._imgCursor) { return; }
            var bmp = this._imgCursor.bitmap;
            var active = this.isOpen() && this.active && this.index() >= 0 &&
                         this.isCursorVisibleForImage();
            if (!active || !bmp || !bmp.isReady()) {
                this._imgCursor.visible = false;
                return;
            }
            var h = this.lineHeight() * CFG.CURSOR_SCALE;  // 커서 높이 = 줄 높이 × 배율
            var ratio = (bmp.height > 0) ? (bmp.width / bmp.height) : 1;
            var w = Math.floor(h * ratio);
            // 이미지 리사이즈(스케일)
            this._imgCursor.scale.x = w / bmp.width;
            this._imgCursor.scale.y = h / bmp.height;

            var rect = this.itemRect(this.index());
            // 커서는 항목의 커서자리(왼쪽) 안, 텍스트 시작 바로 왼쪽에 놓음
            var x = this.padding + rect.x + CFG.CURSOR_GAP / 2 - this.origin.x;
            var y = this.padding + rect.y - this.origin.y +
                    Math.floor((rect.height - h) / 2) + 2;
            this._imgCursor.x = x;
            this._imgCursor.y = y;
            this._imgCursor.visible = true;
        };

        // 하위 창에서 필요 시 오버라이드 (기본은 항상 표시 허용)
        proto.isCursorVisibleForImage = function() {
            return true;
        };
    }

    //=========================================================================
    //  Window_ActorInfo  (윈도우1)
    //=========================================================================
    function Window_ActorInfo() {
        this.initialize.apply(this, arguments);
    }
    Window_ActorInfo.prototype = Object.create(Window_Base.prototype);
    Window_ActorInfo.prototype.constructor = Window_ActorInfo;

    Window_ActorInfo.prototype.initialize = function() {
        Window_Base.prototype.initialize.call(this, CFG.W1_X, CFG.W1_Y, CFG.W1_W, CFG.W1_H);
        this.refresh();
    };
    Window_ActorInfo.prototype.standardBackOpacity = function() {
        return CFG.BACK_OPACITY;
    };
    Window_ActorInfo.prototype.refresh = function() {
        this.contents.clear();
        var actor = $gameParty.members()[0];
        if (!actor) { return; }
        var pad = this.textPadding();
        var lh = this.lineHeight();
        var y = 0;

        this.contents.fontSize = CFG.FONT_NAME;
        this.drawText(actor.name(), pad, y, this.contentsWidth() - pad * 2);
        y += lh + 10;

        this.contents.fontSize = CFG.FONT_LVHP;
        this.contents.fontFace = 'UndertaleHUD';
        this.drawText('LV     ' + actor.level, pad, y, this.contentsWidth() - pad * 2);
        y += lh - 10;

        this.drawText('HP     20/20', pad, y, this.contentsWidth() - pad * 2);

        this.resetFontSettings();
    };

    //=========================================================================
    //  Window_ItemButton  (윈도우2) — ITEM 커맨드 하나 (커스텀 커서 사용)
    //=========================================================================
    function Window_ItemButton() {
        this.initialize.apply(this, arguments);
    }
    Window_ItemButton.prototype = Object.create(Window_Command.prototype);
    Window_ItemButton.prototype.constructor = Window_ItemButton;
    installImageCursor(Window_ItemButton.prototype);

    Window_ItemButton.prototype.initialize = function() {
        Window_Command.prototype.initialize.call(this, CFG.W2_X, CFG.W2_Y);
        this.createCursorSprite();
    };
    Window_ItemButton.prototype.windowWidth = function() { return CFG.W2_W; };
    Window_ItemButton.prototype.windowHeight = function() { return CFG.W2_H; };
    Window_ItemButton.prototype.numVisibleRows = function() { return 1; };
    Window_ItemButton.prototype.standardBackOpacity = function() {
        return CFG.BACK_OPACITY;
    };
    Window_ItemButton.prototype.makeCommandList = function() {
        this.addCommand('물품', 'item', true);
    };
    Window_ItemButton.prototype.itemTextAlign = function() { return 'left'; };

    // 텍스트를 커서 자리만큼 오른쪽으로 밀고 폰트 크기 적용
    Window_ItemButton.prototype.drawItem = function(index) {
        var rect = Window_Command.prototype.itemRectForText.call(this, index);
        var cw = this.cursorAreaWidth();
        this.resetTextColor();
        this.changePaintOpacity(this.isCommandEnabled(index));
        this.contents.fontSize = CFG.FONT_MENU;
        this.drawText(this.commandName(index), rect.x + cw, rect.y,
                      rect.width - cw, this.itemTextAlign());
        this.resetFontSettings();
    };
    Window_ItemButton.prototype.resetFontSettings = function() {
        Window_Command.prototype.resetFontSettings.call(this);
        this.contents.fontSize = CFG.FONT_MENU;
    };
    // 왼쪽 화살표를 누르면 아이템 목록으로 이동 (엔터는 기존대로 사용)
    Window_ItemButton.prototype.processCursorMove = function() {
        if (this.isOpenAndActive() && Input.isRepeated('right')) {
            SoundManager.playCursor();
            this.callHandler('goItemList');
            return;
        }
        Window_Command.prototype.processCursorMove.call(this);
    };

    //=========================================================================
    //  Window_CustomItemList (윈도우3)
    //   위쪽: 아이템 8칸 / (빈 줄 여백) / 아래쪽: USE, INFO
    //   전부 한 창 안에서 하나의 선택 목록으로 관리 (같은 테두리)
    //=========================================================================
    function Window_CustomItemList() {
        this.initialize.apply(this, arguments);
    }
    Window_CustomItemList.prototype = Object.create(Window_Selectable.prototype);
    Window_CustomItemList.prototype.constructor = Window_CustomItemList;
    installImageCursor(Window_CustomItemList.prototype);

    // 인덱스 구성:
    //   0 .. ITEM_ROWS-1           : 아이템 칸
    //   ITEM_ROWS .. +GAP_ROWS-1   : 빈 줄(선택 불가)
    //   그 다음 2칸                 : USE, INFO
    Window_CustomItemList.prototype.initialize = function(x, y, w, h) {
        this._data = [];
        Window_Selectable.prototype.initialize.call(this, x, y, w, h);
        this.createCursorSprite();
        this.refresh();
        this.select(0);
    };
    Window_CustomItemList.prototype.standardBackOpacity = function() {
        return CFG.BACK_OPACITY;
    };
    Window_CustomItemList.prototype.maxCols = function() { return 1; };

    // 버튼 인덱스 계산
    Window_CustomItemList.prototype.useIndex = function() {
        return CFG.ITEM_ROWS + CFG.W3_GAP_ROWS;       // USE
    };
    Window_CustomItemList.prototype.infoIndex = function() {
        return CFG.ITEM_ROWS + CFG.W3_GAP_ROWS + 1;   // INFO
    };
    Window_CustomItemList.prototype.maxItems = function() {
        return CFG.ITEM_ROWS + CFG.W3_GAP_ROWS + 2;   // 아이템칸 + 빈줄 + USE + INFO
    };
    Window_CustomItemList.prototype.numVisibleRows = function() {
        return this.maxItems();
    };
    // 컨텐츠 비트맵이 창 내부 전체 높이를 덮도록 (바닥에 그린 버튼이 잘리지 않게)
    Window_CustomItemList.prototype.contentsHeight = function() {
        return this.height - this.standardPadding() * 2;
    };

    Window_CustomItemList.prototype.filledCount = function() {
        return this._data ? this._data.length : 0;
    };
    Window_CustomItemList.prototype.item = function() {
        var i = this.index();
        return (this._data && i >= 0 && i < this._data.length) ? this._data[i] : null;
    };

    // 어떤 인덱스가 선택 가능한 자리인지
    Window_CustomItemList.prototype.isEnabledIndex = function(index) {
        if (index < CFG.ITEM_ROWS) {
            // 아이템 칸: 데이터가 있는 칸만
            return index < this.filledCount();
        }
        if (index === this.useIndex() || index === this.infoIndex()) {
            return true;   // USE / INFO 항상 가능
        }
        return false;      // 빈 줄 여백
    };
    Window_CustomItemList.prototype.isCurrentItemEnabled = function() {
        return this.isEnabledIndex(this.index());
    };

    Window_CustomItemList.prototype.makeItemList = function() {
        this._data = $gameParty.items().filter(function(item) {
            return item && item.itypeId === 1;   // 일반(상비) 아이템만
        });
    };

    // USE/INFO 는 같은 줄에 가로로 나란히 배치.
    // USE/INFO 줄을 창 바닥에 붙임(창 실제 내부 높이 기준, 바닥에서 마진만큼 위로).
    Window_CustomItemList.prototype.buttonRowY = function() {
        var innerH = this.height - this.standardPadding() * 2;
        return innerH - this.itemHeight() - CFG.BTN_BOTTOM_MARGIN;
    };
    Window_CustomItemList.prototype.itemRect = function(index) {
        // 아이템 칸은 기본(세로 1열) + 맨 위 여백만큼 아래로
        if (index < CFG.ITEM_ROWS) {
            var r = Window_Selectable.prototype.itemRect.call(this, index);
            r.y += CFG.ITEM_TOP_MARGIN;
            return r;
        }
        // USE / INFO: 같은 줄에 좌우 2등분
        var rect = new Rectangle();
        var totalW = this.contentsWidth();
        var half = Math.floor(totalW / 2);
        rect.y = this.buttonRowY();
        rect.height = this.itemHeight();
        rect.width = half;
        if (index === this.useIndex()) {
            rect.x = 0;          // 왼쪽 절반
        } else if (index === this.infoIndex()) {
            rect.x = half;       // 오른쪽 절반
        } else {
            // 빈 줄 여백 등: 화면 밖(안 그림/선택 안 함)
            rect.x = 0; rect.y = -1000; rect.width = 0; rect.height = 0;
        }
        return rect;
    };

    // 커서 자리만큼 밀어서 텍스트를 그림
    Window_CustomItemList.prototype.drawItemName2 = function(text, rect) {
        var cw = this.cursorAreaWidth();
        this.contents.fontSize = CFG.FONT_MENU;
        this.drawText(text, rect.x + cw, rect.y, rect.width - cw, 'left');
        this.resetFontSettings();
    };

    Window_CustomItemList.prototype.drawItem = function(index) {
        var rect = this.itemRect(index);
        if (index < CFG.ITEM_ROWS) {
            var item = this._data[index];
            if (!item) { return; }               // 빈 칸: 아무것도 안 그림
            this.drawItemName2(item.name, rect);
        } else if (index === this.useIndex()) {
            this.drawItemName2('사용', rect);
        } else if (index === this.infoIndex()) {
            this.drawItemName2('정보', rect);
        }
        // 빈 줄 여백은 아무것도 안 그림
    };

    // 커서가 선택 불가 자리에 멈추지 않도록 이동 보정
    Window_CustomItemList.prototype.select = function(index) {
        Window_Selectable.prototype.select.call(this, index);
    };

    // 커서 이동 규칙:
    //   아이템칸끼리는 상하 1열 이동
    //   마지막 아이템 ↓ → USE / USE·INFO ↑ → 마지막 아이템
    //   USE ↔ INFO 는 좌우 이동
    Window_CustomItemList.prototype.lastItemRowIndex = function() {
        var n = this.filledCount();
        return n > 0 ? (n - 1) : -1;   // 마지막으로 채워진 아이템 인덱스
    };
    Window_CustomItemList.prototype.cursorDown = function(wrap) {
        var i = this.index();
        if (i < CFG.ITEM_ROWS) {
            // 아이템칸 안: 다음 채워진 칸이 있으면 이동, 없으면 USE 로
            if (i + 1 < this.filledCount()) {
                this.select(i + 1);
            } else {
                this.select(this.useIndex());
            }
        }
        // USE/INFO 줄에서는 아래 이동 없음
    };
    Window_CustomItemList.prototype.cursorUp = function(wrap) {
        var i = this.index();
        if (i === this.useIndex() || i === this.infoIndex()) {
            var last = this.lastItemRowIndex();
            if (last >= 0) { this.select(last); }
        } else if (i > 0 && i - 1 < this.filledCount()) {
            this.select(i - 1);
        }
    };
    Window_CustomItemList.prototype.cursorRight = function(wrap) {
        if (this.index() === this.useIndex()) {
            this.select(this.infoIndex());
        }
    };
    Window_CustomItemList.prototype.cursorLeft = function(wrap) {
        if (this.index() === this.infoIndex()) {
            this.select(this.useIndex());
        }
    };

    Window_CustomItemList.prototype.refresh = function() {
        this.makeItemList();
        this.createContents();
        this.drawAllItems();
    };

    // 선택 위치가 아이템/USE/INFO 어느 것인지
    Window_CustomItemList.prototype.selectionType = function() {
        var i = this.index();
        if (i === this.useIndex())  { return 'use'; }
        if (i === this.infoIndex()) { return 'info'; }
        if (i < CFG.ITEM_ROWS && this._data[i]) { return 'item'; }
        return 'none';
    };

    // 마지막으로 고른 아이템(USE/INFO 대상) 기억
    Window_CustomItemList.prototype.setLastItemIndex = function() {
        this._lastItemIndex = this.index();
    };
    Window_CustomItemList.prototype.lastItem = function() {
        var i = this._lastItemIndex;
        return (this._data && i >= 0 && i < this._data.length) ? this._data[i] : null;
    };

    //=========================================================================
    //  Window_ItemDescription (INFO 설명창)
    //=========================================================================
    function Window_ItemDescription() {
        this.initialize.apply(this, arguments);
    }
    Window_ItemDescription.prototype = Object.create(Window_Selectable.prototype);
    Window_ItemDescription.prototype.constructor = Window_ItemDescription;

    Window_ItemDescription.prototype.initialize = function() {
        Window_Selectable.prototype.initialize.call(this, CFG.DESC_X, CFG.DESC_Y, CFG.DESC_W, CFG.DESC_H);
        this.openness = 0;
        this.deactivate();
        this.hide();
    };
    Window_ItemDescription.prototype.standardBackOpacity = function() {
        return CFG.DESC_BACK_OPACITY;
    };
    Window_ItemDescription.prototype.lineHeight = function() {
        return Window_Base.prototype.lineHeight.call(this) + CFG.DESC_LINE_SPACING;
    };
    Window_ItemDescription.prototype.maxItems = function() { return 0; };
    Window_ItemDescription.prototype._updateCursor = function() {
        if (this._windowCursorSprite) { this._windowCursorSprite.visible = false; }
    };
    Window_ItemDescription.prototype.setItem = function(item) {
        this._item = item;
        Window_ItemDescription.prototype.resetFontSettings = function() {
            Window_Base.prototype.resetFontSettings.call(this);
            this.contents.fontSize = 40;   // ← 원하는 크기
        };
        this.refresh();
    };
    Window_ItemDescription.prototype.refresh = function() {
        this.contents.clear();
        if (this._item) {
            this.drawTextEx(this._item.description, this.textPadding(), 5);
        }
    };

    //=========================================================================
    //  Scene_Menu 완전 교체
    //=========================================================================
    Scene_Menu.prototype.create = function() {
        Scene_MenuBase.prototype.create.call(this);
        this.createActorInfoWindow();
        this.createItemButtonWindow();
        this.createListWindow();
        this.createDescriptionWindow();
    };

    Scene_Menu.prototype.start = function() {
        Scene_MenuBase.prototype.start.call(this);
        this._actorInfoWindow.refresh();
    };

    // 배경 흐림(blur) 제거:
    //  MV 는 snapForBackground 에서 스냅샷에 blur() 를 구워버림 → blur 호출을 뺀다.
    SceneManager.snapForBackground = function() {
        this._backgroundBitmap = this.snap();
        // this._backgroundBitmap.blur();  // ← 블러 제거
    };

    // 메뉴 배경 스프라이트(블러 필터도 부착 안 함)
    Scene_Menu.prototype.createBackground = function() {
        this._backgroundSprite = new Sprite();
        this._backgroundSprite.bitmap = SceneManager.backgroundBitmap();
        this.addChild(this._backgroundSprite);
    };

    Scene_Menu.prototype.createActorInfoWindow = function() {
        this._actorInfoWindow = new Window_ActorInfo();
        this.addWindow(this._actorInfoWindow);
    };

    Scene_Menu.prototype.createItemButtonWindow = function() {
        this._itemButtonWindow = new Window_ItemButton();
        this._itemButtonWindow.setHandler('item',       this.onItemButtonOk.bind(this));
        this._itemButtonWindow.setHandler('goItemList', this.onItemButtonGoList.bind(this));
        this._itemButtonWindow.setHandler('cancel',     this.popScene.bind(this));
        this.addWindow(this._itemButtonWindow);
        this._itemButtonWindow.activate();
        this._itemButtonWindow.select(0);
    };

    Scene_Menu.prototype.createListWindow = function() {
        this._listWindow = new Window_CustomItemList(CFG.W3_X, CFG.W3_Y, CFG.W3_W, CFG.W3_H);
        this._listWindow.setHandler('ok',     this.onListOk.bind(this));
        this._listWindow.setHandler('cancel', this.onListCancel.bind(this));
        this.addWindow(this._listWindow);
        this._listWindow.deactivate();
    };

    Scene_Menu.prototype.createDescriptionWindow = function() {
        this._descWindow = new Window_ItemDescription();
        this._descWindow.setHandler('ok',     this.onDescClose.bind(this));
        this._descWindow.setHandler('cancel', this.onDescClose.bind(this));
        this.addWindow(this._descWindow);
    };

    //--- 핸들러 --------------------------------------------------------------

    // ITEM 확정 → 목록 창 활성화, 첫 아이템(없으면 USE)에 커서
    Scene_Menu.prototype.onItemButtonOk = function() {
        this._itemButtonWindow.deactivate();
        this._listWindow.refresh();
        this._listWindow.activate();
        var start = (this._listWindow.filledCount() > 0) ? 0 : this._listWindow.useIndex();
        this._listWindow.select(start);
    };

    // 물품 메뉴에서 왼쪽 화살표 → 목록 창 활성화 (엔터와 동일하게 첫 아이템/USE로)
    Scene_Menu.prototype.onItemButtonGoList = function() {
        this._itemButtonWindow.deactivate();
        this._itemButtonWindow.select(0);
        this._listWindow.refresh();
        this._listWindow.activate();
        var start = (this._listWindow.filledCount() > 0) ? 0 : this._listWindow.useIndex();
        this._listWindow.select(start);
    };

    // 목록 창에서 확정: 선택 위치에 따라 분기
    Scene_Menu.prototype.onListOk = function() {
        var type = this._listWindow.selectionType();
        if (type === 'item') {
            // 아이템을 골랐으면 그걸 대상 아이템으로 기억하고 USE 로 커서 이동
            this._listWindow.setLastItemIndex();
            this._listWindow.select(this._listWindow.useIndex());
            this._listWindow.activate();
        } else if (type === 'use') {
            this.doUseItem();
        } else if (type === 'info') {
            this.doShowInfo();
        } else {
            this._listWindow.activate();
        }
    };

    // 목록 창 취소 → ITEM 버튼으로
    Scene_Menu.prototype.onListCancel = function() {
        this._listWindow.deactivate();
        this._itemButtonWindow.activate();
    };

    // 설명창 닫기 → 목록 복귀
    Scene_Menu.prototype.onDescClose = function() {
        this._descWindow.deactivate();
        this._descWindow.close();
        this._descWindow.hide();
        this._listWindow.show();
        this._listWindow.activate();
    };

    //--- 아이템 사용 관련 (액터 1명 기준, 커먼이벤트 정상 실행) --------------
    Scene_Menu.prototype.user = function() {
        return $gameParty.members()[0];
    };
    Scene_Menu.prototype.targetItem = function() {
        return this._listWindow.lastItem();
    };

    Scene_Menu.prototype.doUseItem = function() {
        var item = this.targetItem();
        var actor = this.user();
        if (!item || !actor) {
            SoundManager.playBuzzer();
            this._listWindow.activate();
            return;
        }
        this._listWindow.deactivate();

        SoundManager.playUseItem();
        actor.useItem(item);   // 소비

        var action = new Game_Action(actor);
        action.setItemObject(item);
        for (var i = 0; i < action.numRepeats(); i++) {
            action.apply(actor);
        }
        action.applyGlobal();  // 커먼이벤트 예약

        if (this._actorInfoWindow) { this._actorInfoWindow.refresh(); }

        if ($gameTemp.isCommonEventReserved()) {
            this.popScene();   // 맵으로 복귀 → 커먼이벤트 실행
        } else {
            this._listWindow.refresh();
            this._listWindow.activate();
        }
    };

    Scene_Menu.prototype.doShowInfo = function() {
        var item = this.targetItem();
        // 설명이 비어있으면(공백뿐이거나 없음) 설명창을 띄우지 않음
        var desc = item ? item.description : '';
        if (!desc || desc.trim() === '') {
            SoundManager.playBuzzer();
            this._listWindow.activate();
            return;
        }
        this._descWindow.setItem(item);
        this._listWindow.deactivate();
        this._listWindow.hide();
        this._descWindow.show();
        this._descWindow.open();
        this._descWindow.activate();
    };

})();