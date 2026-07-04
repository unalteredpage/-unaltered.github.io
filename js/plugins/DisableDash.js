//=============================================================================
// DisableDash.js
//=============================================================================
/*:
 * @plugindesc 대쉬(달리기) 기능을 완전히 비활성화합니다. 마우스 클릭 이동 대쉬도 막습니다.
 * @author -
 *
 * @help 이 플러그인은 파라미터가 없습니다.
 * 플러그인 목록에 추가하고 ON으로 설정하면 됩니다.
 */

(function() {

    // Shift 키 등에 의한 대쉬 입력 무효화
    Game_Player.prototype.isDashButtonPressed = function() {
        return false;
    };

    // updateDashing 무효화 (키보드/기타 대쉬 판정)
    Game_Player.prototype.updateDashing = function() {
        this._dashing = false;
    };

    // 마우스 클릭(터치) 이동 시 대쉬 방지
    Game_Player.prototype.updateDashDestination = function() {
        this._dashing = false;
    };

    // 대쉬 상태를 항상 false로 반환
    Game_Player.prototype.isDashing = function() {
        return false;
    };

})();