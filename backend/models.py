from datetime import datetime
from typing import Optional, Dict, Any
from sqlalchemy import UniqueConstraint
from database import db

# --- Core entities ---


class Submission(db.Model):
    __tablename__ = "submissions"
    id = db.Column(db.String, primary_key=True)
    queue_id = db.Column(db.String, index=True)
    task_id = db.Column(db.String, index=True)
    created_at = db.Column(db.Integer)  # epoch ms from input

    questions = db.relationship(
        "Question", backref="submission", cascade="all, delete-orphan")
    answers = db.relationship(
        "Answer", backref="submission", cascade="all, delete-orphan")

    @staticmethod
    def from_ingest(payload: Dict[str, Any]):
        s = Submission(
            id=payload["id"],
            queue_id=payload.get("queueId"),
            task_id=payload.get("labelingTaskId"),
            created_at=payload.get("createdAt"),
        )
        # Questions
        for q in payload.get("questions", []):
            data = q.get("data", {})
            s.questions.append(Question(
                id=data.get("id"),
                submission_id=payload["id"],
                rev=q.get("rev", 1),
                question_type=data.get("questionType"),
                question_text=data.get("questionText"),
            ))
        # Answers map: { q_template_id: {choice, reasoning, ...} }
        for qid, ans in payload.get("answers", {}).items():
            s.answers.append(Answer(
                submission_id=payload["id"],
                question_id=qid,
                choice=ans.get("choice"),
                reasoning=ans.get("reasoning"),
                extra_json=str(ans),
            ))
        return s


class Question(db.Model):
    __tablename__ = "questions"
    # Question templates repeat across submissions; we key by (submission_id, id)
    id = db.Column(db.String, primary_key=True)  # question template id
    submission_id = db.Column(db.String, db.ForeignKey(
        "submissions.id"), primary_key=True)
    rev = db.Column(db.Integer, default=1)
    question_type = db.Column(db.String)
    question_text = db.Column(db.Text)

    assignments = db.relationship(
        "Assignment", backref="question", cascade="all, delete-orphan")
    evaluations = db.relationship(
        "Evaluation", backref="question", cascade="all, delete-orphan")


class Answer(db.Model):
    __tablename__ = "answers"
    id = db.Column(db.Integer, primary_key=True)
    submission_id = db.Column(
        db.String, db.ForeignKey("submissions.id"), index=True)
    # refers to question template id
    question_id = db.Column(db.String, index=True)
    choice = db.Column(db.String)
    reasoning = db.Column(db.Text)
    extra_json = db.Column(db.Text)  # raw blob for debug
    __table_args__ = (
        db.ForeignKeyConstraint(
            ["question_id", "submission_id"],
            ["questions.id", "questions.submission_id"]
        ),
        UniqueConstraint("submission_id", "question_id",
                         name="uq_answer_per_question"),
    )


class Judge(db.Model):
    __tablename__ = "judges"
    id = db.Column(db.Integer, primary_key=True)
    name = db.Column(db.String, unique=True)
    prompt = db.Column(db.Text)
    model_name = db.Column(db.String)
    active = db.Column(db.Boolean, default=True)
    created_at = db.Column(db.DateTime, default=datetime.utcnow)

    assignments = db.relationship(
        "Assignment", backref="judge", cascade="all, delete-orphan")


class Assignment(db.Model):
    __tablename__ = "assignments"
    id = db.Column(db.Integer, primary_key=True)
    submission_id = db.Column(
        db.String, db.ForeignKey("submissions.id"), index=True)
    question_id = db.Column(db.String, index=True)
    judge_id = db.Column(db.Integer, db.ForeignKey("judges.id"), index=True)
    __table_args__ = (
        db.ForeignKeyConstraint(
            ["question_id", "submission_id"],
            ["questions.id", "questions.submission_id"]
        ),
        UniqueConstraint("submission_id", "question_id",
                         "judge_id", name="uq_q_judge_once"),
    )


class Evaluation(db.Model):
    __tablename__ = "evaluations"
    id = db.Column(db.Integer, primary_key=True)
    submission_id = db.Column(
        db.String, db.ForeignKey("submissions.id"), index=True)
    question_id = db.Column(db.String, index=True)
    judge_id = db.Column(db.Integer, db.ForeignKey("judges.id"), index=True)
    verdict = db.Column(db.String, index=True)  # pass | fail | inconclusive
    reasoning = db.Column(db.Text)
    created_at = db.Column(db.DateTime, default=datetime.utcnow)
    __table_args__ = (
        db.ForeignKeyConstraint(
            ["question_id", "submission_id"],
            ["questions.id", "questions.submission_id"]
        ),
    )
