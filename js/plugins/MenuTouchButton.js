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
 *
 * 버튼 이미지: img/picture/hamberger.png 를 넣어주세요.
 *
 * 위치/여백은 아래 CFG 상수에서 조정하세요.
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
        if (this.visible) { this.processTouch(); }
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
