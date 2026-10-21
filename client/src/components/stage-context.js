import { createContext, useContext, useEffect } from 'react'

export const StageContext = createContext(null)
const FALLBACK = { stage: null, status: 'fallback', handlers: { current: {} } }

export function useStage() {
  return useContext(StageContext) ?? FALLBACK
}

// Hands a DOM element to the stage, which draws that view inside its rectangle.
export function useStageView(key, ref) {
  const { stage } = useStage()
  useEffect(() => {
    const element = ref.current
    if (!stage || !element) return
    stage.bind(key, element)
    return () => stage.unbind(key)
  }, [stage, key, ref])
}
