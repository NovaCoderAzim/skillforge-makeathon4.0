const express = require('express');
const router = express.Router();
const { Course, Module, ContentItem, Enrollment, LessonProgress } = require('../models');
const { authMiddleware } = require('../middleware/auth');

router.get('/', authMiddleware, async (req, res) => {
    try {
        if (req.user.role === "instructor") {
            const courses = await Course.findAll({ where: { instructor_id: req.user.id } });
            const result = [];
            for (const c of courses) {
                const student_count = await Enrollment.count({ where: { course_id: c.id } });
                result.push({
                    id: c.id,
                    title: c.title,
                    description: c.description,
                    price: c.price,
                    image_url: c.image_url,
                    is_published: c.is_published,
                    is_finalized: c.is_finalized,
                    students: student_count,
                    rating: student_count > 0 ? Math.round((4.5 + (student_count % 5) * 0.1) * 10) / 10 : 0,
                });
            }
            return res.json(result);
        }
        const publishedCourses = await Course.findAll({ where: { is_published: true } });
        res.json(publishedCourses);
    } catch (error) {
        console.error(error);
        res.status(500).json({ detail: "Internal Server Error" });
    }
});

router.post('/', authMiddleware, async (req, res) => {
    try {
        const new_course = await Course.create({ ...req.body, instructor_id: req.user.id });
        res.json(new_course);
    } catch (error) {
        console.error(error);
        res.status(500).json({ detail: "Internal Server Error" });
    }
});

router.post('/:course_id/modules', authMiddleware, async (req, res) => {
    try {
        const new_module = await Module.create({ ...req.body, course_id: req.params.course_id });
        res.json(new_module);
    } catch (error) {
        res.status(500).json({ detail: "Internal Server Error" });
    }
});

router.get('/:course_id/modules', authMiddleware, async (req, res) => {
    try {
        const modules = await Module.findAll({ 
            where: { course_id: req.params.course_id },
            order: [['order', 'ASC']]
        });
        res.json(modules);
    } catch (error) {
        res.status(500).json({ detail: "Internal Server Error" });
    }
});

router.patch('/:course_id/publish', authMiddleware, async (req, res) => {
    try {
        const course = await Course.findByPk(req.params.course_id);
        if (!course) return res.status(404).json({ detail: "Not found" });
        course.is_published = true;
        await course.save();
        res.json({ message: "Published" });
    } catch (error) {
        res.status(500).json({ detail: "Internal Server Error" });
    }
});

router.patch('/:course_id/finalize', authMiddleware, async (req, res) => {
    try {
        const course = await Course.findOne({ where: { id: req.params.course_id, instructor_id: req.user.id } });
        if (!course) return res.status(404).json({ detail: "Not found" });
        course.is_finalized = true;
        await course.save();
        res.json({ message: "Finalized" });
    } catch (error) {
        res.status(500).json({ detail: "Internal Server Error" });
    }
});

module.exports = router;
