import React from 'react'
import { Layout, Menu } from 'antd'
import { useNavigate, useLocation } from 'react-router-dom'
import {
  FileTextOutlined,
  BookOutlined,
  SettingOutlined,
  CloudUploadOutlined,
  DashboardOutlined
} from '@ant-design/icons'

const { Sider } = Layout

const menuItems = [
  {
    key: '/questions',
    icon: <FileTextOutlined />,
    label: '题目管理'
  },
  {
    key: '/knowledge-points',
    icon: <BookOutlined />,
    label: '知识点管理'
  },
  {
    key: '/config',
    icon: <SettingOutlined />,
    label: '属性配置'
  },
  {
    key: '/uploads',
    icon: <CloudUploadOutlined />,
    label: '图片上传'
  }
]

function Sidebar() {
  const navigate = useNavigate()
  const location = useLocation()

  const handleMenuClick = ({ key }) => {
    navigate(key)
  }

  return (
    <Sider
      width={200}
      theme="dark"
      style={{
        overflow: 'auto',
        height: '100vh',
        position: 'fixed',
        left: 0,
        top: 0,
        bottom: 0,
      }}
    >
      {/* Logo */}
      <div className="logo">
        试题管理系统
      </div>

      {/* 菜单 */}
      <Menu
        theme="dark"
        mode="inline"
        selectedKeys={[location.pathname]}
        items={menuItems}
        onClick={handleMenuClick}
        style={{ borderRight: 0 }}
      />
    </Sider>
  )
}

export default Sidebar
