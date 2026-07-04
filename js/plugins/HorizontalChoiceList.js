//=============================================================================
// HorizontalChoiceList.js
//=============================================================================

/*:
 * @plugindesc 선택지를 가로 배치로 표시 (메시지 창 위에 직접 렌더링)
 * @author Claude
 *
 * @help
 * 이벤트의 [선택지 표시]를 사용하면 자동으로 적용됩니다.
 *
 * 구조:
 *   Window_ChoiceList  → 완전히 숨김, 키보드/입력 처리 전담
 *   Sprite_ChoiceOverlay → Bitmap에 직접 그려 Scene 최상위에 표시
 *
 * 이렇게 분리하는 이유:
 *   WindowLayer는 자식 창들 사이에 스텐실 마스킹을 적용하는 특수 렌더러.
 *   addWindow()로 추가된 창은 다른 창 위에 절대로 올라올 수 없음.
 *   → Window를 완전히 숨기고 Sprite로 직접 그리는 것만이 해결책.
 */

(function() {
    'use strict';

    var COLS_PER_ROW = 3;
    var SEL_COLOR    = '#ffff00';
    var NORM_COLOR   = '#ffffff';
    var FONT_FACE    = 'GameFont, Dotum, AppleGothic, sans-serif';
    var FONT_SIZE    = 28;
    var LINE_HEIGHT  = 36;
    var COL_SPACING  = 20;

    //=========================================================================
    // Sprite_ChoiceOverlay
    // Bitmap에 선택지를 직접 그린 뒤 Scene 직속으로 추가
    // → WindowLayer 렌더링 밖이므로 메시지 창 위에 확실히 표시됨
    //=========================================================================
    function Sprite_ChoiceOverlay() {
        this.initialize.apply(this, arguments);
    }

    Sprite_ChoiceOverlay.prototype = Object.create(Sprite.prototype);
    Sprite_ChoiceOverlay.prototype.constructor = Sprite_ChoiceOverlay;

    Sprite_ChoiceOverlay.prototype.initialize = function(messageWindow, choiceWindow) {
        Sprite.prototype.initialize.call(this);
        this._mw        = messageWindow;
        this._cw        = choiceWindow;
        this._lastIndex = -99;
        this.visible    = false;
    };

    //-------------------------------------------------------------------------
    // 매 프레임 갱신
    //-------------------------------------------------------------------------
    Sprite_ChoiceOverlay.prototype.update = function() {
        Sprite.prototype.update.call(this);

        var active = $gameMessage.isChoice() && this._cw.active;

        if (active) {
            // 선택 인덱스가 바뀔 때만 다시 그리기
            if (this._cw.index() !== this._lastIndex) {
                this._redraw();
            }
            this.visible = true;
            this._processTouch();
        } else {
            this.visible    = false;
            this._lastIndex = -99;
        }
    };

    //-------------------------------------------------------------------------
    // 레이아웃 계산
    // 메시지 창 좌표는 WindowLayer 기준 → Scene 기준으로 변환
    //-------------------------------------------------------------------------
    Sprite_ChoiceOverlay.prototype._layout = function() {
        var mw     = this._mw;
        var n      = $gameMessage.choices().length;
        var cols   = Math.min(n, COLS_PER_ROW);
        var rows   = Math.ceil(n / COLS_PER_ROW);
        var lh     = LINE_HEIGHT;
        var pad    = mw.standardPadding();
        var scene  = SceneManager._scene;
        var offX   = (scene && scene._windowLayer) ? scene._windowLayer.x : 0;
        var offY   = (scene && scene._windowLayer) ? scene._windowLayer.y : 0;
        var innerW = mw.width - pad * 2;
        var h      = rows * lh;
        var colW   = Math.floor((innerW - COL_SPACING * (cols - 1)) / cols);

        return {
            // Scene 절대 좌표
            x:    mw.x + offX + pad,
            y:    mw.y + offY + mw.height - pad - h,
            // 비트맵 크기
            w:    innerW,
            h:    h,
            cols: cols,
            rows: rows,
            lh:   lh,
            colW: colW
        };
    };

    //-------------------------------------------------------------------------
    // 비트맵에 선택지 텍스트 그리기
    //-------------------------------------------------------------------------
    Sprite_ChoiceOverlay.prototype._redraw = function() {
        var L       = this._layout();
        var choices = $gameMessage.choices();
        var selIdx  = this._cw.index();

        this.x = L.x;
        this.y = L.y;

        // 기존 비트맵 클리어 후 재사용, 또는 새로 생성
        if (this.bitmap && this.bitmap.width === L.w && this.bitmap.height === L.h) {
            this.bitmap.clear();
        } else {
            this.bitmap = new Bitmap(L.w, L.h);
        }
        this.bitmap.fontFace = FONT_FACE;
        this.bitmap.fontSize = FONT_SIZE;

        this._lastIndex = selIdx;

        for (var i = 0; i < choices.length; i++) {
            var col = i % COLS_PER_ROW;
            var row = Math.floor(i / COLS_PER_ROW);
            this.bitmap.textColor = (i === selIdx) ? SEL_COLOR : NORM_COLOR;
            this.bitmap.drawText(
                choices[i],
                col * (L.colW + COL_SPACING),  // x
                row * L.lh,                    // y
                L.colW,                        // maxWidth
                L.lh,                          // lineHeight
                'left'
            );
        }
    };

    //-------------------------------------------------------------------------
    // 터치/클릭 처리
    // 오버레이가 표시 중일 때 클릭 좌표와 각 항목 사각형을 비교
    //-------------------------------------------------------------------------
    Sprite_ChoiceOverlay.prototype._processTouch = function() {
        if (!TouchInput.isTriggered()) return;

        var L       = this._layout();
        var choices = $gameMessage.choices();
        var tx      = TouchInput.x - L.x;
        var ty      = TouchInput.y - L.y;

        for (var i = 0; i < choices.length; i++) {
            var col = i % COLS_PER_ROW;
            var row = Math.floor(i / COLS_PER_ROW);
            var rx  = col * (L.colW + COL_SPACING);
            var ry  = row * L.lh;
            if (tx >= rx && tx < rx + L.colW && ty >= ry && ty < ry + L.lh) {
                this._cw.select(i);
                this._cw.processOk();
                return;
            }
        }
    };

    //=========================================================================
    // Window_ChoiceList 수정
    // 시각 표시 없이 입력 처리만 담당
    //
    // visible = false  → WindowLayer에 스텐실(마스크)이 생기지 않음
    //                    → 메시지 창에 구멍이 뚫리지 않음
    // openness = 255   → isOpen() = true → 키보드/입력 처리 활성화
    // active = true    → processCursorMove 등 모든 입력 처리 작동
    //=========================================================================

    // 열 수: 키보드 좌우 이동에 사용
    Window_ChoiceList.prototype.maxCols = function() {
        return Math.min($gameMessage.choices().length, COLS_PER_ROW);
    };

    Window_ChoiceList.prototype.numVisibleRows = function() {
        return Math.ceil($gameMessage.choices().length / COLS_PER_ROW);
    };

    // start(): 창은 완전히 숨기고 입력만 켬
    Window_ChoiceList.prototype.start = function() {
        this.updatePlacement();
        this.updateBackground();
        this.refresh();
        this.selectDefault();
        this.openness = 255;   // isOpen() = true → 입력 처리 활성화
        this.activate();
        this.visible  = false; // 창 숨김 → WindowLayer 스텐실 없음
    };

    Window_ChoiceList.prototype.standardFontFace = function() {
        return FONT_FACE;
    };

    //=========================================================================
    // Scene_Map 패치
    // Sprite_ChoiceOverlay를 Scene 직속(WindowLayer 밖)에 추가
    //=========================================================================
    var _orig_createMessageWindow = Scene_Map.prototype.createMessageWindow;
    Scene_Map.prototype.createMessageWindow = function() {
        _orig_createMessageWindow.call(this);
        this._choiceOverlay = new Sprite_ChoiceOverlay(
            this._messageWindow,
            this._messageWindow._choiceWindow
        );
        // Scene.addChild → WindowLayer 밖 → 항상 최상위 레이어
        this.addChild(this._choiceOverlay);
    };

})();
