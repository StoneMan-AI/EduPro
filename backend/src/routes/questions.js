const express = require('express');
const { Question, Subject, Grade, KnowledgePoint, QuestionType, DifficultyLevel } = require('../models');
const router = express.Router();

// 获取题目列表
router.get('/', async (req, res, next) => {
  try {
    const {
      page = 1,
      page_size = 20,
      subject_id,
      grade_id,
      question_type_id,
      difficulty_id,
      status
    } = req.query;

    const where = {};
    if (subject_id) where.subject_id = subject_id;
    if (grade_id) where.grade_id = grade_id;
    if (question_type_id) where.question_type_id = question_type_id;
    if (difficulty_id) where.difficulty_id = difficulty_id;
    if (status) where.status = status;

    const offset = (page - 1) * page_size;
    const limit = parseInt(page_size);

    const { rows: questions, count: total } = await Question.findAndCountAll({
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

    // 格式化返回数据
    const formattedQuestions = questions.map(q => ({
      ...q.toJSON(),
      subject_name: q.subject?.name,
      grade_name: q.grade?.name,
      knowledge_point_name: q.knowledgePoint?.name,
      question_type_name: q.questionType?.name,
      difficulty_name: q.difficultyLevel?.name,
      difficulty_level: q.difficultyLevel?.level_value
    }));

    res.json({
      success: true,
      data: formattedQuestions,
      total,
      page: parseInt(page),
      page_size: parseInt(page_size)
    });
  } catch (error) {
    next(error);
  }
});

// 获取单个题目
router.get('/:id', async (req, res, next) => {
  try {
    const question = await Question.findByPk(req.params.id, {
      include: [
        { model: Subject, as: 'subject' },
        { model: Grade, as: 'grade' },
        { model: KnowledgePoint, as: 'knowledgePoint' },
        { model: QuestionType, as: 'questionType' },
        { model: DifficultyLevel, as: 'difficultyLevel' }
      ]
    });

    if (!question) {
      return res.status(404).json({
        success: false,
        message: '题目不存在'
      });
    }

    res.json({
      success: true,
      data: question
    });
  } catch (error) {
    next(error);
  }
});

// 创建题目
router.post('/', async (req, res, next) => {
  try {
    const question = await Question.create({
      ...req.body,
      created_by: 'system', // TODO: 从用户信息中获取
      updated_by: 'system'
    });

    res.status(201).json({
      success: true,
      data: question,
      message: '题目创建成功'
    });
  } catch (error) {
    next(error);
  }
});

// 更新题目
router.put('/:id', async (req, res, next) => {
  try {
    const question = await Question.findByPk(req.params.id);
    
    if (!question) {
      return res.status(404).json({
        success: false,
        message: '题目不存在'
      });
    }

    await question.update({
      ...req.body,
      updated_by: 'system' // TODO: 从用户信息中获取
    });

    res.json({
      success: true,
      data: question,
      message: '题目更新成功'
    });
  } catch (error) {
    next(error);
  }
});

// 删除题目
router.delete('/:id', async (req, res, next) => {
  try {
    const question = await Question.findByPk(req.params.id);
    
    if (!question) {
      return res.status(404).json({
        success: false,
        message: '题目不存在'
      });
    }

    await question.destroy();

    res.json({
      success: true,
      message: '题目删除成功'
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
        message: '请提供有效的题目ID列表'
      });
    }

    if (!status) {
      return res.status(400).json({
        success: false,
        message: '请提供状态信息'
      });
    }

    await Question.update(
      { 
        status,
        updated_by: 'system' // TODO: 从用户信息中获取
      },
      { where: { id: ids } }
    );

    res.json({
      success: true,
      message: `成功更新 ${ids.length} 道题目的状态`
    });
  } catch (error) {
    next(error);
  }
});

module.exports = router;
