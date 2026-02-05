pipeline {
    agent any
    environment {        
        DATABASE_URL="postgresql://postgres:postgres@192.168.0.31:55432/northwind?schema=public"
    }    
    stages {
        stage('Node Tasks') {
            agent {
                docker {
                    image 'node:22-bookworm-slim' 
                    args '-v /var/run/docker.sock:/var/run/docker.sock --user root'
                }
            }            
            steps {
                sh 'npm install'
                sh 'npx prisma generate'
                sh 'npx prisma validate'
            }
            
        }
        stage('Build Docker Image') {
            steps {                
                sh 'docker build -t node-api-northwind:latest .'
            }
        }
    }
    stage('Deploy API') {
            steps {
                sh """
                    # Detener el contenedor si ya existe
                    docker stop node-api-container || true
                    docker rm node-api-container || true
                    
                    # Correr el nuevo contenedor
                    docker run -d \
                      --name node-api-container \
                      -p 3000:3000 \                      
                      -e DATABASE_URL="${DATABASE_URL}" \
                      node-api-northwind:latest
                """
            }
        }
}