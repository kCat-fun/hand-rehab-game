// src/utils/handGesture.ts
import type { HandGestureType } from '../types';

/**
 * 手のランドマークからグーかパーかを検出する
 * @param landmarks MediaPipeから返される手のランドマーク
 * @returns 検出されたジェスチャータイプ
 */
export function detectHandGesture(landmarks: any[]): HandGestureType {
    // ランドマークが存在しない場合
    if (!landmarks || landmarks.length === 0) {
        return 'no_hand';
    }

    // 指の曲がり具合を計算
    const fingerBends = calculateFingerBends(landmarks);
    
    // すべての指が曲がっていればグー
    if (fingerBends.every(bend => bend > 0.3)) {
        return 'fist';
    }
    
    // すべての指が伸びていればパー
    if (fingerBends.every(bend => bend < 0.05)) {
        return 'open';
    }
    
    // 中間状態
    return 'transition';
}

/**
 * 指の曲がり具合を計算する
 * 0 (完全に伸ばした状態) から 1 (完全に曲げた状態) の値を返す
 */
function calculateFingerBends(landmarks: any[]): number[] {
  // 各指のベースジョイント (MCP) インデックス
  const fingerBaseIndices = [5, 9, 13, 17]; // 人差し指、中指、薬指、小指のベース
  
  // 各指のMCP, PIP, DIPの角度から曲がり具合を計算
  return fingerBaseIndices.map(baseIndex => {
    const basePoint = landmarks[baseIndex];
    const midPoint = landmarks[baseIndex + 1];
    const tipPoint = landmarks[baseIndex + 3];
    
    // 指先と手のひらの距離
    const tipToBase = distance(tipPoint, landmarks[0]);
    
    // 指が完全に伸びた時の予想距離
    const extendedDistance = distance(basePoint, landmarks[0]) + 
                             distance(midPoint, basePoint) + 
                             distance(tipPoint, midPoint);
    
    // 曲がり具合を計算 (1 - 実際の距離/伸ばした時の距離)
    // 値が高いほど曲がっている
    return 1 - (tipToBase / extendedDistance);
  });
}

/**
 * 2点間の3D距離を計算
 */
function distance(a: {x: number, y: number, z: number}, b: {x: number, y: number, z: number}): number {
  return Math.sqrt(
    Math.pow(a.x - b.x, 2) + 
    Math.pow(a.y - b.y, 2) + 
    Math.pow(a.z - b.z, 2)
  );
}