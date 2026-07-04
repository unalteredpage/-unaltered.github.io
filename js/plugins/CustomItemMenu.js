//=============================================================================
// CustomMessageWindow.js
//=============================================================================

/*:
 * @plugindesc v1.6.0 텍스트창(메시지 윈도우)의 크기, 위치, 여백, 폰트, 타이핑 속도를 자유롭게 커스텀합니다.
 * @author Claude
 *
 * @param --- 창 크기 ---
 * @default
 *
 * @param windowWidth
 * @parent --- 창 크기 ---
 * @text 창 너비
 * @desc 메시지 창의 너비 (픽셀). 0이면 기본값(화면 전체 너비) 사용.
 * @type number
 * @min 0
 * @default 0
 *
 * @param windowHeight
 * @parent --- 창 크기 ---
 * @text 창 높이
 * @desc 메시지 창의 높이 (픽셀). 0이면 기본값(줄 수 기반) 사용.
 * @type number
 * @min 0
 * @default 0
 *
 * @param numLines
 * @parent --- 창 크기 ---
 * @text 표시 줄 수
 * @desc 한 번에 표시할 텍스트 줄 수. (기본: 4)
 * @type number
 * @min 1
 * @max 10
 * @default 4
 *
 * @param --- 창 위치 ---
 * @default
 *
 * @param windowX
 * @parent --- 창 위치 ---
 * @text X 위치
 * @desc 창의 X 좌표. -1이면 자동(가운데 정렬).
 * @type number
 * @min -1
 * @default -1
 *
 * @param windowY
 * @parent --- 창 위치 ---
 * @text Y 위치
 * @desc 창의 Y 좌표. -1이면 자동(포지션 파라미터 기준).
 * @type number
 * @min -1
 * @default -1
 *
 * @param --- 여백 및 텍스트 ---
 * @default
 *
 * @param paddingH
 * @parent --- 여백 및 텍스트 ---
 * @text 수평 여백
 * @desc 텍스트의 좌우 여백 (픽셀). -1이면 기본값 사용.
 * @type number
 * @min -1
 * @default -1
 *
 * @param paddingV
 * @parent --- 여백 및 텍스트 ---
 * @text 수직 여백
 * @desc 텍스트의 상하 여백 (픽셀). -1이면 기본값 사용.
 * @type number
 * @min -1
 * @default -1
 *
 * @param fontSize
 * @parent --- 여백 및 텍스트 ---
 * @text 폰트 크기
 * @desc 메시지 창의 기본 폰트 크기. 0이면 기본값(28) 사용.
 * @type number
 * @min 0
 * @max 72
 * @default 0
 *
 * @param lineHeight
 * @parent --- 여백 및 텍스트 ---
 * @text 줄 간격
 * @desc 텍스트 줄 간격 (픽셀). 0이면 기본값 사용.
 * @type number
 * @min 0
 * @default 0
 *
 * @param --- 투명도 및 스킨 ---
 * @default
 *
 * @param windowOpacity
 * @parent --- 투명도 및 스킨 ---
 * @text 창 불투명도
 * @desc 창 배경의 불투명도 (0~255). -1이면 기본값(192) 사용.
 * @type number
 * @min -1
 * @max 255
 * @default -1
 *
 * @param dimOpacity
 * @parent --- 투명도 및 스킨 ---
 * @text 딤 배경 불투명도
 * @desc 딤(어둡게) 배경의 불투명도 (0~255). -1이면 기본값 사용.
 * @type number
 * @min -1
 * @max 255
 * @default -1
 *
 * @param --- 폰트 설정 ---
 * @default
 *
 * @param fontFace
 * @parent --- 폰트 설정 ---
 * @text 폰트 이름
 * @desc 사용할 폰트 이름. 비워두면 기본값(GameFont) 사용.
 *       커스텀 폰트는 fonts/ 폴더에 넣고 fonts/gamefont.css에 등록 필요.
 * @type string
 * @default
 *
 * @param fontBold
 * @parent --- 폰트 설정 ---
 * @text 굵게(Bold)
 * @desc 텍스트를 굵게 표시합니다.
 * @type boolean
 * @default false
 *
 * @param fontItalic
 * @parent --- 폰트 설정 ---
 * @text 기울임(Italic)
 * @desc 텍스트를 기울여 표시합니다.
 * @type boolean
 * @default false
 *
 * @param fontColor
 * @parent --- 폰트 설정 ---
 * @text 기본 텍스트 색상
 * @desc CSS 색상 문자열. 예: #ffffff, rgba(255,200,100,1). 비워두면 기본값 사용.
 * @type string
 * @default
 *
 * @param fontOutlineColor
 * @parent --- 폰트 설정 ---
 * @text 외곽선 색상
 * @desc 텍스트 외곽선 색상. 예: rgba(0,0,0,0.8). 비워두면 기본값 사용.
 * @type string
 * @default
 *
 * @param fontOutlineWidth
 * @parent --- 폰트 설정 ---
 * @text 외곽선 두께
 * @desc 텍스트 외곽선 두께 (픽셀). 0이면 기본값(4) 사용.
 * @type number
 * @min 0
 * @max 20
 * @default 0
 *
 * @param --- 타이핑 속도 ---
 * @default
 *
 * @param typeSpeed
 * @parent --- 타이핑 속도 ---
 * @text 타이핑 속도
 * @desc 글자 한 개를 출력하는 데 걸리는 프레임 수. (소수 입력 가능)
 *       3 = 기본(보통) / 10 = 느림 / 1 = 매 프레임 한 글자
 *       0.5 = 매 프레임 두 글자 / 0.25 = 매 프레임 네 글자
 *       0 = 기본값(즉시 완료) 사용
 * @type number
 * @decimals 2
 * @min 0
 * @max 60
 * @default 0
 *
 * @param typeSpeedBoost
 * @parent --- 타이핑 속도 ---
 * @text 결정버튼 가속 배율
 * @desc 결정 버튼(Enter/Space/Z)을 누를 때 속도를 몇 배 빠르게 할지.
 *       1이면 가속 없음, 4이면 4배 빠르게. 0이면 기본값(즉시 완료) 사용. (소수 가능)
 * @type number
 * @decimals 2
 * @min 0
 * @max 20
 * @default 0
 *
 * @help
 * ============================================================
 * CustomMessageWindow.js - 메시지 창 커스터마이저
 * ============================================================
 *
 * 플러그인 매개변수로 메시지 창의 크기/위치/여백/폰트를
 * 세밀하게 조정할 수 있습니다.
 *
 * ▶ 사용법
 *   플러그인 매니저에서 각 값을 설정하세요.
 *   0 또는 -1로 설정된 항목은 RPG Maker 기본값을 그대로 사용합니다.
 *
 * ▶ 즉시 출력 (빨리 넘기기)
 *   텍스트가 타이핑되는 도중 [X] · [Shift] · [Enter] 키 중 하나를
 *   누르고 있으면 남은 텍스트가 애니메이션 없이 즉시 전체 표시됩니다.
 *   (타이핑 속도 설정과 무관)
 *
 * ▶ 커스텀 폰트 등록 방법
 *   1) 폰트 파일(.ttf/.woff 등)을 프로젝트의 fonts/ 폴더에 복사
 *   2) fonts/gamefont.css 파일을 열어 아래 형식으로 추가:
 *      @font-face {
 *        font-family: '폰트이름';
 *        src: url('파일명.ttf');
 *      }
 *   3) 플러그인 파라미터 [폰트 이름]에 등록한 font-family 이름 입력
 *
 * ▶ 플러그인 커맨드
 *   아래 커맨드로 인게임 도중 값을 변경할 수 있습니다.
 *
 *   MSGWIN WIDTH <값>           창 너비 변경 (0=기본값)
 *   MSGWIN HEIGHT <값>          창 높이 변경 (0=기본값)
 *   MSGWIN LINES <값>           표시 줄 수 변경
 *   MSGWIN X <값>               X 위치 변경 (-1=자동)
 *   MSGWIN Y <값>               Y 위치 변경 (-1=자동)
 *   MSGWIN FONT_SIZE <값>       폰트 크기 변경 (0=기본값)
 *   MSGWIN FONT_FACE <폰트명>   폰트 이름 변경 (none=기본값)
 *   MSGWIN FONT_BOLD on/off     굵게 켜기/끄기
 *   MSGWIN FONT_ITALIC on/off   기울임 켜기/끄기
 *   MSGWIN FONT_COLOR <색상>    텍스트 색상 변경 (none=기본값)
 *                               예: #ff8800  또는  rgba(255,100,0,1)
 *   MSGWIN OUTLINE_COLOR <색상> 외곽선 색상 변경 (none=기본값)
 *   MSGWIN OUTLINE_WIDTH <값>   외곽선 두께 변경 (0=기본값)
 *   MSGWIN OPACITY <값>         창 불투명도 변경 (0~255)
 *   MSGWIN PADDING_H <값>       수평 여백 변경 (-1=기본값)
 *   MSGWIN PADDING_V <값>       수직 여백 변경 (-1=기본값)
 *   MSGWIN SPEED <값>           타이핑 속도 변경 (프레임/글자, 0=기본값)
 *   MSGWIN SPEED_BOOST <값>     가속 배율 변경 (0=기본값)
 *   MSGWIN RESET                모든 값을 플러그인 매개변수 초기값으로 리셋
 *
 * ▶ 예시
 *   MSGWIN FONT_SIZE 24
 *   MSGWIN FONT_FACE MyFont
 *   MSGWIN FONT_BOLD on
 *   MSGWIN FONT_COLOR #ffe0a0
 *   MSGWIN OUTLINE_COLOR rgba(80,40,0,0.9)
 *   MSGWIN OUTLINE_WIDTH 6
 *   MSGWIN SPEED 1
 *   MSGWIN SPEED_BOOST 4
 *   MSGWIN RESET
 *
 * ============================================================
 * 업데이트 이력
 *   v1.0.0 - 최초 배포
 *   v1.1.0 - 플러그인 커맨드 추가, 딤 불투명도 지원
 *   v1.2.0 - 수직 여백, 줄 간격, lineHeight 파라미터 추가
 *   v1.3.0 - 폰트 이름/굵기/기울임/색상/외곽선 설정 추가
 *   v1.4.0 - 타이핑 속도(typeSpeed), 가속 배율(typeSpeedBoost) 추가
 *   v1.5.0 - 즉시 출력 기능 추가: 텍스트 출력 도중 X키 또는 Shift키를
 *            누르면 남은 텍스트가 애니메이션 없이 즉시 전체 표시됨 (X/Shift/Enter)
 *   v1.6.0 - 타이핑 속도 소수점 입력 지원. 0.5 = 프레임당 2글자처럼
 *            1 미만 값으로 초고속 출력 가능(누적 방식). typeSpeedBoost도 소수 허용.
 * ============================================================
 */

(function() {
    'use strict';

    //=========================================================================
    // 즉시 출력 키 등록
    //=========================================================================
    // MV 기본 keyMapper에는 X키(88)가 없으므로 직접 등록한다.
    // Input이 키 상태(_currentState 등)를 기록하려면 keyMapper에 반드시
    // 해당 keyCode가 있어야 하므로 이 등록이 필수다.
    // (다른 플러그인이 88을 이미 쓰고 있으면 그 값을 존중해 덮어쓰지 않는다.)
    if (!Input.keyMapper[88]) {
        Input.keyMapper[88] = 'msgwinInstant';
    }
    // 실제 감지에 사용할 논리키 이름(위에서 88이 이미 다른 이름이면 그 이름 사용)
    var _INSTANT_KEY = Input.keyMapper[88];

    //=========================================================================
    // 파라미터 파싱
    //=========================================================================
    var parameters = PluginManager.parameters('CustomMessageWindow');

    var _defaultParams = {
        windowWidth:      parseInt(parameters['windowWidth'])   || 0,
        windowHeight:     parseInt(parameters['windowHeight'])  || 0,
        numLines:         parseInt(parameters['numLines'])      || 4,
        windowX:          parseInt(parameters['windowX'])       !== 0 ? parseInt(parameters['windowX']) : -1,
        windowY:          parseInt(parameters['windowY'])       !== 0 ? parseInt(parameters['windowY']) : -1,
        paddingH:         parseInt(parameters['paddingH'])      !== 0 ? parseInt(parameters['paddingH']) : -1,
        paddingV:         parseInt(parameters['paddingV'])      !== 0 ? parseInt(parameters['paddingV']) : -1,
        fontSize:         parseInt(parameters['fontSize'])      || 0,
        lineHeight:       parseInt(parameters['lineHeight'])    || 0,
        windowOpacity:    parseInt(parameters['windowOpacity']) !== 0 ? parseInt(parameters['windowOpacity']) : -1,
        dimOpacity:       parseInt(parameters['dimOpacity'])    !== 0 ? parseInt(parameters['dimOpacity']) : -1,
        // 폰트 설정
        fontFace:         String(parameters['fontFace']         || '').trim(),
        fontBold:         String(parameters['fontBold']         || 'false') === 'true',
        fontItalic:       String(parameters['fontItalic']       || 'false') === 'true',
        fontColor:        String(parameters['fontColor']        || '').trim(),
        fontOutlineColor: String(parameters['fontOutlineColor'] || '').trim(),
        fontOutlineWidth: parseInt(parameters['fontOutlineWidth']) || 0,
        // 타이핑 속도
        typeSpeed:        parseFloat(parameters['typeSpeed'])       || 0,
        typeSpeedBoost:   parseFloat(parameters['typeSpeedBoost'])  || 0,
    };

    // 런타임 덮어쓰기용 복사본
    var _runtimeParams = JSON.parse(JSON.stringify(_defaultParams));

    //=========================================================================
    // 런타임 창 크기 즉시 반영 헬퍼
    //=========================================================================
    // WIDTH / HEIGHT / LINES 커맨드 실행 시 이미 생성된 Window_Message 인스턴스에
    // 새 크기를 바로 적용한다. SceneManager._scene._messageWindow 를 통해 접근.
    function _applyWindowSize() {
        var scene = SceneManager._scene;
        if (!scene || !scene._messageWindow) return;
        var win = scene._messageWindow;
        var newW = win.windowWidth();
        var newH = win.windowHeight();
        // X 위치 재계산 (자동이면 가운데 정렬 유지)
        var newX = _runtimeParams.windowX >= 0
                    ? _runtimeParams.windowX
                    : (Graphics.boxWidth - newW) / 2;
        win.move(newX, win.y, newW, newH);
        win.createContents();
    }

    //=========================================================================
    // 플러그인 커맨드
    //=========================================================================
    var _Game_Interpreter_pluginCommand = Game_Interpreter.prototype.pluginCommand;
    Game_Interpreter.prototype.pluginCommand = function(command, args) {
        _Game_Interpreter_pluginCommand.call(this, command, args);

        if (command.toUpperCase() !== 'MSGWIN') return;

        var sub  = (args[0] || '').toUpperCase();
        var val  = parseInt(args[1]);
        var fval = parseFloat(args[1]);  // 소수 허용 파라미터(SPEED 등)용
        var sval = (args[1] || '').trim();

        switch (sub) {
            case 'WIDTH':
                _runtimeParams.windowWidth = isNaN(val) ? 0 : val;
                _applyWindowSize();
                break;
            case 'HEIGHT':
                _runtimeParams.windowHeight = isNaN(val) ? 0 : val;
                _applyWindowSize();
                break;
            case 'LINES':
                _runtimeParams.numLines = isNaN(val) ? 4 : Math.max(1, val);
                _applyWindowSize();
                break;
            case 'X':              _runtimeParams.windowX          = isNaN(val) ? -1 : val; break;
            case 'Y':              _runtimeParams.windowY          = isNaN(val) ? -1 : val; break;
            case 'FONT_SIZE':      _runtimeParams.fontSize         = isNaN(val) ? 0  : val; break;
            case 'FONT':           _runtimeParams.fontSize         = isNaN(val) ? 0  : val; break; // 하위 호환
            case 'OPACITY':        _runtimeParams.windowOpacity    = isNaN(val) ? -1 : val.clamp(0, 255); break;
            case 'PADDING_H':      _runtimeParams.paddingH         = isNaN(val) ? -1 : val; break;
            case 'PADDING_V':      _runtimeParams.paddingV         = isNaN(val) ? -1 : val; break;
            // 폰트 설정
            case 'FONT_FACE':
                _runtimeParams.fontFace = (sval.toLowerCase() === 'none') ? '' : sval;
                break;
            case 'FONT_BOLD':
                _runtimeParams.fontBold = (sval.toLowerCase() === 'on');
                break;
            case 'FONT_ITALIC':
                _runtimeParams.fontItalic = (sval.toLowerCase() === 'on');
                break;
            case 'FONT_COLOR':
                _runtimeParams.fontColor = (sval.toLowerCase() === 'none') ? '' : sval;
                break;
            case 'OUTLINE_COLOR':
                _runtimeParams.fontOutlineColor = (sval.toLowerCase() === 'none') ? '' : sval;
                break;
            case 'OUTLINE_WIDTH':
                _runtimeParams.fontOutlineWidth = isNaN(val) ? 0 : val;
                break;
            // 타이핑 속도
            case 'SPEED':
                _runtimeParams.typeSpeed = isNaN(fval) ? 0 : Math.max(0, fval);
                break;
            case 'SPEED_BOOST':
                _runtimeParams.typeSpeedBoost = isNaN(fval) ? 0 : Math.max(0, fval);
                break;
            case 'RESET':
                _runtimeParams = JSON.parse(JSON.stringify(_defaultParams));
                break;
        }
    };

    //=========================================================================
    // Window_Message 오버라이드
    //=========================================================================

    // ── 너비
    var _Window_Message_windowWidth = Window_Message.prototype.windowWidth;
    Window_Message.prototype.windowWidth = function() {
        if (_runtimeParams.windowWidth > 0) return _runtimeParams.windowWidth;
        return _Window_Message_windowWidth.call(this);
    };

    // ── 줄 수
    var _Window_Message_numVisibleRows = Window_Message.prototype.numVisibleRows;
    Window_Message.prototype.numVisibleRows = function() {
        return _runtimeParams.numLines;
    };

    // ── 창 높이: numLines 기반 자동 계산 or 고정값
    Window_Message.prototype.windowHeight = function() {
        if (_runtimeParams.windowHeight > 0) return _runtimeParams.windowHeight;
        var lh = _runtimeParams.lineHeight > 0 ? _runtimeParams.lineHeight : this.lineHeight();
        var pv = _runtimeParams.paddingV  >= 0 ? _runtimeParams.paddingV  : this.standardPadding();
        return this.numVisibleRows() * lh + pv * 2;
    };

    // ── 표준 패딩 (수평)
    var _Window_Message_standardPadding = Window_Message.prototype.standardPadding;
    Window_Message.prototype.standardPadding = function() {
        if (_runtimeParams.paddingH >= 0) return _runtimeParams.paddingH;
        return _Window_Message_standardPadding.call(this);
    };

    // ── 텍스트 패딩 (수직 여백에도 간접 영향)
    // 줄 간격
    var _Window_Base_lineHeight = Window_Base.prototype.lineHeight;
    Window_Message.prototype.lineHeight = function() {
        if (_runtimeParams.lineHeight > 0) return _runtimeParams.lineHeight;
        return _Window_Base_lineHeight.call(this);
    };

    // ── 폰트 크기
    var _Window_Base_standardFontSize = Window_Base.prototype.standardFontSize;
    Window_Message.prototype.standardFontSize = function() {
        if (_runtimeParams.fontSize > 0) return _runtimeParams.fontSize;
        return _Window_Base_standardFontSize.call(this);
    };

    // ── 매 메시지 시작 시 최신 파라미터로 창 크기를 재적용
    //    원본 startMessage 는 newPage() → createContents 로 첫 페이지를
    //    세팅하므로, 그 "전에" width/height 를 확정해야 내용이 올바른
    //    크기로 그려진다. 이렇게 하면 MSGWIN WIDTH/HEIGHT/LINES 커맨드를
    //    언제 실행하든 다음 메시지부터 확실히 반영된다.
    var _Window_Message_startMessage = Window_Message.prototype.startMessage;
    Window_Message.prototype.startMessage = function() {
        var newW = this.windowWidth();
        var newH = this.windowHeight();
        if (this.width !== newW || this.height !== newH) {
            this.width  = newW;
            this.height = newH;
            this.createContents();
        }
        _Window_Message_startMessage.call(this);
    };

    // ── X 위치
    var _Window_Message_updatePlacement = Window_Message.prototype.updatePlacement;
    Window_Message.prototype.updatePlacement = function() {
        _Window_Message_updatePlacement.call(this);

        // X
        if (_runtimeParams.windowX >= 0) {
            this.x = _runtimeParams.windowX;
        } else {
            // 기본: 가운데 정렬
            this.x = (Graphics.boxWidth - this.width) / 2;
        }

        // Y
        if (_runtimeParams.windowY >= 0) {
            this.y = _runtimeParams.windowY;
        }
        // windowY == -1 이면 기본 포지션(상/중/하) 로직 그대로 유지
    };

    // ── 불투명도
    var _Window_Message_open = Window_Message.prototype.open;
    Window_Message.prototype.open = function() {
        _Window_Message_open.call(this);
        if (_runtimeParams.windowOpacity >= 0) {
            this.opacity = _runtimeParams.windowOpacity;
        }
    };

    // ── 딤 배경 불투명도
    if (_runtimeParams.dimOpacity >= 0) {
        var _Window_Message_setBackgroundType = Window_Message.prototype.setBackgroundType;
        Window_Message.prototype.setBackgroundType = function(type) {
            _Window_Message_setBackgroundType.call(this, type);
            if (type === 1) { // dim
                this._dimmerSprite.opacity = _runtimeParams.dimOpacity;
            }
        };
    }

    //=========================================================================
    // 폰트 설정 오버라이드
    //=========================================================================

    // ── 폰트 이름 (standardFontFace)
    var _Window_Base_standardFontFace = Window_Base.prototype.standardFontFace;
    Window_Message.prototype.standardFontFace = function() {
        if (_runtimeParams.fontFace) return _runtimeParams.fontFace;
        return _Window_Base_standardFontFace.call(this);
    };

    // ── resetFontSettings: 매 텍스트 출력 시 호출되는 초기화 훅
    //    굵기·기울임·색상·외곽선을 여기에 일괄 적용
    var _Window_Base_resetFontSettings = Window_Base.prototype.resetFontSettings;
    Window_Message.prototype.resetFontSettings = function() {
        _Window_Base_resetFontSettings.call(this);

        if (_runtimeParams.fontFace) {
            this.contents.fontFace = _runtimeParams.fontFace;
        }
        if (_runtimeParams.fontSize > 0) {
            this.contents.fontSize = _runtimeParams.fontSize;
        }
        this.contents.fontBold   = _runtimeParams.fontBold;
        this.contents.fontItalic = _runtimeParams.fontItalic;

        if (_runtimeParams.fontColor) {
            this.contents.textColor = _runtimeParams.fontColor;
        }
        if (_runtimeParams.fontOutlineColor) {
            this.contents.outlineColor = _runtimeParams.fontOutlineColor;
        }
        if (_runtimeParams.fontOutlineWidth > 0) {
            this.contents.outlineWidth = _runtimeParams.fontOutlineWidth;
        }
    };

    //=========================================================================
    // Window_Message.initialize 후 크기 반영
    //=========================================================================
    var _Window_Message_initialize = Window_Message.prototype.initialize;
    Window_Message.prototype.initialize = function() {
        _Window_Message_initialize.call(this);
        this._typeWait = 0;
        this._typeBudget = 0;
        this.width  = this.windowWidth();
        this.height = this.windowHeight();
        this.x      = _runtimeParams.windowX >= 0
                        ? _runtimeParams.windowX
                        : (Graphics.boxWidth - this.width) / 2;
        this.createContents();
    };

    //=========================================================================
    // 타이핑 속도 오버라이드
    //=========================================================================
    // typeSpeed : 글자 1개당 대기 프레임 수 (1=매우빠름, 3=기본, 10=느림)
    // typeSpeedBoost : 결정키 눌렀을 때 speed를 나눌 배율
    //                  0 이면 MV 기본(즉시 전체 출력) 그대로 동작

    // MV 원본 updateMessage를 그대로 두고,
    // 글자 출력의 핵심인 shouldBreakHere 판단만 속도 카운터로 끼워 넣는다.
    // → processCharacter 자체는 건드리지 않으므로 종료 처리가 깨지지 않음.

    // 즉시 출력 키가 눌렸는지 판정.
    // X키(_INSTANT_KEY), Shift키('shift'), Enter키('ok') 중 하나라도
    // 누르고 있으면 true.
    function _isInstantKeyPressed() {
        return Input.isPressed(_INSTANT_KEY) ||
               Input.isPressed('shift') ||
               Input.isPressed('ok');
    }

    // ★ 남은 텍스트를 애니메이션 없이 전부 즉시 그린다.
    //    원본 updateMessage 루프를 재현하되, 속도/대기(_waitCount·pause)를
    //    모두 무시하고 페이지 끝(needsNewPage)까지 강제로 채운다.
    //    페이지가 넘어가는 경우(다음 페이지가 남은 경우)는 원본과 동일하게
    //    거기서 멈추고 사용자의 다음 입력을 기다린다.
    Window_Message.prototype.instantFlushText = function() {
        var textState = this._textState;
        if (!textState) return;

        while (!this.isEndOfText(textState)) {
            // 페이지가 가득 차면 여기서 멈춘다(원본 동작 보존).
            if (this.needsNewPage(textState)) {
                break;
            }
            this.processCharacter(textState);
            // \!(강제 입력 대기)로 pause가 걸리면 그 지점에서 멈춘다.
            // (시간 대기 \. \| 로 인한 _waitCount 는 아래에서 무시)
            if (this.pause) {
                break;
            }
        }

        // 대기/일시정지 상태는 즉시 출력이므로 해제한다.
        this._waitCount = 0;

        if (this.isEndOfText(textState)) {
            this.onEndOfText();
        }
    };

    var _Window_Message_updateMessage = Window_Message.prototype.updateMessage;
    Window_Message.prototype.updateMessage = function() {
        // ★ 즉시 출력: 출력 중(_textState 존재)에 X/Shift/Enter를 누르면
        //    타이핑 애니메이션 없이 남은 텍스트를 통째로 그린다.
        if (this._textState && _isInstantKeyPressed()) {
            this._typeWait = 0;
            this._typeBudget = 0;
            this.instantFlushText();
            return true;
        }

        var speed = _runtimeParams.typeSpeed;

        // speed 미설정(0) → 원본 그대로(즉시 완료)
        if (!speed || speed <= 0) {
            return _Window_Message_updateMessage.call(this);
        }

        // _textState 없음 → 출력할 텍스트 없음
        if (!this._textState) return false;

        var boost = _runtimeParams.typeSpeedBoost;

        // boost 미설정 + 빨리보기(입력 중) → 원본(즉시 완료) 그대로
        if (boost === 0 && (this._showFast || this._lineShowFast)) {
            return _Window_Message_updateMessage.call(this);
        }

        // ★ 핵심: MV 원본처럼 _waitCount 카운트다운을 먼저 처리한다.
        // _waitCount > 0 이면 이번 프레임은 대기만 하고 return true.
        // 이게 없으면 \| \. 등 대기 제어문자 이후 타이머가 영원히 멈추거나
        // 반대로 무시되어 루프처럼 보이는 현상이 발생한다.
        if (this._waitCount > 0) {
            this._waitCount--;
            return true;
        }

        // 가속 배율
        var effectiveSpeed = speed;
        if (boost >= 2 && (this._showFast || this._lineShowFast)) {
            effectiveSpeed = Math.max(0.0001, speed / boost);
        }

        // ★ 소수 속도 지원: 누적(accumulator) 방식.
        //   effectiveSpeed = "글자 1개당 걸리는 프레임 수"(작을수록 빠름).
        //   매 프레임 (1 / effectiveSpeed) 만큼 '출력 예산'을 쌓고,
        //   예산이 1 이상 쌓일 때마다 글자를 1개씩 출력한다.
        //   - effectiveSpeed = 3   → 3프레임마다 글자 1개(정수, 기존과 동일)
        //   - effectiveSpeed = 1   → 매 프레임 글자 1개
        //   - effectiveSpeed = 0.5 → 매 프레임 글자 2개
        //   - effectiveSpeed = 1.5 → 3프레임마다 글자 2개
        this._typeBudget = (this._typeBudget || 0) + (1 / effectiveSpeed);
        if (this._typeBudget < 1) {
            return true;
        }

        // ★ 쌓인 예산(_typeBudget)만큼 '보이는 글자'를 출력한다.
        //   speed >= 1 이면 예산은 정확히 1이라 글자 1개만 나온다(기존 동작).
        //   speed < 1 (예: 0.5)이면 예산이 2 이상 쌓여 여러 글자가 나온다.
        //   제어문자(이스케이프 시퀀스, 줄바꿈)는 예산을 소모하지 않고
        //   연속 처리하며, 보이는 글자를 1개 낼 때마다 예산을 1 차감한다.
        var textState = this._textState;

        while (this._typeBudget >= 1 && textState.index < textState.text.length) {
            var prevIndex = textState.index;
            this.processCharacter(textState);

            // processCharacter가 _waitCount를 설정했으면 이번 프레임 종료
            // (다음 프레임에서 위의 카운트다운 블록이 처리함)
            if (this._waitCount > 0) return true;

            // 실제 보이는 글자(비제어문자, 비줄바꿈)를 출력했으면 예산 1 차감
            var ch = textState.text[prevIndex];
            if (ch !== '\x1b' && ch !== '\n' && ch !== '\r') {
                this._typeBudget -= 1;
            }
        }

        // 아직 출력할 텍스트가 남아있으면 계속
        if (!this.isEndOfText(textState)) return true;

        // 모두 출력 완료.
        // MV 원본과 동일하게: onEndOfText()를 호출 (_textState=null은 그 안에서 처리),
        // return true. (_textState가 있는 분기는 항상 true를 반환하는 것이 원본 동작)
        this._typeBudget = 0;
        this.onEndOfText();
        return true;
    };

})();
