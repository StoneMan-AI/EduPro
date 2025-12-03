import axios from 'axios'
import { message } from 'antd'

// 创建 axios 实例
const api = axios.create({
  baseURL: '/api',
  timeout: 10000,
  headers: {
    'Content-Type': 'application/json'
  }
})

// 请求拦截器
api.interceptors.request.use(
  (config) => {
    // 可以在这里添加认证 token
    // const token = localStorage.getItem('token')
    // if (token) {
    //   config.headers.Authorization = `Bearer ${token}`
    // }
    return config
  },
  (error) => {
    console.error('请求错误:', error)
    return Promise.reject(error)
  }
)

// 响应拦截器
api.interceptors.response.use(
  (response) => {
    return response.data
  },
  (error) => {
    const { response } = error
    
    if (response) {
      const { status, data } = response
      
      switch (status) {
        case 400:
          message.error(data.message || '请求参数错误')
          break
        case 401:
          message.error('未授权，请重新登录')
          // 可以在这里处理登录跳转
          break
        case 403:
          message.error('权限不足')
          break
        case 404:
          message.error('请求的资源不存在')
          break
        case 429:
          // 429 Too Many Requests - 请求过于频繁
          const retryAfter = response.headers['retry-after'] || data?.retryAfter || 60
          message.warning(`请求过于频繁，请 ${retryAfter} 秒后再试`)
          break
        case 500:
          message.error('服务器内部错误')
          break
        default:
          message.error(data.message || `请求失败 (${status})`)
      }
    } else if (error.code === 'ECONNABORTED') {
      message.error('请求超时，请检查网络连接')
    } else {
      message.error('网络错误，请检查网络连接')
    }
    
    return Promise.reject(error)
  }
)

export default api
