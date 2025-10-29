# backend/app.py
import os
from flask import Flask
from flask_cors import CORS
from dotenv import load_dotenv
from database import db
# ensure models imported before create_all
from models import Submission, Question, Answer, Judge, Assignment, Evaluation
from routes.submissions import bp as submissions_bp
from routes.judges import bp as judges_bp
from routes.assignments import bp as assignments_bp
from routes.evaluations import bp as evaluations_bp

load_dotenv()

DATABASE_URL = os.getenv("DATABASE_URL", "sqlite:///ai_judge.db")
DEBUG_MODE = os.getenv("DEBUG", "False").lower() == "true"

app = Flask(__name__)
CORS(app)
app.config["SQLALCHEMY_DATABASE_URI"] = DATABASE_URL
app.config["SQLALCHEMY_TRACK_MODIFICATIONS"] = False

db.init_app(app)


@app.get("/")
def health():
    """Health check endpoint with database connectivity test."""
    try:
        # Test database connectivity
        with app.app_context():
            db.session.execute(db.text('SELECT 1'))
        return {"ok": True, "service": "ai-judge-backend", "database": "connected"}
    except Exception as e:
        return {"ok": False, "service": "ai-judge-backend", "database": "error", "error": str(e)}, 500


def initialize_app():
    """Initialize application: register blueprints and create tables."""
    # Register all blueprints
    app.register_blueprint(submissions_bp)
    app.register_blueprint(judges_bp)
    app.register_blueprint(assignments_bp)
    app.register_blueprint(evaluations_bp)

    # Create database tables
    with app.app_context():
        db.create_all()


if __name__ == "__main__":
    initialize_app()
    port = int(os.getenv("PORT", 5000))
    app.run(port=port, debug=DEBUG_MODE)
