import React, { useState, useEffect } from 'react'
import {
  Card,
  Table,
  Button,
  Space,
  Input,
  Select,
  Form,
  Tag,
  Image,
  Modal,
  message,
  Popconfirm,
  Row,
  Col,
  Typography
} from 'antd'
import {
  PlusOutlined,
  SearchOutlined,
  EditOutlined,
  DeleteOutlined,
  EyeOutlined,
  ReloadOutlined,
  CheckOutlined
} from '@ant-design/icons'
import { useQuery, useMutation, useQueryClient } from 'react-query'
import QuestionForm from '@/components/Forms/QuestionForm'
import api from '@/services/api'

const { Option } = Select
const { Title } = Typography

// API 函数
const questionsAPI = {
  // 获取题目列表
  getQuestions: (params) => api.get('/questions', { params }),
  
  // 删除题目
  deleteQuestion: (id) => api.delete(`/questions/${id}`),
  
  // 批量更新状态
  batchUpdateStatus: (data) => api.patch('/questions/batch-status', data),
  
  // 获取配置数据
  getSubjects: () => api.get('/config/subjects'),
  getGrades: () => api.get('/config/grades'),
  getQuestionTypes: () => api.get('/config/question-types'),
  getDifficultyLevels: () => api.get('/config/difficulty-levels'),
  getKnowledgePoints: () => api.get('/knowledge-points')
}

function Questions() {
  const [form] = Form.useForm()
  const queryClient = useQueryClient()
  
  // 状态管理
  const [selectedRowKeys, setSelectedRowKeys] = useState([])
  const [isModalVisible, setIsModalVisible] = useState(false)
  const [currentQuestion, setCurrentQuestion] = useState(null)
  const [searchParams, setSearchParams] = useState({
    page: 1,
    page_size: 20
  })

  // 获取题目列表
  const { data: questionsData, isLoading, refetch } = useQuery(
    ['questions', searchParams],
    () => questionsAPI.getQuestions(searchParams),
    { 
      keepPreviousData: true,
      staleTime: 30000
    }
  )

  // 安全处理题目数据
  const questions = questionsData?.data || []
  const pagination = questionsData?.pagination || { total: 0, page: 1, page_size: 20 }

  // 获取配置数据
  const { data: subjectsData } = useQuery('subjects', questionsAPI.getSubjects)
  const { data: gradesData } = useQuery('grades', questionsAPI.getGrades)
  const { data: questionTypesData } = useQuery('questionTypes', questionsAPI.getQuestionTypes)
  const { data: difficultyLevelsData } = useQuery('difficultyLevels', questionsAPI.getDifficultyLevels)
  const { data: knowledgePointsData } = useQuery('knowledgePoints', questionsAPI.getKnowledgePoints)

  // 安全处理数据，确保是数组格式
  const subjects = Array.isArray(subjectsData) ? subjectsData : []
  const grades = Array.isArray(gradesData) ? gradesData : []
  const questionTypes = Array.isArray(questionTypesData) ? questionTypesData : []
  const difficultyLevels = Array.isArray(difficultyLevelsData) ? difficultyLevelsData : []
  const knowledgePoints = Array.isArray(knowledgePointsData) ? knowledgePointsData : []

  // 删除题目
  const deleteMutation = useMutation(questionsAPI.deleteQuestion, {
    onSuccess: () => {
      message.success('删除成功')
      queryClient.invalidateQueries('questions')
    },
    onError: () => {
      message.error('删除失败')
    }
  })

  // 批量更新状态
  const batchUpdateMutation = useMutation(questionsAPI.batchUpdateStatus, {
    onSuccess: () => {
      message.success('批量更新成功')
      setSelectedRowKeys([])
      queryClient.invalidateQueries('questions')
    },
    onError: () => {
      message.error('批量更新失败')
    }
  })

  // 表格列定义
  const columns = [
    {
      title: 'ID',
      dataIndex: 'id',
      width: 80,
      fixed: 'left'
    },
    {
      title: '题干图',
      dataIndex: 'question_image_url',
      width: 120,
      render: (url) => (
        url ? (
          <Image
            width={80}
            height={60}
            src={url}
            alt="题干图"
            style={{ objectFit: 'cover', borderRadius: 4 }}
            preview={{
              mask: <EyeOutlined />
            }}
          />
        ) : (
          <div style={{ 
            width: 80, 
            height: 60, 
            background: '#f5f5f5', 
            display: 'flex', 
            alignItems: 'center', 
            justifyContent: 'center',
            borderRadius: 4,
            color: '#999'
          }}>
            暂无图片
          </div>
        )
      )
    },
    {
      title: '答案图',
      dataIndex: 'answer_image_url',
      width: 120,
      render: (url) => (
        url ? (
          <Image
            width={80}
            height={60}
            src={url}
            alt="答案图"
            style={{ objectFit: 'cover', borderRadius: 4 }}
            preview={{
              mask: <EyeOutlined />
            }}
          />
        ) : (
          <div style={{ 
            width: 80, 
            height: 60, 
            background: '#f5f5f5', 
            display: 'flex', 
            alignItems: 'center', 
            justifyContent: 'center',
            borderRadius: 4,
            color: '#999'
          }}>
            暂无图片
          </div>
        )
      )
    },
    {
      title: '学科',
      dataIndex: 'subject_name',
      width: 100
    },
    {
      title: '年级',
      dataIndex: 'grade_name',
      width: 120
    },
    {
      title: '知识点',
      dataIndex: 'knowledge_point_name',
      width: 150,
      ellipsis: true
    },
    {
      title: '题型',
      dataIndex: 'question_type_name',
      width: 100
    },
    {
      title: '难度',
      dataIndex: 'difficulty_name',
      width: 80,
      render: (text, record) => {
        const colors = ['green', 'orange', 'red', 'purple']
        const level = record.difficulty_level || 1
        return (
          <Tag color={colors[level - 1] || 'blue'}>
            {text}
          </Tag>
        )
      }
    },
    {
      title: '状态',
      dataIndex: 'status',
      width: 100,
      render: (status) => {
        const statusConfig = {
          '未处理': { color: 'volcano', text: '未处理' },
          '已标注': { color: 'green', text: '已标注' },
          '已审核': { color: 'blue', text: '已审核' },
          '已发布': { color: 'purple', text: '已发布' }
        }
        const config = statusConfig[status] || { color: 'default', text: status }
        return <Tag color={config.color}>{config.text}</Tag>
      }
    },
    {
      title: '创建时间',
      dataIndex: 'created_at',
      width: 180,
      render: (date) => date ? new Date(date).toLocaleString() : '-'
    },
    {
      title: '操作',
      key: 'actions',
      width: 200,
      fixed: 'right',
      render: (_, record) => (
        <Space size="small">
          <Button
            type="primary"
            size="small"
            icon={<EditOutlined />}
            onClick={() => handleEdit(record)}
          >
            标注
          </Button>
          <Button
            size="small"
            icon={<EyeOutlined />}
            onClick={() => handleView(record)}
          >
            查看
          </Button>
          <Popconfirm
            title="确定要删除这道题目吗？"
            onConfirm={() => handleDelete(record.id)}
            okText="确定"
            cancelText="取消"
          >
            <Button
              danger
              size="small"
              icon={<DeleteOutlined />}
            >
              删除
            </Button>
          </Popconfirm>
        </Space>
      )
    }
  ]

  // 事件处理函数
  const handleSearch = (values) => {
    setSearchParams({ 
      ...searchParams, 
      ...values, 
      page: 1 
    })
  }

  const handleEdit = (question) => {
    setCurrentQuestion(question)
    setIsModalVisible(true)
  }

  const handleView = (question) => {
    Modal.info({
      title: '题目详情',
      width: 800,
      content: (
        <div style={{ marginTop: 16 }}>
          <Row gutter={16}>
            <Col span={12}>
              <p><strong>题干图:</strong></p>
              {question.question_image_url && (
                <Image 
                  src={question.question_image_url} 
                  alt="题干图"
                  style={{ maxWidth: '100%' }}
                />
              )}
            </Col>
            <Col span={12}>
              <p><strong>答案图:</strong></p>
              {question.answer_image_url && (
                <Image 
                  src={question.answer_image_url} 
                  alt="答案图"
                  style={{ maxWidth: '100%' }}
                />
              )}
            </Col>
          </Row>
          <div style={{ marginTop: 16 }}>
            <p><strong>学科:</strong> {question.subject_name}</p>
            <p><strong>年级:</strong> {question.grade_name}</p>
            <p><strong>知识点:</strong> {question.knowledge_point_name}</p>
            <p><strong>题型:</strong> {question.question_type_name}</p>
            <p><strong>难度:</strong> {question.difficulty_name}</p>
            <p><strong>状态:</strong> {question.status}</p>
            {question.remarks && <p><strong>备注:</strong> {question.remarks}</p>}
          </div>
        </div>
      )
    })
  }

  const handleDelete = (id) => {
    deleteMutation.mutate(id)
  }

  const handleBatchUpdate = (status) => {
    if (selectedRowKeys.length === 0) {
      message.warning('请先选择题目')
      return
    }
    batchUpdateMutation.mutate({ ids: selectedRowKeys, status })
  }

  const handleTableChange = (pagination) => {
    setSearchParams({
      ...searchParams,
      page: pagination.current,
      page_size: pagination.pageSize
    })
  }

  const handleModalSuccess = () => {
    setIsModalVisible(false)
    setCurrentQuestion(null)
    queryClient.invalidateQueries('questions')
  }

  const rowSelection = {
    selectedRowKeys,
    onChange: setSelectedRowKeys,
  }

  return (
    <div className="page-container">
      {/* 页面标题 */}
      <div className="page-header">
        <Title level={3}>题目管理</Title>
        <Space>
          <Button 
            icon={<ReloadOutlined />} 
            onClick={() => refetch()}
          >
            刷新
          </Button>
        </Space>
      </div>

      {/* 搜索表单 */}
      <Card className="search-form" style={{ marginBottom: 24 }}>
        <Form
          form={form}
          layout="inline"
          onFinish={handleSearch}
        >
          <Form.Item name="subject_id">
            <Select 
              placeholder="选择学科" 
              style={{ width: 120 }} 
              allowClear
            >
              {subjects.map(subject => (
                <Option key={subject.id} value={subject.id}>
                  {subject.name}
                </Option>
              ))}
            </Select>
          </Form.Item>
          
          <Form.Item name="grade_id">
            <Select 
              placeholder="选择年级" 
              style={{ width: 120 }} 
              allowClear
            >
              {grades.map(grade => (
                <Option key={grade.id} value={grade.id}>
                  {grade.name}
                </Option>
              ))}
            </Select>
          </Form.Item>
          
          <Form.Item name="question_type_id">
            <Select 
              placeholder="选择题型" 
              style={{ width: 120 }} 
              allowClear
            >
              {questionTypes.map(type => (
                <Option key={type.id} value={type.id}>
                  {type.name}
                </Option>
              ))}
            </Select>
          </Form.Item>
          
          <Form.Item name="status">
            <Select 
              placeholder="选择状态" 
              style={{ width: 120 }} 
              allowClear
            >
              <Option value="未处理">未处理</Option>
              <Option value="已标注">已标注</Option>
              <Option value="已审核">已审核</Option>
              <Option value="已发布">已发布</Option>
            </Select>
          </Form.Item>
          
          <Form.Item>
            <Button type="primary" htmlType="submit" icon={<SearchOutlined />}>
              搜索
            </Button>
          </Form.Item>
        </Form>
      </Card>

      {/* 工具栏 */}
      <Card style={{ marginBottom: 24 }}>
        <div className="toolbar">
          <div className="toolbar-left">
            <Space>
              <Button
                type="primary"
                icon={<PlusOutlined />}
                onClick={() => setIsModalVisible(true)}
              >
                添加题目
              </Button>
              <Button
                type="default"
                icon={<CheckOutlined />}
                disabled={selectedRowKeys.length === 0}
                onClick={() => handleBatchUpdate('已标注')}
              >
                批量标为已标注
              </Button>
            </Space>
          </div>
          <div className="toolbar-right">
            共 {total} 道题目，已选择 {selectedRowKeys.length} 道
          </div>
        </div>
      </Card>

      {/* 题目列表 */}
      <Card>
        <Table
          rowSelection={rowSelection}
          columns={columns}
          dataSource={questions}
          rowKey="id"
          loading={isLoading}
          pagination={{
            current: searchParams.page,
            pageSize: searchParams.page_size,
            total,
            showSizeChanger: true,
            showQuickJumper: true,
            showTotal: (total, range) => `第 ${range[0]}-${range[1]} 条/共 ${total} 条`,
            pageSizeOptions: ['10', '20', '50', '100']
          }}
          onChange={handleTableChange}
          scroll={{ x: 1500, y: 500 }}
        />
      </Card>

      {/* 题目表单弹窗 */}
      <QuestionForm
        visible={isModalVisible}
        question={currentQuestion}
        subjects={subjects}
        grades={grades}
        questionTypes={questionTypes}
        difficultyLevels={difficultyLevels}
        knowledgePoints={knowledgePoints}
        onSuccess={handleModalSuccess}
        onCancel={() => {
          setIsModalVisible(false)
          setCurrentQuestion(null)
        }}
      />
    </div>
  )
}

export default Questions
