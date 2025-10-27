import React, { useState, useEffect } from 'react'
import {
  Modal,
  Form,
  Input,
  Select,
  Upload,
  Button,
  Row,
  Col,
  Card,
  Image,
  message
} from 'antd'
import {
  PlusOutlined,
  DeleteOutlined,
  EyeOutlined
} from '@ant-design/icons'
import { useMutation } from 'react-query'
import api from '@/services/api'

const { Option } = Select
const { TextArea } = Input

// API 函数
const questionAPI = {
  createQuestion: (data) => api.post('/questions', data),
  updateQuestion: (id, data) => api.put(`/questions/${id}`, data),
  uploadImage: (file) => {
    const formData = new FormData()
    formData.append('file', file)
    return api.post('/uploads/image', formData, {
      headers: {
        'Content-Type': 'multipart/form-data'
      }
    })
  }
}

function QuestionForm({
  visible,
  question,
  subjects,
  grades,
  questionTypes,
  difficultyLevels,
  knowledgePoints,
  onSuccess,
  onCancel
}) {
  const [form] = Form.useForm()
  const [questionImageUrl, setQuestionImageUrl] = useState('')
  const [answerImageUrl, setAnswerImageUrl] = useState('')
  const [uploadingQuestion, setUploadingQuestion] = useState(false)
  const [uploadingAnswer, setUploadingAnswer] = useState(false)

  const isEdit = !!question

  // 创建/更新题目
  const mutation = useMutation(
    (data) => {
      if (isEdit) {
        return questionAPI.updateQuestion(question.id, data)
      } else {
        return questionAPI.createQuestion(data)
      }
    },
    {
      onSuccess: () => {
        message.success(isEdit ? '题目更新成功' : '题目创建成功')
        onSuccess()
      },
      onError: (error) => {
        message.error(error.response?.data?.message || '操作失败')
      }
    }
  )

  // 过滤知识点 - 根据学科和年级双重筛选
  const filteredKnowledgePoints = knowledgePoints.filter(
    kp => kp.subject_id === form.getFieldValue('subject_id') && 
          kp.grade_id === form.getFieldValue('grade_id')
  )

  // 初始化表单
  useEffect(() => {
    if (visible) {
      if (question) {
        // 编辑模式
        form.setFieldsValue({
          title: question.title,
          subject_id: question.subject_id,
          grade_id: question.grade_id,
          knowledge_point_id: question.knowledge_point_id,
          question_type_id: question.question_type_id,
          difficulty_id: question.difficulty_id,
          remarks: question.remarks
        })
        setQuestionImageUrl(question.question_image_url || '')
        setAnswerImageUrl(question.answer_image_url || '')
      } else {
        // 新增模式
        form.resetFields()
        setQuestionImageUrl('')
        setAnswerImageUrl('')
      }
    }
  }, [visible, question, form])

  // 图片上传处理
  const handleImageUpload = async (file, type) => {
    const isJpgOrPng = file.type === 'image/jpeg' || file.type === 'image/png' || file.type === 'image/gif'
    if (!isJpgOrPng) {
      message.error('只能上传 JPG/PNG/GIF 格式的图片!')
      return false
    }
    const isLt10M = file.size / 1024 / 1024 < 10
    if (!isLt10M) {
      message.error('图片大小不能超过 10MB!')
      return false
    }

    try {
      if (type === 'question') {
        setUploadingQuestion(true)
      } else {
        setUploadingAnswer(true)
      }

      const response = await questionAPI.uploadImage(file)
      
      if (type === 'question') {
        setQuestionImageUrl(response.url)
        message.success('题干图片上传成功')
      } else {
        setAnswerImageUrl(response.url)
        message.success('答案图片上传成功')
      }
    } catch (error) {
      message.error('图片上传失败')
    } finally {
      if (type === 'question') {
        setUploadingQuestion(false)
      } else {
        setUploadingAnswer(false)
      }
    }

    return false // 阻止默认上传行为
  }

  // 删除图片
  const handleRemoveImage = (type) => {
    if (type === 'question') {
      setQuestionImageUrl('')
    } else {
      setAnswerImageUrl('')
    }
  }

  // 表单提交
  const handleSubmit = () => {
    form.validateFields().then((values) => {
      const data = {
        ...values,
        question_image_url: questionImageUrl,
        answer_image_url: answerImageUrl
      }
      mutation.mutate(data)
    })
  }

  // 学科改变时重置知识点
  const handleSubjectChange = () => {
    form.setFieldValue('knowledge_point_id', undefined)
  }

  // 年级改变时重置知识点
  const handleGradeChange = () => {
    form.setFieldValue('knowledge_point_id', undefined)
  }

  const uploadButton = (loading) => (
    <div>
      {loading ? <LoadingOutlined /> : <PlusOutlined />}
      <div style={{ marginTop: 8 }}>
        点击上传
      </div>
    </div>
  )

  return (
    <Modal
      title={isEdit ? '编辑题目' : '添加题目'}
      open={visible}
      width={900}
      onOk={handleSubmit}
      onCancel={onCancel}
      confirmLoading={mutation.isLoading}
      okText="保存"
      cancelText="取消"
    >
      <Form
        form={form}
        layout="vertical"
        initialValues={{
          status: '未处理'
        }}
      >
        {/* 图片上传区域 */}
        <Card title="图片上传" size="small" style={{ marginBottom: 24 }}>
          <Row gutter={24}>
            <Col span={12}>
              <Form.Item label="题干图片">
                <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
                  {questionImageUrl ? (
                    <div style={{ position: 'relative' }}>
                      <Image
                        width={200}
                        height={150}
                        src={questionImageUrl}
                        style={{ objectFit: 'cover', borderRadius: 8 }}
                        preview={{
                          mask: <EyeOutlined />
                        }}
                      />
                      <Button
                        danger
                        size="small"
                        icon={<DeleteOutlined />}
                        style={{
                          position: 'absolute',
                          top: -8,
                          right: -8,
                          borderRadius: '50%'
                        }}
                        onClick={() => handleRemoveImage('question')}
                      />
                    </div>
                  ) : (
                    <Upload
                      showUploadList={false}
                      beforeUpload={(file) => handleImageUpload(file, 'question')}
                    >
                      <div
                        style={{
                          width: 200,
                          height: 150,
                          border: '2px dashed #d9d9d9',
                          borderRadius: 8,
                          display: 'flex',
                          flexDirection: 'column',
                          alignItems: 'center',
                          justifyContent: 'center',
                          cursor: 'pointer',
                          color: '#8c8c8c'
                        }}
                      >
                        <PlusOutlined style={{ fontSize: 24, marginBottom: 8 }} />
                        <div>点击上传题干图</div>
                      </div>
                    </Upload>
                  )}
                </div>
              </Form.Item>
            </Col>
            
            <Col span={12}>
              <Form.Item label="答案图片">
                <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
                  {answerImageUrl ? (
                    <div style={{ position: 'relative' }}>
                      <Image
                        width={200}
                        height={150}
                        src={answerImageUrl}
                        style={{ objectFit: 'cover', borderRadius: 8 }}
                        preview={{
                          mask: <EyeOutlined />
                        }}
                      />
                      <Button
                        danger
                        size="small"
                        icon={<DeleteOutlined />}
                        style={{
                          position: 'absolute',
                          top: -8,
                          right: -8,
                          borderRadius: '50%'
                        }}
                        onClick={() => handleRemoveImage('answer')}
                      />
                    </div>
                  ) : (
                    <Upload
                      showUploadList={false}
                      beforeUpload={(file) => handleImageUpload(file, 'answer')}
                    >
                      <div
                        style={{
                          width: 200,
                          height: 150,
                          border: '2px dashed #d9d9d9',
                          borderRadius: 8,
                          display: 'flex',
                          flexDirection: 'column',
                          alignItems: 'center',
                          justifyContent: 'center',
                          cursor: 'pointer',
                          color: '#8c8c8c'
                        }}
                      >
                        <PlusOutlined style={{ fontSize: 24, marginBottom: 8 }} />
                        <div>点击上传答案图</div>
                      </div>
                    </Upload>
                  )}
                </div>
              </Form.Item>
            </Col>
          </Row>
        </Card>

        {/* 题目属性 */}
        <Card title="题目属性" size="small">
          <Row gutter={16}>
            <Col span={24}>
              <Form.Item
                name="title"
                label="题目标题"
              >
                <Input 
                  placeholder="请输入题目标题（可选）" 
                  maxLength={200}
                />
              </Form.Item>
            </Col>
            
            <Col span={12}>
              <Form.Item
                name="subject_id"
                label="学科"
                rules={[{ required: true, message: '请选择学科' }]}
              >
                <Select 
                  placeholder="请选择学科"
                  onChange={handleSubjectChange}
                >
                  {subjects.map(subject => (
                    <Option key={subject.id} value={subject.id}>
                      {subject.name}
                    </Option>
                  ))}
                </Select>
              </Form.Item>
            </Col>
            
            <Col span={12}>
              <Form.Item
                name="grade_id"
                label="年级"
                rules={[{ required: true, message: '请选择年级' }]}
              >
                <Select 
                  placeholder="请选择年级"
                  onChange={handleGradeChange}
                >
                  {grades.map(grade => (
                    <Option key={grade.id} value={grade.id}>
                      {grade.name}
                    </Option>
                  ))}
                </Select>
              </Form.Item>
            </Col>
            
            <Col span={12}>
              <Form.Item
                name="knowledge_point_id"
                label="知识点"
              >
                <Select 
                  placeholder={
                    !form.getFieldValue('subject_id') || !form.getFieldValue('grade_id') 
                      ? "请先选择学科和年级" 
                      : "请选择知识点"
                  }
                  allowClear
                  disabled={!form.getFieldValue('subject_id') || !form.getFieldValue('grade_id')}
                >
                  {filteredKnowledgePoints.map(kp => (
                    <Option key={kp.id} value={kp.id}>
                      {kp.name} {kp.grade_name && `(${kp.grade_name})`}
                    </Option>
                  ))}
                </Select>
              </Form.Item>
            </Col>
            
            <Col span={12}>
              <Form.Item
                name="question_type_id"
                label="题型"
                rules={[{ required: true, message: '请选择题型' }]}
              >
                <Select placeholder="请选择题型">
                  {questionTypes.map(type => (
                    <Option key={type.id} value={type.id}>
                      {type.name}
                    </Option>
                  ))}
                </Select>
              </Form.Item>
            </Col>
            
            <Col span={12}>
              <Form.Item
                name="difficulty_id"
                label="难度"
                rules={[{ required: true, message: '请选择难度' }]}
              >
                <Select placeholder="请选择难度">
                  {difficultyLevels.map(level => (
                    <Option key={level.id} value={level.id}>
                      {level.name}
                    </Option>
                  ))}
                </Select>
              </Form.Item>
            </Col>
            
            <Col span={24}>
              <Form.Item
                name="remarks"
                label="备注"
              >
                <TextArea 
                  rows={3} 
                  placeholder="请输入备注信息（可选）"
                  maxLength={500}
                />
              </Form.Item>
            </Col>
          </Row>
        </Card>
      </Form>
    </Modal>
  )
}

export default QuestionForm
