import React from 'react'
import { Routes, Route, Navigate } from 'react-router-dom'
import { Layout } from 'antd'
import Sidebar from '@/components/Layout/Sidebar'
import Header from '@/components/Layout/Header'
import Questions from '@/pages/Questions'
import Videos from '@/pages/Videos'
import KnowledgePoints from '@/pages/KnowledgePoints'
import Config from '@/pages/Config'
import Uploads from '@/pages/Uploads'
import './App.css'

const { Content } = Layout

function App() {
  return (
    <Layout className="app-layout">
      {/* 侧边栏 */}
      <Sidebar />
      
      {/* 主要内容区域 */}
      <Layout className="app-layout-content">
        {/* 顶部导航 */}
        <Header />
        
        {/* 内容区域 */}
        <Content className="app-content">
          <div className="content-wrapper">
            <Routes>
              <Route path="/" element={<Navigate to="/questions" replace />} />
              <Route path="/questions" element={<Questions />} />
              <Route path="/videos" element={<Videos />} />
              <Route path="/knowledge-points" element={<KnowledgePoints />} />
              <Route path="/config" element={<Config />} />
              <Route path="/uploads" element={<Uploads />} />
              <Route path="*" element={<Navigate to="/questions" replace />} />
            </Routes>
          </div>
        </Content>
      </Layout>
    </Layout>
  )
}

export default App
