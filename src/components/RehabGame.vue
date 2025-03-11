<!-- src/components/RehabGame.vue -->
<template>
    <div class="rehab-game">
        <div class="game-ui">
            <div class="progress-container">
                <div class="gesture-indicator">
                    <div class="gesture-icon" :class="currentGesture"></div>
                    <div class="gesture-text">{{ gestureText }}</div>
                </div>

                <div class="timer-bar-container">
                    <div class="timer-bar" :style="{ width: `${progressPercent}%` }"></div>
                </div>

                <div class="exercise-counter">
                    {{ completedExercises }} / {{ targetExercises }}
                </div>
            </div>

            <div class="game-status">
                <h2 v-if="!isGameStarted && !isGameCompleted">準備OK？</h2>
                <h2 v-if="isGameStarted && !isGameCompleted">{{ text }}</h2>
                <h2 v-if="isGameCompleted">お疲れ様でした！</h2>

                <div v-if="!isGameStarted" class="game-controls">
                    <button @click="startGame" class="start-button">スタート</button>
                </div>

                <div v-if="isGameCompleted" class="game-stats">
                    <p>正しく完了した運動回数: {{ completedExercises }}</p>
                    <p>かかった時間: {{ Math.floor(elapsedTime / 1000) }}秒</p>
                    <button @click="resetGame" class="restart-button">もう一度</button>
                </div>
            </div>
        </div>
    </div>
</template>

<script lang="ts" setup>
import { ref, computed, watch } from 'vue';
import type { HandGestureType } from '../types';

const props = defineProps<{
    currentGesture: HandGestureType;
}>();

// ゲーム設定
const targetExercises = 10; // 目標運動回数
const transitionTime = 7000; // 1回のグー→パーまたはパー→グーの移行時間

// ゲーム状態
const isGameStarted = ref(false);
const isGameCompleted = ref(false);
const completedExercises = ref(0);
const startTime = ref(0);
const elapsedTime = ref(0);
const text = ref(''); // ジェスチャーのテキスト表示

// 現在のエクササイズ状態
const currentTarget = ref<'fist' | 'open'>('fist');
const progress = ref(0); // 0-100%
const timerInterval = ref<number | null>(null);

// ジェスチャーのテキスト表示
const gestureText = computed(() => {
    switch (props.currentGesture) {
        case 'no_hand': return 'なし';
        case 'fist': return 'グー';
        case 'open': return 'パー';
        case 'transition': return '途中';
        default: return '';
    }
});

// 現在の指示
const currentInstruction = (currentGesture: HandGestureType) => {
    if(currentGesture === 'no_hand') {
        return '手をカメラに見せてください';
    }
    else if(currentGesture === currentTarget.value) {
        return currentTarget.value === 'fist'
            ? 'そのまま手をキープしてください (グー)'
            : 'そのまま手をキープしてください (パー)';
    }
    return currentTarget.value === 'fist'
        ? 'ゆっくりと手を握ってください (グー)'
        : 'ゆっくりと手を開いてください (パー)';
};

// 進捗パーセント
const progressPercent = computed(() => {
    return progress.value;
});

// ゲームを開始
const startGame = () => {
    isGameStarted.value = true;
    isGameCompleted.value = false;
    completedExercises.value = 0;
    currentTarget.value = 'fist';
    progress.value = 0;
    startTime.value = Date.now();
    startProgressTimer();
};

// ゲームをリセット
const resetGame = () => {
    isGameStarted.value = false;
    isGameCompleted.value = false;
    completedExercises.value = 0;
    progress.value = 0;
    if (timerInterval.value) {
        clearInterval(timerInterval.value);
        timerInterval.value = null;
    }
};

// プログレスタイマーを開始
const startProgressTimer = () => {
    if (timerInterval.value) {
        clearInterval(timerInterval.value);
    }

    const startProgress = 0;
    progress.value = startProgress;
    const startTimestamp = Date.now();

    timerInterval.value = setInterval(() => {
        const elapsed = Date.now() - startTimestamp;
        progress.value = (elapsed / transitionTime) * 100;

        text.value = currentInstruction(props.currentGesture);

        if (progress.value >= 100) {
            progress.value = 100;
            completeCurrentExercise();
        }
    }, 50);
};

// 現在のエクササイズを完了
const completeCurrentExercise = () => {
    if (timerInterval.value) {
        clearInterval(timerInterval.value);
        timerInterval.value = null;
    }

    if(currentTarget.value !== props.currentGesture) {
        // エラー: 間違ったジェスチャーが検出された
        startProgressTimer();
        return;
    }

    // エクササイズをカウント
    completedExercises.value++;

    // 全てのエクササイズが完了したかチェック
    if (completedExercises.value >= targetExercises) {
        completeGame();
        return;
    }

    // 次のターゲットに切り替え
    currentTarget.value = currentTarget.value === 'fist' ? 'open' : 'fist';

    // 新しいプログレスタイマーを開始
    startProgressTimer();
};

// ゲーム完了
const completeGame = () => {
    isGameCompleted.value = true;
    elapsedTime.value = Date.now() - startTime.value;

    if (timerInterval.value) {
        clearInterval(timerInterval.value);
        timerInterval.value = null;
    }
};

// ジェスチャーの監視
watch(() => props.currentGesture, (newGesture, oldGesture) => {
    // console.log(`Gesture changed: ${oldGesture} -> ${newGesture}`);

    if (!isGameStarted.value || isGameCompleted.value) return;

    if (newGesture === currentTarget.value && progress.value >= 100) {
        completeCurrentExercise();
    }
});

</script>

<style scoped>
.rehab-game {
    margin-top: 20px;
    color: #000;
}

.game-ui {
    width: 640px;
    margin: 0 auto;
    background-color: #f5f5f5;
    border-radius: 10px;
    padding: 20px;
    box-shadow: 0 4px 8px rgba(0, 0, 0, 0.1);
}

.progress-container {
    margin-bottom: 20px;
}

.gesture-indicator {
    display: flex;
    align-items: center;
    margin-bottom: 10px;
}

.gesture-icon {
    width: 60px;
    height: 60px;
    border-radius: 50%;
    margin-right: 15px;
    background-color: #e0e0e0;
    display: flex;
    align-items: center;
    justify-content: center;
    font-size: 30px;
}

.gesture-icon.fist {
    background-color: #ffcdd2;
}

.gesture-icon.open {
    background-color: #c8e6c9;
}

.gesture-icon.no_hand {
    background-color: #e0e0e0;
}

.gesture-icon.transition {
    background-color: #fff9c4;
}

.gesture-text {
    font-size: 24px;
    font-weight: bold;
}

.timer-bar-container {
    width: 100%;
    height: 30px;
    background-color: #e0e0e0;
    border-radius: 15px;
    overflow: hidden;
    margin-bottom: 10px;
}

.timer-bar {
    height: 100%;
    background-color: #4caf50;
    transition: width 0.1s linear;
}

.exercise-counter {
    text-align: right;
    font-size: 20px;
    font-weight: bold;
}

.game-status {
    text-align: center;
    margin-top: 20px;
}

.game-controls {
    margin-top: 20px;
}

.start-button,
.restart-button {
    padding: 12px 24px;
    font-size: 18px;
    background-color: #2196f3;
    color: white;
    border: none;
    border-radius: 5px;
    cursor: pointer;
    transition: background-color 0.3s;
}

.start-button:hover,
.restart-button:hover {
    background-color: #0d8bf2;
}

.game-stats {
    margin-top: 20px;
    font-size: 18px;
}
</style>