from datetime import datetime

from .extensions import db


class Student(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    student_no = db.Column(db.String(32), unique=True, nullable=False, index=True)
    name = db.Column(db.String(80), nullable=False)
    major = db.Column(db.String(120), default="")
    class_name = db.Column(db.String(120), default="")
    created_at = db.Column(db.DateTime, default=datetime.utcnow)

    grades = db.relationship("Grade", back_populates="student", cascade="all, delete-orphan")

    def to_dict(self):
        return {
            "id": self.id,
            "studentNo": self.student_no,
            "name": self.name,
            "major": self.major,
            "className": self.class_name,
        }


class GradeBatch(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    name = db.Column(db.String(120), nullable=False)
    semester = db.Column(db.String(40), nullable=False)
    teacher = db.Column(db.String(80), nullable=False)
    status = db.Column(db.String(20), default="draft", nullable=False)
    created_at = db.Column(db.DateTime, default=datetime.utcnow)
    published_at = db.Column(db.DateTime, nullable=True)

    grades = db.relationship("Grade", back_populates="batch", cascade="all, delete-orphan")

    def to_dict(self, include_grades=False):
        result = {
            "id": self.id,
            "name": self.name,
            "semester": self.semester,
            "teacher": self.teacher,
            "status": self.status,
            "gradeCount": len(self.grades),
            "createdAt": self.created_at.isoformat(),
            "publishedAt": self.published_at.isoformat() if self.published_at else None,
        }
        if include_grades:
            result["grades"] = [grade.to_dict() for grade in self.grades]
        return result


class Grade(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    student_id = db.Column(db.Integer, db.ForeignKey("student.id"), nullable=False)
    course_code = db.Column(db.String(40), nullable=False)
    course_name = db.Column(db.String(120), nullable=False)
    credit = db.Column(db.Float, nullable=False)
    score = db.Column(db.Float, nullable=False)
    semester = db.Column(db.String(40), nullable=False)
    teacher = db.Column(db.String(80), nullable=False)
    batch_id = db.Column(db.Integer, db.ForeignKey("grade_batch.id"), nullable=True)
    published = db.Column(db.Boolean, default=False, nullable=False)
    created_at = db.Column(db.DateTime, default=datetime.utcnow)
    updated_at = db.Column(db.DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    student = db.relationship("Student", back_populates="grades")
    batch = db.relationship("GradeBatch", back_populates="grades")
    appeals = db.relationship("Appeal", back_populates="grade", cascade="all, delete-orphan")

    def to_dict(self):
        from .services.gpa import score_to_letter, score_to_point

        latest_appeal = sorted(self.appeals, key=lambda appeal: appeal.created_at, reverse=True)
        return {
            "id": self.id,
            "student": self.student.to_dict(),
            "courseCode": self.course_code,
            "courseName": self.course_name,
            "credit": self.credit,
            "score": self.score,
            "gpaPoint": score_to_point(self.score),
            "letter": score_to_letter(self.score),
            "semester": self.semester,
            "teacher": self.teacher,
            "batchId": self.batch_id,
            "published": self.published,
            "appealStatus": latest_appeal[0].status if latest_appeal else None,
            "createdAt": self.created_at.isoformat(),
            "updatedAt": self.updated_at.isoformat(),
        }


class Appeal(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    grade_id = db.Column(db.Integer, db.ForeignKey("grade.id"), nullable=False)
    student_no = db.Column(db.String(32), nullable=False, index=True)
    reason = db.Column(db.Text, nullable=False)
    status = db.Column(db.String(20), default="pending", nullable=False)
    teacher_response = db.Column(db.Text, default="")
    created_at = db.Column(db.DateTime, default=datetime.utcnow)
    updated_at = db.Column(db.DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    grade = db.relationship("Grade", back_populates="appeals")

    def to_dict(self):
        return {
            "id": self.id,
            "gradeId": self.grade_id,
            "studentNo": self.student_no,
            "studentName": self.grade.student.name,
            "courseName": self.grade.course_name,
            "score": self.grade.score,
            "reason": self.reason,
            "status": self.status,
            "teacherResponse": self.teacher_response,
            "createdAt": self.created_at.isoformat(),
            "updatedAt": self.updated_at.isoformat(),
        }
