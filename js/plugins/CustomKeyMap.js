//=============================================================================
// CustomKeyMap.js
//=============================================================================
/*:
 * @plugindesc 키 입력 재설정: X/Shift=취소, Ctrl/C=메뉴 열기, Z/Enter=결정, Space 제거. 마우스는 그대로.
 * @author (custom)
 *
 * @help
 * ============================================================================
 *  개요
 * ============================================================================
 * 키보드 입력 매핑을 다음과 같이 변경합니다.
 *
 *   결정(ok)     : Z, Enter               (기본 유지)
 *   취소(escape) : X, Shift               (Shift 달리기는 사라짐)
 *   메뉴 열기    : Ctrl, C                (새 'menu' 액션)
 *   방향키       : 좌우상하                (기본 유지)
 *   Space        : 제거 (아무 동작 안 함)
 *   마우스       : 그대로 (TouchInput 이라 영향 없음)
 *
 * ※ Space 는 원래 결정(ok)이었으나 매핑에서 제거되어 반응하지 않습니다.
 * ※ Shift 는 원래 달리기(shift)였으나 취소(escape)로 바뀝니다.
 * ============================================================================
 */

(function() {
    'use strict';

    //-------------------------------------------------------------------------
    //  키 매핑 전체 재정의
    //  (필요한 키만 남기고 새로 구성 — Space 는 의도적으로 뺌)
    //-------------------------------------------------------------------------
    Input.keyMapper = {
        9:  'tab',      // Tab
        13: 'ok',       // Enter  — 결정
        16: 'escape',   // Shift  — 취소
        17: 'menu',     // Ctrl   — 메뉴 열기
        27: 'escape',   // Esc    — 취소(관례상 유지)
        37: 'left',     // ←
        38: 'up',       // ↑
        39: 'right',    // →
        40: 'down',     // ↓
        67: 'menu',     // C      — 메뉴 열기
        88: 'escape',   // X      — 취소
        90: 'ok'        // Z      — 결정
        // 32(Space) 없음 → 제거됨
    };

    //-------------------------------------------------------------------------
    //  맵에서 Ctrl/C('menu' 액션)로 메뉴가 열리도록 처리
    //  기본 MV 는 'escape'(=취소)로 메뉴를 열지만, 여기선 취소와 메뉴를
    //  분리했으므로 'menu' 트리거를 별도로 확인해 메뉴를 연다.
    //  ('cancel' 로 인한 기본 메뉴 열기는 아래에서 무력화)
    //-------------------------------------------------------------------------
    var _Scene_Map_updateScene = Scene_Map.prototype.updateScene;
    Scene_Map.prototype.updateScene = function() {
        _Scene_Map_updateScene.call(this);
        if (!SceneManager.isSceneChanging()) {
            this.updateCallMenuByKey();
        }
    };

    Scene_Map.prototype.updateCallMenuByKey = function() {
        if (this.isMenuEnabled() && !this.isMenuCalled() &&
            !$gameMap.isEventRunning() && Input.isTriggered('menu')) {
            this.menuCalling = true;
        }
    };

    // 기본 'cancel'(=escape) 로 메뉴가 열리던 동작 무력화:
    //  X/Shift 취소가 맵에서 메뉴를 열지 않도록 한다.
    Scene_Map.prototype.isMenuCalled = function() {
        return this.menuCalling;
    };

})();
