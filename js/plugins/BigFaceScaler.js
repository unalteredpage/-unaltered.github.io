//=============================================================================
// BigFaceScaler.js
//=============================================================================

/*:
 * @plugindesc v3.0.0 페이스칩을 도트 디테일을 최대한 보존하며 선명하게 축소합니다.
 * @author Claude
 *
 * @param FaceDisplayWidth
 * @text 표시 너비 (px)
 * @desc 메시지 창에서 페이스칩이 표시될 최대 너비
 * @type number
 * @min 1
 * @default 144
 *
 * @param FaceDisplayHeight
 * @text 표시 높이 (px)
 * @desc 메시지 창에서 페이스칩이 표시될 최대 높이
 * @type number
 * @min 1
 * @default 144
 *
 * @param OffsetX
 * @text X 오프셋 (px)
 * @desc 미세 조정용 가로 오프셋
 * @type number
 * @min -9999
 * @default 0
 *
 * @param OffsetY
 * @text Y 오프셋 (px)
 * @desc 미세 조정용 세로 오프셋
 * @type number
 * @min -9999
 * @default 0
 *
 * @param ScaleMode
 * @text 축소 방식
 * @desc smooth=부드럽게(기본 보간) / sharp=또렷하게(픽셀/도트 보존)
 * @type select
 * @option 또렷하게 (도트 보존)
 * @value sharp
 * @option 부드럽게 (기본)
 * @value smooth
 * @default sharp
 *
 * @param StepDown
 * @text 단계적 축소
 * @desc ON이면 절반씩 여러 번 나눠 줄여 가는 선/작은 도트 손실을 줄입니다.
 * @type boolean
 * @on 사용
 * @off 미사용
 * @default true
 *
 * @help
 * ============================================================================
 * BigFaceScaler v3 - 페이스칩 선명 축소 플러그인
 * ============================================================================
 *
 * 【무엇이 바뀌었나】
 *   기존에는 1280px 같은 큰 이미지를 144px로 "한 번에" 줄여서,
 *   가는 선이나 1~2px짜리 작은 도트가 평균값에 묻혀 사라졌습니다.
 *
 *   v3는 세 가지로 이를 개선합니다.
 *     1) 또렷한 축소(sharp): 픽셀을 뭉개지 않고 도트 느낌을 살려 그립니다.
 *     2) 단계적 축소(StepDown): 큰 이미지를 절반씩 여러 번 나눠 줄입니다.
 *        한 번에 9분의 1로 줄이는 것보다 디테일이 훨씬 잘 남습니다.
 *     3) 작은 이미지 정수배율 확대: 표시 영역보다 작은 페이스(32, 64 등)는
 *        표시 영역을 넘지 않는 최대 정수 배율로 키웁니다.
 *        예) 144 영역에서 64px → 2배(128px), 32px → 4배(128px).
 *        정수 배율 + nearest로 키우므로 도트가 일그러지지 않습니다.
 *
 * 【표시 크기】
 *   메시지 창 왼쪽 페이스칩 영역은 기본 144x144 입니다.
 *   그보다 키우면 메시지 창을 벗어날 수 있으니 주의하세요.
 *
 * 【스프라이트시트 판별】
 *   가로가 세로의 정확히 2배 → 표준 4열×2행 시트로 처리, 그 외 → 단일 이미지.
 * ============================================================================
 */

(function () {
    'use strict';

    //-------------------------------------------------------------------------
    // 파라미터
    //-------------------------------------------------------------------------
    var parameters = PluginManager.parameters('BigFaceScaler');
    var DISPLAY_W   = Number(parameters['FaceDisplayWidth']  || 144);
    var DISPLAY_H   = Number(parameters['FaceDisplayHeight'] || 144);
    var OFFSET_X    = Number(parameters['OffsetX']           || 0);
    var OFFSET_Y    = Number(parameters['OffsetY']           || 0);
    var SCALE_MODE  = String(parameters['ScaleMode'] || 'sharp');
    var STEP_DOWN   = String(parameters['StepDown']  || 'true') === 'true';

    var SHARP = (SCALE_MODE === 'sharp');

    //-------------------------------------------------------------------------
    // 캐시: 같은 페이스칩을 매번 다시 축소하지 않도록 결과 비트맵을 저장
    //   key = faceName + '#' + faceIndex + '#' + DISPLAY_W + 'x' + DISPLAY_H
    //-------------------------------------------------------------------------
    var _scaledCache = {};

    //-------------------------------------------------------------------------
    // 크기 변환 유틸
    // 원본의 (srcX,srcY,srcW,srcH) 영역을 (drawW,drawH) 크기로 만든
    // 새 Bitmap을 반환한다.
    //   - 축소 시: 절반보다 작게 줄여야 하면 절반씩 여러 번 거쳐(단계적 축소)
    //             가는 선/작은 도트 손실을 최소화한다.
    //   - 확대 시: 단계 루프를 건너뛰고 한 번에 키운다. sharp(nearest) 모드면
    //             정수 배율 확대 시 도트가 일그러지지 않고 그대로 보존된다.
    //-------------------------------------------------------------------------
    function makeScaledBitmap(src, srcX, srcY, srcW, srcH, drawW, drawH) {
        // 1) 원본에서 필요한 셀 영역만 잘라낸 작업용 비트맵 생성
        var cur = new Bitmap(srcW, srcH);
        applySmoothing(cur, !SHARP);
        cur.blt(src, srcX, srcY, srcW, srcH, 0, 0, srcW, srcH);

        var curW = srcW;
        var curH = srcH;

        // 2) 단계적 축소: 목표가 현재의 절반 미만이면 절반씩 줄여 접근
        if (STEP_DOWN) {
            while (curW > drawW * 2 && curH > drawH * 2) {
                var halfW = Math.max(drawW, Math.floor(curW / 2));
                var halfH = Math.max(drawH, Math.floor(curH / 2));

                var next = new Bitmap(halfW, halfH);
                applySmoothing(next, !SHARP);
                next.blt(cur, 0, 0, curW, curH, 0, 0, halfW, halfH);

                cur  = next;
                curW = halfW;
                curH = halfH;
            }
        }

        // 3) 마지막으로 목표 크기까지 줄이기
        var out = new Bitmap(drawW, drawH);
        applySmoothing(out, !SHARP);
        out.blt(cur, 0, 0, curW, curH, 0, 0, drawW, drawH);

        return out;
    }

    //-------------------------------------------------------------------------
    // 비트맵의 보간(smoothing) on/off
    //   smooth=true  → 부드러운 축소 (기본 보간)
    //   smooth=false → 또렷한 축소 (nearest neighbor, 도트 보존)
    //
    // MV Bitmap에는 공식 'smooth' 속성이 있어, 값을 넣으면 내부적으로
    // _baseTexture.scaleMode 를 LINEAR/NEAREST 로 맞춰준다. 이를 우선 사용하고,
    // 캔버스 컨텍스트의 imageSmoothingEnabled 도 함께 꺼서 blt 축소 단계에서도
    // 픽셀이 뭉개지지 않게 한다.
    //-------------------------------------------------------------------------
    function applySmoothing(bitmap, smooth) {
        // 1) 캔버스 2D 컨텍스트의 보간 플래그 (blt로 줄일 때 적용됨)
        var ctx = bitmap._context;
        if (ctx) {
            ctx.imageSmoothingEnabled       = smooth;
            ctx.webkitImageSmoothingEnabled = smooth;
            ctx.mozImageSmoothingEnabled    = smooth;
            ctx.msImageSmoothingEnabled     = smooth;
        }
        // 2) MV 공식 smooth 속성 (텍스처 scaleMode까지 알아서 처리)
        try {
            bitmap.smooth = smooth;
        } catch (e) {
            // 혹시 smooth 속성이 없으면 scaleMode를 직접 설정 (버전 호환)
            if (bitmap._baseTexture && typeof PIXI !== 'undefined') {
                var modes = PIXI.SCALE_MODES || PIXI.scaleModes;
                if (modes) {
                    bitmap._baseTexture.scaleMode = smooth ? modes.LINEAR : modes.NEAREST;
                }
            }
        }
        if (bitmap._setDirty) bitmap._setDirty();
    }

    //-------------------------------------------------------------------------
    // Window_Message.drawMessageFace 오버라이드
    //-------------------------------------------------------------------------
    Window_Message.prototype.drawMessageFace = function () {
        var faceName  = $gameMessage.faceName();
        var faceIndex = $gameMessage.faceIndex();
        if (faceName) {
            this.drawScaledFace(faceName, faceIndex, OFFSET_X, OFFSET_Y, DISPLAY_W, DISPLAY_H);
        }
    };

    //-------------------------------------------------------------------------
    // Window_Base.drawScaledFace
    //-------------------------------------------------------------------------
    Window_Base.prototype.drawScaledFace = function (faceName, faceIndex, destX, destY, maxW, maxH) {
        var bitmap = ImageManager.loadFace(faceName);
        var self   = this;

        bitmap.addLoadListener(function () {
            var srcX, srcY, srcW, srcH;

            // 가로가 세로의 정확히 2배 → 표준 4열×2행 스프라이트시트
            var isSheet = (bitmap.width === bitmap.height * 2);

            if (isSheet) {
                var cellW = Math.floor(bitmap.width  / 4);
                var cellH = Math.floor(bitmap.height / 2);
                var col   = faceIndex % 4;
                var row   = Math.floor(faceIndex / 4);
                srcX = col * cellW;
                srcY = row * cellH;
                srcW = cellW;
                srcH = cellH;
            } else {
                srcX = 0;
                srcY = 0;
                srcW = bitmap.width;
                srcH = bitmap.height;
            }

            // ── 크기 결정 ──────────────────────────────────────────────────
            // 원본이 표시 영역보다 "작으면" 정수 배율로 확대 (도트 보존),
            // "크면" 기존처럼 비율 유지 축소.
            var drawW, drawH;

            if (srcW <= maxW && srcH <= maxH) {
                // 작은 이미지: 표시 영역(maxW,maxH)을 넘지 않는 최대 정수 배율
                //   예) maxW=144, src=64 → 2배(128). src=32 → 4배(128).
                //   가로/세로 중 더 빡빡한 쪽 기준으로 배율을 잡아 비율을 유지한다.
                var intScale = Math.min(
                    Math.floor(maxW / srcW),
                    Math.floor(maxH / srcH)
                );
                if (intScale < 1) intScale = 1; // 안전장치
                drawW = srcW * intScale;
                drawH = srcH * intScale;
            } else {
                // 큰 이미지: 비율 유지 축소
                var scale = Math.min(maxW / srcW, maxH / srcH);
                drawW = Math.max(1, Math.floor(srcW * scale));
                drawH = Math.max(1, Math.floor(srcH * scale));
            }

            // 표시 영역 안에서 중앙 정렬
            var cx = destX + Math.floor((maxW - drawW) / 2);
            var cy = destY + Math.floor((maxH - drawH) / 2);

            // 결과 비트맵을 캐시에서 가져오거나 새로 생성
            var key = faceName + '#' + faceIndex + '#' + drawW + 'x' + drawH +
                      '#' + (SHARP ? 's' : 'm') + (STEP_DOWN ? 't' : 'f');
            var scaled = _scaledCache[key];
            if (!scaled) {
                scaled = makeScaledBitmap(bitmap, srcX, srcY, srcW, srcH, drawW, drawH);
                _scaledCache[key] = scaled;
            }

            // 최종 출력. 같은 크기 1:1 복사라 여기서는 디테일 손실이 거의 없다.
            // 그래도 sharp 모드면 contents 보간도 꺼서 확실히 또렷하게 복사.
            if (SHARP && self.contents && self.contents._context) {
                var cctx = self.contents._context;
                cctx.imageSmoothingEnabled       = false;
                cctx.webkitImageSmoothingEnabled = false;
                cctx.mozImageSmoothingEnabled    = false;
                cctx.msImageSmoothingEnabled     = false;
            }
            self.contents.blt(scaled, 0, 0, drawW, drawH, cx, cy, drawW, drawH);
        });
    };

    //-------------------------------------------------------------------------
    // Window_Message.newLineX 오버라이드
    //-------------------------------------------------------------------------
    Window_Message.prototype.newLineX = function () {
        return $gameMessage.faceName() ? DISPLAY_W + 8 : 0;
    };

})();
