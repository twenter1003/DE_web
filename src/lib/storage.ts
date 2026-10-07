// localStorage는 프라이빗 모드·차단 설정에서 예외를 던질 수 있다. 실패해도 페이지는 계속 동작한다.
export function load<T>(key: string, fallback: T): T {
  try {
    const raw = window.localStorage.getItem(key)
    return raw ? (JSON.parse(raw) as T) : fallback
  } catch {
    return fallback
  }
}

export function save(key: string, value: unknown): void {
  try {
    window.localStorage.setItem(key, JSON.stringify(value))
  } catch {
    // 저장 실패: 이번 방문 동안은 메모리 상태로 계속 진행
  }
}

export function remove(key: string): void {
  try {
    window.localStorage.removeItem(key)
  } catch {
    // 무시
  }
}
