const express = require('express');
const router = express.Router();
const { Submission, User, ContentItem, Module, Course } = require('../models');
const { authMiddleware } = require('../middleware/auth');

// Get all submissions for courses owned by the logged-in instructor
router.get('/submissions', authMiddleware, async (req, res) => {
    try {
        if (req.user.role !== "instructor") {
            return res.status(403).json({ detail: "Forbidden" });
        }

        const submissions = await Submission.findAll({
            include: [
                {
                    model: User,
                    as: 'student'
                },
                {
                    model: ContentItem,
                    as: 'assignment',
                    include: [
                        {
                            model: Module,
                            include: [
                                {
                                    model: Course,
                                    where: { instructor_id: req.user.id }
                                }
                            ]
                        }
                    ]
                }
            ]
        });

        // Filter out submissions where assignment.Module.Course is null (since we filtered by instructor_id in where clause)
        const filtered = submissions.filter(s => s.assignment && s.assignment.Module && s.assignment.Module.Course);

        const out = filtered.map(s => ({
            id: s.id,
            student_name: s.student ? s.student.full_name : "Unknown Student",
            assignment_title: s.assignment ? s.assignment.title : "Unknown Assignment",
            course_name: s.assignment.Module.Course.title,
            submitted_at: s.submitted_at ? new Date(s.submitted_at).toISOString().split('T')[0] : "N/A",
            status: s.status || "Pending",
            file_url: s.drive_link
        }));

        res.json(out);
    } catch (error) {
        console.error("Get submissions error:", error);
        res.status(500).json({ detail: "Internal Server Error" });
    }
});

// Update status of a submission
router.patch('/:submissionId/status', authMiddleware, async (req, res) => {
    try {
        if (req.user.role !== "instructor") {
            return res.status(403).json({ detail: "Forbidden" });
        }

        const submission = await Submission.findByPk(req.params.submissionId, {
            include: [
                {
                    model: ContentItem,
                    as: 'assignment',
                    include: [
                        {
                            model: Module,
                            include: [Course]
                        }
                    ]
                }
            ]
        });

        if (!submission) {
            return res.status(404).json({ detail: "Submission not found" });
        }

        const course = submission.assignment?.Module?.Course;
        if (!course || course.instructor_id !== req.user.id) {
            return res.status(403).json({ detail: "Unauthorized" });
        }

        const { status } = req.body;
        if (!["Pending", "Accepted", "Rejected"].includes(status)) {
            return res.status(400).json({ detail: "Invalid status value" });
        }

        submission.status = status;
        await submission.save();

        res.json({ message: `Submission status updated to ${status}` });
    } catch (error) {
        console.error("Patch submission status error:", error);
        res.status(500).json({ detail: "Internal Server Error" });
    }
});

module.exports = router;
