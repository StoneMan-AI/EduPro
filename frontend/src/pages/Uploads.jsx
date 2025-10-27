import React, { useState } from 'react'
import {
  Card,
  Upload,
  Button,
  Progress,
  List,
  Typography,
  Space,
  Tag,
  Image,
  Row,
  Col,
  Statistic,
  message
} from 'antd'
import {
  InboxOutlined,
  CloudUploadOutlined,
  DeleteOutlined,
  EyeOutlined,
  ReloadOutlined
} from '@ant-design/icons'
import { useMutation } from 'react-query'
import api from '@/services/api'

const { Dragger } = Upload
const { Title, Text } = Typography

// API 函数
const uploadsAPI = {
  uploadImage: (file) => {
    const formData = new FormData()
    formData.append('file', file)
    return api.post('/uploads/image', formData, {
      headers: {
        'Content-Type': 'multipart/form-data'
      }
    })
  },
  batchUpload: (files) => {
    const formData = new FormData()
    files.forEach(file => {
      formData.append('files', file)
    })
    return api.post('/uploads/batch', formData, {
      headers: {
        'Content-Type': 'multipart/form-data'
      }
    })
  }
}

function Uploads() {
  // 状态管理
  const [uploadList, setUploadList] = useState([])
  const [uploading, setUploading] = useState(false)

  // 上传统计
  const totalFiles = uploadList.length
  const successFiles = uploadList.filter(file => file.status === 'done').length
  const errorFiles = uploadList.filter(file => file.status === 'error').length
  const uploadingFiles = uploadList.filter(file => file.status === 'uploading').length

  // 单文件上传
  const singleUploadMutation = useMutation(uploadsAPI.uploadImage, {
    onSuccess: (response, file) => {
      setUploadList(prev => prev.map(item => 
        item.uid === file.uid 
          ? { ...item, status: 'done', url: response.url, response }
          : item
      ))
      message.success(`${file.name} 上传成功`)
    },
    onError: (error, file) => {
      setUploadList(prev => prev.map(item => 
        item.uid === file.uid 
          ? { ...item, status: 'error', error: error.message }
          : item
      ))
      message.error(`${file.name} 上传失败`)
    }
  })

  // 批量上传
  const batchUploadMutation = useMutation(uploadsAPI.batchUpload, {
    onSuccess: (response) => {
      const { results } = response
      setUploadList(prev => {
        const newList = [...prev]
        results.forEach(result => {
          const index = newList.findIndex(item => item.name === result.filename)
          if (index >= 0) {
            newList[index] = {
              ...newList[index],
              status: result.success ? 'done' : 'error',
              url: result.url,
              error: result.error
            }
          }
        })
        return newList
      })
      message.success('批量上传完成')
      setUploading(false)
    },
    onError: (error) => {
      setUploadList(prev => prev.map(item => ({ ...item, status: 'error' })))
      message.error('批量上传失败')
      setUploading(false)
    }
  })

  // 上传配置
  const uploadProps = {
    name: 'file',
    multiple: true,
    accept: 'image/*',
    showUploadList: false,
    beforeUpload: (file) => {
      // 文件类型检查
      const isImage = file.type.startsWith('image/')
      if (!isImage) {
        message.error(`${file.name} 不是图片文件`)
        return false
      }

      // 文件大小检查
      const isLt10M = file.size / 1024 / 1024 < 10
      if (!isLt10M) {
        message.error(`${file.name} 大小超过10MB`)
        return false
      }

      // 添加到上传列表
      const fileItem = {
        uid: file.uid,
        name: file.name,
        size: file.size,
        type: file.type,
        status: 'ready',
        originFileObj: file
      }

      setUploadList(prev => [...prev, fileItem])
      return false // 阻止自动上传
    },
    onDrop: (e) => {
      console.log('拖拽文件:', e.dataTransfer.files)
    }
  }

  // 开始上传
  const handleStartUpload = () => {
    const readyFiles = uploadList.filter(file => file.status === 'ready')
    if (readyFiles.length === 0) {
      message.warning('没有待上传的文件')
      return
    }

    setUploading(true)

    // 标记为上传中
    setUploadList(prev => prev.map(item => 
      item.status === 'ready' ? { ...item, status: 'uploading' } : item
    ))

    if (readyFiles.length === 1) {
      // 单文件上传
      singleUploadMutation.mutate(readyFiles[0].originFileObj)
    } else {
      // 批量上传
      const files = readyFiles.map(file => file.originFileObj)
      batchUploadMutation.mutate(files)
    }
  }

  // 移除文件
  const handleRemove = (uid) => {
    setUploadList(prev => prev.filter(item => item.uid !== uid))
  }

  // 清空列表
  const handleClear = () => {
    setUploadList([])
  }

  // 重新上传
  const handleRetry = (file) => {
    setUploadList(prev => prev.map(item => 
      item.uid === file.uid ? { ...item, status: 'uploading' } : item
    ))
    singleUploadMutation.mutate(file.originFileObj)
  }

  // 获取状态标签
  const getStatusTag = (status) => {
    const statusMap = {
      ready: { color: 'blue', text: '待上传' },
      uploading: { color: 'orange', text: '上传中' },
      done: { color: 'green', text: '已完成' },
      error: { color: 'red', text: '失败' }
    }
    const config = statusMap[status] || { color: 'default', text: status }
    return <Tag color={config.color}>{config.text}</Tag>
  }

  // 格式化文件大小
  const formatFileSize = (bytes) => {
    if (bytes === 0) return '0 Bytes'
    const k = 1024
    const sizes = ['Bytes', 'KB', 'MB', 'GB']
    const i = Math.floor(Math.log(bytes) / Math.log(k))
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i]
  }

  return (
    <div className="page-container">
      {/* 页面标题 */}
      <div className="page-header">
        <Title level={3}>图片上传</Title>
        <Space>
          <Button 
            icon={<ReloadOutlined />} 
            onClick={handleClear}
            disabled={uploading}
          >
            清空列表
          </Button>
        </Space>
      </div>

      {/* 上传统计 */}
      <Row gutter={16} style={{ marginBottom: 24 }}>
        <Col span={6}>
          <Card>
            <Statistic title="总文件数" value={totalFiles} />
          </Card>
        </Col>
        <Col span={6}>
          <Card>
            <Statistic 
              title="上传成功" 
              value={successFiles} 
              valueStyle={{ color: '#52c41a' }} 
            />
          </Card>
        </Col>
        <Col span={6}>
          <Card>
            <Statistic 
              title="上传失败" 
              value={errorFiles} 
              valueStyle={{ color: '#ff4d4f' }} 
            />
          </Card>
        </Col>
        <Col span={6}>
          <Card>
            <Statistic 
              title="上传中" 
              value={uploadingFiles} 
              valueStyle={{ color: '#faad14' }} 
            />
          </Card>
        </Col>
      </Row>

      <Row gutter={24}>
        {/* 左侧：上传区域 */}
        <Col span={12}>
          <Card title="选择文件" size="small">
            <Dragger {...uploadProps} style={{ marginBottom: 16 }}>
              <p className="ant-upload-drag-icon">
                <InboxOutlined style={{ fontSize: 48, color: '#1890ff' }} />
              </p>
              <p className="ant-upload-text">
                点击或拖拽文件到此区域上传
              </p>
              <p className="ant-upload-hint">
                支持单个或批量上传图片文件，支持 JPG、PNG、GIF 格式，单个文件不超过 10MB
              </p>
            </Dragger>

            <Space>
              <Button
                type="primary"
                icon={<CloudUploadOutlined />}
                onClick={handleStartUpload}
                loading={uploading}
                disabled={uploadList.filter(f => f.status === 'ready').length === 0}
              >
                开始上传 ({uploadList.filter(f => f.status === 'ready').length})
              </Button>
              
              <Button
                onClick={handleClear}
                disabled={uploading || uploadList.length === 0}
              >
                清空列表
              </Button>
            </Space>
          </Card>
        </Col>

        {/* 右侧：文件列表 */}
        <Col span={12}>
          <Card title="文件列表" size="small">
            <List
              dataSource={uploadList}
              renderItem={(file) => (
                <List.Item
                  key={file.uid}
                  actions={[
                    file.status === 'done' && file.url && (
                      <Button
                        size="small"
                        icon={<EyeOutlined />}
                        onClick={() => {
                          Image.PreviewGroup({
                            items: [file.url]
                          })
                        }}
                      />
                    ),
                    file.status === 'error' && (
                      <Button
                        size="small"
                        type="link"
                        onClick={() => handleRetry(file)}
                      >
                        重试
                      </Button>
                    ),
                    <Button
                      size="small"
                      danger
                      icon={<DeleteOutlined />}
                      onClick={() => handleRemove(file.uid)}
                      disabled={uploading && file.status === 'uploading'}
                    />
                  ].filter(Boolean)}
                >
                  <List.Item.Meta
                    avatar={
                      file.status === 'done' && file.url ? (
                        <Image
                          width={40}
                          height={40}
                          src={file.url}
                          style={{ objectFit: 'cover', borderRadius: 4 }}
                          preview={false}
                        />
                      ) : (
                        <div
                          style={{
                            width: 40,
                            height: 40,
                            background: '#f5f5f5',
                            borderRadius: 4,
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center'
                          }}
                        >
                          <InboxOutlined style={{ color: '#ccc' }} />
                        </div>
                      )
                    }
                    title={
                      <Space>
                        <Text ellipsis style={{ maxWidth: 150 }}>
                          {file.name}
                        </Text>
                        {getStatusTag(file.status)}
                      </Space>
                    }
                    description={
                      <div>
                        <Text type="secondary" style={{ fontSize: 12 }}>
                          {formatFileSize(file.size)}
                        </Text>
                        {file.status === 'uploading' && (
                          <Progress percent={50} size="small" status="active" />
                        )}
                        {file.status === 'error' && file.error && (
                          <Text type="danger" style={{ fontSize: 12, display: 'block' }}>
                            错误: {file.error}
                          </Text>
                        )}
                      </div>
                    }
                  />
                </List.Item>
              )}
              style={{ maxHeight: 500, overflowY: 'auto' }}
            />
          </Card>
        </Col>
      </Row>
    </div>
  )
}

export default Uploads
