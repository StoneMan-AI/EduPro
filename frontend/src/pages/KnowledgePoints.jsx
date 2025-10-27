import React, { useState } from 'react'
import {
  Card,
  Table,
  Button,
  Space,
  Modal,
  Form,
  Input,
  Select,
  Tree,
  Row,
  Col,
  Typography,
  message,
  Popconfirm
} from 'antd'
import {
  PlusOutlined,
  EditOutlined,
  DeleteOutlined,
  ReloadOutlined
} from '@ant-design/icons'
import { useQuery, useMutation, useQueryClient } from 'react-query'
import api from '@/services/api'

const { Option } = Select
const { TextArea } = Input
const { Title } = Typography

// API 函数
const knowledgePointsAPI = {
  getKnowledgePoints: (params) => api.get('/knowledge-points', { params }),
  createKnowledgePoint: (data) => api.post('/knowledge-points', data),
  updateKnowledgePoint: (id, data) => api.put(`/knowledge-points/${id}`, data),
  deleteKnowledgePoint: (id) => api.delete(`/knowledge-points/${id}`),
  getSubjects: () => api.get('/config/subjects')
}

function KnowledgePoints() {
  const [form] = Form.useForm()
  const queryClient = useQueryClient()
  
  // 状态管理
  const [isModalVisible, setIsModalVisible] = useState(false)
  const [currentKnowledgePoint, setCurrentKnowledgePoint] = useState(null)
  const [selectedSubject, setSelectedSubject] = useState(null)

  // 获取知识点列表
  const [selectedGrade, setSelectedGrade] = useState(null)
  const { data: knowledgePoints = [], isLoading, refetch } = useQuery(
    ['knowledgePoints', selectedSubject, selectedGrade],
    () => knowledgePointsAPI.getKnowledgePoints({ 
      subject_id: selectedSubject,
      grade_id: selectedGrade 
    }),
    { 
      staleTime: 30000
    }
  )

  // 获取学科列表和年级列表
  const { data: subjects = [] } = useQuery('subjects', knowledgePointsAPI.getSubjects)
  const { data: grades = [] } = useQuery('grades', () => 
    api.get('/config/grades').then(res => res.data || [])
  )

  // 创建/更新知识点
  const mutation = useMutation(
    ({ id, ...data }) => {
      if (id) {
        return knowledgePointsAPI.updateKnowledgePoint(id, data)
      } else {
        return knowledgePointsAPI.createKnowledgePoint(data)
      }
    },
    {
      onSuccess: () => {
        message.success('操作成功')
        setIsModalVisible(false)
        setCurrentKnowledgePoint(null)
        form.resetFields()
        queryClient.invalidateQueries('knowledgePoints')
      },
      onError: (error) => {
        message.error(error.response?.data?.message || '操作失败')
      }
    }
  )

  // 删除知识点
  const deleteMutation = useMutation(knowledgePointsAPI.deleteKnowledgePoint, {
    onSuccess: () => {
      message.success('删除成功')
      queryClient.invalidateQueries('knowledgePoints')
    },
    onError: (error) => {
      message.error(error.response?.data?.message || '删除失败')
    }
  })

  // 构建树形数据
  const buildTreeData = (items) => {
    const map = {}
    const roots = []

    // 创建映射
    items.forEach(item => {
      map[item.id] = { 
        ...item, 
        key: item.id,
        title: item.name,
        children: [] 
      }
    })

    // 构建树形结构
    items.forEach(item => {
      if (item.parent_id && map[item.parent_id]) {
        map[item.parent_id].children.push(map[item.id])
      } else {
        roots.push(map[item.id])
      }
    })

    return roots
  }

  // 表格列定义
  const columns = [
    {
      title: 'ID',
      dataIndex: 'id',
      width: 80
    },
    {
      title: '知识点名称',
      dataIndex: 'name',
      width: 200
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
      title: '父知识点',
      dataIndex: 'parent_name',
      width: 150,
      render: (text) => text || '根节点'
    },
    {
      title: '描述',
      dataIndex: 'description',
      ellipsis: true
    },
    {
      title: '状态',
      dataIndex: 'is_active',
      width: 100,
      render: (active) => (
        <span style={{ color: active ? '#52c41a' : '#ff4d4f' }}>
          {active ? '启用' : '禁用'}
        </span>
      )
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
      width: 150,
      render: (_, record) => (
        <Space size="small">
          <Button
            type="primary"
            size="small"
            icon={<EditOutlined />}
            onClick={() => handleEdit(record)}
          >
            编辑
          </Button>
          <Popconfirm
            title="确定要删除这个知识点吗？"
            description="删除后，相关的子知识点也会被删除"
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
  const handleAdd = () => {
    setCurrentKnowledgePoint(null)
    setIsModalVisible(true)
  }

  const handleEdit = (knowledgePoint) => {
    setCurrentKnowledgePoint(knowledgePoint)
    form.setFieldsValue({
      name: knowledgePoint.name,
      subject_id: knowledgePoint.subject_id,
      parent_id: knowledgePoint.parent_id,
      description: knowledgePoint.description,
      is_active: knowledgePoint.is_active
    })
    setIsModalVisible(true)
  }

  const handleDelete = (id) => {
    deleteMutation.mutate(id)
  }

  const handleSubmit = () => {
    form.validateFields().then(values => {
      const data = currentKnowledgePoint 
        ? { id: currentKnowledgePoint.id, ...values }
        : values
      mutation.mutate(data)
    })
  }

  const handleSubjectFilter = (subjectId) => {
    setSelectedSubject(subjectId)
    setSelectedGrade(null) // 重置年级筛选
  }

  const handleGradeFilter = (gradeId) => {
    setSelectedGrade(gradeId)
  }

  // 获取父知识点选项
  const getParentOptions = () => {
    const subjectId = form.getFieldValue('subject_id')
    const gradeId = form.getFieldValue('grade_id')
    if (!subjectId || !gradeId) return []
    
    return knowledgePoints
      .filter(kp => 
        kp.subject_id === subjectId && 
        kp.grade_id === gradeId && 
        kp.id !== currentKnowledgePoint?.id
      )
      .map(kp => ({ value: kp.id, label: kp.name }))
  }

  const treeData = buildTreeData(knowledgePoints)

  return (
    <div className="page-container">
      {/* 页面标题 */}
      <div className="page-header">
        <Title level={3}>知识点管理</Title>
        <Space>
          <Button 
            icon={<ReloadOutlined />} 
            onClick={() => refetch()}
          >
            刷新
          </Button>
        </Space>
      </div>

      <Row gutter={24}>
        {/* 左侧：知识点树形结构 */}
        <Col span={8}>
          <Card 
            title="知识点结构" 
            size="small"
            extra={
              <Space>
                <Select
                  placeholder="筛选学科"
                  style={{ width: 100 }}
                  allowClear
                  onChange={handleSubjectFilter}
                >
                  {subjects.map(subject => (
                    <Option key={subject.id} value={subject.id}>
                      {subject.name}
                    </Option>
                  ))}
                </Select>
                <Select
                  placeholder="筛选年级"
                  style={{ width: 120 }}
                  allowClear
                  value={selectedGrade}
                  onChange={handleGradeFilter}
                >
                  {grades.map(grade => (
                    <Option key={grade.id} value={grade.id}>
                      {grade.name}
                    </Option>
                  ))}
                </Select>
              </Space>
            }
          >
            <Tree
              treeData={treeData}
              defaultExpandAll
              showLine
              height={500}
              style={{ overflowY: 'auto' }}
            />
          </Card>
        </Col>

        {/* 右侧：知识点列表和操作 */}
        <Col span={16}>
          {/* 工具栏 */}
          <Card style={{ marginBottom: 16 }}>
            <div className="toolbar">
              <div className="toolbar-left">
                <Button
                  type="primary"
                  icon={<PlusOutlined />}
                  onClick={handleAdd}
                >
                  添加知识点
                </Button>
              </div>
              <div className="toolbar-right">
                共 {knowledgePoints.length} 个知识点
              </div>
            </div>
          </Card>

          {/* 知识点列表 */}
          <Card>
            <Table
              columns={columns}
              dataSource={knowledgePoints}
              rowKey="id"
              loading={isLoading}
              pagination={{
                pageSize: 10,
                showSizeChanger: true,
                showQuickJumper: true,
                showTotal: (total, range) => `第 ${range[0]}-${range[1]} 条/共 ${total} 条`
              }}
              scroll={{ y: 400 }}
            />
          </Card>
        </Col>
      </Row>

      {/* 知识点表单弹窗 */}
      <Modal
        title={currentKnowledgePoint ? '编辑知识点' : '添加知识点'}
        open={isModalVisible}
        width={600}
        onOk={handleSubmit}
        onCancel={() => {
          setIsModalVisible(false)
          setCurrentKnowledgePoint(null)
          form.resetFields()
        }}
        confirmLoading={mutation.isLoading}
        okText="保存"
        cancelText="取消"
      >
        <Form
          form={form}
          layout="vertical"
          initialValues={{
            is_active: true
          }}
        >
          <Form.Item
            name="name"
            label="知识点名称"
            rules={[
              { required: true, message: '请输入知识点名称' },
              { max: 100, message: '名称不能超过100个字符' }
            ]}
          >
            <Input placeholder="请输入知识点名称" />
          </Form.Item>

          <Form.Item
            name="subject_id"
            label="所属学科"
            rules={[{ required: true, message: '请选择所属学科' }]}
          >
            <Select 
              placeholder="请选择所属学科"
              onChange={() => {
                form.setFieldValue('parent_id', undefined)
                form.setFieldValue('grade_id', undefined)
              }}
            >
              {subjects.map(subject => (
                <Option key={subject.id} value={subject.id}>
                  {subject.name}
                </Option>
              ))}
            </Select>
          </Form.Item>

          <Form.Item
            name="grade_id"
            label="所属年级"
            rules={[{ required: true, message: '请选择所属年级' }]}
          >
            <Select 
              placeholder="请选择所属年级"
              onChange={() => form.setFieldValue('parent_id', undefined)}
            >
              {grades.map(grade => (
                <Option key={grade.id} value={grade.id}>
                  {grade.name}
                </Option>
              ))}
            </Select>
          </Form.Item>

          <Form.Item
            name="parent_id"
            label="父知识点"
          >
            <Select 
              placeholder="请选择父知识点（可选）"
              allowClear
              options={getParentOptions()}
            />
          </Form.Item>

          <Form.Item
            name="description"
            label="描述"
          >
            <TextArea 
              rows={3} 
              placeholder="请输入知识点描述（可选）"
              maxLength={500}
            />
          </Form.Item>

          <Form.Item
            name="is_active"
            label="状态"
          >
            <Select>
              <Option value={true}>启用</Option>
              <Option value={false}>禁用</Option>
            </Select>
          </Form.Item>
        </Form>
      </Modal>
    </div>
  )
}

export default KnowledgePoints
