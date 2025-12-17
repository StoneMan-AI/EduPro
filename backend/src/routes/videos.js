const express = require('express');
const { LearningVideo, Subject, Grade, KnowledgePoint, QuestionType, DifficultyLevel } = require('../models');
const router = express.Router();

// 获取视频列表（分页/筛选逻辑与题目管理一致）
router.get('/', async (req, res, next) => {
  try {
    const {
      page = 1,
      page_size = 20,
      subject_id,
      grade_id,
      knowledge_point_id,
      question_type_id,
      difficulty_id,
      status
    } = req.query;

    const where = {};
    if (subject_id) where.subject_id = subject_id;
    if (grade_id) where.grade_id = grade_id;
    if (knowledge_point_id) where.knowledge_point_id = knowledge_point_id;
    if (question_type_id) where.question_type_id = question_type_id;
    if (difficulty_id) where.difficulty_id = difficulty_id;
    if (status) where.status = status;

    const offset = (page - 1) * page_size;
    const limit = parseInt(page_size);

    const { rows: videos, count: total } = await LearningVideo.findAndCountAll({
      where,
      include: [
        { model: Subject, as: 'subject' },
        { model: Grade, as: 'grade' },
        { model: KnowledgePoint, as: 'knowledgePoint' },
        { model: QuestionType, as: 'questionType' },
        { model: DifficultyLevel, as: 'difficultyLevel' }
      ],
      offset,
      limit,
      order: [['created_at', 'DESC']]
    });

    const formatted = videos.map(v => ({
      ...v.toJSON(),
      subject_name: v.subject?.name,
      grade_name: v.grade?.name,
      knowledge_point_name: v.knowledgePoint?.name,
      question_type_name: v.questionType?.name,
      difficulty_name: v.difficultyLevel?.name,
      difficulty_level: v.difficultyLevel?.level_value
    }));

    res.json({
      success: true,
      data: formatted,
      total,
      page: parseInt(page),
      page_size: parseInt(page_size)
    });
  } catch (error) {
    next(error);
  }
});

// 获取单个视频
router.get('/:id', async (req, res, next) => {
  try {
    const video = await LearningVideo.findByPk(req.params.id, {
      include: [
        { model: Subject, as: 'subject' },
        { model: Grade, as: 'grade' },
        { model: KnowledgePoint, as: 'knowledgePoint' },
        { model: QuestionType, as: 'questionType' },
        { model: DifficultyLevel, as: 'difficultyLevel' }
      ]
    });

    if (!video) {
      return res.status(404).json({
        success: false,
        message: '视频不存在'
      });
    }

    res.json({
      success: true,
      data: video
    });
  } catch (error) {
    next(error);
  }
});

// 创建视频
router.post('/', async (req, res, next) => {
  try {
    const video = await LearningVideo.create({
      ...req.body,
      created_by: 'system',
      updated_by: 'system'
    });

    res.status(201).json({
      success: true,
      data: video,
      message: '视频创建成功'
    });
  } catch (error) {
    next(error);
  }
});

// 更新视频
router.put('/:id', async (req, res, next) => {
  try {
    const video = await LearningVideo.findByPk(req.params.id);

    if (!video) {
      return res.status(404).json({
        success: false,
        message: '视频不存在'
      });
    }

    await video.update({
      ...req.body,
      updated_by: 'system'
    });

    res.json({
      success: true,
      data: video,
      message: '视频更新成功'
    });
  } catch (error) {
    next(error);
  }
});

// 删除视频
router.delete('/:id', async (req, res, next) => {
  try {
    const video = await LearningVideo.findByPk(req.params.id);

    if (!video) {
      return res.status(404).json({
        success: false,
        message: '视频不存在'
      });
    }

    await video.destroy();

    res.json({
      success: true,
      message: '视频删除成功'
    });
  } catch (error) {
    next(error);
  }
});

// 批量更新状态
router.patch('/batch-status', async (req, res, next) => {
  try {
    const { ids, status } = req.body;

    if (!ids || !Array.isArray(ids) || ids.length === 0) {
      return res.status(400).json({
        success: false,
        message: '请提供有效的视频ID列表'
      });
    }

    if (!status) {
      return res.status(400).json({
        success: false,
        message: '请提供状态信息'
      });
    }

    await LearningVideo.update(
      { status, updated_by: 'system' },
      { where: { id: ids } }
    );

    res.json({
      success: true,
      message: `成功更新 ${ids.length} 条视频的状态`
    });
  } catch (error) {
    next(error);
  }
});

module.exports = router;


