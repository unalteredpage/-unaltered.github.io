//=============================================================================
// QuizTypingInput.js
//=============================================================================
/*:
 * @plugindesc v1.4 퀴즈 타이핑 입력 플러그인 (한글/영문, 힌트, 모바일 지원)
 * @author Claude
 *
 * @param Variable ID
 * @desc 입력한 텍스트를 저장할 게임 변수 번호
 * @default 1
 *
 * @param Actor ID
 * @desc 정답 체크에 사용할 액터 번호 (기본: 2번 액터)
 * @default 2
 *
 * @param Max Chars
 * @desc 최대 입력 글자 수
 * @default 8
 *
 * @param Hint Duration
 * @desc 힌트 표시 지속 시간 (밀리초, 기본 4000 = 4초)
 * @default 4000
 *
 * @help
 * ─────────────────────────────────────────────
 *  QuizTypingInput.js  v1.4
 * ─────────────────────────────────────────────
 *
 * ■ 플러그인 명령
 *
 *   QuizInput open hint:힌트텍스트
 *   QuizInput open
 *
 * ■ 정답 체크 (조건 분기 → 스크립트)
 *
 *   영문 대소문자 무시:
 *     $gameActors.actor(2).name().toLowerCase() === 'apple'
 *
 *   한글 완전 일치:
 *     $gameActors.actor(2).name() === '사과'
 */

(function () {
    'use strict';

    //=========================================================================
    // 파라미터 파싱
    //=========================================================================
    var params      = PluginManager.parameters('QuizTypingInput');
    var VARIABLE_ID = parseInt(params['Variable ID'] || 1);
    var ACTOR_ID    = parseInt(params['Actor ID']    || 2);
    var MAX_CHARS   = parseInt(params['Max Chars']   || 8);
    var HINT_DUR    = parseInt(params['Hint Duration'] || 4000);

    // 입력창을 게임 창 바닥에서 위로 띄우는 여백(게임 좌표 boxHeight 기준, px).
    // 값을 키우면 위로, 줄이면 아래로. (기존 fixed bottom:55px 의도 반영)
    var QUIZ_BOTTOM_OFFSET = 55;

    //=========================================================================
    // 상태 관리
    //=========================================================================
    var _quizOpen      = false;
    var _quizSubmitted = false;
    var _hintText      = '';
    var _hintTimeout   = null;

    //=========================================================================
    // 플러그인 명령 처리
    //=========================================================================
    var _Game_Interpreter_pluginCommand =
        Game_Interpreter.prototype.pluginCommand;

    Game_Interpreter.prototype.pluginCommand = function (command, args) {
        _Game_Interpreter_pluginCommand.call(this, command, args);

        if (command === 'QuizInput') {
            if (args[0] === 'open') {
                var fullArgs  = args.join(' ');
                var hintMatch = fullArgs.match(/hint:(.+)/);
                _hintText      = hintMatch ? hintMatch[1].trim() : '';
                _quizSubmitted = false;
                QuizInputManager.open();
                this.setWaitMode('quizInput');
            }
            if (args[0] === 'close') {
                QuizInputManager.close();
            }
        }
    };

    //=========================================================================
    // Game_Interpreter – 'quizInput' 대기 모드
    //=========================================================================
    var _Game_Interpreter_updateWaitMode =
        Game_Interpreter.prototype.updateWaitMode;

    Game_Interpreter.prototype.updateWaitMode = function () {
        if (this._waitMode === 'quizInput') {
            if (!_quizSubmitted) return true;
            this._waitMode = '';
            return false;
        }
        return _Game_Interpreter_updateWaitMode.call(this);
    };

    //=========================================================================
    // QuizInputManager
    //=========================================================================
    var QuizInputManager = {
        open: function () {
            if (_quizOpen) return;
            _quizOpen = true;
            QuizInputUI.create();
        },
        close: function () {
            if (!_quizOpen) return;
            _quizOpen = false;
            QuizInputUI.destroy();
        },
        submit: function (text) {
            var clean = text.replace(/\s/g, '');
            $gameVariables.setValue(VARIABLE_ID, clean);
            var actor = $gameActors.actor(ACTOR_ID);
            if (actor) actor._name = clean;
            this.close();
            _quizSubmitted = true;
        }
    };

    //=========================================================================
    // QuizInputUI
    //=========================================================================
    var QuizInputUI = {
        _container : null,
        _inputEl   : null,
        _hintPopup : null,

        create: function () {
            var self = this;

            // ── 메인 래퍼 ─────────────────────────────────────────────────
            // 배경·테두리 없음. 텍스트 창 영역 안에 플로팅.
            var container = document.createElement('div');
            container.id  = 'quiz-input-container';
            container.style.cssText = [
                'position:fixed',
                // 실제 위치/크기는 _syncToCanvas() 가 게임 캔버스에 맞춰 매 프레임 갱신.
                // (fixed + 뷰포트 bottom 기준이면 웹 배포 시 레터박스 때문에 어긋남)
                'left:0',
                'top:0',
                'display:flex',
                'flex-direction:column',
                'align-items:center',
                'gap:6px',
                'z-index:9999',
                'pointer-events:auto',
                'font-family:"IyagiGGC","MS Gothic","Malgun Gothic","Apple SD Gothic Neo",sans-serif'
            ].join(';');
            this._container = container;

            // ── 힌트 팝업 (입력창 바로 위, 텍스트창 상단 근처) ────────────
            var hintPopup = document.createElement('div');
            hintPopup.id = 'quiz-hint-popup';
            hintPopup.style.cssText = [
                'display:none',
                'background:none',
                'border:none',
                'border-radius:0',
                'color:#ffe080',
                'font-size:15px',
                'font-family:"IyagiGGC","MS Gothic","Malgun Gothic","Apple SD Gothic Neo",sans-serif',
                'padding:6px 14px',
                'line-height:1.6',
                'text-shadow:0 0 6px rgba(255,200,0,0.5)',
                'word-break:break-all',
                'width:100%',
                'box-sizing:border-box',
                'text-align:center'
            ].join(';');
            this._hintPopup = hintPopup;
            container.appendChild(hintPopup);

            // ── 입력 행 ───────────────────────────────────────────────────
            var row = document.createElement('div');
            row.style.cssText = [
                'display:flex',
                'align-items:center',
                'justify-content:center',
                'gap:12px',
                'width:100%'
            ].join(';');
            container.appendChild(row);

            // 입력 필드 (placeholder로 _ _ _ _ _ _ _ _ 표시)
            var input = document.createElement('input');
            input.id             = 'quiz-input-field';
            input.type           = 'text';
            input.maxLength      = MAX_CHARS;
            input.placeholder    = Array(MAX_CHARS).fill('_').join(' ');
            input.autocomplete   = 'off';
            input.autocorrect    = 'off';
            input.autocapitalize = 'none';
            input.spellcheck     = false;
            input.style.cssText = [
                'background:transparent',
                'border:none',
                'border-radius:0',
                'color:#ffffff',
                'font-size:26px',
                'font-family:"IyagiGGC","MS Gothic","Malgun Gothic","Apple SD Gothic Neo",monospace',
                'letter-spacing:4px',
                'text-align:center',
                'padding:2px 8px 6px',
                'outline:none',
                'caret-color:#88ccff',
                'width:320px',
                'max-width:60vw',   // 작은 화면에서 넘치지 않도록
                'text-shadow:0 0 8px rgba(180,220,255,0.6)'
            ].join(';');
            this._inputEl = input;

            // 공백 차단
            input.addEventListener('input', function () {
                var pos    = input.selectionStart;
                var before = input.value;
                input.value = before.replace(/\s/g, '');
                var diff = before.length - input.value.length;
                if (diff > 0) pos = Math.max(0, pos - diff);
                try { input.setSelectionRange(pos, pos); } catch(e) {}
            });

            // Enter 제출
            input.addEventListener('keydown', function (e) {
                if (e.key === 'Enter') { e.preventDefault(); self._submit(); }
            });

            row.appendChild(input);

            // 확인 버튼 (작고 심플하게)
            var btnOk = this._makeButton('확인', function () { self._submit(); }, false);
            row.appendChild(btnOk);

            // 힌트 버튼
            if (_hintText) {
                var btnHint = this._makeButton('힌트', function () { self._showHint(); }, true);
                row.appendChild(btnHint);
            }

            document.body.appendChild(container);

            // 캔버스 위치/크기에 맞춰 입력창 배치 (웹 배포 레터박스 대응)
            this._startCanvasSync();

            // 포커스
            setTimeout(function () {
                if (input && document.body.contains(input)) input.focus();
            }, 150);

            this._blockCanvasPointer(true);
        },

        destroy: function () {
            this._stopCanvasSync();
            if (_hintTimeout) { clearTimeout(_hintTimeout); _hintTimeout = null; }
            if (this._container && document.body.contains(this._container)) {
                document.body.removeChild(this._container);
            }
            this._container = null;
            this._inputEl   = null;
            this._hintPopup = null;
            this._blockCanvasPointer(false);
        },

        // ── 게임 캔버스에 맞춰 입력창 위치·크기 동기화 ────────────────────
        //  position:fixed 지만 left/top/width 를 캔버스의 화면상 사각형에 맞춤.
        //  캔버스가 레터박스로 화면 중앙에 있어도 정확히 그 위에 얹힘.
        _startCanvasSync: function () {
            var self = this;
            this._syncToCanvas();
            // 매 프레임 갱신(리사이즈/회전/스크롤/주소창 변화까지 자동 대응)
            var loop = function () {
                if (!self._container) return;   // destroy 되면 중단
                self._syncToCanvas();
                self._syncRAF = requestAnimationFrame(loop);
            };
            this._syncRAF = requestAnimationFrame(loop);
        },

        _stopCanvasSync: function () {
            if (this._syncRAF) { cancelAnimationFrame(this._syncRAF); this._syncRAF = null; }
        },

        _syncToCanvas: function () {
            var c = this._container;
            if (!c) return;
            var canvas = Graphics._canvas || document.querySelector('canvas');
            if (!canvas) return;
            var r = canvas.getBoundingClientRect();

            // 캔버스의 화면상 가로폭에 맞춰 컨테이너 폭 결정(양옆 여백 28px씩)
            var sideMargin = Math.min(28, r.width * 0.04);
            var width = r.width - sideMargin * 2;

            // 게임 좌표(boxHeight) 기준 "메시지창 중앙쯤" 위치를 화면 비율로 환산.
            // 기존 의도: 창 바닥에서 약 55px 위. 이를 캔버스 높이에 비례시켜 계산.
            var scale = r.height / Graphics.boxHeight;        // 캔버스 스케일
            var bottomOffsetGame = QUIZ_BOTTOM_OFFSET;        // 게임좌표 기준 bottom 여백
            var bottomPx = bottomOffsetGame * scale;          // 화면 픽셀로 환산

            c.style.left   = (r.left + sideMargin) + 'px';
            c.style.top    = 'auto';
            c.style.bottom = (window.innerHeight - r.bottom + bottomPx) + 'px';
            c.style.width  = width + 'px';
            c.style.transform = 'none';
        },

        _submit: function () {
            if (!this._inputEl) return;
            QuizInputManager.submit(this._inputEl.value);
        },

        _showHint: function () {
            if (!this._hintPopup) return;
            if (_hintTimeout) { clearTimeout(_hintTimeout); _hintTimeout = null; }
            // 힌트 사용 횟수: 변수 0005번 +1
            $gameVariables.setValue(5, $gameVariables.value(5) + 1);
            this._hintPopup.textContent = _hintText;
            this._hintPopup.style.display = 'block';
            this._hintPopup.style.opacity = '0';
            var popup = this._hintPopup;
            requestAnimationFrame(function () {
                popup.style.transition = 'opacity 0.3s';
                popup.style.opacity    = '1';
            });
            var self = this;
            _hintTimeout = setTimeout(function () {
                if (!self._hintPopup) return;
                self._hintPopup.style.opacity = '0';
                setTimeout(function () {
                    if (self._hintPopup) self._hintPopup.style.display = 'none';
                }, 350);
                _hintTimeout = null;
            }, HINT_DUR);
        },

        // ── 버튼 생성 ─────────────────────────────────────────────────────
        // isHint: true이면 힌트(아이콘) 스타일, false이면 확인 스타일
        _makeButton: function (label, onClick, isHint) {
            var btn = document.createElement('button');
            btn.textContent = label;

            if (isHint) {
                btn.className = 'hint-btn';
                btn.style.cssText = [
                    'background:transparent',
                    'border:1px solid rgba(255,220,80,0.55)',
                    'border-radius:3px',
                    'color:rgba(255,220,80,0.9)',
                    'font-size:14px',
                    'font-family:"IyagiGGC","MS Gothic","Malgun Gothic","Apple SD Gothic Neo",sans-serif',
                    'cursor:pointer',
                    'padding:4px 10px',
                    'line-height:1',
                    'opacity:0.85',
                    'white-space:nowrap',
                    '-webkit-tap-highlight-color:transparent',
                    'touch-action:manipulation',
                    'transition:opacity 0.15s'
                ].join(';');
                btn.addEventListener('mouseenter', function () { btn.style.opacity = '1'; });
                btn.addEventListener('mouseleave', function () { btn.style.opacity = '0.85'; });
            } else {
                // 확인 버튼: 심플한 흰 테두리 스타일
                btn.style.cssText = [
                    'background:rgba(255,255,255,0.10)',
                    'border:1px solid rgba(255,255,255,0.55)',
                    'border-radius:3px',
                    'color:#fff',
                    'font-size:14px',
                    'font-family:"IyagiGGC","MS Gothic","Malgun Gothic","Apple SD Gothic Neo",sans-serif',
                    'padding:4px 14px',
                    'cursor:pointer',
                    'white-space:nowrap',
                    '-webkit-tap-highlight-color:transparent',
                    'touch-action:manipulation',
                    'transition:background 0.15s'
                ].join(';');
                btn.addEventListener('mouseenter', function () {
                    btn.style.background = 'rgba(255,255,255,0.22)';
                });
                btn.addEventListener('mouseleave', function () {
                    btn.style.background = 'rgba(255,255,255,0.10)';
                });
            }

            btn.addEventListener('touchstart', function (e) {
                e.stopPropagation();
            }, { passive: true });
            btn.addEventListener('touchend', function (e) {
                e.stopPropagation();
                e.preventDefault();
                onClick();
            });
            btn.addEventListener('click', function (e) {
                e.stopPropagation();
                onClick();
            });
            return btn;
        },

        _blockCanvasPointer: function (block) {
            var canvas = document.querySelector('canvas');
            if (canvas) canvas.style.pointerEvents = block ? 'none' : 'auto';
        }
    };

    //=========================================================================
    // Input / TouchInput 차단
    //=========================================================================
    var _Input_onKeyDown = Input._onKeyDown;
    Input._onKeyDown = function (event) {
        if (_quizOpen) return;
        _Input_onKeyDown.call(this, event);
    };

    var _Input_onKeyUp = Input._onKeyUp;
    Input._onKeyUp = function (event) {
        if (_quizOpen) return;
        _Input_onKeyUp.call(this, event);
    };

    var _TouchInput_onTouchStart = TouchInput._onTouchStart;
    TouchInput._onTouchStart = function (event) {
        if (_quizOpen) return;
        _TouchInput_onTouchStart.call(this, event);
    };

    var _TouchInput_onMouseDown = TouchInput._onMouseDown;
    TouchInput._onMouseDown = function (event) {
        if (_quizOpen) return;
        _TouchInput_onMouseDown.call(this, event);
    };

    //=========================================================================
    // Scene_Map 종료 시 정리
    //=========================================================================
    var _Scene_Map_terminate = Scene_Map.prototype.terminate;
    Scene_Map.prototype.terminate = function () {
        _Scene_Map_terminate.call(this);
        if (_quizOpen) { QuizInputManager.close(); _quizSubmitted = true; }
    };

    //=========================================================================
    // CSS 주입
    //=========================================================================
    (function injectCSS() {
        var style = document.createElement('style');
        style.textContent = [
            // IyagiGGC 폰트 로드
            '@font-face {',
            '  font-family: "IyagiGGC";',
            '  src: url("fonts/IyagiGGC.woff") format("woff");',
            '  font-weight: normal;',
            '  font-style: normal;',
            '}',
            // (모바일 소프트키보드 대응은 _syncToCanvas 가 innerHeight 변화로 자동 처리)
            // 포커스 시 커서색만 강조 (border 없음)
            '#quiz-input-field:focus {',
            '  text-shadow: 0 0 12px rgba(100,180,255,0.8) !important;',
            '}',
            // placeholder 언더바 색상
            '#quiz-input-field::placeholder {',
            '  color: rgba(255,255,255,0.4);',
            '  opacity: 1;',
            '}',
            '#quiz-input-field::-webkit-input-placeholder {',
            '  color: rgba(255,255,255,0.4);',
            '}',
            '#quiz-input-field::-moz-placeholder {',
            '  color: rgba(255,255,255,0.4);',
            '  opacity: 1;',
            '}',
            // 자동완성 배경 제거
            '#quiz-input-field:-webkit-autofill {',
            '  -webkit-box-shadow: 0 0 0 30px transparent inset !important;',
            '  -webkit-text-fill-color: #ffffff !important;',
            '}',
            // 힌트 버튼 텍스트 스타일
            '#quiz-input-container button.hint-btn {',
            '  font-family: "IyagiGGC","MS Gothic","Malgun Gothic","Apple SD Gothic Neo",sans-serif !important;',
            '  font-size: 14px !important;',
            '  color: rgba(255,220,80,0.9) !important;',
            '}'
        ].join('\n');
        document.head.appendChild(style);
    })();

})();
