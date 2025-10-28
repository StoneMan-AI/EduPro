const express = require('express');
const { KnowledgePoint, Subject, Grade } = require('../models');
const router = express.Router();

// 获取知识点列表
router.get('/', async (req, res, next) => {
  try {
    const { subject_id, grade_id } = req.query;
    
    const where = {};
    if (subject_id) where.subject_id = subject_id;
    if (grade_id) where.grade_id = grade_id;

    const knowledgePoints = await KnowledgePoint.findAll({
      where,
      include: [
        { model: Subject, as: 'subject' },
        { model: Grade, as: 'grade' },
        { 
          model: KnowledgePoint, 
          as: 'parent',
          attributes: ['id', 'name']
        }
      ],
      order: [['created_at', 'DESC']]
    });

    // 格式化返回数据
    const formattedData = knowledgePoints.map(kp => ({
      ...kp.toJSON(),
      subject_name: kp.subject?.name,
      grade_name: kp.grade?.name,
      parent_name: kp.parent?.name
    }));

    res.json({
      success: true,
      data: formattedData
    });
  } catch (error) {
    next(error);
  }
});

// 获取知识点树形结构
router.get('/tree/:subjectId/:gradeId?', async (req, res, next) => {
  try {
    const { subjectId, gradeId } = req.params;
    
    const where = { subject_id: subjectId };
    if (gradeId) where.grade_id = gradeId;
    
    const knowledgePoints = await KnowledgePoint.findAll({
      where,
      include: [
        { model: Subject, as: 'subject' },
        { model: Grade, as: 'grade' }
      ],
      order: [['created_at', 'ASC']]
    });

    // 构建树形结构
    const buildTree = (items, parentId = null) => {
      return items
        .filter(item => item.parent_id === parentId)
        .map(item => ({
          ...item.toJSON(),
          subject_name: item.subject?.name,
          grade_name: item.grade?.name,
          children: buildTree(items, item.id)
        }));
    };

    const tree = buildTree(knowledgePoints);

    res.json({
      success: true,
      data: tree
    });
  } catch (error) {
    next(error);
  }
});

// 获取单个知识点
router.get('/:id', async (req, res, next) => {
  try {
    const knowledgePoint = await KnowledgePoint.findByPk(req.params.id, {
      include: [
        { model: Subject, as: 'subject' },
        { model: Grade, as: 'grade' }
      ]
    });

    if (!knowledgePoint) {
      return res.status(404).json({
        success: false,
        message: '知识点不存在'
      });
    }

    res.json({
      success: true,
      data: knowledgePoint
    });
  } catch (error) {
    next(error);
  }
});

// 创建知识点
router.post('/', async (req, res, next) => {
  try {
    const knowledgePoint = await KnowledgePoint.create(req.body);

    res.status(201).json({
      success: true,
      data: knowledgePoint,
      message: '知识点创建成功'
    });
  } catch (error) {
    next(error);
  }
});

// 更新知识点
router.put('/:id', async (req, res, next) => {
  try {
    const knowledgePoint = await KnowledgePoint.findByPk(req.params.id);
    
    if (!knowledgePoint) {
      return res.status(404).json({
        success: false,
        message: '知识点不存在'
      });
    }

    await knowledgePoint.update(req.body);

    res.json({
      success: true,
      data: knowledgePoint,
      message: '知识点更新成功'
    });
  } catch (error) {
    next(error);
  }
});

// 删除知识点
router.delete('/:id', async (req, res, next) => {
  try {
    const knowledgePoint = await KnowledgePoint.findByPk(req.params.id);
    
    if (!knowledgePoint) {
      return res.status(404).json({
        success: false,
        message: '知识点不存在'
      });
    }

    // 检查是否有子知识点
    const childCount = await KnowledgePoint.count({
      where: { parent_id: req.params.id }
    });

    if (childCount > 0) {
      return res.status(400).json({
        success: false,
        message: '该知识点下还有子知识点，无法删除'
      });
    }

    await knowledgePoint.destroy();

    res.json({
      success: true,
      message: '知识点删除成功'
    });
  } catch (error) {
    next(error);
  }
});

module.exports = router;
