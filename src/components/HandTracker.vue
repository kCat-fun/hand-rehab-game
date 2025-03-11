<template>
    <div class="hand-tracker">
        <video ref="videoElement" class="input-video" playsinline autoplay muted></video>
        <canvas ref="canvasElement" class="output-canvas"></canvas>
    </div>
</template>

<script lang="ts" setup>
import { ref, onMounted, onUnmounted, watch } from 'vue';
import { Hands } from '@mediapipe/hands';
import { Camera } from '@mediapipe/camera_utils';
import * as drawingUtils from '@mediapipe/drawing_utils';
import { HAND_CONNECTIONS } from '@mediapipe/hands';
import type { HandGestureType } from '../types';
import { detectHandGesture } from '../utils/handGesture';

const props = defineProps<{
    enabled: boolean;
}>();

const emit = defineEmits<{
    (e: 'gestureDetected', gesture: HandGestureType): void;
}>();

const videoElement = ref<HTMLVideoElement | null>(null);
const canvasElement = ref<HTMLCanvasElement | null>(null);
let camera: Camera | null = null;
let hands: Hands | null = null;

// 手の状態を検出する関数
const onResults = (results: any) => {
    if (!canvasElement.value) return;

    const canvas = canvasElement.value;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // キャンバスをクリア
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    // ビデオフィードを描画
    if (results.image) {
        ctx.save();
        ctx.drawImage(results.image, 0, 0, canvas.width, canvas.height);
        ctx.restore();
    }

    // 検出された手を描画
    if (results.multiHandLandmarks && results.multiHandLandmarks.length > 0) {
        for (const landmarks of results.multiHandLandmarks) {
            // 手のランドマークを描画
            drawingUtils.drawConnectors(ctx, landmarks, HAND_CONNECTIONS, { color: '#00FF00', lineWidth: 5 });
            drawingUtils.drawLandmarks(ctx, landmarks, { color: '#FF0000', lineWidth: 2 });

            // ジェスチャーを検出
            const gesture = detectHandGesture(landmarks);
            emit('gestureDetected', gesture);
        }
    }
    else {
        emit('gestureDetected', 'no_hand');
    }
};

// カメラとハンドトラッキングの初期化
const initializeTracking = () => {
    if (!videoElement.value || !canvasElement.value) return;

    // Hands APIの初期化
    hands = new Hands({
        locateFile: (file) => `/node_modules/@mediapipe/hands/${file}`
    });

    hands.setOptions({
        maxNumHands: 1,
        modelComplexity: 1,
        minDetectionConfidence: 0.5,
        minTrackingConfidence: 0.5
    });

    hands.onResults(onResults);

    // カメラの初期化
    camera = new Camera(videoElement.value, {
        onFrame: async () => {
            if (!hands || !videoElement.value) return;
            if (!videoElement.value.videoWidth || !videoElement.value.videoHeight) return; // 映像が未ロードの場合はスキップ
            await hands.send({ image: videoElement.value });
        },
        width: 640,
        height: 480
    });


    // キャンバスのサイズ設定
    canvasElement.value.width = 640;
    canvasElement.value.height = 480;

    // カメラスタート
    camera.start();
};

// トラッキングの停止
const stopTracking = () => {
    if (camera) {
        camera.stop();
    }
    if (hands) {
        hands.close();
    }
};

// コンポーネントマウント時にトラッキングを初期化
onMounted(() => {
    if (props.enabled) {
        initializeTracking();
    }
});

// コンポーネントアンマウント時にトラッキングを停止
onUnmounted(() => {
    stopTracking();
});

// enabledプロパティが変更されたときの処理
watch(() => props.enabled, (newValue) => {
    if (newValue) {
        initializeTracking();
    } else {
        stopTracking();
    }
});
</script>

<style scoped>
.hand-tracker {
    position: relative;
    width: 440px;
    height: 270px;
    margin: 0 auto;
}

.input-video {
    position: absolute;
    visibility: hidden;
    width: 100%;
    height: 100%;
}

.output-canvas {
    position: absolute;
    left: 0;
    width: 100%;
    height: 100%;
    transform: scale(-1, 1);
    /* 鏡像反転 */
}
</style>