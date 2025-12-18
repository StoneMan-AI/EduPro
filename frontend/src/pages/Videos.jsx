import React, { useState } from 'react'
import {
  Card,
  Table,
  Button,
  Space,
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
  CheckOutlined,
  LinkOutlined
} from '@ant-design/icons'
import { useQuery, useMutation, useQueryClient } from 'react-query'
import VideoForm from '@/components/Forms/VideoForm'
import api from '@/services/api'

const { Option } = Select
const { Title } = Typography

const videosAPI = {
  getVideos: (params) => api.get('/videos', { params }),
  deleteVideo: (id) => api.delete(`/videos/${id}`),
  batchUpdateStatus: (data) => api.patch('/videos/batch-status', data),
  getSubjects: () => api.get('/config/subjects'),
  getGrades: () => api.get('/config/grades'),
  getQuestionTypes: () => api.get('/config/question-types'),
  getDifficultyLevels: () => api.get('/config/difficulty-levels'),
  getKnowledgePoints: (params) => api.get('/knowledge-points', { params })
}

function Videos() {
  const [form] = Form.useForm()
  const queryClient = useQueryClient()

  const [selectedRowKeys, setSelectedRowKeys] = useState([])
  const [isModalVisible, setIsModalVisible] = useState(false)
  const [currentVideo, setCurrentVideo] = useState(null)
  const [searchParams, setSearchParams] = useState({ page: 1, page_size: 20 })
  const [searchSubjectId, setSearchSubjectId] = useState(null)
  const [searchGradeId, setSearchGradeId] = useState(null)

  const { data: videosData, isLoading, refetch } = useQuery(
    ['videos', searchParams],
    () => videosAPI.getVideos(searchParams),
    { keepPreviousData: true, staleTime: 30000 }
  )

  const videos = videosData?.data || []
  const total = videosData?.total || 0
  const currentPage = videosData?.page || 1
  const pageSize = videosData?.page_size || 20

  const { data: subjectsData } = useQuery('subjects', videosAPI.getSubjects, {
    retry: 3,
    retryDelay: 1000,
    staleTime: 5 * 60 * 1000
  })
  const { data: gradesData } = useQuery('grades', videosAPI.getGrades, {
    retry: 3,
    retryDelay: 1000,
    staleTime: 5 * 60 * 1000
  })
  const { data: questionTypesData } = useQuery('questionTypes', videosAPI.getQuestionTypes, {
    retry: 3,
    retryDelay: 1000,
    staleTime: 5 * 60 * 1000
  })
  const { data: difficultyLevelsData } = useQuery('difficultyLevels', videosAPI.getDifficultyLevels, {
    retry: 3,
    retryDelay: 1000,
    staleTime: 5 * 60 * 1000
  })

  const { data: knowledgePointsData } = useQuery(
    ['knowledgePoints', 'videosSearch', searchSubjectId, searchGradeId],
    () => videosAPI.getKnowledgePoints({ subject_id: searchSubjectId, grade_id: searchGradeId }),
    {
      retry: 3,
      retryDelay: 1000,
      staleTime: 5 * 60 * 1000,
      enabled: !!searchSubjectId && !!searchGradeId
    }
  )

  const subjects = Array.isArray(subjectsData?.data) ? subjectsData.data : []
  const grades = Array.isArray(gradesData?.data) ? gradesData.data : []
  const questionTypes = Array.isArray(questionTypesData?.data) ? questionTypesData.data : []
  const difficultyLevels = Array.isArray(difficultyLevelsData?.data) ? difficultyLevelsData.data : []
  const knowledgePoints = Array.isArray(knowledgePointsData?.data) ? knowledgePointsData.data : []

  const deleteMutation = useMutation(videosAPI.deleteVideo, {
    onSuccess: () => {
      message.success('删除成功')
      queryClient.invalidateQueries('videos')
    },
    onError: () => message.error('删除失败')
  })

  const batchUpdateMutation = useMutation(videosAPI.batchUpdateStatus, {
    onSuccess: () => {
      message.success('批量更新成功')
      setSelectedRowKeys([])
      queryClient.invalidateQueries('videos')
    },
    onError: () => message.error('批量更新失败')
  })

  const columns = [
    { title: 'ID', dataIndex: 'id', width: 80, fixed: 'left' },
    {
      title: '封面图',
      dataIndex: 'cover_image_url',
      width: 120,
      render: (url) =>
        url ? (
          <Image
            width={80}
            height={60}
            src={url}
            alt="封面图"
            style={{ objectFit: 'cover', borderRadius: 4 }}
            preview={{ mask: <EyeOutlined /> }}
          />
        ) : (
          <div
            style={{
              width: 80,
              height: 60,
              background: '#f5f5f5',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              borderRadius: 4,
              color: '#999'
            }}
          >
            暂无图片
          </div>
        )
    },
    {
      title: '视频',
      dataIndex: 'video_url',
      width: 160,
      render: (url) =>
        url ? (
          <Space size="small">
            <Tag color="blue">已上传</Tag>
            <a href={url} target="_blank" rel="noreferrer">
              <LinkOutlined /> 打开
            </a>
          </Space>
        ) : (
          <Tag>未上传</Tag>
        )
    },
    { title: '学科', dataIndex: 'subject_name', width: 100 },
    { title: '年级', dataIndex: 'grade_name', width: 120 },
    { title: '知识点', dataIndex: 'knowledge_point_name', width: 150, ellipsis: true },
    { title: '题型', dataIndex: 'question_type_name', width: 100 },
    {
      title: '难度',
      dataIndex: 'difficulty_name',
      width: 80,
      render: (text, record) => {
        const colors = ['green', 'orange', 'red', 'purple']
        const level = record.difficulty_level || 1
        return <Tag color={colors[level - 1] || 'blue'}>{text}</Tag>
      }
    },
    {
      title: '状态',
      dataIndex: 'status',
      width: 100,
      render: (status) => {
        const statusConfig = {
          未处理: { color: 'volcano', text: '未处理' },
          已标注: { color: 'green', text: '已标注' },
          已审核: { color: 'blue', text: '已审核' },
          已发布: { color: 'purple', text: '已发布' }
        }
        const config = statusConfig[status] || { color: 'default', text: status }
        return <Tag color={config.color}>{config.text}</Tag>
      }
    },
    {
      title: '创建时间',
      dataIndex: 'created_at',
      width: 180,
      render: (date) => (date ? new Date(date).toLocaleString() : '-')
    },
    {
      title: '操作',
      key: 'actions',
      width: 200,
      fixed: 'right',
      render: (_, record) => (
        <Space size="small">
          <Button type="primary" size="small" icon={<EditOutlined />} onClick={() => handleEdit(record)}>
            标注
          </Button>
          <Button size="small" icon={<EyeOutlined />} onClick={() => handleView(record)}>
            查看
          </Button>
          <Popconfirm
            title="确定要删除这条视频吗？"
            onConfirm={() => handleDelete(record.id)}
            okText="确定"
            cancelText="取消"
          >
            <Button danger size="small" icon={<DeleteOutlined />}>
              删除
            </Button>
          </Popconfirm>
        </Space>
      )
    }
  ]

  const handleSearch = (values) => {
    if (values.subject_id !== undefined) setSearchSubjectId(values.subject_id || null)
    if (values.grade_id !== undefined) setSearchGradeId(values.grade_id || null)

    const filteredValues = Object.keys(values).reduce((acc, key) => {
      if (values[key] !== undefined && values[key] !== null && values[key] !== '') {
        acc[key] = values[key]
      } else {
        acc[key] = undefined
      }
      return acc
    }, {})

    setSearchParams({
      page: 1,
      page_size: searchParams.page_size || 20,
      ...filteredValues
    })
  }

  const handleSearchSubjectChange = (subjectId) => {
    setSearchSubjectId(subjectId || null)
    setSearchGradeId(null)
    form.setFieldsValue({ grade_id: undefined, knowledge_point_id: undefined })
  }

  const handleSearchGradeChange = (gradeId) => {
    setSearchGradeId(gradeId || null)
    form.setFieldsValue({ knowledge_point_id: undefined })
  }

  const handleEdit = (v) => {
    setCurrentVideo(v)
    setIsModalVisible(true)
  }

  const handleView = (v) => {
    Modal.info({
      title: '视频详情',
      width: 800,
      content: (
        <div style={{ marginTop: 16 }}>
          <Row gutter={16}>
            <Col span={12}>
              <p>
                <strong>封面图:</strong>
              </p>
              {v.cover_image_url && <Image src={v.cover_image_url} alt="封面图" style={{ maxWidth: '100%' }} />}
            </Col>
            <Col span={12}>
              <p>
                <strong>视频:</strong>
              </p>
              {v.video_url ? (
                <a href={v.video_url} target="_blank" rel="noreferrer">
                  打开视频文件
                </a>
              ) : (
                <span>-</span>
              )}
            </Col>
          </Row>
          <div style={{ marginTop: 16 }}>
            <p>
              <strong>标题:</strong> {v.title || '-'}
            </p>
            <p>
              <strong>学科:</strong> {v.subject_name}
            </p>
            <p>
              <strong>年级:</strong> {v.grade_name}
            </p>
            <p>
              <strong>知识点:</strong> {v.knowledge_point_name}
            </p>
            <p>
              <strong>题型:</strong> {v.question_type_name || '-'}
            </p>
            <p>
              <strong>难度:</strong> {v.difficulty_name || '-'}
            </p>
            <p>
              <strong>状态:</strong> {v.status}
            </p>
            {v.remarks && (
              <p>
                <strong>备注:</strong> {v.remarks}
              </p>
            )}
          </div>
        </div>
      )
    })
  }

  const handleDelete = (id) => deleteMutation.mutate(id)

  const handleBatchUpdate = (status) => {
    if (selectedRowKeys.length === 0) {
      message.warning('请先选择视频')
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
    setCurrentVideo(null)
    queryClient.invalidateQueries('videos')
  }

  const rowSelection = {
    selectedRowKeys: Array.isArray(selectedRowKeys) ? selectedRowKeys : [],
    onChange: setSelectedRowKeys
  }

  return (
    <div className="page-container">
      <div className="page-header">
        <Title level={3}>学习视频管理</Title>
        <Space>
          <Button icon={<ReloadOutlined />} onClick={() => refetch()}>
            刷新
          </Button>
        </Space>
      </div>

      <Card className="search-form" style={{ marginBottom: 24 }}>
        <Form form={form} layout="inline" onFinish={handleSearch}>
          <Form.Item name="subject_id">
            <Select placeholder="选择学科" style={{ width: 120 }} allowClear onChange={handleSearchSubjectChange}>
              {subjects.map((s) => (
                <Option key={s.id} value={s.id}>
                  {s.name}
                </Option>
              ))}
            </Select>
          </Form.Item>

          <Form.Item name="grade_id">
            <Select placeholder="选择年级" style={{ width: 120 }} allowClear onChange={handleSearchGradeChange}>
              {grades.map((g) => (
                <Option key={g.id} value={g.id}>
                  {g.name}
                </Option>
              ))}
            </Select>
          </Form.Item>

          <Form.Item name="knowledge_point_id">
            <Select
              placeholder={searchSubjectId && searchGradeId ? '选择知识点' : '请先选择学科和年级'}
              style={{ width: 150 }}
              allowClear
              disabled={!searchSubjectId || !searchGradeId}
            >
              {knowledgePoints.map((kp) => (
                <Option key={kp.id} value={kp.id}>
                  {kp.name}
                </Option>
              ))}
            </Select>
          </Form.Item>

          <Form.Item name="question_type_id">
            <Select placeholder="选择题型" style={{ width: 120 }} allowClear>
              {questionTypes.map((t) => (
                <Option key={t.id} value={t.id}>
                  {t.name}
                </Option>
              ))}
            </Select>
          </Form.Item>

          <Form.Item name="status">
            <Select placeholder="选择状态" style={{ width: 120 }} allowClear>
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

      <Card style={{ marginBottom: 24 }}>
        <div className="toolbar">
          <div className="toolbar-left">
            <Space>
              <Button
                type="primary"
                icon={<PlusOutlined />}
                onClick={() => {
                  setCurrentVideo(null)
                  setIsModalVisible(true)
                }}
              >
                添加视频
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
            共 {total} 条视频，已选择 {selectedRowKeys.length} 条
          </div>
        </div>
      </Card>

      <Card>
        <Table
          rowSelection={rowSelection}
          columns={columns}
          dataSource={Array.isArray(videos) ? videos : []}
          rowKey="id"
          loading={isLoading}
          pagination={{
            current: searchParams.page || currentPage,
            pageSize: searchParams.page_size || pageSize,
            total,
            showSizeChanger: true,
            showQuickJumper: true,
            showTotal: (t, range) => `第 ${range[0]}-${range[1]} 条/共 ${t} 条`,
            pageSizeOptions: ['10', '20', '50', '100']
          }}
          onChange={handleTableChange}
          scroll={{ x: 1500, y: 500 }}
        />
      </Card>

      <VideoForm
        visible={isModalVisible}
        video={currentVideo}
        subjects={subjects}
        grades={grades}
        questionTypes={questionTypes}
        difficultyLevels={difficultyLevels}
        onSuccess={handleModalSuccess}
        onCancel={() => {
          setIsModalVisible(false)
          setCurrentVideo(null)
        }}
      />
    </div>
  )
}

export default Videos



