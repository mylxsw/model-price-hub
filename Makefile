
welcome:
	echo "Hello"

run-backend:
	cd backend && source venv/bin/activate && uvicorn app.main:app --reload


run-frontend:
	cd frontend && npm install && npm run dev
