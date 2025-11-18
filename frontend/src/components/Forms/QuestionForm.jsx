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
  EyeOutlined,
  LoadingOutlined
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
  const [questionImageFile, setQuestionImageFile] = useState(null)
  const [answerImageFile, setAnswerImageFile] = useState(null)
  const [questionImagePreview, setQuestionImagePreview] = useState('')
  const [answerImagePreview, setAnswerImagePreview] = useState('')
  const [selectedSubjectId, setSelectedSubjectId] = useState(null)
  const [selectedGradeId, setSelectedGradeId] = useState(null)
  const [optionImageErrors, setOptionImageErrors] = useState({}) // 记录选项图片加载失败状态

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
    kp => kp.subject_id === selectedSubjectId && 
          kp.grade_id === selectedGradeId
  )

  // 初始化表单
  useEffect(() => {
    if (visible) {
      if (question) {
        // 编辑模式
        console.log('编辑模式，题目数据:', question)
        console.log('题目状态:', question.status)
        form.setFieldsValue({
          title: question.title,
          subject_id: question.subject_id,
          grade_id: question.grade_id,
          knowledge_point_id: question.knowledge_point_id,
          question_type_id: question.question_type_id,
          difficulty_id: question.difficulty_id,
          status: question.status,
          remarks: question.remarks
        })
        setSelectedSubjectId(question.subject_id)
        setSelectedGradeId(question.grade_id)
        const questionImageUrl = question.question_image_url || ''
        const answerImageUrl = question.answer_image_url || ''
        setQuestionImagePreview(questionImageUrl)
        setAnswerImagePreview(answerImageUrl)
        console.log('设置图片预览 - 题干:', questionImageUrl)
        console.log('设置图片预览 - 答案:', answerImageUrl)
        console.log('题干图片URL类型:', typeof questionImageUrl)
        console.log('答案图片URL类型:', typeof answerImageUrl)
        setQuestionImageFile(null)
        setAnswerImageFile(null)
      } else {
        // 新增模式
        console.log('新增模式 - 清空所有状态')
        // 先清空所有状态
        setSelectedSubjectId(null)
        setSelectedGradeId(null)
        setQuestionImagePreview('')
        setAnswerImagePreview('')
        setQuestionImageFile(null)
        setAnswerImageFile(null)
        setOptionImageErrors({})
        // 然后重置表单
        form.resetFields()
        // 强制设置默认值
        form.setFieldsValue({
          title: '',
          subject_id: undefined,
          grade_id: undefined,
          knowledge_point_id: undefined,
          question_type_id: undefined,
          difficulty_id: undefined,
          status: '已发布',
          remarks: ''
        })
        console.log('新增模式 - 状态已清空')
      }
    } else {
      // 弹框关闭时，清空所有状态
      console.log('弹框关闭 - 清空所有状态')
      setSelectedSubjectId(null)
      setSelectedGradeId(null)
      setQuestionImagePreview('')
      setAnswerImagePreview('')
      setQuestionImageFile(null)
      setAnswerImageFile(null)
      setOptionImageErrors({})
      form.resetFields()
    }
  }, [visible, question, form])

  // 图片选择处理（只预览，不上传）
  const handleImageSelect = (file, type) => {
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

    // 创建预览URL
    const previewUrl = URL.createObjectURL(file)
    
    if (type === 'question') {
      setQuestionImageFile(file)
      setQuestionImagePreview(previewUrl)
    } else {
      setAnswerImageFile(file)
      setAnswerImagePreview(previewUrl)
    }

    return false // 阻止默认上传行为
  }

  // 删除图片
  const handleRemoveImage = (type) => {
    if (type === 'question') {
      setQuestionImageFile(null)
      setQuestionImagePreview('')
      // 在编辑模式下，清空图片预览表示要删除图片
      if (isEdit) {
        console.log('删除题干图片')
      }
    } else {
      setAnswerImageFile(null)
      setAnswerImagePreview('')
      // 在编辑模式下，清空图片预览表示要删除图片
      if (isEdit) {
        console.log('删除答案图片')
      }
    }
  }

  // 表单提交
  const handleSubmit = async () => {
    try {
      const values = await form.validateFields()
      
      // 初始化图片URL
      let questionImageUrl = ''
      let answerImageUrl = ''
      
      // 处理题干图片
      if (questionImageFile) {
        // 新选择的图片，需要上传
        try {
          const response = await questionAPI.uploadImage(questionImageFile)
          questionImageUrl = response.url || response.data?.url
          console.log('题干图片上传成功:', questionImageUrl)
          if (!questionImageUrl) {
            throw new Error('图片上传响应中没有URL')
          }
        } catch (error) {
          console.error('题干图片上传失败:', error)
          message.error('题干图片上传失败，请重试')
          return
        }
      } else if (isEdit) {
        // 编辑模式：检查图片是否被删除
        if (questionImagePreview && questionImagePreview.length > 0) {
          // 保持原有图片URL（未修改）
          questionImageUrl = questionImagePreview
          console.log('题干图片未修改，保持原有URL:', questionImageUrl)
        } else {
          // 图片被删除，设置为空字符串
          questionImageUrl = ''
          console.log('题干图片已删除')
        }
      } else if (questionImagePreview && questionImagePreview.startsWith('http')) {
        // 新增模式：使用预览URL
        questionImageUrl = questionImagePreview
        console.log('新增模式题干图片URL:', questionImageUrl)
      }
      
      // 处理答案图片
      if (answerImageFile) {
        // 新选择的图片，需要上传
        try {
          const response = await questionAPI.uploadImage(answerImageFile)
          answerImageUrl = response.url || response.data?.url
          console.log('答案图片上传成功:', answerImageUrl)
          if (!answerImageUrl) {
            throw new Error('图片上传响应中没有URL')
          }
        } catch (error) {
          console.error('答案图片上传失败:', error)
          message.error('答案图片上传失败，请重试')
          return
        }
      } else if (isEdit) {
        // 编辑模式：检查图片是否被删除
        if (answerImagePreview && answerImagePreview.length > 0) {
          // 保持原有图片URL（未修改）
          answerImageUrl = answerImagePreview
          console.log('答案图片未修改，保持原有URL:', answerImageUrl)
        } else {
          // 图片被删除，设置为空字符串
          answerImageUrl = ''
          console.log('答案图片已删除')
        }
      } else if (answerImagePreview && answerImagePreview.startsWith('http')) {
        // 新增模式：使用预览URL
        answerImageUrl = answerImagePreview
        console.log('新增模式答案图片URL:', answerImageUrl)
      }
      
      const data = {
        ...values,
        question_image_url: questionImageUrl,
        answer_image_url: answerImageUrl
      }
      
      console.log('=== 提交题目数据 ===')
      console.log('提交题目数据:', data)
      console.log('题干图片URL:', questionImageUrl)
      console.log('答案图片URL:', answerImageUrl)
      console.log('编辑模式:', isEdit)
      console.log('原有题干图片URL:', question?.question_image_url)
      console.log('原有答案图片URL:', question?.answer_image_url)
      console.log('题干图片预览:', questionImagePreview)
      console.log('答案图片预览:', answerImagePreview)
      console.log('题干图片文件:', questionImageFile)
      console.log('答案图片文件:', answerImageFile)
      console.log('题干图片预览长度:', questionImagePreview?.length)
      console.log('答案图片预览长度:', answerImagePreview?.length)
      console.log('题干图片预览类型:', typeof questionImagePreview)
      console.log('答案图片预览类型:', typeof answerImagePreview)
      console.log('========================')
      mutation.mutate(data)
    } catch (error) {
      console.error('表单验证失败:', error)
      message.error('表单验证失败，请检查输入')
    }
  }

  // 学科改变时重置知识点
  const handleSubjectChange = (value) => {
    setSelectedSubjectId(value)
    form.setFieldValue('knowledge_point_id', undefined)
  }

  // 年级改变时重置知识点
  const handleGradeChange = (value) => {
    setSelectedGradeId(value)
    form.setFieldValue('knowledge_point_id', undefined)
  }

  const uploadButton = (
    <div>
      <PlusOutlined />
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
          status: question ? question.status : '已发布',
          title: question?.title || '',
          subject_id: question?.subject_id || undefined,
          grade_id: question?.grade_id || undefined,
          knowledge_point_id: question?.knowledge_point_id || undefined,
          question_type_id: question?.question_type_id || undefined,
          difficulty_id: question?.difficulty_id || undefined,
          remarks: question?.remarks || ''
        }}
        key={question?.id || 'new'}
      >
        {/* 图片上传区域 */}
        <Card title="图片上传" size="small" style={{ marginBottom: 24 }}>
          <Row gutter={24}>
            <Col span={12}>
              <Form.Item label="题干图片">
                <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
                  {questionImagePreview ? (
                    <div style={{ position: 'relative' }}>
                      <Image
                        width={200}
                        height={150}
                        src={questionImagePreview}
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
                      beforeUpload={(file) => handleImageSelect(file, 'question')}
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
                  {answerImagePreview ? (
                    <div style={{ position: 'relative' }}>
                      <Image
                        width={200}
                        height={150}
                        src={answerImagePreview}
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
                      beforeUpload={(file) => handleImageSelect(file, 'answer')}
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
                  
                  {/* A、B、C、D 选项 */}
                  <div style={{ marginTop: 16, width: '100%' }}>
                    <div style={{ 
                      display: 'flex', 
                      justifyContent: 'space-around',
                      gap: 12,
                      flexWrap: 'wrap'
                    }}>
                      {['A', 'B', 'C', 'D'].map((option) => {
                        const optionImageUrl = `/uploads/${option}.png`
                        // 检查是否选中（支持相对路径和绝对路径）
                        const isSelected = answerImagePreview === optionImageUrl || 
                                          answerImagePreview?.endsWith(`/${option}.png`) ||
                                          answerImagePreview?.includes(`/${option}.png`)
                        return (
                          <div
                            key={option}
                            style={{
                              display: 'flex',
                              flexDirection: 'column',
                              alignItems: 'center',
                              cursor: 'pointer'
                            }}
                            onClick={() => {
                              setAnswerImageFile(null)
                              setAnswerImagePreview(optionImageUrl)
                              message.success(`已选择选项 ${option}`)
                            }}
                          >
                            <div
                              style={{
                                width: 80,
                                height: 80,
                                border: isSelected ? '2px solid #1890ff' : '2px solid #d9d9d9',
                                borderRadius: 8,
                                display: 'flex',
                                flexDirection: 'column',
                                alignItems: 'center',
                                justifyContent: 'center',
                                backgroundColor: isSelected ? '#e6f7ff' : '#fafafa',
                                transition: 'all 0.3s',
                                position: 'relative',
                                overflow: 'hidden'
                              }}
                              onMouseEnter={(e) => {
                                if (!isSelected) {
                                  e.currentTarget.style.borderColor = '#1890ff'
                                  e.currentTarget.style.backgroundColor = '#f0f8ff'
                                }
                              }}
                              onMouseLeave={(e) => {
                                if (!isSelected) {
                                  e.currentTarget.style.borderColor = '#d9d9d9'
                                  e.currentTarget.style.backgroundColor = '#fafafa'
                                }
                              }}
                            >
                              {/* 预览图片或文字 */}
                              {optionImageErrors[option] ? (
                                // 图片加载失败，显示文字
                                <div style={{
                                  fontSize: 32,
                                  fontWeight: 'bold',
                                  color: isSelected ? '#1890ff' : '#595959',
                                  marginBottom: 4
                                }}>
                                  {option}
                                </div>
                              ) : (
                                // 显示图片
                                <Image
                                  src={optionImageUrl}
                                  alt={`选项 ${option}`}
                                  width={60}
                                  height={50}
                                  style={{
                                    objectFit: 'contain',
                                    marginBottom: 4
                                  }}
                                  preview={{
                                    mask: <EyeOutlined />
                                  }}
                                  onError={() => {
                                    // 图片加载失败，记录状态
                                    setOptionImageErrors(prev => ({ ...prev, [option]: true }))
                                  }}
                                />
                              )}
                              {/* 选项标签 */}
                              <div style={{
                                position: 'absolute',
                                bottom: 4,
                                fontSize: 12,
                                fontWeight: 'bold',
                                color: isSelected ? '#1890ff' : '#8c8c8c'
                              }}>
                                {option}
                              </div>
                            </div>
                          </div>
                        )
                      })}
                    </div>
                    <div style={{ 
                      marginTop: 12, 
                      fontSize: 12, 
                      color: '#8c8c8c',
                      textAlign: 'center'
                    }}>
                      点击选项快速选择预设答案图片（A.png、B.png、C.png、D.png）
                    </div>
                  </div>
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
            
            <Col span={12}>
              <Form.Item
                name="status"
                label="状态"
                rules={[{ required: true, message: '请选择状态' }]}
              >
                <Select placeholder="请选择状态">
                  <Option value="未处理">未处理</Option>
                  <Option value="已标注">已标注</Option>
                  <Option value="已审核">已审核</Option>
                  <Option value="已发布">已发布</Option>
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
