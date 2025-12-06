StegHider — Test & Dev Setup

This document explains how to create a virtualenv, install dependencies, and run the pipeline tests locally or in CI.

Quick start (project root):

```bash
# create a venv
python3 -m venv .venv
# activate
source .venv/bin/activate
# upgrade packaging tools
pip install --upgrade pip setuptools wheel
# install deps
pip install -r requirements.txt
# run the test runner (creates temporary files under tests/_tmp_run)
python3 tests/run_pipeline_tests.py
# or run pytest
python3 -m pytest -q tests/test_pipeline.py
```

Notes:
- The test runner uses Pillow, reedsolo and cryptography. Ensure your Python install supports venv and pip (CI runner typically does).
- If your CI image does not include build tools for `reedsolo` you may need to install `libgmp` or equivalent; on Debian/Ubuntu-based images:

```bash
sudo apt-get update && sudo apt-get install -y build-essential libgmp-dev
```

If you want a reproducible Docker-based run, build and run the provided `Dockerfile`:

```bash
# build image
docker build -t steghider-test .
# run tests inside container
docker run --rm steghider-test
```

CI: a GitHub Actions workflow `.github/workflows/ci-tests.yml` is included and will run the pipeline tests on push and PRs to `main`.

Makefile: you can use `make` to create a venv, install deps and run tests:

```bash
make venv
make install
make test
```
