<!-- src/App.vue -->
<template>
  <div class="container">
    <header>
      <h1>リハビリ・グーパー運動</h1>
      <p>カメラを使って手の動きを検出し、ゆっくりとグーパーするリハビリをゲーム感覚で行いましょう。</p>
    </header>
    
    <footer>
      <div class="instructions">
        <h3>使い方</h3>
        <ol>
          <li>カメラが手を認識できる位置に手を置いてください</li>
          <li>「スタート」ボタンをクリックしてゲームを開始します</li>
          <li>指示に従って、手をゆっくりとグーにしたりパーにしたりしてください</li>
          <li>各動作は約7秒かけてゆっくり行います</li>
          <li>10回の運動を完了するとゲームは終了します</li>
        </ol>
      </div>
    </footer>

    <main>
      <HandTracker
        :enabled="true"
        @gesture-detected="handleGestureDetected"
      />
      
      <RehabGame
        :current-gesture="currentGesture"
      />
    </main>
    
  </div>
</template>

<script lang="ts" setup>
import { ref } from 'vue';
import HandTracker from './components/HandTracker.vue';
import RehabGame from './components/RehabGame.vue';
import type { HandGestureType } from './types';

// 現在のジェスチャー状態
const currentGesture = ref<HandGestureType>('transition');

// ジェスチャー検出のハンドラ
const handleGestureDetected = (gesture: HandGestureType) => {
  currentGesture.value = gesture;
};
</script>

<style>
body {
  font-family: 'Arial', sans-serif;
  margin: 0;
  padding: 0;
  background-color: #f0f2f5;
}

.container {
  max-width: 800px;
  margin: 0 auto;
  padding: 0 20px;
}

header {
  color: #000;
  text-align: center;
  margin-bottom: 30px;
}

h1 {
  color: #2c3e50;
  margin-top: 0;
  margin-bottom: 10px;
}

main {
  margin-bottom: 30px;
}

footer {
  padding-top: 20px;
  margin-bottom: 30px;
}

.instructions {
  background-color: #e8f4fd;
  padding: 15px;
  border-radius: 8px;
}

.instructions h3 {
  margin-top: 0;
  color: #2c3e50;
}

.instructions ol {
  text-align: left;
  padding-left: 20px;
  color: #000;
}

.instructions li {
  margin-bottom: 8px;
}
</style>