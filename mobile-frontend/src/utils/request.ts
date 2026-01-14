// API请求工具
const API_BASE = import.meta.env.VITE_API_BASE_URL || 'http://localhost:3000'

// 检测是否是H5环境
const isH5 = typeof window !== 'undefined' && typeof document !== 'undefined'

// 通用请求函数
export async function request(options: {
  url: string
  method: 'GET' | 'POST' | 'PUT' | 'DELETE'
  data?: any
  headers?: Record<string, string>
  timeout?: number
}): Promise<any> {
  const fullUrl = options.url.startsWith('http') ? options.url : `${API_BASE}${options.url}`

  console.log('API请求:', { url: fullUrl, method: options.method })

  // H5环境使用fetch
  if (isH5 && typeof fetch !== 'undefined') {
    const controller = new AbortController()
    const timeoutId = setTimeout(() => controller.abort(), options.timeout || 10000)

    try {
      const response = await fetch(fullUrl, {
        method: options.method,
        headers: {
          'Content-Type': 'application/json',
          ...options.headers
        },
        body: options.data ? JSON.stringify(options.data) : undefined,
        signal: controller.signal
      })

      clearTimeout(timeoutId)

      const data = await response.json()

      console.log('API响应:', { status: response.status, data })

      return {
        statusCode: response.status,
        data: data,
        header: {}
      }
    } catch (error: any) {
      clearTimeout(timeoutId)
      console.error('API错误:', error)

      if (error.name === 'AbortError') {
        throw new Error('连接超时')
      }

      throw error
    }
  }

  // 小程序/App环境使用uni.request
  return await uni.request({
    url: fullUrl,
    method: options.method,
    header: options.headers,
    data: options.data,
    timeout: options.timeout || 10000
  }) as any
}
