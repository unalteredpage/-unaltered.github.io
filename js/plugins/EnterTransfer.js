//=============================================================================
// EnterTransfer.js
//=============================================================================

/*:
 * @plugindesc 스위치 18번이 켜져 있을 때 Enter(결정키)를 누르면 맵 009의 (8,11)로 페이드 없이 이동합니다.
 * @author Claude
 *
 * @help
 * 스위치 18번이 ON인 동안, 메시지 표시 중이든 아니든 상관없이
 * 결정키(Enter/Space/Z)를 누르면 맵 009번의 좌표 (8, 11)로
 * 페이드 없이 이동합니다.
 *
 * 스위치 18번이 OFF이면 아무 동작도 하지 않습니다.
 * 플러그인 매니저에 등록하고 ON 하기만 하면 됩니다.
 */

(function() {
    'use strict';

    var _Scene_Map_update = Scene_Map.prototype.update;
    Scene_Map.prototype.update = function() {
        _Scene_Map_update.call(this);

        if (!$gameSwitches.value(18)) return;
        if ($gamePlayer.isTransferring()) return;

        if (Input.isTriggered('ok')) {
            // 메시지가 떠 있으면 먼저 닫는다.
            if ($gameMessage.isBusy()) {
                $gameMessage.clear();
                if (SceneManager._scene._messageWindow) {
                    SceneManager._scene._messageWindow.terminateMessage();
                }
            }
            // 이동 예약 후 즉시 실행
            $gamePlayer.reserveTransfer(9, 8, 11, 0, 0);
            $gamePlayer.performTransfer();
        }
    };
})();