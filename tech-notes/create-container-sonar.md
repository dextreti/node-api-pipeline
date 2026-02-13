# create file: touch create-container-sonar.build
# copy && paste this code:
# *************************

# Limpiamos instancias previas para evitar conflictos
docker rm -f sonarqube_server || true

# Ejecutamos el comando
docker run -d --name sonarqube_server \
  -p 9000:9000 \
  -v sonarqube_data:/opt/sonarqube/data \
  -v sonarqube_extensions:/opt/sonarqube/extensions \
  -v sonarqube_logs:/opt/sonarqube/logs \
  sonarqube:lts-community

# *************************
# exec command:
# chmod +x create-container-sonar.build
# ./create-container-sonar.build
