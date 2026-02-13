# create file docker-compose-jenkins.yml into server
# copy && paste  this code

services:
  jenkins:
    image: jenkins/jenkins:lts-jdk17
    privileged: true
    user: root
    ports:
      - "8080:8080"
      - "50000:50000"
    container_name: jenkins_server
    volumes:
      - jenkins_home:/var/jenkins_home
      - /var/run/docker.sock:/var/run/docker.sock # Para que Jenkins pueda usar Docker
      - /usr/bin/docker:/usr/bin/docker

volumes:
  jenkins_home:


# exec this command:
# docker compose -f docker-compose-jenkins.yml down
# docker compose -f docker-compose-jenkins.yml up -d
# valid if jenkins_server has open bridge
# docker exec -u root jenkins_server docker ps

