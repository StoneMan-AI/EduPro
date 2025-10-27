const express = require('express');
const { Subject, Grade, QuestionType, DifficultyLevel } = require('../models');
const router = express.Router();

// ============ 学科管理 ============

// 获取所有学科
router.get('/subjects', async (req, res, next) => {
  try {
    const subjects = await Subject.findAll({
      order: [['created_at', 'ASC']]
    });

    res.json({
      success: true,
      data: subjects
    });
  } catch (error) {
    next(error);
  }
});

// 创建学科
router.post('/subjects', async (req, res, next) => {
  try {
    const subject = await Subject.create(req.body);

    res.status(201).json({
      success: true,
      data: subject,
      message: '学科创建成功'
    });
  } catch (error) {
    next(error);
  }
});

// 更新学科
router.put('/subjects/:id', async (req, res, next) => {
  try {
    const subject = await Subject.findByPk(req.params.id);
    
    if (!subject) {
      return res.status(404).json({
        success: false,
        message: '学科不存在'
      });
    }

    await subject.update(req.body);

    res.json({
      success: true,
      data: subject,
      message: '学科更新成功'
    });
  } catch (error) {
    next(error);
  }
});

// 删除学科
router.delete('/subjects/:id', async (req, res, next) => {
  try {
    const subject = await Subject.findByPk(req.params.id);
    
    if (!subject) {
      return res.status(404).json({
        success: false,
        message: '学科不存在'
      });
    }

    await subject.destroy();

    res.json({
      success: true,
      message: '学科删除成功'
    });
  } catch (error) {
    next(error);
  }
});

// ============ 年级管理 ============

// 获取所有年级
router.get('/grades', async (req, res, next) => {
  try {
    const grades = await Grade.findAll({
      order: [['sort_order', 'ASC'], ['created_at', 'ASC']]
    });

    res.json({
      success: true,
      data: grades
    });
  } catch (error) {
    next(error);
  }
});

// 创建年级
router.post('/grades', async (req, res, next) => {
  try {
    const grade = await Grade.create(req.body);

    res.status(201).json({
      success: true,
      data: grade,
      message: '年级创建成功'
    });
  } catch (error) {
    next(error);
  }
});

// 更新年级
router.put('/grades/:id', async (req, res, next) => {
  try {
    const grade = await Grade.findByPk(req.params.id);
    
    if (!grade) {
      return res.status(404).json({
        success: false,
        message: '年级不存在'
      });
    }

    await grade.update(req.body);

    res.json({
      success: true,
      data: grade,
      message: '年级更新成功'
    });
  } catch (error) {
    next(error);
  }
});

// 删除年级
router.delete('/grades/:id', async (req, res, next) => {
  try {
    const grade = await Grade.findByPk(req.params.id);
    
    if (!grade) {
      return res.status(404).json({
        success: false,
        message: '年级不存在'
      });
    }

    await grade.destroy();

    res.json({
      success: true,
      message: '年级删除成功'
    });
  } catch (error) {
    next(error);
  }
});

// ============ 题型管理 ============

// 获取所有题型
router.get('/question-types', async (req, res, next) => {
  try {
    const questionTypes = await QuestionType.findAll({
      order: [['created_at', 'ASC']]
    });

    res.json({
      success: true,
      data: questionTypes
    });
  } catch (error) {
    next(error);
  }
});

// 创建题型
router.post('/question-types', async (req, res, next) => {
  try {
    const questionType = await QuestionType.create(req.body);

    res.status(201).json({
      success: true,
      data: questionType,
      message: '题型创建成功'
    });
  } catch (error) {
    next(error);
  }
});

// 更新题型
router.put('/question-types/:id', async (req, res, next) => {
  try {
    const questionType = await QuestionType.findByPk(req.params.id);
    
    if (!questionType) {
      return res.status(404).json({
        success: false,
        message: '题型不存在'
      });
    }

    await questionType.update(req.body);

    res.json({
      success: true,
      data: questionType,
      message: '题型更新成功'
    });
  } catch (error) {
    next(error);
  }
});

// 删除题型
router.delete('/question-types/:id', async (req, res, next) => {
  try {
    const questionType = await QuestionType.findByPk(req.params.id);
    
    if (!questionType) {
      return res.status(404).json({
        success: false,
        message: '题型不存在'
      });
    }

    await questionType.destroy();

    res.json({
      success: true,
      message: '题型删除成功'
    });
  } catch (error) {
    next(error);
  }
});

// ============ 难度级别管理 ============

// 获取所有难度级别
router.get('/difficulty-levels', async (req, res, next) => {
  try {
    const difficultyLevels = await DifficultyLevel.findAll({
      order: [['level_value', 'ASC']]
    });

    res.json({
      success: true,
      data: difficultyLevels
    });
  } catch (error) {
    next(error);
  }
});

// 创建难度级别
router.post('/difficulty-levels', async (req, res, next) => {
  try {
    const difficultyLevel = await DifficultyLevel.create(req.body);

    res.status(201).json({
      success: true,
      data: difficultyLevel,
      message: '难度级别创建成功'
    });
  } catch (error) {
    next(error);
  }
});

// 更新难度级别
router.put('/difficulty-levels/:id', async (req, res, next) => {
  try {
    const difficultyLevel = await DifficultyLevel.findByPk(req.params.id);
    
    if (!difficultyLevel) {
      return res.status(404).json({
        success: false,
        message: '难度级别不存在'
      });
    }

    await difficultyLevel.update(req.body);

    res.json({
      success: true,
      data: difficultyLevel,
      message: '难度级别更新成功'
    });
  } catch (error) {
    next(error);
  }
});

// 删除难度级别
router.delete('/difficulty-levels/:id', async (req, res, next) => {
  try {
    const difficultyLevel = await DifficultyLevel.findByPk(req.params.id);
    
    if (!difficultyLevel) {
      return res.status(404).json({
        success: false,
        message: '难度级别不存在'
      });
    }

    await difficultyLevel.destroy();

    res.json({
      success: true,
      message: '难度级别删除成功'
    });
  } catch (error) {
    next(error);
  }
});

module.exports = router;
