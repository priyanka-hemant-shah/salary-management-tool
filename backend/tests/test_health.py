"""
PR 1 — Health endpoint tests.

TDD: these tests were written before the implementation.
"""

import pytest


@pytest.mark.asyncio
async def test_health_returns_200(client):
    """Health endpoint must return HTTP 200."""
    response = await client.get("/health")
    assert response.status_code == 200


@pytest.mark.asyncio
async def test_health_returns_ok_status(client):
    """Health response body must include status=ok."""
    response = await client.get("/health")
    data = response.json()
    assert data["status"] == "ok"


@pytest.mark.asyncio
async def test_health_returns_service_name(client):
    """Health response must identify the service."""
    response = await client.get("/health")
    data = response.json()
    assert data["service"] == "acme-salary-intelligence"


@pytest.mark.asyncio
async def test_root_returns_200(client):
    """Root path must respond (used by load balancers)."""
    response = await client.get("/")
    assert response.status_code == 200


@pytest.mark.asyncio
async def test_docs_available(client):
    """OpenAPI docs must be accessible."""
    response = await client.get("/docs")
    assert response.status_code == 200

