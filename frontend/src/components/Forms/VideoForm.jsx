import React, { useEffect, useState } from 'react'
import { Modal, Form, Input, Select, Upload, Button, Row, Col, Card, Image, message, Tag } from 'antd'
import { PlusOutlined, DeleteOutlined, EyeOutlined, FileOutlined } from '@ant-design/icons'
import { useMutation, useQuery } from 'react-query'
import api from '@/services/api'

const { Option } = Select
const { TextArea } = Input

const videosAPI = {
  createVideo: (data) => api.post('/videos', data),
  updateVideo: (id, data) => api.put(`/videos/${id}`, data),
  uploadImage: (file) => {
    const formData = new FormData()
    formData.append('file', file)
    return api.post('/uploads/image', formData, {
      headers: { 'Content-Type': 'multipart/form-data' }
    })
  },
  uploadVideo: (file) => {
    const formData = new FormData()
    formData.append('file', file)
    return api.post('/uploads/video', formData, {
      headers: { 'Content-Type': 'multipart/form-data' }
    })
  }
}

function VideoForm({
  visible,
  video,
  subjects,
  grades,
  questionTypes,
  difficultyLevels,
  onSuccess,
  onCancel
}) {
  const [form] = Form.useForm()
  const isEdit = !!video

  const [coverFile, setCoverFile] = useState(null)
  const [videoFile, setVideoFile] = useState(null)
  const [coverPreview, setCoverPreview] = useState('')
  const [videoUrlPreview, setVideoUrlPreview] = useState('')
  const [videoNamePreview, setVideoNamePreview] = useState('')

  const [selectedSubjectId, setSelectedSubjectId] = useState(null)
  const [selectedGradeId, setSelectedGradeId] = useState(null)

  // 动态获取知识点：必须先选学科+年级
  const { data: formKnowledgePointsData } = useQuery(
    ['knowledgePoints', 'videoForm', selectedSubjectId, selectedGradeId],
    () => api.get('/knowledge-points', { params: { subject_id: selectedSubjectId, grade_id: selectedGradeId } }),
    {
      retry: 3,
      retryDelay: 1000,
      staleTime: 5 * 60 * 1000,
      enabled: !!selectedSubjectId && !!selectedGradeId
    }
  )

  const knowledgePoints = Array.isArray(formKnowledgePointsData?.data) ? formKnowledgePointsData.data : []

  const mutation = useMutation(
    (data) => (isEdit ? videosAPI.updateVideo(video.id, data) : videosAPI.createVideo(data)),
    {
      onSuccess: () => {
        message.success(isEdit ? '视频更新成功' : '视频创建成功')
        onSuccess()
      },
      onError: (error) => {
        message.error(error.response?.data?.message || '操作失败')
      }
    }
  )

  useEffect(() => {
    if (!visible) return

    // 初始化下拉依赖
    const initSubjectId = video?.subject_id ?? null
    const initGradeId = video?.grade_id ?? null
    setSelectedSubjectId(initSubjectId)
    setSelectedGradeId(initGradeId)

    // 初始化预览
    setCoverFile(null)
    setVideoFile(null)
    setCoverPreview(video?.cover_image_url || '')
    setVideoUrlPreview(video?.video_url || '')
    setVideoNamePreview(video?.video_url ? video.video_url.split('/').pop() : '')
  }, [visible, video])

  const handleSubjectChange = (value) => {
    const subjectId = value || null
    setSelectedSubjectId(subjectId)
    form.setFieldValue('knowledge_point_id', undefined)
  }

  const handleGradeChange = (value) => {
    const gradeId = value || null
    setSelectedGradeId(gradeId)
    form.setFieldValue('knowledge_point_id', undefined)
  }

  const handleSelectCover = (file) => {
    setCoverFile(file)
    setCoverPreview(URL.createObjectURL(file))
    return false
  }

  const handleRemoveCover = () => {
    setCoverFile(null)
    setCoverPreview('')
  }

  const handleSelectVideo = (file) => {
    if (file.type !== 'video/mp4') {
      message.error('只支持 MP4 格式的视频')
      return Upload.LIST_IGNORE
    }
    if (file.size > 20 * 1024 * 1024) {
      message.error('视频大小不能超过 20MB')
      return Upload.LIST_IGNORE
    }
    setVideoFile(file)
    setVideoNamePreview(file.name)
    setVideoUrlPreview('') // 新选视频后，清空旧 URL 预览
    return false
  }

  const handleRemoveVideo = () => {
    setVideoFile(null)
    setVideoUrlPreview('')
    setVideoNamePreview('')
  }

  const handleSubmit = async () => {
    try {
      const values = await form.validateFields()

      // 封面图
      let coverImageUrl = ''
      if (coverFile) {
        try {
          const resp = await videosAPI.uploadImage(coverFile)
          coverImageUrl = resp.url || resp.data?.url
          if (!coverImageUrl) throw new Error('封面上传响应中没有URL')
        } catch (e) {
          message.error('封面图上传失败，请重试')
          return
        }
      } else if (isEdit) {
        coverImageUrl = coverPreview || ''
      } else {
        coverImageUrl = coverPreview || ''
      }

      // 视频
      let videoUrl = ''
      if (videoFile) {
        try {
          const resp = await videosAPI.uploadVideo(videoFile)
          videoUrl = resp.url || resp.data?.url
          if (!videoUrl) throw new Error('视频上传响应中没有URL')
        } catch (e) {
          message.error('视频上传失败，请重试')
          return
        }
      } else if (isEdit) {
        videoUrl = videoUrlPreview || ''
      } else {
        videoUrl = videoUrlPreview || ''
      }

      mutation.mutate({
        ...values,
        cover_image_url: coverImageUrl,
        video_url: videoUrl
      })
    } catch (error) {
      message.error('表单验证失败，请检查输入')
    }
  }

  return (
    <Modal
      title={isEdit ? '编辑视频' : '添加视频'}
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
          status: video ? video.status : '已发布',
          title: video?.title || '',
          subject_id: video?.subject_id || undefined,
          grade_id: video?.grade_id || undefined,
          knowledge_point_id: video?.knowledge_point_id || undefined,
          question_type_id: video?.question_type_id || undefined,
          difficulty_id: video?.difficulty_id || undefined,
          remarks: video?.remarks || ''
        }}
        key={video?.id || 'new'}
      >
        {/* 文件上传区域 */}
        <Card title="文件上传" size="small" style={{ marginBottom: 24 }}>
          <Row gutter={24}>
            <Col span={12}>
              <Form.Item label="展示图（封面）">
                <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
                  {coverPreview ? (
                    <div style={{ position: 'relative' }}>
                      <Image
                        width={200}
                        height={150}
                        src={coverPreview}
                        style={{ objectFit: 'cover', borderRadius: 8 }}
                        preview={{ mask: <EyeOutlined /> }}
                      />
                      <Button
                        danger
                        size="small"
                        icon={<DeleteOutlined />}
                        style={{ position: 'absolute', top: -8, right: -8, borderRadius: '50%' }}
                        onClick={handleRemoveCover}
                      />
                    </div>
                  ) : (
                    <Upload showUploadList={false} beforeUpload={handleSelectCover} accept="image/png,image/jpeg">
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
                        <div>点击上传封面图</div>
                      </div>
                    </Upload>
                  )}
                </div>
              </Form.Item>
            </Col>

            <Col span={12}>
              <Form.Item label="视频文件（MP4，≤20MB）">
                <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
                  {(videoFile || videoUrlPreview) ? (
                    <div style={{ width: '100%' }}>
                      <div
                        style={{
                          width: '100%',
                          minHeight: 150,
                          border: '1px dashed #d9d9d9',
                          borderRadius: 8,
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'space-between',
                          padding: 12,
                          background: '#fafafa'
                        }}
                      >
                        <div style={{ display: 'flex', alignItems: 'center', gap: 8, overflow: 'hidden' }}>
                          <FileOutlined />
                          <div style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                            {videoFile ? videoFile.name : (videoNamePreview || '已上传视频')}
                          </div>
                        </div>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                          {videoUrlPreview ? (
                            <Tag color="blue">已上传</Tag>
                          ) : (
                            <Tag color="orange">待上传</Tag>
                          )}
                          <Button danger size="small" icon={<DeleteOutlined />} onClick={handleRemoveVideo} />
                        </div>
                      </div>
                    </div>
                  ) : (
                    <Upload
                      showUploadList={false}
                      beforeUpload={handleSelectVideo}
                      accept="video/mp4"
                    >
                      <div
                        style={{
                          width: '100%',
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
                        <div>点击选择 MP4 视频</div>
                      </div>
                    </Upload>
                  )}
                </div>
              </Form.Item>
            </Col>
          </Row>
        </Card>

        {/* 基础信息 */}
        <Card title="基础信息" size="small">
          <Row gutter={24}>
            <Col span={12}>
              <Form.Item name="title" label="标题（可不填）">
                <Input placeholder="请输入标题（可选）" />
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item name="status" label="状态" rules={[{ required: true, message: '请选择状态' }]}>
                <Select placeholder="选择状态">
                  <Option value="未处理">未处理</Option>
                  <Option value="已标注">已标注</Option>
                  <Option value="已审核">已审核</Option>
                  <Option value="已发布">已发布</Option>
                </Select>
              </Form.Item>
            </Col>

            <Col span={8}>
              <Form.Item name="subject_id" label="学科" rules={[{ required: true, message: '请选择学科' }]}>
                <Select placeholder="选择学科" allowClear onChange={handleSubjectChange}>
                  {subjects.map(s => (
                    <Option key={s.id} value={s.id}>{s.name}</Option>
                  ))}
                </Select>
              </Form.Item>
            </Col>
            <Col span={8}>
              <Form.Item name="grade_id" label="年级" rules={[{ required: true, message: '请选择年级' }]}>
                <Select placeholder="选择年级" allowClear onChange={handleGradeChange}>
                  {grades.map(g => (
                    <Option key={g.id} value={g.id}>{g.name}</Option>
                  ))}
                </Select>
              </Form.Item>
            </Col>
            <Col span={8}>
              <Form.Item name="knowledge_point_id" label="知识点" rules={[{ required: true, message: '请选择知识点' }]}>
                <Select
                  placeholder={selectedSubjectId && selectedGradeId ? '选择知识点' : '请先选择学科和年级'}
                  disabled={!selectedSubjectId || !selectedGradeId}
                  allowClear
                >
                  {knowledgePoints.map(kp => (
                    <Option key={kp.id} value={kp.id}>{kp.name}</Option>
                  ))}
                </Select>
              </Form.Item>
            </Col>

            <Col span={12}>
              <Form.Item name="question_type_id" label="题型（可选）">
                <Select placeholder="选择题型" allowClear>
                  {questionTypes.map(t => (
                    <Option key={t.id} value={t.id}>{t.name}</Option>
                  ))}
                </Select>
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item name="difficulty_id" label="难度（可选）">
                <Select placeholder="选择难度" allowClear>
                  {difficultyLevels.map(d => (
                    <Option key={d.id} value={d.id}>{d.name}</Option>
                  ))}
                </Select>
              </Form.Item>
            </Col>

            <Col span={24}>
              <Form.Item name="remarks" label="备注">
                <TextArea rows={3} placeholder="请输入备注（可选）" />
              </Form.Item>
            </Col>
          </Row>
        </Card>
      </Form>
    </Modal>
  )
}

export default VideoForm


