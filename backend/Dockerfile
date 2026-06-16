FROM python:3.12-slim

WORKDIR /app

COPY requirements.txt ./requirements.txt
RUN pip install --no-cache-dir -r requirements.txt

COPY . .

CMD ["sh", "-c", "for i in 1 2 3 4 5; do alembic upgrade head && break || sleep 5; done && uvicorn app.main:app --host 0.0.0.0 --port 8000"]
EXPOSE 8000