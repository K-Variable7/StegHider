FROM python:3.11-slim

WORKDIR /app
ENV PYTHONPATH=/app

# Install system deps needed to build reedsolo if required
RUN apt-get update \
    && apt-get install -y --no-install-recommends build-essential libgmp-dev git \
    && rm -rf /var/lib/apt/lists/*

COPY requirements.txt ./
RUN python3 -m pip install --upgrade pip setuptools wheel
RUN python3 -m pip install -r requirements.txt

COPY . /app

CMD ["python3", "tests/run_pipeline_tests.py"]
