//=============================================================================
// TypingQuizInput.js
//=============================================================================
/*:
 * @target MZ
 * @plugindesc [v1.0.0] 타이핑(키보드 직접입력) 기반 퀴즈 입력 시스템 (영문/한글, PC&모바일 겸용)
 * @author Custom
 *
 * @param inputVariable
 * @text 기본 입력 변수
 * @desc 플레이어가 타이핑한 답을 저장할 기본 변수입니다.
 * 액터 이름(정답)과는 별개의 변수를 사용하세요.
 * @type variable
 * @default 1
 *
 * @param maxLength
 * @text 최대 입력 글자수
 * @desc 입력창에 표시될 칸의 개수입니다.
 * @type number
 * @min 1
 * @max 20
 * @default 8
 *
 * @param windowHeight
 * @text 입력창 높이
 * @desc 타이핑 입력창의 높이(px)입니다.
 * @type number
 * @default 84
 *
 * @param fontSize
 * @text 입력 글자 폰트 크기
 * @type number
 * @default 28
 *
 * @param okButtonText
 * @text 확인 버튼 텍스트
 * @default 확인
 *
 * @param okButtonWidth
 * @text 확인 버튼 너비
 * @type number
 * @default 96
 *
 * @param hintButtonText
 * @text 힌트 버튼 텍스트
 * @default 힌트
 *
 * @param hintDuration
 * @text 힌트 표시 시간 (프레임, 60=1초)
 * @type number
 * @default 240
 *
 * @param hintWindowWidth
 * @text 힌트 팝업 너비
 * @type number
 * @default 360
 *
 * @param hintWindowHeight
 * @text 힌트 팝업 높이
 * @type number
 * @default 140
 *
 * @command ShowInput
 * @text 타이핑 입력 시작
 * @desc 화면 하단 메시지창 바로 위에 타이핑 입력창을 띄웁니다.
 * 입력이 끝날 때까지 이벤트 진행이 멈춥니다(자동 대기).
 *
 * @arg variableId
 * @text 저장 변수 (0= 기본 변수 사용)
 * @type variable
 * @default 0
 *
 * @arg maxLength
 * @text 최대 글자수 (0 = 기본값 사용)
 * @type number
 * @default 0
 *
 * @command SetHint
 * @text 힌트 텍스트 설정
 * @desc 다음에 호출되는 "타이핑 입력 시작" 명령에서 사용할 힌트 텍스트를 설정합니다.
 * 이 명령은 반드시 "타이핑 입력 시작" 명령 "이전"에 실행해야 합니다.
 * 비워두면 힌트 버튼이 표시되지 않습니다.
 *
 * @arg text
 * @text 힌트 텍스트
 * @type multiline_string
 * @default
 *
 * @help
 * ============================================================================
 * TypingQuizInput.js
 * ============================================================================
 *
 * ■ 개요
 * 맵 위에서 키보드(PC) 또는 가상 키보드(모바일)로 영문/한글을 직접 타이핑해서
 * 입력받는 퀴즈 입력창 플러그인입니다.
 * 입력창은 시스템 윈도우 스킨(system.png)을 그대로 사용하며,
 * 기본 메시지 창(텍스트 윈도우) 바로 위에 겹쳐서 표시됩니다.
 *
 * ■ 사용 방법
 * 1) 이벤트에서 [텍스트 표시]로 문제를 보여줍니다.
 * 2) (힌트가 필요하면) 플러그인 명령 [힌트 텍스트 설정]을 먼저 실행합니다.
 * 3) 플러그인 명령 [타이핑 입력 시작]을 실행합니다.
 *    -> 화면에 입력창(과 힌트 버튼)이 나타나고, 이벤트는 자동으로 대기합니다.
 *    -> 플레이어가 글자를 입력하고 "확인" 버튼을 클릭/탭하면
 *       지정한 변수에 입력값이 저장되고 이벤트가 자동으로 이어서 진행됩니다.
 * 4) [조건 분기] -> [스크립트]에서 아래처럼 정답을 비교합니다.
 *
 *     String($gameVariables.value(1)).toLowerCase() ===
 *     String($gameActors.actor(2).name()).toLowerCase()
 *
 *    (변수 1번 = 입력값을 저장한 변수 번호로 교체하세요)
 *    (액터 2번 = 정답을 미리 이름으로 넣어둔 액터 번호)
 *
 *    이렇게 하면 영문은 대소문자를 구분하지 않고, 한글은 완전히 일치할 때만
 *    참(true)이 됩니다. 공백은 입력 단계에서부터 막혀 있으므로 신경쓰지
 *    않으셔도 됩니다.
 *
 * ■ 입력 규칙
 * - 스페이스(공백) 입력은 원천적으로 차단됩니다.
 * - 최대 입력 글자수는 기본 8자이며, 플러그인 파라미터 또는 플러그인 명령의
 *   인자로 조절할 수 있습니다.
 *
 * ■ 힌트 버튼
 * - 힌트 텍스트를 설정한 경우에만 화면 우측 상단에 힌트 버튼이 나타납니다.
 * - 버튼을 클릭(터치)하면 별도의 팝업창에 힌트가 표시되고, 일정 시간 후
 *   자동으로 사라집니다. 입력창을 가리지 않는 위치(상단)에 표시됩니다.
 * - 사용 횟수 제한은 없습니다. 여러 번 클릭해서 봐도 됩니다.
 *
 * ■ 모바일 지원
 * - 입력창의 글자 입력 영역을 탭하면 화면에 보이지 않는 input 요소가
 *   포커스를 받아 모바일 OS의 기본 키보드(한글 입력 포함)가 열립니다.
 * - PC에서는 입력창이 열리는 즉시 자동으로 포커스가 잡혀 바로 타이핑할 수
 *   있습니다.
 * - 모바일/PC 구분 없이 화면에 "확인" 버튼이 항상 표시되며, 클릭/탭으로
 *   입력을 확정합니다. PC에서는 Enter 키로도 확정할 수 있습니다.
 *
 * ■ 다른 기능과의 충돌
 * - 입력창이 떠 있는 동안 플레이어 이동과 메뉴 호출이 자동으로 차단됩니다.
 * - 입력창/힌트 버튼/힌트 팝업은 모두 윈도우 레이어 위에 표시되며, 그림(픽처)
 *   표시 기능과는 서로 다른 레이어이므로 충돌하지 않습니다. 문제 이미지를
 *   픽처로 띄워두신 상태에서 입력창을 띄워도 그림은 그대로 보입니다.
 *
 * ============================================================================
 */

(() => {
    "use strict";

    const pluginName = "TypingQuizInput";
    const rawParams = PluginManager.parameters(pluginName);

    const params = {
        inputVariable: Number(rawParams.inputVariable || 1),
        maxLength: Number(rawParams.maxLength || 8),
        windowHeight: Number(rawParams.windowHeight || 84),
        fontSize: Number(rawParams.fontSize || 28),
        okButtonText: String(rawParams.okButtonText || "확인"),
        okButtonWidth: Number(rawParams.okButtonWidth || 96),
        hintButtonText: String(rawParams.hintButtonText || "힌트"),
        hintDuration: Number(rawParams.hintDuration || 240),
        hintWindowWidth: Number(rawParams.hintWindowWidth || 360),
        hintWindowHeight: Number(rawParams.hintWindowHeight || 140)
    };

    const TypingQuizInput = {
        params: params,
        _hintText: ""
    };
    window.TypingQuizInput = TypingQuizInput;

    function getGameCanvas() {
        if (Graphics.app && Graphics.app.canvas) return Graphics.app.canvas;
        if (Graphics.app && Graphics.app.view) return Graphics.app.view;
        if (Graphics._canvas) return Graphics._canvas;
        return document.getElementById("GameCanvas") || document.querySelector("canvas");
    }

    //-------------------------------------------------------------------------
    // Plugin Commands
    //-------------------------------------------------------------------------
    PluginManager.registerCommand(pluginName, "SetHint", args => {
        TypingQuizInput._hintText = String(args.text || "");
    });

    PluginManager.registerCommand(pluginName, "ShowInput", function(args) {
        const variableId = Number(args.variableId) || params.inputVariable;
        const maxLength = Number(args.maxLength) || params.maxLength;
        const hintText = TypingQuizInput._hintText || "";
        TypingQuizInput._hintText = "";
        if (SceneManager._scene && SceneManager._scene.startTypingQuiz) {
            SceneManager._scene.startTypingQuiz(variableId, maxLength, hintText);
            this.setWaitMode("typingQuiz");
        }
    });

    //-------------------------------------------------------------------------
    // Game_Temp - active flag
    //-------------------------------------------------------------------------
    const _Game_Temp_initialize = Game_Temp.prototype.initialize;
    Game_Temp.prototype.initialize = function() {
        _Game_Temp_initialize.call(this);
        this._typingQuizActive = false;
    };

    //-------------------------------------------------------------------------
    // Game_Interpreter - wait mode
    //-------------------------------------------------------------------------
    const _Game_Interpreter_updateWaitMode = Game_Interpreter.prototype.updateWaitMode;
    Game_Interpreter.prototype.updateWaitMode = function() {
        if (this._waitMode === "typingQuiz") {
            if ($gameTemp._typingQuizActive) {
                return true;
            } else {
                this._waitMode = "";
                return false;
            }
        }
        return _Game_Interpreter_updateWaitMode.call(this);
    };

    //-------------------------------------------------------------------------
    // Block player movement / menu while typing
    //-------------------------------------------------------------------------
    const _Game_Player_canMove = Game_Player.prototype.canMove;
    Game_Player.prototype.canMove = function() {
        if ($gameTemp._typingQuizActive) return false;
        return _Game_Player_canMove.call(this);
    };

    const _Scene_Map_isMenuCalled = Scene_Map.prototype.isMenuCalled;
    Scene_Map.prototype.isMenuCalled = function() {
        if ($gameTemp._typingQuizActive) return false;
        return _Scene_Map_isMenuCalled.call(this);
    };

    //-------------------------------------------------------------------------
    // Window_TypingInput
    //-------------------------------------------------------------------------
    function Window_TypingInput() {
        this.initialize(...arguments);
    }

    Window_TypingInput.prototype = Object.create(Window_Base.prototype);
    Window_TypingInput.prototype.constructor = Window_TypingInput;

    Window_TypingInput.prototype.initialize = function(rect, variableId, maxLength) {
        Window_Base.prototype.initialize.call(this, rect);
        this._variableId = variableId;
        this._maxLength = maxLength;
        this._text = "";
        this._cursorBlink = 0;
        this._hiddenInput = null;
        this._finished = false;
        this.calcLayout();
        this.refresh();
        this.createHiddenInput();
    };

    Window_TypingInput.prototype.calcLayout = function() {
        const cw = this.contentsWidth();
        const ch = this.contentsHeight();
        const okW = params.okButtonWidth;
        const okH = Math.min(48, ch - 8);
        const gapBetween = 12;
        const boxesAreaWidth = cw - okW - gapBetween;
        const boxCount = this._maxLength;
        const boxGap = 6;
        let boxW = Math.floor((boxesAreaWidth - boxGap * (boxCount - 1)) / boxCount);
        if (boxW < 16) boxW = 16;
        const boxH = Math.min(48, ch - 8);
        const totalBoxesWidth = boxW * boxCount + boxGap * (boxCount - 1);

        this._singleBoxWidth = boxW;
        this._boxGap = boxGap;
        this._boxRect = new Rectangle(0, Math.floor((ch - boxH) / 2), totalBoxesWidth, boxH);
        this._okRect = new Rectangle(
            cw - okW,
            Math.floor((ch - okH) / 2),
            okW,
            okH
        );
    };

    Window_TypingInput.prototype.screenBoxRect = function() {
        return new Rectangle(
            this.x + this.padding + this._boxRect.x,
            this.y + this.padding + this._boxRect.y,
            this._boxRect.width,
            this._boxRect.height
        );
    };

    Window_TypingInput.prototype.screenOkRect = function() {
        return new Rectangle(
            this.x + this.padding + this._okRect.x,
            this.y + this.padding + this._okRect.y,
            this._okRect.width,
            this._okRect.height
        );
    };

    Window_TypingInput.prototype.update = function() {
        Window_Base.prototype.update.call(this);
        if (this._finished) return;
        this._cursorBlink = (this._cursorBlink + 1) % 60;
        this.refresh();
        this.positionHiddenInput();
        this.updateTouchInput();
    };

    Window_TypingInput.prototype.updateTouchInput = function() {
        if (TouchInput.isTriggered()) {
            const x = TouchInput.x;
            const y = TouchInput.y;
            if (this.screenOkRect().contains(x, y)) {
                SoundManager.playOk();
                this.confirmInput();
            } else if (this.screenBoxRect().contains(x, y)) {
                this.focusHiddenInput();
            }
        }
    };

    Window_TypingInput.prototype.confirmInput = function() {
        if (this._finished) return;
        this._finished = true;
        $gameVariables.setValue(this._variableId, this._text);
        this.destroyHiddenInput();
        if (SceneManager._scene && SceneManager._scene.endTypingQuiz) {
            SceneManager._scene.endTypingQuiz();
        }
    };

    Window_TypingInput.prototype.refresh = function() {
        this.contents.clear();
        this.drawCharBoxes();
        this.drawOkButton();
    };

    Window_TypingInput.prototype.drawCharBoxes = function() {
        const rect = this._boxRect;
        const boxW = this._singleBoxWidth;
        const gap = this._boxGap;
        const lineColor = ColorManager.normalColor();
        this.contents.fontSize = params.fontSize;
        for (let i = 0; i < this._maxLength; i++) {
            const bx = rect.x + i * (boxW + gap);
            const by = rect.y;
            this.contents.fillRect(bx, by + rect.height - 2, boxW, 2, lineColor);
            const ch = this._text[i];
            if (ch) {
                this.contents.drawText(ch, bx, by - 4, boxW, rect.height, "center");
            } else if (i === this._text.length && this._cursorBlink < 30) {
                this.contents.fillRect(
                    bx + Math.floor(boxW / 2) - 1,
                    by + 6,
                    2,
                    rect.height - 16,
                    lineColor
                );
            }
        }
        this.resetFontSettings();
    };

    Window_TypingInput.prototype.drawOkButton = function() {
        const r = this._okRect;
        this.contents.fillRect(r.x, r.y, r.width, r.height, "rgba(0,0,0,0.35)");
        this.contents.strokeRect(r.x, r.y, r.width, r.height, ColorManager.normalColor());
        this.contents.fontSize = params.fontSize - 4;
        this.contents.drawText(params.okButtonText, r.x, r.y, r.width, r.height, "center");
        this.resetFontSettings();
    };

    Window_TypingInput.prototype.createHiddenInput = function() {
        const input = document.createElement("input");
        input.type = "text";
        input.maxLength = this._maxLength;
        input.autocomplete = "off";
        input.autocapitalize = "off";
        input.spellcheck = false;
        input.style.position = "absolute";
        input.style.opacity = "0";
        input.style.border = "0";
        input.style.padding = "0";
        input.style.margin = "0";
        input.style.pointerEvents = "auto";
        input.style.zIndex = "9999";
        input.style.fontSize = "16px"; // iOS 자동 확대 방지
        document.body.appendChild(input);
        this._hiddenInput = input;

        this._onInputHandler = () => {
            let v = input.value.replace(/\s/g, "");
            if (v.length > this._maxLength) v = v.slice(0, this._maxLength);
            input.value = v;
            this._text = v;
            this.refresh();
        };
        this._onKeydownHandler = e => {
            if (e.key === "Enter") {
                e.preventDefault();
                this.confirmInput();
            } else if (e.key === " " || e.code === "Space") {
                e.preventDefault();
            }
        };
        input.addEventListener("input", this._onInputHandler);
        input.addEventListener("keydown", this._onKeydownHandler);

        this.focusHiddenInput();
    };

    Window_TypingInput.prototype.positionHiddenInput = function() {
        const input = this._hiddenInput;
        if (!input) return;
        const canvas = getGameCanvas();
        if (!canvas) return;
        const bounds = canvas.getBoundingClientRect();
        const scaleX = bounds.width / Graphics.width;
        const scaleY = bounds.height / Graphics.height;
        const rect = this.screenBoxRect();
        input.style.left = bounds.left + rect.x * scaleX + "px";
        input.style.top = bounds.top + rect.y * scaleY + "px";
        input.style.width = Math.max(1, rect.width * scaleX) + "px";
        input.style.height = Math.max(1, rect.height * scaleY) + "px";
    };

    Window_TypingInput.prototype.focusHiddenInput = function() {
        this.positionHiddenInput();
        if (this._hiddenInput) {
            this._hiddenInput.focus();
        }
    };

    Window_TypingInput.prototype.destroyHiddenInput = function() {
        if (this._hiddenInput) {
            this._hiddenInput.removeEventListener("input", this._onInputHandler);
            this._hiddenInput.removeEventListener("keydown", this._onKeydownHandler);
            this._hiddenInput.blur();
            if (this._hiddenInput.parentNode) {
                this._hiddenInput.parentNode.removeChild(this._hiddenInput);
            }
            this._hiddenInput = null;
        }
    };

    //-------------------------------------------------------------------------
    // Window_HintButton
    //-------------------------------------------------------------------------
    function Window_HintButton() {
        this.initialize(...arguments);
    }

    Window_HintButton.prototype = Object.create(Window_Base.prototype);
    Window_HintButton.prototype.constructor = Window_HintButton;

    Window_HintButton.prototype.initialize = function(rect) {
        Window_Base.prototype.initialize.call(this, rect);
        this._hintText = "";
        this.refresh();
    };

    Window_HintButton.prototype.setHintText = function(text) {
        this._hintText = text;
    };

    Window_HintButton.prototype.refresh = function() {
        this.contents.clear();
        this.contents.fontSize = params.fontSize - 6;
        this.contents.drawText(
            params.hintButtonText,
            0,
            0,
            this.contentsWidth(),
            this.contentsHeight(),
            "center"
        );
        this.resetFontSettings();
    };

    Window_HintButton.prototype.update = function() {
        Window_Base.prototype.update.call(this);
        if (TouchInput.isTriggered()) {
            const x = TouchInput.x;
            const y = TouchInput.y;
            const rect = new Rectangle(this.x, this.y, this.width, this.height);
            if (rect.contains(x, y)) {
                SoundManager.playOk();
                if (SceneManager._scene && SceneManager._scene.showHintPopup) {
                    SceneManager._scene.showHintPopup(this._hintText);
                }
            }
        }
    };

    //-------------------------------------------------------------------------
    // Window_HintPopup
    //-------------------------------------------------------------------------
    function Window_HintPopup() {
        this.initialize(...arguments);
    }

    Window_HintPopup.prototype = Object.create(Window_Base.prototype);
    Window_HintPopup.prototype.constructor = Window_HintPopup;

    Window_HintPopup.prototype.initialize = function(rect, text, duration) {
        Window_Base.prototype.initialize.call(this, rect);
        this._duration = duration;
        this.refresh(text);
    };

    Window_HintPopup.prototype.refresh = function(text) {
        this.contents.clear();
        this.drawTextEx(text, 4, 0, this.contentsWidth() - 8);
    };

    Window_HintPopup.prototype.update = function() {
        Window_Base.prototype.update.call(this);
        this._duration--;
        if (this._duration <= 0) {
            if (SceneManager._scene && SceneManager._scene.closeHintPopup) {
                SceneManager._scene.closeHintPopup();
            }
        }
    };

    //-------------------------------------------------------------------------
    // Scene_Map
    //-------------------------------------------------------------------------
    Scene_Map.prototype.startTypingQuiz = function(variableId, maxLength, hintText) {
        this.endTypingQuiz(); // 안전을 위해 기존 입력창 정리

        const inputRect = this.typingQuizInputRect();
        this._typingQuizWindow = new Window_TypingInput(inputRect, variableId, maxLength);
        this.addWindow(this._typingQuizWindow);

        if (hintText && hintText.length > 0) {
            const btnRect = this.typingHintButtonRect();
            this._typingHintButton = new Window_HintButton(btnRect);
            this._typingHintButton.setHintText(hintText);
            this.addWindow(this._typingHintButton);
        }

        $gameTemp._typingQuizActive = true;
    };

    Scene_Map.prototype.endTypingQuiz = function() {
        if (this._typingQuizWindow) {
            this._typingQuizWindow.destroyHiddenInput();
            this._windowLayer.removeChild(this._typingQuizWindow);
            this._typingQuizWindow.destroy();
            this._typingQuizWindow = null;
        }
        if (this._typingHintButton) {
            this._windowLayer.removeChild(this._typingHintButton);
            this._typingHintButton.destroy();
            this._typingHintButton = null;
        }
        this.closeHintPopup();
        $gameTemp._typingQuizActive = false;
    };

    Scene_Map.prototype.showHintPopup = function(text) {
        this.closeHintPopup();
        const rect = this.typingHintPopupRect();
        this._typingHintPopup = new Window_HintPopup(rect, text, params.hintDuration);
        this.addWindow(this._typingHintPopup);
    };

    Scene_Map.prototype.closeHintPopup = function() {
        if (this._typingHintPopup) {
            this._windowLayer.removeChild(this._typingHintPopup);
            this._typingHintPopup.destroy();
            this._typingHintPopup = null;
        }
    };

    Scene_Map.prototype.typingQuizInputRect = function() {
        const ww = Graphics.boxWidth;
        const wh = params.windowHeight;
        const wx = 0;
        let messageWindowY = Graphics.boxHeight - 168;
        if (this._messageWindow) {
            messageWindowY = this._messageWindow.y;
        }
        const wy = messageWindowY - wh;
        return new Rectangle(wx, wy, ww, wh);
    };

    Scene_Map.prototype.typingHintButtonRect = function() {
        const w = 120;
        const h = 48;
        const x = Graphics.boxWidth - w - 8;
        const y = 8;
        return new Rectangle(x, y, w, h);
    };

    Scene_Map.prototype.typingHintPopupRect = function() {
        const w = params.hintWindowWidth;
        const h = params.hintWindowHeight;
        const x = Graphics.boxWidth - w - 8;
        const y = 64;
        return new Rectangle(x, y, w, h);
    };
})();
