//=============================================================================
// MenuTouchButton.js
//=============================================================================
/*:
 * @plugindesc 맵 우측 상단에 햄버거 버튼을 띄워 탭으로 메뉴 열기/닫기 (웹·모바일 대응)
 * @author (custom)
 *
 * @help
 * ============================================================================
 *  개요
 * ============================================================================
 * 맵 화면 우측 상단에 img/picture/hamberger.png 버튼을 표시합니다.
 *   - 맵에서 탭 → 메뉴 열기
 *   - 메뉴(Scene_Menu)에서 탭 → 메뉴 닫기(맵 복귀)
 *   - 메시지 창이 떠 있는 동안에는 버튼 숨김
 *   - PC·모바일 모두 항상 표시 (한 손가락 탭이라 웹에서도 안정적)
 *   - 버튼에서 시작된 터치는 뒤(맵 이동·메뉴 창)로 전달되지 않음
 *
 * 버튼 이미지: img/picture/hamberger.png 를 넣어주세요.
 * 위치/여백은 아래 CFG 상수에서 조정하세요.
 *
 * ============================================================================
 *  터치 관통(pass-through) 방지 구조
 * ============================================================================
 * MV의 Scene_Map.update()는 프레임 "맨 앞"에서 updateDestination() →
 * processMapTouch()를 실행해 터치 지점을 이동 목적지로 설정하고,
 * 버튼 스프라이트의 update()는 프레임 "맨 끝"(updateChildren)에 실행됩니다.
 * 따라서 버튼 쪽에서 나중에 입력을 지우는 방식(TouchInput.clear() 등)으로는
 * 같은 프레임에 이미 확정된 맵 이동을 막을 수 없습니다.
 *
 * 그래서 이 플러그인은 "이 터치가 버튼에서 시작됐는가"를 실행 순서와
 * 무관하게 좌표로 판정하는 isTouchCaptured()를 두고,
 * 터치를 소비하는 쪽의 입구에서 해당 터치를 무시하게 합니다.
 *   1) Scene_Map.processMapTouch      → 맵 이동으로 새는 것 방지
 *   2) Window_Selectable.processTouch → 메뉴에서 버튼 아래에 겹친 창
 *                                       (스테이터스 창 등)이 반응하는 것 방지
 * ============================================================================
 */

(function() {
    'use strict';

    var CFG = {
        IMAGE: 'hamberger',   // img/picture/hamberger.png (확장자 제외)
        MARGIN_X: 12,         // 화면 오른쪽 끝에서 버튼까지 여백(px)
        MARGIN_Y: 12,         // 화면 위쪽 끝에서 버튼까지 여백(px)
        SCALE: 1.0            // 버튼 크기 배율
    };

    //=========================================================================
    //  Sprite_HamburgerButton : 탭 감지 스프라이트 버튼
    //=========================================================================
    function Sprite_HamburgerButton() {
        this.initialize.apply(this, arguments);
    }
    Sprite_HamburgerButton.prototype = Object.create(Sprite.prototype);
    Sprite_HamburgerButton.prototype.constructor = Sprite_HamburgerButton;

    Sprite_HamburgerButton.prototype.initialize = function(onTapHandler) {
        Sprite.prototype.initialize.call(this);
        this.bitmap = ImageManager.loadPicture(CFG.IMAGE);
        this.scale.x = CFG.SCALE;
        this.scale.y = CFG.SCALE;
        this._onTap = onTapHandler;
        this._pressed = false;
        var self = this;
        this.bitmap.addLoadListener(function() { self.updatePosition(); });
    };

    // 우측 상단에 배치
    Sprite_HamburgerButton.prototype.updatePosition = function() {
        var w = this.width * CFG.SCALE;
        this.x = Graphics.boxWidth - w - CFG.MARGIN_X;
        this.y = CFG.MARGIN_Y;
    };

    // 버튼이 지금 보여야 하는지 (메시지 창 뜬 동안 숨김)
    Sprite_HamburgerButton.prototype.shouldShow = function() {
        if ($gameMessage && $gameMessage.isBusy()) { return false; }
        return true;
    };

    Sprite_HamburgerButton.prototype.update = function() {
        Sprite.prototype.update.call(this);
        this.updatePosition();
        this.visible = this.shouldShow();
        if (this.visible) {
            this.processTouch();
        } else {
            // 눌린 채로 숨겨지면 눌림 상태가 남아 오작동하므로 반드시 초기화
            this._pressed = false;
        }
    };

    // 스프라이트 영역 안을 탭했는지 판정
    Sprite_HamburgerButton.prototype.isButtonTouched = function() {
        var x = this.canvasToLocalX(TouchInput.x);
        var y = this.canvasToLocalY(TouchInput.y);
        return x >= 0 && y >= 0 &&
               x <= this.width * CFG.SCALE && y <= this.height * CFG.SCALE;
    };
    Sprite_HamburgerButton.prototype.canvasToLocalX = function(x) {
        return x - this.x;
    };
    Sprite_HamburgerButton.prototype.canvasToLocalY = function(y) {
        return y - this.y;
    };

    // 버튼 위에서 누르기 시작해(트리거) 버튼 위에서 뗐을 때만 탭으로 처리.
    // ※ 여기서 TouchInput.clear()를 호출하면 안 된다.
    //    clear()는 좌표와 눌림/릴리즈 상태를 전부 리셋해 버튼 자신의
    //    릴리즈 판정을 깨뜨리고(모바일에선 touchend 등록 자체가 막힘),
    //    맵의 터치 처리는 버튼 update보다 먼저 실행되므로
    //    같은 프레임의 맵 이동도 막지 못한다.
    Sprite_HamburgerButton.prototype.processTouch = function() {
        if (TouchInput.isTriggered() && this.isButtonTouched()) {
            this._pressed = true;
        }
        if (this._pressed && TouchInput.isReleased()) {
            this._pressed = false;
            if (this.isButtonTouched() && this._onTap) {
                this._onTap();
            }
        }
    };

    // 현재 터치를 이 버튼이 점유 중인지 판정 (터치 관통 차단용).
    // 씬의 터치 처리(processMapTouch 등)는 버튼의 update()보다 먼저 실행되어
    // 트리거 프레임에는 _pressed 가 아직 false 이므로,
    // 그 프레임은 TouchInput 좌표로 직접 판정한다. → 실행 순서와 무관하게 동작.
    Sprite_HamburgerButton.prototype.isTouchCaptured = function() {
        if (!this.visible) { return false; }
        if (this._pressed) { return true; }  // 버튼에서 시작된 누름이 진행 중(릴리즈 프레임 포함)
        return TouchInput.isTriggered() && this.isButtonTouched();
    };

    //=========================================================================
    //  터치 관통 방지 1 : Scene_Map 의 맵 이동
    //  버튼이 점유한 터치는 이동 목적지 설정에서 제외한다.
    //=========================================================================
    var _SceneMap_processMapTouch = Scene_Map.prototype.processMapTouch;
    Scene_Map.prototype.processMapTouch = function() {
        if (this._hamburgerButton && this._hamburgerButton.isTouchCaptured()) {
            this._touchCount = 0;   // 눌러두기 이동(15프레임 연속 판정)도 함께 차단
            return;
        }
        _SceneMap_processMapTouch.call(this);
    };

    //=========================================================================
    //  터치 관통 방지 2 : 버튼 아래에 겹친 선택 창
    //  (Scene_Menu 에서 버튼이 스테이터스 창 위에 겹치므로,
    //   버튼 탭이 액터 선택 등으로 새지 않게 창의 터치 처리도 차단)
    //  버튼이 없는 씬이나 버튼이 터치를 점유하지 않은 프레임에는
    //  원본 그대로 동작한다.
    //=========================================================================
    var _WindowSelectable_processTouch = Window_Selectable.prototype.processTouch;
    Window_Selectable.prototype.processTouch = function() {
        var scene = SceneManager._scene;
        var button = scene ? scene._hamburgerButton : null;
        if (button && button.isTouchCaptured()) {
            this._touching = false;
            return;
        }
        _WindowSelectable_processTouch.call(this);
    };

    //=========================================================================
    //  Scene_Map : 버튼 추가 (탭 → 메뉴 열기)
    //=========================================================================
    var _SceneMap_createDisplayObjects = Scene_Map.prototype.createDisplayObjects;
    Scene_Map.prototype.createDisplayObjects = function() {
        _SceneMap_createDisplayObjects.call(this);
        this.createHamburgerButton();
    };

    Scene_Map.prototype.createHamburgerButton = function() {
        var self = this;
        this._hamburgerButton = new Sprite_HamburgerButton(function() {
            self.openMenuByButton();
        });
        // 맵에서는 메시지 창 표시 중 또는 메뉴 금지 상태면 숨김
        this._hamburgerButton.shouldShow = function() {
            if ($gameMessage && $gameMessage.isBusy()) { return false; }
            if (!$gameSystem.isMenuEnabled()) { return false; }
            return true;
        };
        this.addChild(this._hamburgerButton);
    };

    Scene_Map.prototype.openMenuByButton = function() {
        if (this.isMenuButtonEnabled()) {
            SoundManager.playOk();
            SceneManager.push(Scene_Menu);
        }
    };

    // 메뉴 호출 가능 상태(이벤트 실행/이동 중, 메뉴 금지 등이 아닐 때)
    Scene_Map.prototype.isMenuButtonEnabled = function() {
        return $gameSystem.isMenuEnabled() &&
               !$gameMap.isEventRunning() &&
               !$gameMessage.isBusy() &&
               !SceneManager.isSceneChanging();
    };

    //=========================================================================
    //  Scene_Menu : 같은 버튼 표시 (탭 → 메뉴 닫기)
    //=========================================================================
    var _SceneMenu_create = Scene_Menu.prototype.create;
    Scene_Menu.prototype.create = function() {
        _SceneMenu_create.call(this);
        this.createHamburgerButton();
    };

    Scene_Menu.prototype.createHamburgerButton = function() {
        var self = this;
        this._hamburgerButton = new Sprite_HamburgerButton(function() {
            self.closeMenuByButton();
        });
        // 메뉴에서는 메시지 창 조건이 없으므로 항상 표시
        this._hamburgerButton.shouldShow = function() { return true; };
        this.addChild(this._hamburgerButton);
    };

    Scene_Menu.prototype.closeMenuByButton = function() {
        if (!SceneManager.isSceneChanging()) {
            SoundManager.playCancel();
            this.popScene();  // 맵으로 복귀
        }
    };

})();
