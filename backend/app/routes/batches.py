from flask import Blueprint, jsonify, request

from ..services.batch_service import (
    create_batch,
    delete_batch,
    get_batch,
    list_batches,
    publish_batch,
    unpublish_batch,
    update_batch,
)
from ..utils.validation import require_fields

batches_bp = Blueprint("batches", __name__)


@batches_bp.get("")
def index():
    return jsonify([batch.to_dict() for batch in list_batches()])


@batches_bp.post("")
def create():
    payload = request.get_json() or {}
    missing = require_fields(payload, ["name", "semester", "teacher"])
    if missing:
        return jsonify({"message": f"缺少字段: {', '.join(missing)}"}), 400
    batch = create_batch(payload)
    return jsonify(batch.to_dict(include_grades=True)), 201


@batches_bp.get("/<int:batch_id>")
def show(batch_id):
    batch = get_batch(batch_id)
    return jsonify(batch.to_dict(include_grades=True))


@batches_bp.put("/<int:batch_id>")
def update(batch_id):
    batch = get_batch(batch_id)
    if batch.status == "published":
        return jsonify({"message": "已发布的批次不可编辑"}), 400
    updated = update_batch(batch, request.get_json() or {})
    return jsonify(updated.to_dict(include_grades=True))


@batches_bp.delete("/<int:batch_id>")
def delete(batch_id):
    batch = get_batch(batch_id)
    delete_batch(batch)
    return "", 204


@batches_bp.post("/<int:batch_id>/publish")
def publish(batch_id):
    batch = get_batch(batch_id)
    if not batch.grades:
        return jsonify({"message": "批次中没有成绩，无法发布"}), 400
    result, error = publish_batch(batch)
    if error:
        return jsonify({"message": error}), 400
    return jsonify(result.to_dict(include_grades=True))


@batches_bp.post("/<int:batch_id>/unpublish")
def unpublish(batch_id):
    batch = get_batch(batch_id)
    result, error = unpublish_batch(batch)
    if error:
        return jsonify({"message": error}), 400
    return jsonify(result.to_dict(include_grades=True))
