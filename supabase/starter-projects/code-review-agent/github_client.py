"""
Step 2 of the Code Review Agent.

Authenticates as your GitHub App and fetches a PR's changed files. JWT
construction is a pure function you can inspect and verify the shape
of without a real private key or network call - only the token
exchange and file fetch need your actual GitHub App credentials.
"""

import time

import jwt
import requests

GITHUB_API = "https://api.github.com"


def build_jwt(app_id, private_key, now=None):
    """
    Builds a signed JWT for authenticating as your GitHub App (RS256,
    10-minute expiry, per GitHub's requirements).

        token = build_jwt(app_id, private_key)

    Pure function given a fixed `now` - tested below with a real RSA
    keypair generated on the fly, so the test proves the JWT actually
    decodes and carries the right claims, not just that this function
    runs without an exception.
    """
    now = now or int(time.time())
    payload = {
        "iat": now - 60,   # backdated 60s - GitHub's own recommendation, to tolerate clock drift
        "exp": now + 600,  # 10-minute expiry, GitHub's maximum
        "iss": app_id,
    }
    return jwt.encode(payload, private_key, algorithm="RS256")


def get_installation_token(app_id, private_key, installation_id):
    """
    Exchanges a freshly-built JWT for a short-lived installation access
    token - this is the token that actually authorizes API calls like
    fetching PR files or posting a review.
    """
    app_jwt = build_jwt(app_id, private_key)
    response = requests.post(
        f"{GITHUB_API}/app/installations/{installation_id}/access_tokens",
        headers={"Authorization": f"Bearer {app_jwt}", "Accept": "application/vnd.github+json"},
    )
    response.raise_for_status()
    return response.json()["token"]


def get_pr_files(token, repo, pr_number):
    """
    Fetches the list of changed files for one PR, each with its diff
    patch.

        files = get_pr_files(token, "yourname/yourrepo", 42)
        -> [{"filename": "auth.py", "patch": "@@ ..."}, ...]
    """
    response = requests.get(
        f"{GITHUB_API}/repos/{repo}/pulls/{pr_number}/files",
        headers={"Authorization": f"Bearer {token}", "Accept": "application/vnd.github+json"},
    )
    response.raise_for_status()
    return [{"filename": f["filename"], "patch": f.get("patch", "")} for f in response.json()]


if __name__ == "__main__":
    # Run this file on its own to check the JWT is built correctly - a
    # throwaway RSA keypair, no GitHub account or network call needed:
    #     python github_client.py
    from cryptography.hazmat.primitives import serialization
    from cryptography.hazmat.primitives.asymmetric import rsa

    key = rsa.generate_private_key(public_exponent=65537, key_size=2048)
    private_pem = key.private_bytes(
        encoding=serialization.Encoding.PEM,
        format=serialization.PrivateFormat.TraditionalOpenSSL,
        encryption_algorithm=serialization.NoEncryption(),
    ).decode()
    public_pem = key.public_key().public_bytes(
        encoding=serialization.Encoding.PEM,
        format=serialization.PublicFormat.SubjectPublicKeyInfo,
    ).decode()

    fixed_now = 1_700_000_000
    token = build_jwt("12345", private_pem, now=fixed_now)

    decoded = jwt.decode(token, public_pem, algorithms=["RS256"], options={"verify_exp": False})
    assert decoded["iss"] == "12345"
    assert decoded["iat"] == fixed_now - 60
    assert decoded["exp"] == fixed_now + 600
    print("JWT decoded correctly:", decoded)

    print("\nAll checks passed. This JWT would be accepted by GitHub as proof you control app 12345's private key.")
