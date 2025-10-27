import React, { useState } from 'react'
import {
  Card,
  Tabs,
  Table,
  Button,
  Space,
  Modal,
  Form,
  Input,
  InputNumber,
  Typography,
  message,
  Popconfirm,
  Tag
} from 'antd'
import {
  PlusOutlined,
  EditOutlined,
  DeleteOutlined,
  ReloadOutlined
} from '@ant-design/icons'
import { useQuery, useMutation, useQueryClient } from 'react-query'
import api from '@/services/api'

const { TextArea } = Input
const { Title } = Typography
const { TabPane } = Tabs

// API 函数
const configAPI = {
  // 学科相关
  getSubjects: () => api.get('/config/subjects'),
  createSubject: (data) => api.post('/config/subjects', data),
  updateSubject: (id, data) => api.put(`/config/subjects/${id}`, data),
  deleteSubject: (id) => api.delete(`/config/subjects/${id}`),
  
  // 年级相关
  getGrades: () => api.get('/config/grades'),
  createGrade: (data) => api.post('/config/grades', data),
  updateGrade: (id, data) => api.put(`/config/grades/${id}`, data),
  deleteGrade: (id) => api.delete(`/config/grades/${id}`),
  
  // 题型相关
  getQuestionTypes: () => api.get('/config/question-types'),
  createQuestionType: (data) => api.post('/config/question-types', data),
  updateQuestionType: (id, data) => api.put(`/config/question-types/${id}`, data),
  deleteQuestionType: (id) => api.delete(`/config/question-types/${id}`),
  
  // 难度级别相关
  getDifficultyLevels: () => api.get('/config/difficulty-levels'),
  createDifficultyLevel: (data) => api.post('/config/difficulty-levels', data),
  updateDifficultyLevel: (id, data) => api.put(`/config/difficulty-levels/${id}`, data),
  deleteDifficultyLevel: (id) => api.delete(`/config/difficulty-levels/${id}`)
}

function Config() {
  const [form] = Form.useForm()
  const queryClient = useQueryClient()
  
  // 状态管理
  const [activeTab, setActiveTab] = useState('subjects')
  const [isModalVisible, setIsModalVisible] = useState(false)
  const [currentItem, setCurrentItem] = useState(null)
  const [modalType, setModalType] = useState('subjects')

  // 数据查询
  const { data: subjects = [], refetch: refetchSubjects } = useQuery('subjects', configAPI.getSubjects)
  const { data: grades = [], refetch: refetchGrades } = useQuery('grades', configAPI.getGrades)
  const { data: questionTypes = [], refetch: refetchQuestionTypes } = useQuery('questionTypes', configAPI.getQuestionTypes)
  const { data: difficultyLevels = [], refetch: refetchDifficultyLevels } = useQuery('difficultyLevels', configAPI.getDifficultyLevels)

  // 通用的增删改 mutation
  const mutation = useMutation(
    async ({ type, action, id, data }) => {
      const apiMap = {
        subjects: configAPI,
        grades: configAPI,
        questionTypes: configAPI,
        difficultyLevels: configAPI
      }
      
      const methodMap = {
        subjects: {
          create: 'createSubject',
          update: 'updateSubject', 
          delete: 'deleteSubject'
        },
        grades: {
          create: 'createGrade',
          update: 'updateGrade',
          delete: 'deleteGrade'
        },
        questionTypes: {
          create: 'createQuestionType',
          update: 'updateQuestionType',
          delete: 'deleteQuestionType'
        },
        difficultyLevels: {
          create: 'createDifficultyLevel',
          update: 'updateDifficultyLevel',
          delete: 'deleteDifficultyLevel'
        }
      }
      
      const method = methodMap[type][action]
      return action === 'delete' 
        ? apiMap[type][method](id)
        : apiMap[type][method](id ? id : data, action === 'update' ? data : undefined)
    },
    {
      onSuccess: (_, { type, action }) => {
        message.success(`${action === 'delete' ? '删除' : '保存'}成功`)
        if (action !== 'delete') {
          setIsModalVisible(false)
          setCurrentItem(null)
          form.resetFields()
        }
        
        // 刷新对应的数据
        const refetchMap = {
          subjects: refetchSubjects,
          grades: refetchGrades,
          questionTypes: refetchQuestionTypes,
          difficultyLevels: refetchDifficultyLevels
        }
        refetchMap[type]()
        
        // 同时刷新相关查询
        queryClient.invalidateQueries(type)
      },
      onError: (error) => {
        message.error(error.response?.data?.message || '操作失败')
      }
    }
  )

  // 学科表格列
  const subjectColumns = [
    { title: 'ID', dataIndex: 'id', width: 80 },
    { title: '学科名称', dataIndex: 'name' },
    { title: '学科代码', dataIndex: 'code' },
    { title: '描述', dataIndex: 'description', ellipsis: true },
    { title: '创建时间', dataIndex: 'created_at', width: 180, render: (date) => new Date(date).toLocaleString() },
    {
      title: '操作',
      key: 'actions',
      width: 150,
      render: (_, record) => (
        <Space size="small">
          <Button size="small" icon={<EditOutlined />} onClick={() => handleEdit('subjects', record)}>编辑</Button>
          <Popconfirm title="确定删除？" onConfirm={() => handleDelete('subjects', record.id)}>
            <Button danger size="small" icon={<DeleteOutlined />}>删除</Button>
          </Popconfirm>
        </Space>
      )
    }
  ]

  // 年级表格列  
  const gradeColumns = [
    { title: 'ID', dataIndex: 'id', width: 80 },
    { title: '年级名称', dataIndex: 'name' },
    { title: '年级代码', dataIndex: 'code' },
    { title: '排序', dataIndex: 'sort_order', width: 80 },
    { title: '创建时间', dataIndex: 'created_at', width: 180, render: (date) => new Date(date).toLocaleString() },
    {
      title: '操作',
      key: 'actions', 
      width: 150,
      render: (_, record) => (
        <Space size="small">
          <Button size="small" icon={<EditOutlined />} onClick={() => handleEdit('grades', record)}>编辑</Button>
          <Popconfirm title="确定删除？" onConfirm={() => handleDelete('grades', record.id)}>
            <Button danger size="small" icon={<DeleteOutlined />}>删除</Button>
          </Popconfirm>
        </Space>
      )
    }
  ]

  // 题型表格列
  const questionTypeColumns = [
    { title: 'ID', dataIndex: 'id', width: 80 },
    { title: '题型名称', dataIndex: 'name' },
    { title: '题型代码', dataIndex: 'code' },
    { title: '描述', dataIndex: 'description', ellipsis: true },
    { title: '创建时间', dataIndex: 'created_at', width: 180, render: (date) => new Date(date).toLocaleString() },
    {
      title: '操作',
      key: 'actions',
      width: 150,
      render: (_, record) => (
        <Space size="small">
          <Button size="small" icon={<EditOutlined />} onClick={() => handleEdit('questionTypes', record)}>编辑</Button>
          <Popconfirm title="确定删除？" onConfirm={() => handleDelete('questionTypes', record.id)}>
            <Button danger size="small" icon={<DeleteOutlined />}>删除</Button>
          </Popconfirm>
        </Space>
      )
    }
  ]

  // 难度级别表格列
  const difficultyColumns = [
    { title: 'ID', dataIndex: 'id', width: 80 },
    { 
      title: '难度名称', 
      dataIndex: 'name',
      render: (text, record) => {
        const colors = ['green', 'orange', 'red', 'purple']
        return <Tag color={colors[record.level_value - 1]}>{text}</Tag>
      }
    },
    { title: '难度代码', dataIndex: 'code' },
    { title: '难度级别', dataIndex: 'level_value', width: 100 },
    { title: '描述', dataIndex: 'description', ellipsis: true },
    { title: '创建时间', dataIndex: 'created_at', width: 180, render: (date) => new Date(date).toLocaleString() },
    {
      title: '操作',
      key: 'actions',
      width: 150,
      render: (_, record) => (
        <Space size="small">
          <Button size="small" icon={<EditOutlined />} onClick={() => handleEdit('difficultyLevels', record)}>编辑</Button>
          <Popconfirm title="确定删除？" onConfirm={() => handleDelete('difficultyLevels', record.id)}>
            <Button danger size="small" icon={<DeleteOutlined />}>删除</Button>
          </Popconfirm>
        </Space>
      )
    }
  ]

  // 事件处理函数
  const handleAdd = (type) => {
    setCurrentItem(null)
    setModalType(type)
    setIsModalVisible(true)
  }

  const handleEdit = (type, item) => {
    setCurrentItem(item)
    setModalType(type)
    form.setFieldsValue(item)
    setIsModalVisible(true)
  }

  const handleDelete = (type, id) => {
    mutation.mutate({ type, action: 'delete', id })
  }

  const handleSubmit = () => {
    form.validateFields().then(values => {
      const action = currentItem ? 'update' : 'create'
      const id = currentItem?.id
      mutation.mutate({ type: modalType, action, id, data: values })
    })
  }

  const getModalTitle = () => {
    const typeMap = {
      subjects: '学科',
      grades: '年级', 
      questionTypes: '题型',
      difficultyLevels: '难度级别'
    }
    return `${currentItem ? '编辑' : '添加'}${typeMap[modalType]}`
  }

  const renderFormItems = () => {
    switch (modalType) {
      case 'subjects':
        return (
          <>
            <Form.Item name="name" label="学科名称" rules={[{ required: true, message: '请输入学科名称' }]}>
              <Input placeholder="请输入学科名称" />
            </Form.Item>
            <Form.Item name="code" label="学科代码" rules={[{ required: true, message: '请输入学科代码' }]}>
              <Input placeholder="请输入学科代码" />
            </Form.Item>
            <Form.Item name="description" label="描述">
              <TextArea rows={3} placeholder="请输入学科描述" />
            </Form.Item>
          </>
        )
      case 'grades':
        return (
          <>
            <Form.Item name="name" label="年级名称" rules={[{ required: true, message: '请输入年级名称' }]}>
              <Input placeholder="请输入年级名称" />
            </Form.Item>
            <Form.Item name="code" label="年级代码" rules={[{ required: true, message: '请输入年级代码' }]}>
              <Input placeholder="请输入年级代码" />
            </Form.Item>
            <Form.Item name="sort_order" label="排序" rules={[{ required: true, message: '请输入排序号' }]}>
              <InputNumber min={0} placeholder="请输入排序号" style={{ width: '100%' }} />
            </Form.Item>
          </>
        )
      case 'questionTypes':
        return (
          <>
            <Form.Item name="name" label="题型名称" rules={[{ required: true, message: '请输入题型名称' }]}>
              <Input placeholder="请输入题型名称" />
            </Form.Item>
            <Form.Item name="code" label="题型代码" rules={[{ required: true, message: '请输入题型代码' }]}>
              <Input placeholder="请输入题型代码" />
            </Form.Item>
            <Form.Item name="description" label="描述">
              <TextArea rows={3} placeholder="请输入题型描述" />
            </Form.Item>
          </>
        )
      case 'difficultyLevels':
        return (
          <>
            <Form.Item name="name" label="难度名称" rules={[{ required: true, message: '请输入难度名称' }]}>
              <Input placeholder="请输入难度名称" />
            </Form.Item>
            <Form.Item name="code" label="难度代码" rules={[{ required: true, message: '请输入难度代码' }]}>
              <Input placeholder="请输入难度代码" />
            </Form.Item>
            <Form.Item name="level_value" label="难度级别" rules={[{ required: true, message: '请输入难度级别' }]}>
              <InputNumber min={1} max={10} placeholder="请输入难度级别(1-10)" style={{ width: '100%' }} />
            </Form.Item>
            <Form.Item name="description" label="描述">
              <TextArea rows={3} placeholder="请输入难度描述" />
            </Form.Item>
          </>
        )
      default:
        return null
    }
  }

  return (
    <div className="page-container">
      {/* 页面标题 */}
      <div className="page-header">
        <Title level={3}>属性配置</Title>
        <Button icon={<ReloadOutlined />} onClick={() => {
          refetchSubjects()
          refetchGrades()
          refetchQuestionTypes()
          refetchDifficultyLevels()
        }}>
          刷新
        </Button>
      </div>

      <Card>
        <Tabs activeKey={activeTab} onChange={setActiveTab}>
          <TabPane tab="学科管理" key="subjects">
            <div style={{ marginBottom: 16 }}>
              <Button type="primary" icon={<PlusOutlined />} onClick={() => handleAdd('subjects')}>
                添加学科
              </Button>
            </div>
            <Table
              columns={subjectColumns}
              dataSource={subjects}
              rowKey="id"
              pagination={{ pageSize: 10 }}
            />
          </TabPane>

          <TabPane tab="年级管理" key="grades">
            <div style={{ marginBottom: 16 }}>
              <Button type="primary" icon={<PlusOutlined />} onClick={() => handleAdd('grades')}>
                添加年级
              </Button>
            </div>
            <Table
              columns={gradeColumns}
              dataSource={grades}
              rowKey="id"
              pagination={{ pageSize: 10 }}
            />
          </TabPane>

          <TabPane tab="题型管理" key="questionTypes">
            <div style={{ marginBottom: 16 }}>
              <Button type="primary" icon={<PlusOutlined />} onClick={() => handleAdd('questionTypes')}>
                添加题型
              </Button>
            </div>
            <Table
              columns={questionTypeColumns}
              dataSource={questionTypes}
              rowKey="id"
              pagination={{ pageSize: 10 }}
            />
          </TabPane>

          <TabPane tab="难度级别" key="difficultyLevels">
            <div style={{ marginBottom: 16 }}>
              <Button type="primary" icon={<PlusOutlined />} onClick={() => handleAdd('difficultyLevels')}>
                添加难度级别
              </Button>
            </div>
            <Table
              columns={difficultyColumns}
              dataSource={difficultyLevels}
              rowKey="id"
              pagination={{ pageSize: 10 }}
            />
          </TabPane>
        </Tabs>
      </Card>

      {/* 表单弹窗 */}
      <Modal
        title={getModalTitle()}
        open={isModalVisible}
        onOk={handleSubmit}
        onCancel={() => {
          setIsModalVisible(false)
          setCurrentItem(null)
          form.resetFields()
        }}
        confirmLoading={mutation.isLoading}
        okText="保存"
        cancelText="取消"
      >
        <Form form={form} layout="vertical">
          {renderFormItems()}
        </Form>
      </Modal>
    </div>
  )
}

export default Config
