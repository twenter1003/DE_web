import rough from 'roughjs'
import type { Options, PathInfo } from 'roughjs/bin/core'

const gen = rough.generator()
const cache = new Map<string, PathInfo[]>()

type Shape =
  | { kind: 'rect'; x: number; y: number; w: number; h: number }
  | { kind: 'ellipse'; cx: number; cy: number; w: number; h: number }
  | { kind: 'line'; x1: number; y1: number; x2: number; y2: number }
  | { kind: 'path'; d: string }
  | { kind: 'linear'; points: [number, number][] }

/** rough.js 경로를 계산하고 캐시한다. 같은 입력·seed면 항상 같은 선(리렌더링 때 떨리지 않음). */
export function roughPaths(shape: Shape, opts: Options): PathInfo[] {
  const key = JSON.stringify([shape, opts])
  const hit = cache.get(key)
  if (hit) return hit
  const o: Options = {
    ...opts,
    // 정밀한 단계에서는 겹선을 없애 설계도처럼 보이게
    disableMultiStroke: (opts.roughness ?? 1) < 0.5,
    disableMultiStrokeFill: true,
    fillStyle: opts.fillStyle ?? 'solid',
  }
  let d
  switch (shape.kind) {
    case 'rect':
      d = gen.rectangle(shape.x, shape.y, shape.w, shape.h, o)
      break
    case 'ellipse':
      d = gen.ellipse(shape.cx, shape.cy, shape.w, shape.h, o)
      break
    case 'line':
      d = gen.line(shape.x1, shape.y1, shape.x2, shape.y2, o)
      break
    case 'linear':
      d = gen.linearPath(shape.points, o)
      break
    case 'path':
      d = gen.path(shape.d, o)
      break
  }
  const paths = gen.toPaths(d)
  if (cache.size > 4000) cache.clear()
  cache.set(key, paths)
  return paths
}

/** 문자열에서 안정적인 seed(1 이상 정수)를 만든다. */
export function seedOf(s: string): number {
  let h = 2166136261
  for (let i = 0; i < s.length; i++) {
    h ^= s.charCodeAt(i)
    h = Math.imul(h, 16777619)
  }
  return (Math.abs(h) % 2147483646) + 1
}
