from flask import Blueprint, request, jsonify
from database import db
from models import Judge
from llm import get_valid_models, VALID_OPENAI_MODELS

bp = Blueprint("judges", __name__, url_prefix="/judges")

@bp.get("/models")
def list_models():
    """Return list of valid OpenAI models."""
    return jsonify({"models": get_valid_models()})

@bp.get("")
def list_judges():
    js = Judge.query.order_by(Judge.created_at.desc()).all()
    return jsonify([{
        "id": j.id, "name": j.name, "prompt": j.prompt,
        "modelName": j.model_name, "active": j.active,
        "createdAt": j.created_at.isoformat()
    } for j in js])

@bp.post("")
def create_judge():
    d = request.get_json(force=True)
    model_name = d.get("modelName")
    
    # Validate model name
    if model_name and model_name not in VALID_OPENAI_MODELS:
        return {
            "error": f"Invalid model '{model_name}'. Valid models: {', '.join(sorted(VALID_OPENAI_MODELS))}"
        }, 400
    
    j = Judge(name=d["name"], prompt=d["prompt"], model_name=model_name, active=d.get("active", True))
    db.session.add(j)
    db.session.commit()
    return {"id": j.id}, 201

@bp.put("/<int:judge_id>")
def update_judge(judge_id: int):
    j = db.session.get(Judge, judge_id)
    if not j:
        return {"error": "not found"}, 404
    d = request.get_json(force=True)
    
    # Validate model name if being updated
    new_model = d.get("modelName")
    if new_model and new_model not in VALID_OPENAI_MODELS:
        return {
            "error": f"Invalid model '{new_model}'. Valid models: {', '.join(sorted(VALID_OPENAI_MODELS))}"
        }, 400
    
    j.name = d.get("name", j.name)
    j.prompt = d.get("prompt", j.prompt)
    j.model_name = new_model if new_model else j.model_name
    j.active = d.get("active", j.active)
    db.session.commit()
    return {"ok": True}

@bp.delete("/<int:judge_id>")
def delete_judge(judge_id: int):
    j = db.session.get(Judge, judge_id)
    if not j:
        return {"error": "not found"}, 404
    db.session.delete(j)
    db.session.commit()
    return {"ok": True}