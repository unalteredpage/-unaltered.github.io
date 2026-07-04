//=============================================================================
// SavefileWindow.js
//=============================================================================
// 맵에서 병렬실행(플러그인 호출)으로 사용하는 세이브파일 스타일 윈도우
// = 실제 타이틀 화면을 대체하는 "가짜 타이틀" (변수 초기화 방지 목적)
//
// 구성: 이름 / LV / 플레이타임 / 옛날집(힌트N/리셋수N) / 버튼 3개
//   버튼: 정체불명의 종이 확인 | 리셋 | 설정
//=============================================================================

/*:
 * @plugindesc 세이브파일 스타일 정보 윈도우 - 가짜 타이틀 (배경/테두리 없음)
 * @author Claude
 *
 * @help
 * 플러그인 명령:
 *   ShowSavefileWindow     - 윈도우를 표시하고 입력을 활성화합니다 (플레이타임 정지)
 *   HideSavefileWindow     - 윈도우를 숨기고 비활성화합니다 (플레이타임 재개)
 *
 * 변수:
 *   0005번 - 힌트를 본 횟수
 *   0006번 - 클리어(리셋) 횟수
 *
 * 버튼 (좌→우):
 *   "정체불명의 종이 확인" → 공통이벤트 0002번 호출 후 창 닫힘
 *   "리셋"                 → 공통이벤트 0003번 호출 후 창 닫힘
 *   "설정"                 → 가상 설정 창 호출 (우측 상단 X 또는 ESC로 닫기)
 *                            (창은 닫히지 않고 옵션을 닫으면 그대로 돌아옴)
 *
 * 조작:
 *   좌/우 방향키 - 버튼 간 이동 (끝에서는 더 이상 넘어가지 않음)
 *   Z/Enter      - 선택 실행
 *   마우스 클릭   - 버튼 직접 클릭 실행
 *   선택된 버튼은 노란색으로 표시됩니다.
 */

(function() {
    'use strict';

    //=========================================================================
    // 상수
    //=========================================================================
    var PLAYER_NAME    = '프리스크';
    var PLAYER_LEVEL   = 1;
    var HINT_VAR_ID    = 5;   // 힌트를 본 횟수
    var CLEAR_VAR_ID   = 6;   // 클리어(리셋) 횟수
    var CE_PAPER       = 2;   // 정체불명의 종이 확인 → 공통이벤트 002
    var CE_RESET       = 3;   // 리셋 → 공통이벤트 003

    var FONT_FACE      = 'GameFont, Dotum, AppleGothic, sans-serif';
    var FONT_SIZE      = 28;
    var LINE_H         = 36;
    var BASE_MIN_WIDTH = 520; // 창의 최소 너비 (이전에 확정된 사이즈를 하한선으로 유지)
    var WIN_H          = LINE_H * 3 + 28;
    var SEL_COLOR      = '#ffff00';

    var BTN_PAD_X      = 12;  // 버튼 텍스트 좌우 여백(클릭 영역 확보용)
    var BTN_MIN_GAP    = 36;  // 버튼 사이 최소 간격

    var VOICE_SWITCH_ID = 15; // 보이스클립 ON/OFF 스위치
    var VOLUME_STEP     = 20; // 좌/우 키 1회당 볼륨 증감량 (5단계: 0,20,40,60,80,100)

    // 버튼 정의: 라벨 + 동작 타입. 순서가 곧 좌→우 배치 순서.
    var BUTTON_DEFS = [
        { label: '정체불명의 종이 확인', type: 'commonEvent', ceId: CE_PAPER },
        { label: '리셋',                 type: 'commonEvent', ceId: CE_RESET },
        { label: '설정',                 type: 'options' }
    ];

    //=========================================================================
    // 씬 재생성에도 살아남는 영속 상태
    //=========================================================================
    // RPG Maker MV의 SceneManager.push/pop은 이전 씬을 "재개"하지 않고
    // 매번 new Scene_Map() 으로 완전히 새로 만든다 (SceneManager.goto 내부 구현).
    //
    // "설정" → SceneManager.push(Scene_Options) → 옵션을 닫고 pop()으로 돌아오면
    // Scene_Map 자체가 새 인스턴스로 교체되고, 그 안의 Window_SavefileInfo도
    // 새로 만들어지며 기본값(숨김/비활성)으로 초기화된다.
    // → 옵션을 켰다 끄면 창이 사라진 것처럼 보였던 원인이 바로 이것.
    //
    // 해결: 표시 상태를 윈도우/씬 인스턴스가 아니라 이 IIFE 스코프(=스크립트가
    // 로드된 동안, 즉 게임 세션 내내 유지되는 모듈 변수)에 저장해두고,
    // 새 윈도우가 만들어질 때마다 그 값으로 복원한다.
    var _persistentState = {
        visible:     false, // ShowSavefileWindow ~ HideSavefileWindow 사이인지
        active:      false, // 메인 창이 입력을 받는 상태였는지
        cursorIndex: 0,     // 마지막으로 선택돼 있던 버튼
        optionsOpen: false  // 설정(가상 옵션) 창이 열려 있는지
    };

    //=========================================================================
    // 텍스트 폭 측정 유틸
    // Window 생성 전(=this.contents가 없는 시점)에도 너비를 계산할 수 있도록
    // 별도의 1x1 측정용 Bitmap을 재사용한다.
    //=========================================================================
    var _measureBitmap = null;
    function measureTextWidth(text) {
        if (!_measureBitmap) {
            _measureBitmap = new Bitmap(1, 1);
            _measureBitmap.fontFace = FONT_FACE;
            _measureBitmap.fontSize = FONT_SIZE;
        }
        return _measureBitmap.measureTextWidth(text);
    }

    // 버튼 3개가 최소 간격(BTN_MIN_GAP)으로 한 줄에 들어가기 위한 최소 너비
    function computeMinButtonRowWidth() {
        var sumW = 0;
        for (var i = 0; i < BUTTON_DEFS.length; i++) {
            sumW += measureTextWidth(BUTTON_DEFS[i].label) + BTN_PAD_X * 2;
        }
        return Math.ceil(sumW + BTN_MIN_GAP * (BUTTON_DEFS.length - 1));
    }

    //=========================================================================
    // Window_SavefileInfo
    //=========================================================================
    function Window_SavefileInfo() {
        this.initialize.apply(this, arguments);
    }

    Window_SavefileInfo.prototype = Object.create(Window_Base.prototype);
    Window_SavefileInfo.prototype.constructor = Window_SavefileInfo;

    Window_SavefileInfo.prototype.initialize = function() {
        // 너비: 기존 확정 사이즈(520)와 버튼 3개가 필요로 하는 최소 너비 중 큰 쪽
        var w  = Math.ceil(Math.max(BASE_MIN_WIDTH, computeMinButtonRowWidth()));
        var h  = WIN_H;
        var gw = Graphics.boxWidth;
        var gh = Graphics.boxHeight;
        var x  = Math.floor((gw - w) / 2);
        var y  = Math.floor((gh - h) / 2) - 30;

        Window_Base.prototype.initialize.call(this, x, y, w, h);

        // 배경/테두리/바탕 완전 제거
        this.opacity         = 0;   // 테두리(프레임) 투명
        this.backOpacity     = 0;   // 배경 투명
        this.contentsOpacity = 255;

        this._cursorIndex  = 0;     // 현재 선택된 버튼 인덱스
        this._active       = false;
        this._buttonRects  = null;  // _computeButtonLayout() 결과 캐시 (위치는 불변이므로 1회만 계산)
        this._buttonRowY   = 0;

        this.refresh();
        this._captureState();
    };

    // padding 0으로 설정해 내용이 테두리 없이 꽉 차게
    Window_SavefileInfo.prototype.standardPadding = function() {
        return 0;
    };

    Window_SavefileInfo.prototype.standardFontFace = function() {
        return FONT_FACE;
    };

    Window_SavefileInfo.prototype.standardFontSize = function() {
        return FONT_SIZE;
    };

    //-------------------------------------------------------------------------
    // 플레이타임 문자열 취득
    //-------------------------------------------------------------------------
    Window_SavefileInfo.prototype.playtimeText = function() {
        return $gameSystem.playtimeText();
    };

    //-------------------------------------------------------------------------
    // 전체 다시 그리기
    //-------------------------------------------------------------------------
    Window_SavefileInfo.prototype.refresh = function() {
        this.contents.clear();
        this.resetFontSettings();

        var lh = LINE_H;
        var w  = this.contentsWidth();

        // ── 1행: 이름   LV1   플레이타임 ──────────────────────────────────
        var nameText = PLAYER_NAME;
        var lvText   = 'LV ' + PLAYER_LEVEL;
        var timeText = this.playtimeText();

        this.changeTextColor(this.normalColor());
        this.drawText(nameText, 0,       0, 160);
        this.drawText(lvText,   160,     0, 100, 'center');
        this.drawText(timeText, w - 160, 0, 160, 'right');

        // ── 2행: 옛날 집  -  힌트N/클리어 수N ──────────────────────────────
        var hintVal  = $gameVariables.value(HINT_VAR_ID);
        var clearVal = $gameVariables.value(CLEAR_VAR_ID);
        var subLabel = '옛날 집';
        var subVal   = '힌트' + hintVal + '/' + '클리어 수' + clearVal;

        this.changeTextColor(this.normalColor());
        this.drawText(subLabel, 0,   lh, 100);
        this.drawText('-',      104, lh, 24, 'center');
        this.drawText(subVal,   136, lh, w - 136);

        // ── 3행: 버튼 3개 ─────────────────────────────────────────────────
        this._drawButtons(lh * 2);
    };

    //-------------------------------------------------------------------------
    // 버튼 레이아웃 계산
    // - 각 버튼은 텍스트 실측 너비 + 좌우 패딩만큼만 차지
    // - 남는 공간은 버튼 사이 간격에 균등 분배 (양 끝 버튼이 창 끝까지 퍼짐)
    // - 위치는 창 크기가 고정된 이후 절대 바뀌지 않으므로 1회만 계산해 캐시
    //-------------------------------------------------------------------------
    Window_SavefileInfo.prototype._computeButtonLayout = function() {
        var n      = BUTTON_DEFS.length;
        var widths = [];
        var sumW   = 0;
        var i;

        for (i = 0; i < n; i++) {
            var bw = measureTextWidth(BUTTON_DEFS[i].label) + BTN_PAD_X * 2;
            widths.push(bw);
            sumW += bw;
        }

        var contentW = this.contentsWidth();
        var gap = (n > 1) ? Math.max(BTN_MIN_GAP, (contentW - sumW) / (n - 1)) : 0;

        var rects = [];
        var x = 0;
        for (i = 0; i < n; i++) {
            rects.push({ x: x, width: widths[i] });
            x += widths[i] + gap;
        }
        return rects;
    };

    //-------------------------------------------------------------------------
    // 버튼 그리기
    //-------------------------------------------------------------------------
    Window_SavefileInfo.prototype._drawButtons = function(y) {
        if (!this._buttonRects) {
            this._buttonRects = this._computeButtonLayout();
        }
        this._buttonRowY = y;

        var selected = this._active ? this._cursorIndex : -1;

        for (var i = 0; i < BUTTON_DEFS.length; i++) {
            var rect = this._buttonRects[i];
            this.changeTextColor(i === selected ? SEL_COLOR : this.normalColor());
            this.drawText(BUTTON_DEFS[i].label, rect.x, y, rect.width);
        }
    };

    //-------------------------------------------------------------------------
    // 활성화 / 비활성화
    //-------------------------------------------------------------------------
    Window_SavefileInfo.prototype.activateWindow = function(startIndex) {
        this._active = true;
        if (typeof startIndex === 'number') {
            this._cursorIndex = Math.min(Math.max(startIndex, 0), BUTTON_DEFS.length - 1);
        } else {
            this._cursorIndex = 0;
        }
        this._inputGuard = true; // 활성화된 프레임의 잔류 입력(옵션 닫기 ESC 등) 1프레임 무시
        this.refresh();
        this._captureState();
    };

    Window_SavefileInfo.prototype.deactivateWindow = function() {
        this._active = false;
        this.refresh();
        this._captureState();
    };

    //-------------------------------------------------------------------------
    // 변경 감지용 상태 스냅샷
    // (initialize / activateWindow / deactivateWindow 에서 명시적으로 refresh한
    //  직후 호출해, update()의 dirty-check가 같은 프레임에 또 refresh하지 않도록 함)
    //-------------------------------------------------------------------------
    Window_SavefileInfo.prototype._captureState = function() {
        this._lastTimeText    = this.playtimeText();
        this._lastHintVal     = $gameVariables.value(HINT_VAR_ID);
        this._lastClearVal    = $gameVariables.value(CLEAR_VAR_ID);
        this._lastCursorIndex = this._cursorIndex;
        this._lastActiveState = this._active;

        // 씬이 재생성돼도 복원할 수 있도록 모듈 스코프에도 함께 기록
        _persistentState.active      = this._active;
        _persistentState.cursorIndex = this._cursorIndex;
    };

    //-------------------------------------------------------------------------
    // 값이 실제로 바뀐 경우에만 다시 그림 (매 프레임 무조건 refresh하지 않음)
    //-------------------------------------------------------------------------
    Window_SavefileInfo.prototype._refreshIfDirty = function() {
        var dirty =
            this.playtimeText()               !== this._lastTimeText    ||
            $gameVariables.value(HINT_VAR_ID)  !== this._lastHintVal     ||
            $gameVariables.value(CLEAR_VAR_ID) !== this._lastClearVal    ||
            this._cursorIndex                  !== this._lastCursorIndex ||
            this._active                       !== this._lastActiveState;

        if (dirty) {
            this.refresh();
            this._captureState();
        }
    };

    //-------------------------------------------------------------------------
    // update: 키보드 + 마우스 입력 처리
    //-------------------------------------------------------------------------
    Window_SavefileInfo.prototype.update = function() {
        Window_Base.prototype.update.call(this);

        this._refreshIfDirty();

        if (!this._active) return;

        // 활성화된 첫 프레임은 입력을 무시 (옵션 창을 ESC로 닫고 돌아온 직후의
        // 잔류 입력이 메인 창에서 곧바로 처리되는 것을 방지)
        if (this._inputGuard) {
            this._inputGuard = false;
            return;
        }

        // 좌/우 방향키 (끝에서는 더 넘어가지 않음)
        if (Input.isTriggered('left')) {
            if (this._cursorIndex > 0) {
                this._cursorIndex--;
                SoundManager.playCursor();
            }
        } else if (Input.isTriggered('right')) {
            if (this._cursorIndex < BUTTON_DEFS.length - 1) {
                this._cursorIndex++;
                SoundManager.playCursor();
            }
        }

        // 결정 (Z / Enter / Space)
        if (Input.isTriggered('ok')) {
            this._executeButton(this._cursorIndex);
        }

        // 마우스/터치 클릭 처리
        if (TouchInput.isTriggered()) {
            this._processTouch();
        }
    };

    //-------------------------------------------------------------------------
    // 버튼 실행
    //-------------------------------------------------------------------------
    Window_SavefileInfo.prototype._executeButton = function(index) {
        var def = BUTTON_DEFS[index];
        if (!def) return;

        SoundManager.playOk();

        switch (def.type) {
            case 'options':
                // 씬 전환 없이 가상 설정 창을 연다.
                // (Scene_Options를 push하면 Scene_Map이 재생성되며 입력이 꼬이는
                //  문제가 있어, 같은 씬 안의 별도 윈도우로 처리한다.)
                this._openOptions();
                break;

            case 'commonEvent':
                $gameTemp.reserveCommonEvent(def.ceId);
                unfreezePlaytime();
                this.deactivateWindow();
                break;
        }
    };

    //-------------------------------------------------------------------------
    // 설정 창 열기: 메인 창은 입력만 잠그고(표시는 유지), 옵션 창에 포커스 이양
    //-------------------------------------------------------------------------
    Window_SavefileInfo.prototype._openOptions = function() {
        this._active = false; // 메인 창 입력 잠금 (표시는 그대로)
        _persistentState.active = false;
        _persistentState.optionsOpen = true;
        this.refresh();
        if (this._optionsWindow) {
            this._optionsWindow.activateWindow();
        }
    };

    //-------------------------------------------------------------------------
    // 설정 창에서 돌아오기: 메인 창 입력 복구
    //-------------------------------------------------------------------------
    Window_SavefileInfo.prototype.onOptionsClosed = function() {
        _persistentState.optionsOpen = false;
        this.activateWindow(this._cursorIndex);
    };

    //-------------------------------------------------------------------------
    // 터치/마우스 클릭 판정
    // (캔버스 표시 스케일 + DOM 오프셋 보정 — 확인된 동작 방식 유지)
    //-------------------------------------------------------------------------
    Window_SavefileInfo.prototype._processTouch = function() {
        if (!this._buttonRects) return;

        var scaleX = Graphics.width  / Graphics.boxWidth;
        var scaleY = Graphics.height / Graphics.boxHeight;

        var canvas  = Graphics._canvas;
        var rect    = canvas ? canvas.getBoundingClientRect() : { left: 0, top: 0 };
        var offsetX = rect.left / scaleX;
        var offsetY = rect.top  / scaleY;

        var gx = TouchInput.x / scaleX - offsetX;
        var gy = TouchInput.y / scaleY - offsetY;

        var tx = gx - this.x;
        var ty = gy - this.y;
        var by = this._buttonRowY;

        for (var i = 0; i < this._buttonRects.length; i++) {
            var r = this._buttonRects[i];
            if (tx >= r.x && tx < r.x + r.width &&
                ty >= by  && ty < by + LINE_H) {
                this._cursorIndex = i;
                this._executeButton(i);
                return;
            }
        }
    };

    //=========================================================================
    // Window_FakeOptions  (가상 설정 창)
    //
    // 씬 전환 없이 같은 Scene_Map 안에서 동작하는 옵션 창.
    // 항목: BGM 볼륨 / SE 볼륨 / 보이스클립(스위치 15번)
    //   - 위/아래: 항목 이동
    //   - 좌/우  : 값 변경 (볼륨 ±20, 보이스 ON/OFF 토글)
    //   - ESC/X  : 닫고 메인 창으로 복귀
    // 선택된 항목은 노란색으로 표시.
    //=========================================================================
    var OPT_W      = 460;
    var OPT_ROW_H  = 44;
    var OPT_PAD    = 20;

    // 우측 상단 X(닫기) 버튼
    var CLOSE_BTN_W   = 40;  // 클릭 영역 너비
    var CLOSE_BTN_H   = 36;  // 클릭 영역 높이
    var CLOSE_BTN_Y   = 0;   // contents 기준 Y
    var OPT_TOP_SPACE = 44;  // X버튼과 겹치지 않도록 항목을 아래로 내리는 여백

    // 옵션 항목 정의
    var OPTION_DEFS = [
        { key: 'bgmVolume', label: 'BGM 음량', type: 'volume' },
        { key: 'seVolume',  label: 'SE 음량',  type: 'volume' },
        { key: 'voice',     label: '보이스클립', type: 'switch' }
    ];

    function Window_FakeOptions() {
        this.initialize.apply(this, arguments);
    }

    Window_FakeOptions.prototype = Object.create(Window_Base.prototype);
    Window_FakeOptions.prototype.constructor = Window_FakeOptions;

    Window_FakeOptions.prototype.initialize = function() {
        var w = OPT_W;
        var h = OPTION_DEFS.length * OPT_ROW_H + OPT_PAD * 2 + OPT_TOP_SPACE;
        var x = Math.floor((Graphics.boxWidth  - w) / 2);
        var y = Math.floor((Graphics.boxHeight - h) / 2) - 30; // 메인 창과 같은 중앙선

        Window_Base.prototype.initialize.call(this, x, y, w, h);

        this._index      = 0;
        this._active     = false;
        this._owner      = null; // 메인 창 참조 (닫을 때 복귀 통지)
        this._inputGuard = false;
        this.openness    = 255;
        this.visible     = false;
        this.refresh();
    };

    Window_FakeOptions.prototype.standardFontFace = function() {
        return FONT_FACE;
    };

    Window_FakeOptions.prototype.standardFontSize = function() {
        return FONT_SIZE;
    };

    Window_FakeOptions.prototype.setOwner = function(owner) {
        this._owner = owner;
    };

    //-------------------------------------------------------------------------
    // 값 읽기/쓰기
    //-------------------------------------------------------------------------
    Window_FakeOptions.prototype._getValue = function(def) {
        if (def.type === 'volume') {
            return ConfigManager[def.key];
        } else { // switch
            return $gameSwitches.value(VOICE_SWITCH_ID);
        }
    };

    Window_FakeOptions.prototype._valueText = function(def) {
        if (def.type === 'volume') {
            return ConfigManager[def.key] + '%';
        } else {
            return $gameSwitches.value(VOICE_SWITCH_ID) ? 'ON' : 'OFF';
        }
    };

    //-------------------------------------------------------------------------
    // 그리기
    //-------------------------------------------------------------------------
    Window_FakeOptions.prototype.refresh = function() {
        this.contents.clear();
        this.resetFontSettings();

        var w = this.contentsWidth();

        // ── 우측 상단 X(닫기) 버튼 ────────────────────────────────────────
        // 클릭 영역은 _processTouch()의 _closeBtnRect 판정과 좌표를 맞춘다.
        this.changeTextColor(this.normalColor());
        this.drawText('X', w - CLOSE_BTN_W, CLOSE_BTN_Y, CLOSE_BTN_W, 'center');

        for (var i = 0; i < OPTION_DEFS.length; i++) {
            var def = OPTION_DEFS[i];
            var y   = OPT_TOP_SPACE + i * OPT_ROW_H;
            var sel = (i === this._index && this._active);

            this.changeTextColor(sel ? SEL_COLOR : this.normalColor());
            // 항목명 (왼쪽)
            this.drawText(def.label, 0, y, Math.floor(w * 0.55));
            // 값 (오른쪽). 볼륨이면 화살표 표시로 조절 가능함을 암시
            var valText = this._valueText(def);
            if (def.type === 'volume') {
                valText = '◄ ' + valText + ' ►';
            } else {
                valText = '◄ ' + valText + ' ►';
            }
            this.drawText(valText, Math.floor(w * 0.55), y, Math.floor(w * 0.45), 'right');
        }
    };

    //-------------------------------------------------------------------------
    // 활성/비활성
    //-------------------------------------------------------------------------
    Window_FakeOptions.prototype.activateWindow = function() {
        this._active = true;
        this._index  = 0;
        this.visible = true;
        this._inputGuard = true; // 활성화된 프레임의 잔류 입력(설정 버튼의 ok 등) 1프레임 무시
        this.refresh();
    };

    Window_FakeOptions.prototype.deactivateWindow = function() {
        this._active = false;
        this.visible = false;
        this.refresh();
    };

    //-------------------------------------------------------------------------
    // 값 변경
    //-------------------------------------------------------------------------
    Window_FakeOptions.prototype._changeValue = function(def, dir) {
        if (def.type === 'volume') {
            var v = ConfigManager[def.key] + dir * VOLUME_STEP;
            v = Math.max(0, Math.min(100, v));
            // ConfigManager의 bgmVolume/seVolume은 setter로 구현돼 있어,
            // 값을 대입하면 AudioManager에 즉시 반영된다(현재 재생 중인 BGM 포함).
            ConfigManager[def.key] = v;
            SoundManager.playCursor();
        } else { // switch (토글: 방향 무관)
            var cur = $gameSwitches.value(VOICE_SWITCH_ID);
            $gameSwitches.setValue(VOICE_SWITCH_ID, !cur);
            SoundManager.playCursor();
        }
        this.refresh();
    };

    //-------------------------------------------------------------------------
    // 입력 처리
    //-------------------------------------------------------------------------
    Window_FakeOptions.prototype.update = function() {
        Window_Base.prototype.update.call(this);
        if (!this._active) return;

        // 활성화된 첫 프레임은 입력을 무시한다.
        // ("설정"을 ok로 눌러 창이 열린 그 프레임에 같은 ok가 새어들어와
        //  보이스클립이 즉시 토글되는 것을 방지)
        if (this._inputGuard) {
            this._inputGuard = false;
            return;
        }

        var def = OPTION_DEFS[this._index];

        // 위/아래: 항목 이동
        if (Input.isRepeated('down')) {
            this._index = (this._index + 1) % OPTION_DEFS.length;
            SoundManager.playCursor();
            this.refresh();
        } else if (Input.isRepeated('up')) {
            this._index = (this._index - 1 + OPTION_DEFS.length) % OPTION_DEFS.length;
            SoundManager.playCursor();
            this.refresh();
        }

        // 좌/우: 값 변경
        if (Input.isRepeated('right')) {
            this._changeValue(def, +1);
        } else if (Input.isRepeated('left')) {
            this._changeValue(def, -1);
        }

        // 보이스클립은 결정(ok)로도 토글
        if (Input.isTriggered('ok') && def.type === 'switch') {
            this._changeValue(def, +1);
        }

        // ESC/X: 닫기
        if (Input.isTriggered('cancel')) {
            this._close();
        }

        // 마우스 클릭으로 항목 선택/조절
        if (TouchInput.isTriggered()) {
            this._processTouch();
        }
    };

    Window_FakeOptions.prototype._close = function() {
        SoundManager.playCancel();
        ConfigManager.save(); // 변경한 옵션 저장
        this.deactivateWindow();
        if (this._owner) {
            this._owner.onOptionsClosed();
        }
    };

    //-------------------------------------------------------------------------
    // 클릭 판정: 항목 행을 클릭하면 선택, 좌/우 절반 클릭으로 값 증감
    //-------------------------------------------------------------------------
    Window_FakeOptions.prototype._processTouch = function() {
        var scaleX = Graphics.width  / Graphics.boxWidth;
        var scaleY = Graphics.height / Graphics.boxHeight;
        var canvas = Graphics._canvas;
        var rect   = canvas ? canvas.getBoundingClientRect() : { left: 0, top: 0 };
        var gx = TouchInput.x / scaleX - rect.left / scaleX;
        var gy = TouchInput.y / scaleY - rect.top  / scaleY;

        var tx = gx - this.x - this.padding;
        var ty = gy - this.y - this.padding;

        // 우측 상단 X(닫기) 버튼 판정
        var w = this.contentsWidth();
        if (tx >= w - CLOSE_BTN_W && tx < w &&
            ty >= CLOSE_BTN_Y && ty < CLOSE_BTN_Y + CLOSE_BTN_H) {
            this._close();
            return;
        }

        for (var i = 0; i < OPTION_DEFS.length; i++) {
            var rowY = OPT_TOP_SPACE + i * OPT_ROW_H;
            if (ty >= rowY && ty < rowY + OPT_ROW_H) {
                this._index = i;
                var def = OPTION_DEFS[i];
                // 행의 오른쪽 절반을 클릭하면 +, 왼쪽 절반이면 -
                var half = this.contentsWidth() / 2;
                this._changeValue(def, (tx >= half) ? +1 : -1);
                return;
            }
        }
    };

    //=========================================================================
    // Game_System 패치: 플레이타임 정지/재개
    //=========================================================================
    // $gameSystem.playtimeText() 는 내부적으로 Graphics.frameCount 기반 경과시간을
    // 계산하므로, frameCount 자체를 멈추지 않고 "표시값"만 스냅샷으로 고정한다.

    var _frozenPlaytime = null; // null이면 정지 안 된 상태 (단위: 프레임)

    var _Game_System_playtimeText = Game_System.prototype.playtimeText;
    Game_System.prototype.playtimeText = function() {
        if (_frozenPlaytime !== null) {
            var totalSec = Math.floor(_frozenPlaytime / 60);
            var h = Math.floor(totalSec / 3600);
            var m = Math.floor(totalSec / 60) % 60;
            var s = totalSec % 60;
            return h.padZero(2) + ':' + m.padZero(2) + ':' + s.padZero(2);
        }
        return _Game_System_playtimeText.call(this);
    };

    function freezePlaytime() {
        if (_frozenPlaytime !== null) return; // 이미 정지된 상태

        if (typeof $gameSystem.playtime === 'function') {
            _frozenPlaytime = $gameSystem.playtime() * 60; // 초 → 프레임 환산
        } else {
            // 구버전 호환: playtime() 미존재 시 frameCount로 대체
            _frozenPlaytime = Graphics.frameCount;
        }
    }

    function unfreezePlaytime() {
        _frozenPlaytime = null;
    }

    //=========================================================================
    // Scene_Map 주입: 윈도우 생성
    //=========================================================================
    var _Scene_Map_createAllWindows = Scene_Map.prototype.createAllWindows;
    Scene_Map.prototype.createAllWindows = function() {
        _Scene_Map_createAllWindows.call(this);

        // 메인(가짜 타이틀) 창
        this._savefileWindow = new Window_SavefileInfo();
        this._savefileWindow.visible = _persistentState.visible;

        // 가상 설정 창 (메인 창 위에 겹쳐 표시)
        this._fakeOptionsWindow = new Window_FakeOptions();
        this._fakeOptionsWindow.setOwner(this._savefileWindow);
        this._savefileWindow._optionsWindow = this._fakeOptionsWindow;

        // 표시 상태 복원: 메인 창이 떠 있어야 입력 상태를 복원한다.
        // (현재는 설정도 가상 창이라 씬 재생성이 일어나지 않지만, 다른 사유로
        //  Scene_Map이 재생성되는 경우에도 안전하게 동작하도록 유지)
        if (_persistentState.visible) {
            if (_persistentState.optionsOpen) {
                // 설정 창이 열린 채로 복원: 메인은 입력잠금, 옵션 창 활성화
                this._fakeOptionsWindow.activateWindow();
            } else if (_persistentState.active) {
                this._savefileWindow.activateWindow(_persistentState.cursorIndex);
            }
        }

        this.addChild(this._savefileWindow);
        this.addChild(this._fakeOptionsWindow);
    };

    //=========================================================================
    // Plugin Command
    //=========================================================================
    var _Game_Interpreter_pluginCommand = Game_Interpreter.prototype.pluginCommand;
    Game_Interpreter.prototype.pluginCommand = function(command, args) {
        _Game_Interpreter_pluginCommand.call(this, command, args);

        switch (command) {
            case 'ShowSavefileWindow':
                if (SceneManager._scene && SceneManager._scene._savefileWindow) {
                    freezePlaytime();
                    SceneManager._scene._savefileWindow.visible = true;
                    SceneManager._scene._savefileWindow.activateWindow();
                    _persistentState.visible = true;
                }
                break;

            case 'HideSavefileWindow':
                if (SceneManager._scene && SceneManager._scene._savefileWindow) {
                    var scn = SceneManager._scene;
                    // 설정 창이 열려 있으면 함께 닫는다
                    if (scn._fakeOptionsWindow) {
                        scn._fakeOptionsWindow.deactivateWindow();
                    }
                    scn._savefileWindow.deactivateWindow();
                    scn._savefileWindow.visible = false;
                    unfreezePlaytime();
                    _persistentState.visible     = false;
                    _persistentState.optionsOpen = false;
                }
                break;
        }
    };

})();