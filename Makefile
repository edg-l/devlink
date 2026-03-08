.PHONY: dev build preview check lint format test test-unit test-e2e db-push db-generate db-migrate db-studio auth-schema

dev:
	npm run dev

build:
	npm run build

preview:
	npm run preview

check:
	npm run check

lint:
	npm run lint

format:
	npm run format

test:
	npm run test

test-unit:
	npm run test:unit -- --run

test-e2e:
	npm run test:e2e

db-push:
	npm run db:push

db-generate:
	npm run db:generate

db-migrate:
	npm run db:migrate

db-studio:
	npm run db:studio

auth-schema:
	npm run auth:schema
