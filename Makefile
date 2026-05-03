APP=slujst-api

up:
	docker compose up -d

build:
	docker compose up -d --build

down:
	docker compose down

restart:
	docker compose down && docker compose up -d

logs:
	docker logs -f $(APP)

ps:
	docker ps

migrate:
	docker exec -it $(APP) yarn prisma migrate deploy

shell:
	docker exec -it $(APP) sh

db:
	docker exec -it slujst-db psql -U postgres -d slujst_db

clean:
	docker compose down -v --remove-orphans

rebuild:
	docker compose down -v
	docker compose up -d --build

deploy:
	git reset --hard
	git pull origin main
	docker compose down
	docker compose up -d --build
	docker logs -f $(APP)