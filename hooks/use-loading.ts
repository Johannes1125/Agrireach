import { useLoading as useLoadingContext } from "@/contexts/loading-context"

export function useLoading() {
  const { setLoading } = useLoadingContext()

  const showLoading = (text?: string) => {
    setLoading(true, text)
  }

  const hideLoading = () => {
    setLoading(false)
  }

  const withLoading = async <T,>(
    promise: Promise<T>,
    loadingText?: string
  ): Promise<T> => {
    showLoading(loadingText)
    try {
      const result = await promise
      return result
    } finally {
      hideLoading()
    }
  }

  return {
    showLoading,
    hideLoading,
    withLoading,
  }
}

