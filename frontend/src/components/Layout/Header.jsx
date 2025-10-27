import React from 'react'
import { Layout, Button, Typography, Space, Tooltip } from 'antd'
import { useLocation } from 'react-router-dom'
import {
  ReloadOutlined,
  QuestionCircleOutlined,
  BellOutlined
} from '@ant-design/icons'

const { Header: AntHeader } = Layout
const { Title } = Typography

// 页面标题映射
const pageTitles = {
  '/questions': '题目管理',
  '/knowledge-points': '知识点管理',
  '/config': '属性配置',
  '/uploads': '图片上传'
}

function Header() {
  const location = useLocation()
  
  const currentTitle = pageTitles[location.pathname] || '试题后台管理系统'

  const handleRefresh = () => {
    window.location.reload()
  }

  return (
    <AntHeader
      style={{
        background: '#fff',
        padding: '0 24px',
        boxShadow: '0 1px 4px rgba(0,21,41,.08)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        marginLeft: 200, // 侧边栏宽度
        position: 'sticky',
        top: 0,
        zIndex: 10
      }}
    >
      {/* 页面标题 */}
      <div>
        <Title level={4} style={{ margin: 0, color: 'rgba(0, 0, 0, 0.85)' }}>
          {currentTitle}
        </Title>
      </div>

      {/* 右侧操作区 */}
      <Space size="middle">
        <Tooltip title="刷新页面">
          <Button
            type="text"
            icon={<ReloadOutlined />}
            onClick={handleRefresh}
          />
        </Tooltip>
        
        <Tooltip title="帮助文档">
          <Button
            type="text"
            icon={<QuestionCircleOutlined />}
          />
        </Tooltip>
        
        <Tooltip title="系统通知">
          <Button
            type="text"
            icon={<BellOutlined />}
          />
        </Tooltip>
      </Space>
    </AntHeader>
  )
}

export default Header
