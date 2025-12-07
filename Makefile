VENV=.venv
PYTHON=$(VENV)/bin/python
PIP=$(VENV)/bin/pip

.PHONY: help venv install test docker-build docker-run clean

help:
	@echo "Available targets: venv install test docker-build docker-run clean"

venv:
	python3 -m venv $(VENV)
	$(PIP) install --upgrade pip setuptools wheel

install: venv
	$(PIP) install -r requirements.txt

test: install
	$(PYTHON) tests/run_pipeline_tests.py

docker-build:
	docker build -t steghider-test .

docker-run:
	docker run --rm steghider-test

clean:
	rm -rf $(VENV) tests/_tmp_run
