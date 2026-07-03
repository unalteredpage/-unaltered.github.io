//=============================================================================
// MenuWindowCustom.js
//=============================================================================
/*:
 * @plugindesc 메뉴창(커맨드/소지금/액터정보) 공통 디자인 수정
 * @author (custom)
 *
 * @help
 * X키로 열리는 메뉴 화면의 세 창(커맨드창, 소지금창, 액터정보창)에
 * 다음 공통 변경을 적용합니다.
 *
 *   1. 윈도우 스킨(system/Window.png)은 그대로 사용 (기본값 유지)
 *   2. 배경 불투명도(back opacity)를 255로 (반투명 -> 진하게)
 *   3. 텍스트의 검은 테두리(outline) 제거, 글자색은 흰색 유지
 *   4. 선택 커서의 빛나는(깜빡임) 효과 제거
 *
 * 플러그인 매니저에서 ON으로 두면 적용됩니다.
 * 원본 코어 파일(rpg_windows.js)은 수정하지 않습니다.
 */

(function() {
    'use strict';

    //-------------------------------------------------------------------------
    // 이 플러그인을 적용할 메뉴 관련 창 목록
    //-------------------------------------------------------------------------
    var TARGET_WINDOWS = [
        Window_MenuCommand,   // 1. 메뉴 버튼(아이템/스킬/장비/...) 창
        Window_Gold,          // 2. 소지금 창
        Window_MenuStatus     // 3. 액터 정보 창
    ];

    TARGET_WINDOWS.forEach(function(WindowClass) {

        //---------------------------------------------------------------------
        // 2. 배경 불투명도 255 (완전히 진하게)
        //---------------------------------------------------------------------
        WindowClass.prototype.standardBackOpacity = function() {
            return 255;
        };

        //---------------------------------------------------------------------
        // 3. 텍스트 검은 테두리(outline) 제거 / 글자색은 흰색 유지
        //    resetFontSettings 직후 outline 을 투명+두께0 으로 덮어씀.
        //---------------------------------------------------------------------
        var _resetFontSettings = WindowClass.prototype.resetFontSettings;
        WindowClass.prototype.resetFontSettings = function() {
            _resetFontSettings.call(this);
            if (this.contents) {
                this.contents.outlineWidth = 0;
                this.contents.outlineColor = 'rgba(0, 0, 0, 0)';
            }
        };

        //---------------------------------------------------------------------
        // 4. 선택 커서의 빛나는(깜빡임) 효과 제거
        //    _makeCursorAlpha 만 오버라이드해서 항상 불투명 고정.
        //    (위치/가시성 등 나머지 커서 처리는 코어 원본 그대로 유지)
        //---------------------------------------------------------------------
        WindowClass.prototype._makeCursorAlpha = function() {
            return this.contentsOpacity / 255; // 깜빡임 계산 없이 기본 불투명도만
        };
    });

})();
