//=============================================================================
// DhoomMessageSE_RandomVoice.js
//=============================================================================
// DhoomMessageSE 확장 플러그인
// 지정한 프리셋에서, 글자(character) SE를 여러 음성 파일 중 하나로 랜덤 재생한다.
//
// ★ 플러그인 관리자에서 반드시 DhoomMessageSE 보다 "아래"에 배치할 것.
//=============================================================================

/*:
 * @plugindesc DhoomMessageSE 확장 - 지정 프리셋에서 글자 SE를 voice1~N 중 랜덤 재생 (v1.1 스킵 중복재생 수정)
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
 * @param Skip Voice Mode
 * @text 스킵 시 보이스 처리
 * @desc 엔터/시프트로 대사를 한꺼번에 넘길 때 보이스 처리 방식.
 * once = 1개만 재생 / mute = 재생 안 함
 * @type select
 * @option 1개만 재생 (once)
 * @value once
 * @option 재생 안 함 (mute)
 * @value mute
 * @default once
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
 * • v1.1 변경점 (스킵 중복재생 수정)
 *   - 엔터/시프트 빨리감기로 남은 글자가 한 프레임에 전부 출력될 때,
 *     글자 수만큼 보이스가 동시에 터지던 문제를 수정.
 *   - 대상 프리셋에서는 보이스를 "한 프레임에 최대 1회"만 재생합니다.
 *     (정상 속도 타이핑은 프레임당 글자 1개 이하이므로 영향 없음)
 *   - [스킵 시 보이스 처리]를 mute로 두면, 빨리감기 중에는 아예 재생하지 않습니다.
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
    var SKIP_MODE   = String(params['Skip Voice Mode'] || 'once'); // 'once' | 'mute'

    // 직전에 고른 파일명 (연속 방지용)
    var _lastVoiceName = null;

    // 마지막으로 보이스를 재생한 프레임 (한 프레임 1회 제한용)
    var _lastVoiceFrame = -1;

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
    // ★ 스킵(빨리감기) 대응 (v1.1):
    //   엔터/시프트로 빨리감기를 하면 MV는 남은 글자를 "같은 한 프레임" 안에서
    //   전부 processCharacter로 처리하므로, updateMessageSE도 글자 수만큼 연속
    //   호출되어 보이스가 N개 동시에 재생되던 문제가 있었다.
    //
    //   → Graphics.frameCount로 "이 프레임에 이미 보이스를 재생했는지"를 추적해,
    //     같은 프레임의 두 번째 호출부터는 characterSe.name 을 빈 문자열('')로
    //     바꿔치기한다. MV의 AudioManager.playSe / playStaticSe 는 name이 비어
    //     있으면 아무것도 재생하지 않으므로, DhoomMessageSE의 글자 간격 카운터 등
    //     나머지 로직은 그대로 돌면서 소리만 조용히 스킵된다.
    //
    //   정상 속도 타이핑은 프레임당 글자가 1개 이하이므로 이 제한의 영향을
    //   받지 않는다.
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

        var frame       = Graphics.frameCount;
        var isFast      = this._showFast || this._lineShowFast || this._pauseSkip;
        var alreadyThis = (_lastVoiceFrame === frame);

        // 이번 호출에서 실제로 소리를 낼지 결정
        var playThisTime;
        if (alreadyThis) {
            // 같은 프레임에서 이미 1회 재생함 → 무음 처리 (동시재생 방지)
            playThisTime = false;
        } else if (isFast && SKIP_MODE === 'mute') {
            // 빨리감기 중 + mute 모드 → 재생하지 않음
            playThisTime = false;
        } else {
            playThisTime = true;
        }

        // characterSe.name 만 임시로 교체 (재생 시 랜덤, 무음 시 '')
        var originalName = preset.characterSe.name;
        preset.characterSe.name = playThisTime ? pickVoiceName() : '';
        if (playThisTime) {
            _lastVoiceFrame = frame;
        }
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
