//=============================================================================
// DhoomMessageSE_RandomVoice.js
//=============================================================================
// DhoomMessageSE 확장 플러그인
// 지정한 프리셋에서, 글자(character) SE를 여러 음성 파일 중 하나로 랜덤 재생한다.
//
// ★ 플러그인 관리자에서 반드시 DhoomMessageSE 보다 "아래"에 배치할 것.
//=============================================================================

/*:
 * @plugindesc DhoomMessageSE 확장 - 지정 프리셋에서 글자 SE를 voice1~N 중 랜덤 재생
 * @author Claude
 *
 * @param Target Preset Name
 * @text 대상 프리셋 이름
 * @desc 이 이름의 프리셋에서만 랜덤 보이스가 작동합니다. (DhoomMessageSE의 프리셋 이름과 일치해야 함)
 * @type string
 * @default Voice
 *
 * @param Voice File Prefix
 * @text 음성 파일 접두어
 * @desc 음성 파일 이름의 공통 앞부분. 예) voice → voice1, voice2, ...
 * @type string
 * @default voice
 *
 * @param Voice Count
 * @text 음성 파일 개수
 * @desc 랜덤으로 고를 음성 파일 개수. 예) 6 → voice1 ~ voice6
 * @type number
 * @min 1
 * @default 6
 *
 * @param Start Index
 * @text 시작 번호
 * @desc 파일 번호 시작값. 예) 1 → voice1부터, 0 → voice0부터
 * @type number
 * @min 0
 * @default 1
 *
 * @param No Repeat
 * @text 같은 소리 연속 방지
 * @desc ON이면 직전에 재생한 음성과 다른 음성을 고릅니다.
 * @type boolean
 * @on 방지함
 * @off 허용함
 * @default true
 *
 * @help =============================================================================
 * • 사용법
 * =============================================================================
 *   1. audio/se 폴더에 voice1.ogg ~ voice6.ogg (개수만큼) 파일을 넣습니다.
 *      (접두어/개수/시작번호는 위 파라미터에서 변경 가능)
 *
 *   2. DhoomMessageSE의 프리셋 중, 위 "대상 프리셋 이름"과 같은 이름의 프리셋을
 *      하나 만듭니다. 그 프리셋의 글자(Character) SE가 재생될 때마다
 *      voice1~voiceN 중 하나가 무작위로 대신 재생됩니다.
 *      (볼륨/피치/팬/Pitch Variance 등 나머지 설정은 프리셋의 Character SE 값을
 *       그대로 따릅니다. 파일 이름만 랜덤으로 바뀝니다.)
 *
 *   3. 메시지에서 \mse[Voice] 로 해당 프리셋으로 전환하면 랜덤 보이스가 나옵니다.
 *      (다른 프리셋에서는 평소처럼 동작합니다.)
 *
 * • 참고
 *   - 글자 SE에만 적용됩니다. word/sentence/page SE에는 영향을 주지 않습니다.
 *   - 보이스 ON/OFF 전환은 이 플러그인이 아니라, 메시지 표시 전에
 *     조건 분기로 \mse[Voice] / \mse[Default] 프리셋을 바꾸는 식으로 처리하면 됩니다.
 *
 * ★ 플러그인 관리자에서 반드시 DhoomMessageSE 보다 아래에 두세요.
 */

(function () {
    'use strict';

    // ── 의존성 확인 ──────────────────────────────────────────────────────────
    if (typeof Dhoom === 'undefined' || !Dhoom.MessageSE) {
        console.error('DhoomMessageSE_RandomVoice: DhoomMessageSE 플러그인을 찾을 수 없습니다. ' +
                      '플러그인 목록에서 DhoomMessageSE 아래에 배치했는지 확인하세요.');
        return;
    }

    var params      = PluginManager.parameters('DhoomMessageSE_RandomVoice');
    var TARGET_NAME = String(params['Target Preset Name'] || 'Voice');
    var PREFIX      = String(params['Voice File Prefix'] || 'voice');
    var COUNT       = Math.max(1, Number(params['Voice Count'] || 6));
    var START_IDX   = Math.max(0, Number(params['Start Index'] || 1));
    var NO_REPEAT   = String(params['No Repeat'] || 'true') === 'true';

    // 직전에 고른 파일명 (연속 방지용)
    var _lastVoiceName = null;

    // 랜덤 음성 파일명 하나 선택
    function pickVoiceName() {
        if (COUNT === 1) {
            return PREFIX + START_IDX;
        }
        var name;
        do {
            var n = START_IDX + Math.floor(Math.random() * COUNT);
            name = PREFIX + n;
        } while (NO_REPEAT && name === _lastVoiceName);
        _lastVoiceName = name;
        return name;
    }

    //-------------------------------------------------------------------------
    // updateMessageSE 를 감싼다.
    // 대상 프리셋이 활성인 동안에만, 그 프리셋의 characterSe.name 을
    // 잠깐 랜덤 파일명으로 바꿔치기한 뒤 원본을 호출하고, 곧바로 원복한다.
    //
    // 이렇게 하면 글자 SE에만 영향을 주고 (원본이 characterSe를 고를 때만
    // 바뀐 이름이 쓰임), word/sentence/page SE 및 볼륨·피치·variance 등
    // 나머지 동작은 원본 그대로 유지된다.
    //-------------------------------------------------------------------------
    var _Window_Message_updateMessageSE = Window_Message.prototype.updateMessageSE;
    Window_Message.prototype.updateMessageSE = function (i, textState) {
        var preset = $gameSystem.messageSePreset();

        // 대상 프리셋이 아니거나, characterSe가 없으면 원본 그대로
        if (!preset || String(preset.name) !== TARGET_NAME ||
            !preset.characterSe) {
            _Window_Message_updateMessageSE.call(this, i, textState);
            return;
        }

        // characterSe.name 만 임시로 랜덤 교체
        var originalName = preset.characterSe.name;
        preset.characterSe.name = pickVoiceName();
        try {
            _Window_Message_updateMessageSE.call(this, i, textState);
        } finally {
            // 어떤 경우에도 원래 이름으로 복구 (프리셋 객체가 공유되므로 필수)
            preset.characterSe.name = originalName;
        }
    };

    //-------------------------------------------------------------------------
    // 음성 파일 미리 로드 (끊김 방지)
    //-------------------------------------------------------------------------
    var _SoundManager_preloadMessageSe = SoundManager.preloadMessageSe;
    SoundManager.preloadMessageSe = function () {
        if (_SoundManager_preloadMessageSe) {
            _SoundManager_preloadMessageSe.call(this);
        }
        for (var n = START_IDX; n < START_IDX + COUNT; n++) {
            AudioManager.loadStaticSe({ name: PREFIX + n, volume: 100, pitch: 100, pan: 0 });
        }
    };

})();
