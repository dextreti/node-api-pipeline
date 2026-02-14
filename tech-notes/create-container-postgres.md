# create file: touch create-container-postgres.build
# copy && paste this code:
# *************************

docker rm -f postgres-db

docker run -d \
  --name postgres-db \
  -p 55432:5432 \
  -e POSTGRES_USER=postgres \
  -e POSTGRES_PASSWORD=postgres \
  -e POSTGRES_DB=northwind \
  --restart always \
  postgres:latest

# *************************
# add permise:
 chmod +x create-container-postgres.build
# exec
 ./create-container-postgres.build
# create tablas, insert to database container postgres-db from northwind.sql 
docker exec -i postgres-db psql -U postgres -d northwind < northwind.sql
